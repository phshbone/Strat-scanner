"use strict";

const fs=require("fs");
const path=require("path");
const job=require("../historical-dataset-job.js");

function localDate(bar){return String(bar?.semantics?.periodOpenId||"").split("|")[2]||null;}
function countBy(events,keyFn){
  const out={};
  for(const event of events||[]){const key=keyFn(event);out[key]=(out[key]||0)+1;}
  return out;
}
function diagnosticSummary(dataset){
  const events=dataset.events||[];
  const summary=job.summarizeDataset(events);
  const resolved=events.filter(e=>e.resolution==="WIN"||e.resolution==="LOSS");
  const wins=resolved.filter(e=>e.resolution==="WIN").length;
  return {
    ...summary,
    evidenceEligible:events.filter(e=>e.evidenceEligible===true).length,
    resolved:resolved.length,
    diagnosticResolvedWinRate:resolved.length?Number(((wins/resolved.length)*100).toFixed(1)):null,
    ambiguous:events.filter(e=>e.sequenceAmbiguous===true||e.resolution==="AMBIGUOUS").length,
    byFtfc:countBy(events,e=>e.ftfcAlignment||"NO_DATA"),
    byPriceBucket:countBy(events,e=>e.priceBucket||"UNKNOWN"),
    byObservationPhase:countBy(events,e=>e.observationPhase||"UNKNOWN")
  };
}

async function main(){
  const symbol=String(process.env.HISTORICAL_PROBE_SYMBOL||"SPY").toUpperCase();
  const timeframe=String(process.env.HISTORICAL_PROBE_TIMEFRAME||"15");
  const outputsize=Math.max(100,Math.min(5000,Number(process.env.HISTORICAL_PROBE_OUTPUTSIZE)||1000));
  const horizonBars=Math.max(1,Number(process.env.HISTORICAL_PROBE_HORIZON_BARS)||20);
  const proxyBase=process.env.HISTORICAL_PROXY_BASE||"https://thestrat.phshbone.workers.dev";
  const outDir=path.resolve(process.env.HISTORICAL_PROBE_OUTDIR||"artifacts/historical-probe");

  if(timeframe!=="15") throw new Error("v1 evidence probe supports 15m parent bars only");

  const parentSeries=await job.fetchHistoricalSeries({proxyBase,symbol,timeframe,outputsize});
  const startDate=localDate(parentSeries.bars[0]),endDate=localDate(parentSeries.bars.at(-1));
  const lowerSeries=await job.fetchHistoricalSeries({proxyBase,symbol,timeframe:"5",outputsize:5000,startDate,endDate});

  const completedMidpoint=job.buildHistoricalDataset(parentSeries,{stopModel:"MIDPOINT",horizonBars});
  const completedStructure=job.buildHistoricalDataset(parentSeries,{stopModel:"STRUCTURE",horizonBars});
  const evidenceMidpoint=job.buildEvidenceDataset(parentSeries,lowerSeries,{stopModel:"MIDPOINT",horizonBars});
  const evidenceStructure=job.buildEvidenceDataset(parentSeries,lowerSeries,{stopModel:"STRUCTURE",horizonBars});

  if(evidenceMidpoint.events.length===0) throw new Error("checkpoint reconstruction produced no evidence events");
  if(evidenceMidpoint.events.length!==evidenceStructure.events.length) throw new Error("stop models disagree on checkpoint occurrence count");
  if(!evidenceMidpoint.events.every(e=>e.evidenceEligible===true)) throw new Error("checkpoint evidence contains ineligible records");

  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,"spy-15m-completed-midpoint-probe.json"),JSON.stringify(completedMidpoint,null,2));
  fs.writeFileSync(path.join(outDir,"spy-15m-completed-structure-probe.json"),JSON.stringify(completedStructure,null,2));
  fs.writeFileSync(path.join(outDir,"spy-15m-checkpoint-midpoint.json"),JSON.stringify(evidenceMidpoint,null,2));
  fs.writeFileSync(path.join(outDir,"spy-15m-checkpoint-structure.json"),JSON.stringify(evidenceStructure,null,2));

  const summary={
    generatedAt:new Date().toISOString(),
    source:evidenceMidpoint.source,
    symbol,
    timeframe,
    parentBarsReceived:parentSeries.bars.length,
    lowerTimeframeBarsReceived:lowerSeries.bars.length,
    firstParentBar:parentSeries.bars[0]?.semantics?.barOpenTimestamp||parentSeries.bars[0]?.datetime||null,
    lastParentBar:parentSeries.bars.at(-1)?.semantics?.barOpenTimestamp||parentSeries.bars.at(-1)?.datetime||null,
    sampleConstruction:evidenceMidpoint.sampleConstruction,
    successDefinition:evidenceMidpoint.successDefinition,
    completedBarProbe:{
      midpointEvents:completedMidpoint.events.length,
      structureEvents:completedStructure.events.length,
      evidenceEligible:false,
      purpose:"look-ahead diagnostic only"
    },
    checkpointEvidence:{
      midpoint:diagnosticSummary(evidenceMidpoint),
      structure:diagnosticSummary(evidenceStructure)
    },
    note:"Checkpoint evidence reconstructs the first setup state observable at completed 5m checkpoints inside each 15m bar. Outcome measurement begins after the observation checkpoint, so information already contained in that checkpoint is not reused as future evidence. Diagnostic win rates are research outputs only and are not forecasts or Trade Coach guidance."
  };

  fs.writeFileSync(path.join(outDir,"summary.json"),JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
}

main().catch(error=>{console.error(error.stack||error.message||String(error));process.exit(1);});
