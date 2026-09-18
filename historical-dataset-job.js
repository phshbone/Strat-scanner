"use strict";

const live=require("./live-candidates-ui.js");
const builder=require("./historical-event-builder.js");

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
  const url=buildHistoricalProxyUrl({proxyBase,symbol,timeframe,outputsize,startDate,endDate});
  const response=await fetchImpl(url,{headers:{Accept:"application/json"}});
  if(!response||response.ok===false) throw new Error("historical market-data request failed: HTTP "+(response?.status||"error"));
  return live.normalizePayload(await response.json(),{symbol,timeframe});
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

module.exports={normalizeStopModel,buildHistoricalDataset,summarizeDataset,buildHistoricalProxyUrl,fetchHistoricalSeries,writeHistoricalDataset};