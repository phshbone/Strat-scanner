"use strict";

const fs=require("fs");
const path=require("path");
const job=require("../historical-dataset-job.js");

async function main(){
  const symbol=String(process.env.HISTORICAL_PROBE_SYMBOL||"SPY").toUpperCase();
  const timeframe=String(process.env.HISTORICAL_PROBE_TIMEFRAME||"15");
  const outputsize=Math.max(100,Math.min(5000,Number(process.env.HISTORICAL_PROBE_OUTPUTSIZE)||1000));
  const horizonBars=Math.max(1,Number(process.env.HISTORICAL_PROBE_HORIZON_BARS)||20);
  const proxyBase=process.env.HISTORICAL_PROXY_BASE||"https://thestrat.phshbone.workers.dev";
  const outDir=path.resolve(process.env.HISTORICAL_PROBE_OUTDIR||"artifacts/historical-probe");

  const series=await job.fetchHistoricalSeries({proxyBase,symbol,timeframe,outputsize});
  const midpoint=job.buildHistoricalDataset(series,{stopModel:"MIDPOINT",horizonBars});
  const structure=job.buildHistoricalDataset(series,{stopModel:"STRUCTURE",horizonBars});

  if(midpoint.events.length===0) throw new Error("historical probe produced no deterministic setup events");
  if(midpoint.events.length!==structure.events.length) throw new Error("stop-model datasets disagree on setup occurrence count");

  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,"spy-15m-midpoint.json"),JSON.stringify(midpoint,null,2));
  fs.writeFileSync(path.join(outDir,"spy-15m-structure.json"),JSON.stringify(structure,null,2));

  const summary={
    generatedAt:new Date().toISOString(),
    source:midpoint.source,
    symbol,
    timeframe,
    barsReceived:series.bars.length,
    firstBar:series.bars[0]?.semantics?.barOpenTimestamp||series.bars[0]?.datetime||null,
    lastBar:series.bars.at(-1)?.semantics?.barOpenTimestamp||series.bars.at(-1)?.datetime||null,
    midpoint:midpoint.summary,
    structure:structure.summary,
    note:"Real provider history processed through normalized semantics and the deterministic Strat engine. Descriptive probe only; not a forecast."
  };
  fs.writeFileSync(path.join(outDir,"summary.json"),JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
}

main().catch(error=>{console.error(error.stack||error.message||String(error));process.exit(1);});