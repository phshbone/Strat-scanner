"use strict";

const live=require("./live-candidates-ui.js");
const builder=require("./historical-event-builder.js");
const reconstruction=require("./historical-intrabar-reconstruction.js");

function normalizeStopModel(value){return builder.normalizeStopModel(value||"MIDPOINT");}

function buildHistoricalDataset(series,{stopModel="MIDPOINT",horizonBars=20}={}){
  if(!series||!Array.isArray(series.bars)) throw new Error("normalized historical series required");
  const model=normalizeStopModel(stopModel);
  const events=builder.extractHistoricalEvents({
    bars:series.bars,
    symbol:series.symbol,
    timeframe:series.timeframe,
    marketType:series.marketType,
    stopModel:model,
    horizonBars,
    contextResolver:({index})=>{
      let alignment="NO_DATA";
      try{
        alignment=live.deriveIntradayContinuity({...series,bars:series.bars.slice(0,index+1)}).alignment||"NO_DATA";
      }catch(_){alignment="NO_DATA";}
      return {ftfcAlignment:alignment,scenarioVersion:"historical-db-v1"};
    }
  });
  return {
    schemaVersion:1,
    source:"TWELVE_DATA_VIA_CLOUDFLARE_PROXY",
    symbol:series.symbol,
    timeframe:series.timeframe,
    marketType:series.marketType||null,
    stopModel:model,
    barsReceived:series.bars.length,
    events,
    summary:summarizeDataset(events)
  };
}

function buildEvidenceDataset(parentSeries,lowerSeries,{stopModel="MIDPOINT",horizonBars=20}={}){
  const model=normalizeStopModel(stopModel);
  const rebuilt=reconstruction.buildCheckpointEvents({parentSeries,lowerSeries,stopModel:model,horizonBars});
  return {
    schemaVersion:1,
    source:"TWELVE_DATA_VIA_CLOUDFLARE_PROXY",
    symbol:parentSeries.symbol,
    timeframe:parentSeries.timeframe,
    marketType:parentSeries.marketType||null,
    stopModel:model,
    barsReceived:parentSeries.bars.length,
    lowerTimeframeBarsReceived:lowerSeries.bars.length,
    sampleConstruction:rebuilt.sampleConstruction,
    successDefinition:rebuilt.successDefinition,
    events:rebuilt.events,
    summary:summarizeDataset(rebuilt.events)
  };
}

function summarizeDataset(events=[]){
  const rows=Array.isArray(events)?events:[];
  const byResolution={},bySetup={};
  for(const event of rows){
    const resolution=String(event.resolution||"UNKNOWN");
    byResolution[resolution]=(byResolution[resolution]||0)+1;
    const key=[event.setup||"UNKNOWN",event.direction||"UNKNOWN"].join("|");
    bySetup[key]=(bySetup[key]||0)+1;
  }
  return {events:rows.length,byResolution,bySetup};
}

function buildHistoricalProxyUrl({proxyBase=live.DEFAULT_PROXY_BASE,symbol,timeframe,outputsize=5000,startDate=null,endDate=null}={}){
  const base=new URL(live.buildProxyUrl({symbol,timeframe,outputsize,proxyBase}));
  if(startDate) base.searchParams.set("start_date",String(startDate));
  if(endDate) base.searchParams.set("end_date",String(endDate));
  return base.toString();
}

async function fetchHistoricalSeries({proxyBase=live.DEFAULT_PROXY_BASE,symbol,timeframe,outputsize=5000,startDate=null,endDate=null,fetchImpl=globalThis.fetch}={}){
  if(typeof fetchImpl!=="function") throw new Error("fetch implementation required");
  const url=buildHistoricalProxyUrl({symbol,timeframe,outputsize,startDate,endDate});
  const response=await fetchImpl(url,{headers:{Accept:"application/json"}});
  if(!response||response.ok===false){
    const error=new Error("historical market-data request failed: HTTP "+(response?.status||"error"));
    error.status=Number(response?.status)||null;
    throw error;
  }
  return live.normalizePayload(await response.json(),{symbol,timeframe});
}

function isoDate(value){
  const d=value instanceof Date?value:new Date(String(value)+"T00:00:00Z");
  if(Number.isNaN(d.getTime())) throw new Error("valid YYYY-MM-DD date required");
  return d.toISOString().slice(0,10);
}

