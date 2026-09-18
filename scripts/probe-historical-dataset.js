"use strict";

const fs=require("fs");
const path=require("path");
const job=require("../historical-dataset-job.js");
const resolver=require("../historical-path-resolver.js");

function localDate(bar){return String(bar?.semantics?.periodOpenId||"").split("|")[2]||null;}
function resolutionSources(events=[]){
  const out={};
  for(const event of events){const key=event.pathResolutionSource||"PARENT_TIMEFRAME";out[key]=(out[key]||0)+1;}
  return out;
}

async function main(){
  const symbol=String(process.env.HISTORICAL_PROBE_SYMBOL||"SPY").toUpperCase();
  const timeframe=String(process.env.HISTORICAL_PROBE_TIMEFRAME||"15");
  const outputsize=Math.max(100,Math.min(5000,Number(process.env.HISTORICAL_PROBE_OUTPUTSIZE)||1000));
  const horizonBars=Math.max(1,Number(process.env.HISTORICAL_PROBE_HORIZON_BARS)||20);
  const proxyBase=process.env.HISTORICAL_PROXY_BASE||"https://thestrat.phshbone.workers.dev";
  const outDir=path.resolve(process.env.HISTORICAL_PROBE_OUTDIR||"artifacts/historical-probe");

  const series=await job.fetchHistoricalSeries({proxyBase,symbol,timeframe,outputsize});
  const midpointRaw=job.buildHistoricalDataset(series,{stopModel:"MIDPOINT",horizonBars});
  const structureRaw=job.buildHistoricalDataset(series,{stopModel:"STRUCTURE",horizonBars});

  if(midpointRaw.events.length===0) throw new Error("historical probe produced no deterministic setup events");
  if(midpointRaw.events.length!==structureRaw.events.length) throw new Error("stop-model datasets disagree on setup occurrence count");

  let lowerSeries=null,midpointRepair=null,structureRepair=null;
  if(timeframe==="15"){
    const startDate=localDate(series.bars[0]),endDate=localDate(series.bars.at(-1));
    lowerSeries=await job.fetchHistoricalSeries({proxyBase,symbol,timeframe:"5",outputsize:5000,startDate,endDate});
    midpointRepair=resolver.resolveAmbiguousEvents(midpointRaw.events,lowerSeries.bars,{parentMinutes:15,lowerMinutes:5});
    structureRepair=resolver.resolveAmbiguousEvents(structureRaw.events,lowerSeries.bars,{parentMinutes:15,lowerMinutes:5});
  }

  const midpointEvents=midpointRepair?.events||midpointRaw.events;
  const structureEvents=structureRepair?.events||structureRaw.events;
  const midpoint={...midpointRaw,events:midpointEvents,summary:job.summarizeDataset(midpointEvents)};
  const structure={...structureRaw,events:structureEvents,summary:job.summarizeDataset(structureEvents)};

  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,"spy-15m-midpoint.json"),JSON.stringify(midpoint,null,2));
  fs.writeFileSync(path.join(outDir,"spy-15m-structure.json"),JSON.stringify(structure,null,2));

  const summary={
    generatedAt:new Date().toISOString(),source:midpoint.source,symbol,timeframe,
    barsReceived:series.bars.length,lowerTimeframeBarsReceived:lowerSeries?.bars?.length||0,
    firstBar:series.bars[0]?.semantics?.barOpenTimestamp||series.bars[0]?.datetime||null,
    lastBar:series.bars.at(-1)?.semantics?.barOpenTimestamp||series.bars.at(-1)?.datetime||null,
    midpoint:{...midpoint.summary,pathRepair:midpointRepair?{beforeAmbiguous:midpointRepair.beforeAmbiguous,afterAmbiguous:midpointRepair.afterAmbiguous,resolvedAmbiguities:midpointRepair.resolvedAmbiguities}:null,resolutionSources:resolutionSources(midpointEvents)},
    structure:{...structure.summary,pathRepair:structureRepair?{beforeAmbiguous:structureRepair.beforeAmbiguous,afterAmbiguous:structureRepair.afterAmbiguous,resolvedAmbiguities:structureRepair.resolvedAmbiguities}:null,resolutionSources:resolutionSources(structureEvents)},
    note:"Real provider history processed through normalized semantics and the deterministic Strat engine. Lower-timeframe bars resolve sequence only when order is provable; unresolved same-bar paths remain ambiguous. Descriptive probe only; not a forecast."
  };
  fs.writeFileSync(path.join(outDir,"summary.json"),JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
}

main().catch(error=>{console.error(error.stack||error.message||String(error));process.exit(1);});