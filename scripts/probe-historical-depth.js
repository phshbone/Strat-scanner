"use strict";

const fs=require("fs");
const path=require("path");
const job=require("../historical-dataset-job.js");
const audit=require("../historical-cohort-audit.js");
const temporal=require("../historical-temporal-audit.js");

function yyyyMmDd(date){return date.toISOString().slice(0,10);}
function countAvailable(rows=[]){return rows.filter(row=>row.status==="AVAILABLE").length;}
function topAvailable(rows=[],limit=12){return rows.filter(row=>row.status==="AVAILABLE").slice(0,limit);}
function datasetSummary(dataset){
  const rows=dataset.events||[];
  const resolved=rows.filter(e=>e.resolution==="WIN"||e.resolution==="LOSS");
  const wins=resolved.filter(e=>e.resolution==="WIN").length;
  return {
    events:rows.length,
    resolved:resolved.length,
    wins,
    losses:resolved.length-wins,
    ambiguous:rows.filter(e=>e.resolution==="AMBIGUOUS"||e.sequenceAmbiguous===true).length,
    unresolved:rows.filter(e=>!["WIN","LOSS","AMBIGUOUS"].includes(String(e.resolution||""))).length,
    diagnosticResolvedWinRatePct:resolved.length?Number(((wins/resolved.length)*100).toFixed(1)):null
  };
}
function auditSummary(result){
  const out={};
  for(const [level,rows] of Object.entries(result.levels||{})){
    out[level]={totalCohorts:rows.length,availableCohorts:countAvailable(rows),topAvailable:topAvailable(rows)};
  }
  return out;
}

async function main(){
  const days=Math.max(60,Math.min(730,Number(process.env.HISTORICAL_DEPTH_DAYS)||180));
  const chunkDays=Math.max(7,Math.min(45,Number(process.env.HISTORICAL_DEPTH_CHUNK_DAYS)||30));
  const delayMs=Math.max(0,Number(process.env.HISTORICAL_DEPTH_DELAY_MS)||8000);
  const proxyBase=process.env.HISTORICAL_PROXY_BASE||"https://thestrat.phshbone.workers.dev";
  const symbol=String(process.env.HISTORICAL_DEPTH_SYMBOL||"SPY").toUpperCase();
  const outDir=path.resolve(process.env.HISTORICAL_DEPTH_OUTDIR||"artifacts/historical-depth");

  const end=new Date();
  end.setUTCDate(end.getUTCDate()-1);
  const start=new Date(end);
  start.setUTCDate(start.getUTCDate()-(days-1));
  const startDate=yyyyMmDd(start),endDate=yyyyMmDd(end);

  console.log("Fetching "+symbol+" 15m history "+startDate+" -> "+endDate);
  const parentSeries=await job.fetchHistoricalSeriesRange({
    proxyBase,symbol,timeframe:"15",startDate,endDate,chunkDays,delayMs,outputsize:5000
  });

  console.log("Fetching "+symbol+" 5m reconstruction history "+startDate+" -> "+endDate);
  const lowerSeries=await job.fetchHistoricalSeriesRange({
    proxyBase,symbol,timeframe:"5",startDate,endDate,chunkDays,delayMs,outputsize:5000
  });

  const midpoint=job.buildEvidenceDataset(parentSeries,lowerSeries,{stopModel:"MIDPOINT",horizonBars:20});
  const structure=job.buildEvidenceDataset(parentSeries,lowerSeries,{stopModel:"STRUCTURE",horizonBars:20});
  const midpointAudit=audit.buildCohortAudit(midpoint.events,{minResolved:20});
  const structureAudit=audit.buildCohortAudit(structure.events,{minResolved:20});
  const midpointExact=midpointAudit.levels.exactCheckpoint.filter(row=>row.status==="AVAILABLE");
  const structureExact=structureAudit.levels.exactCheckpoint.filter(row=>row.status==="AVAILABLE");
  const midpointTemporal=temporal.auditsForCohorts(midpoint.events,midpointExact,{minResolvedPerPeriod:10,minPopulatedPeriods:3});
  const structureTemporal=temporal.auditsForCohorts(structure.events,structureExact,{minResolvedPerPeriod:10,minPopulatedPeriods:3});

  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,"spy-15m-midpoint-evidence.json"),JSON.stringify(midpoint,null,2));
  fs.writeFileSync(path.join(outDir,"spy-15m-structure-evidence.json"),JSON.stringify(structure,null,2));
  fs.writeFileSync(path.join(outDir,"spy-15m-midpoint-cohorts.json"),JSON.stringify(midpointAudit,null,2));
  fs.writeFileSync(path.join(outDir,"spy-15m-structure-cohorts.json"),JSON.stringify(structureAudit,null,2));
  fs.writeFileSync(path.join(outDir,"spy-15m-midpoint-temporal.json"),JSON.stringify(midpointTemporal,null,2));
  fs.writeFileSync(path.join(outDir,"spy-15m-structure-temporal.json"),JSON.stringify(structureTemporal,null,2));

  const summary={
    generatedAt:new Date().toISOString(),
    symbol,
    startDate,
    endDate,
    requestedCalendarDays:days,
    parentBars:parentSeries.bars.length,
    lowerBars:lowerSeries.bars.length,
    parentChunks:parentSeries.range?.chunksRequested||null,
    lowerChunks:lowerSeries.range?.chunksRequested||null,
    sampleConstruction:midpoint.sampleConstruction,
    successDefinition:midpoint.successDefinition,
    midpoint:{...datasetSummary(midpoint),cohorts:auditSummary(midpointAudit),temporalExact:midpointTemporal},
    structure:{...datasetSummary(structure),cohorts:auditSummary(structureAudit),temporalExact:structureTemporal},
    note:"Research evidence from first-observable completed 5m checkpoints inside 15m bars. Percentages and temporal slices are descriptive historical diagnostics, not forecasts, confidence scores, or trade recommendations."
  };
  fs.writeFileSync(path.join(outDir,"summary.json"),JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
}

main().catch(error=>{console.error(error.stack||error.message||String(error));process.exit(1);});
