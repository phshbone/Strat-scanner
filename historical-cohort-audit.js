"use strict";

const DEFAULT_MIN_RESOLVED=20;

function upper(v){return v===null||v===undefined||v===""?null:String(v).trim().toUpperCase();}
function valueFor(event,field){
  const aliases={
    setup:"setupId",
    stopModel:"stopModel",
    ftfcAlignment:"ftfcAlignment",
    priceBucket:"priceBucket",
    observationPhase:"observationPhase"
  };
  const key=aliases[field]||field;
  return upper(event?.[key]??event?.[field])||"UNKNOWN";
}

function summarize(events,{minResolved=DEFAULT_MIN_RESOLVED}={}){
  const rows=Array.isArray(events)?events:[];
  const resolved=rows.filter(e=>e.resolution==="WIN"||e.resolution==="LOSS");
  const wins=resolved.filter(e=>e.resolution==="WIN").length;
  const losses=resolved.length-wins;
  const ambiguous=rows.filter(e=>e.sequenceAmbiguous===true||e.resolution==="AMBIGUOUS").length;
  const unresolved=rows.filter(e=>!["WIN","LOSS","AMBIGUOUS"].includes(String(e.resolution||""))).length;
  const status=rows.length===0?"NOT_AVAILABLE":resolved.length>=minResolved?"AVAILABLE":"INSUFFICIENT_SAMPLE";
  return {
    status,
    sufficient:status==="AVAILABLE",
    sampleSize:rows.length,
    resolvedSampleSize:resolved.length,
    wins,
    losses,
    successRate:resolved.length?wins/resolved.length:null,
    successRatePct:resolved.length?Number(((wins/resolved.length)*100).toFixed(1)):null,
    ambiguous,
    unresolved,
    minResolvedSampleSize:minResolved
  };
}

function groupCohorts(events,dimensions,{minResolved=DEFAULT_MIN_RESOLVED}={}){
  const dims=Array.isArray(dimensions)?dimensions:[];
  const groups=new Map();
  for(const event of Array.isArray(events)?events:[]){
    if(event?.evidenceEligible!==true) continue;
    const values=dims.map(field=>valueFor(event,field));
    const key=values.join("|");
    if(!groups.has(key)) groups.set(key,{conditions:Object.fromEntries(dims.map((field,i)=>[field,values[i]])),events:[]});
    groups.get(key).events.push(event);
  }
  return Array.from(groups.values()).map(group=>({
    ...group.conditions,
    ...summarize(group.events,{minResolved})
  })).sort((a,b)=>b.resolvedSampleSize-a.resolvedSampleSize||b.sampleSize-a.sampleSize||JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function buildCohortAudit(events,{minResolved=DEFAULT_MIN_RESOLVED}={}){
  const rows=(Array.isArray(events)?events:[]).filter(e=>e?.evidenceEligible===true);
  return {
    minResolvedSampleSize:minResolved,
    evidenceEligibleEvents:rows.length,
    levels:{
      setupBaseline:groupCohorts(rows,["setup","direction","stopModel"],{minResolved}),
      ftfc:groupCohorts(rows,["setup","direction","stopModel","ftfcAlignment"],{minResolved}),
      ftfcPrice:groupCohorts(rows,["setup","direction","stopModel","ftfcAlignment","priceBucket"],{minResolved}),
      exactCheckpoint:groupCohorts(rows,["setup","direction","stopModel","ftfcAlignment","priceBucket","observationPhase"],{minResolved})
    }
  };
}

module.exports={DEFAULT_MIN_RESOLVED,valueFor,summarize,groupCohorts,buildCohortAudit};