function dateChunks(startDate,endDate,{chunkDays=30}={}){
  const start=new Date(isoDate(startDate)+"T00:00:00Z");
  const end=new Date(isoDate(endDate)+"T00:00:00Z");
  if(start>end) throw new Error("startDate must be on or before endDate");
  const days=Math.max(1,Math.min(120,Number(chunkDays)||30));
  const chunks=[];
  let cursor=new Date(start);
  while(cursor<=end){
    const chunkStart=new Date(cursor);
    const chunkEnd=new Date(cursor);
    chunkEnd.setUTCDate(chunkEnd.getUTCDate()+days-1);
    if(chunkEnd>end) chunkEnd.setTime(end.getTime());
    chunks.push({startDate:isoDate(chunkStart),endDate:isoDate(chunkEnd)});
    cursor=new Date(chunkEnd);
    cursor.setUTCDate(cursor.getUTCDate()+1);
  }
  return chunks;
}

function mergeHistoricalSeries(seriesList){
  const list=(Array.isArray(seriesList)?seriesList:[]).filter(Boolean);
  if(!list.length) throw new Error("historical series list required");
  const first=list[0],seen=new Map();
  for(const series of list){
    if(series.symbol!==first.symbol||series.timeframe!==first.timeframe) throw new Error("historical series identity mismatch");
    for(const bar of series.bars||[]){
      const key=bar?.semantics?.barOpenTimestamp||bar?.datetime||bar?.time;
      if(key) seen.set(String(key),bar);
    }
  }
  const bars=Array.from(seen.values()).sort((a,b)=>String(a?.semantics?.barOpenTimestamp||a.datetime||a.time).localeCompare(String(b?.semantics?.barOpenTimestamp||b.datetime||b.time)));
  return {...first,bars};
}

function retryableHistoricalError(error){
  const status=Number(error?.status);
  return status===429 || (status>=500&&status<=599);
}

async function fetchHistoricalSeriesRange({
  proxyBase=live.DEFAULT_PROXY_BASE,
  symbol,
  timeframe,
  startDate,
  endDate,
  chunkDays=30,
  outputsize=5000,
  delayMs=8000,
  maxAttempts=4,
  retryBaseMs=15000,
  fetchImpl=globalThis.fetch
}={}){
  const chunks=dateChunks(startDate,endDate,{chunkDays});
  const attempts=Math.max(1,Math.min(6,Number(maxAttempts)||4));
  const retryBase=Math.max(0,Number(retryBaseMs)||0);
  const series=[];
  let retryCount=0;
  for(let i=0;i<chunks.length;i++){
    const chunk=chunks[i];
    let fetched=null;
    for(let attempt=1;attempt<=attempts;attempt++){
      try{
        fetched=await fetchHistoricalSeries({proxyBase,symbol,timeframe,outputsize,startDate:chunk.startDate,endDate:chunk.endDate,fetchImpl});
        break;
      }catch(error){
        if(attempt>=attempts||!retryableHistoricalError(error)) throw error;
        retryCount+=1;
        const waitMs=retryBase*Math.pow(2,attempt-1);
        if(waitMs>0) await new Promise(resolve=>setTimeout(resolve,waitMs));
      }
    }
    series.push(fetched);
    if(delayMs>0&&i<chunks.length-1) await new Promise(resolve=>setTimeout(resolve,delayMs));
  }
  const merged=mergeHistoricalSeries(series);
  return {...merged,range:{startDate:isoDate(startDate),endDate:isoDate(endDate),chunkDays,chunksRequested:chunks.length,retryCount}};
}

async function writeHistoricalDataset({proxyBase=live.DEFAULT_PROXY_BASE,dataset,token,importId,fetchImpl=globalThis.fetch,batchSize=400}={}){
  if(!dataset||!Array.isArray(dataset.events)) throw new Error("dataset required");
  if(!token) throw new Error("HISTORICAL_DB_WRITE_TOKEN required");
  if(typeof fetchImpl!=="function") throw new Error("fetch implementation required");
  const size=Math.max(1,Math.min(500,Number(batchSize)||400));
  let written=0;
  for(let i=0;i<dataset.events.length;i+=size){
    const batch=dataset.events.slice(i,i+size);
    const response=await fetchImpl(String(proxyBase).replace(/\/+$/,"")+"/historical/events",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
      body:JSON.stringify({events:batch,importId})
    });
    const payload=await response.json();
    if(!response.ok) throw new Error(payload?.message||("historical database write failed: HTTP "+response.status));
    written+=Number(payload.written)||0;
  }
  return {written,batches:Math.ceil(dataset.events.length/size)};
}

module.exports={normalizeStopModel,buildHistoricalDataset,buildEvidenceDataset,summarizeDataset,buildHistoricalProxyUrl,fetchHistoricalSeries,isoDate,dateChunks,mergeHistoricalSeries,retryableHistoricalError,fetchHistoricalSeriesRange,writeHistoricalDataset};
