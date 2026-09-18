"use strict";

const DEFAULT_MIN_RESOLVED_PER_PERIOD=10;
const DEFAULT_MIN_POPULATED_PERIODS=3;

function present(v){return v!==null&&v!==undefined&&v!=="";}
function upper(v){return present(v)?String(v).trim().toUpperCase():null;}
function eventTime(event){return event?.activationTimestamp||event?.timestamp||event?.signalBarTimestamp||null;}

function monthKey(value){
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0,7);
}

function matches(event,conditions={}){
  for(const [key,expectedRaw] of Object.entries(conditions||{})){
    if(!present(expectedRaw)) continue;
    const expected=upper(expectedRaw);
    const actual=upper(event?.[key]??(key==="setup"?event?.setupId:null));
    if(actual!==expected) return false;
  }
  return true;
}

function summarizePeriod(events,{minResolvedPerPeriod=DEFAULT_MIN_RESOLVED_PER_PERIOD}={}){
  const rows=Array.isArray(events)?events:[];
  const resolved=rows.filter(e=>e.resolution==="WIN"||e.resolution==="LOSS");
  const wins=resolved.filter(e=>e.resolution==="WIN").length;
  const losses=resolved.length-wins;
  return {
    sampleSize:rows.length,
    resolvedSampleSize:resolved.length,
    wins,
    losses,
    successRate:resolved.length?wins/resolved.length:null,
    successRatePct:resolved.length?Number(((wins/resolved.length)*100).toFixed(1)):null,
    ambiguous:rows.filter(e=>e.sequenceAmbiguous===true||e.resolution==="AMBIGUOUS").length,
    unresolved:rows.filter(e=>!["WIN","LOSS","AMBIGUOUS"].includes(String(e.resolution||""))).length,
    populated:resolved.length>=minResolvedPerPeriod,
    minResolvedPerPeriod
  };
}

function temporalAudit(events,conditions={},{
  minResolvedPerPeriod=DEFAULT_MIN_RESOLVED_PER_PERIOD,
  minPopulatedPeriods=DEFAULT_MIN_POPULATED_PERIODS
}={}){
  const matched=(Array.isArray(events)?events:[]).filter(e=>e?.evidenceEligible===true&&matches(e,conditions));
  const groups=new Map();
  for(const event of matched){
    const period=monthKey(eventTime(event));
    if(!period) continue;
    if(!groups.has(period)) groups.set(period,[]);
    groups.get(period).push(event);
  }
  const periods=Array.from(groups.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([period,rows])=>({
    period,
    ...summarizePeriod(rows,{minResolvedPerPeriod})
  }));
  const populated=periods.filter(row=>row.populated&&row.successRatePct!==null);
  const rates=populated.map(row=>row.successRatePct);
  const coverageStatus=matched.length===0?"NO_DATA":populated.length>=minPopulatedPeriods?"TEMPORAL_COVERAGE":"LIMITED_PERIOD_COVERAGE";
  return {
    conditions:{...conditions},
    coverageStatus,
    sampleSize:matched.length,
    periods,
    populatedPeriods:populated.length,
    minPopulatedPeriods,
    minResolvedPerPeriod,
    earliestPeriod:periods[0]?.period||null,
    latestPeriod:periods.at(-1)?.period||null,
    populatedRateMinPct:rates.length?Math.min(...rates):null,
    populatedRateMaxPct:rates.length?Math.max(...rates):null,
    populatedRateSpreadPct:rates.length?Number((Math.max(...rates)-Math.min(...rates)).toFixed(1)):null,
    note:"Temporal slices are descriptive diagnostics. Variation across periods is reported rather than converted into a prediction or confidence score."
  };
}

function auditsForCohorts(events,cohorts,options={}){
  return (Array.isArray(cohorts)?cohorts:[]).map(cohort=>{
    const conditions={};
    for(const field of ["setup","direction","stopModel","ftfcAlignment","priceBucket","observationPhase"]){
      if(present(cohort?.[field])) conditions[field]=cohort[field];
    }
    return {
      cohort:{...conditions,sampleSize:cohort.sampleSize??null,resolvedSampleSize:cohort.resolvedSampleSize??null},
      temporal:temporalAudit(events,conditions,options)
    };
  });
}

module.exports={
  DEFAULT_MIN_RESOLVED_PER_PERIOD,
  DEFAULT_MIN_POPULATED_PERIODS,
  eventTime,
  monthKey,
  matches,
  summarizePeriod,
  temporalAudit,
  auditsForCohorts
};
