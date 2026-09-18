"use strict";

const outcomes=require("./research-outcomes.js");
const dataSemantics=require("./data-semantics.js");

const DEFAULT_MIN_RESOLVED_SAMPLE_SIZE=20;
const CONTEXT_FIELDS=Object.freeze([
  "ftfcAlignment",
  "marketAlignment",
  "sectorAlignment",
  "elderState",
  "minerviniState",
  "exhaustionState",
  "sss50State",
  "priceBucket",
  "stopModel"
]);
const PROFILE_FIELDS=Object.freeze([
  "marketTimezone",
  "session",
  "extendedHoursIncluded",
  "barAnchor",
  "barAnchorOffsetMinutes",
  "providerAggregation"
]);

function text(value){
  if(value===null||value===undefined||value==="") return null;
  return String(value).trim().toUpperCase();
}

function normalizeDirection(value){
  const d=text(value);
  return d==="BULLISH"||d==="BEARISH"?d:null;
}

function normalizeSetupId(value){
  return text(value);
}

function normalizeTimeframe(value){
  return dataSemantics.normalizeTimeframe(value)||text(value);
}

function normalizeContextValue(value){
  return value===true||value===false?value:text(value);
}

function constructionProfile(source={}){
  const raw=source?.dataSemantics||source?.semantics||source||{};
  const n=dataSemantics.normalizeDataSemantics(raw);
  return {
    marketTimezone:n.marketTimezone||null,
    session:n.session||null,
    extendedHoursIncluded:n.extendedHoursIncluded===true,
    barAnchor:n.barAnchor||null,
    barAnchorOffsetMinutes:n.barAnchorOffsetMinutes,
    providerAggregation:n.providerAggregation||null
  };
}

function hasProfile(profile={}){
  return PROFILE_FIELDS.some(field=>{
    const value=profile?.[field];
    return value!==null&&value!==undefined&&(field==="extendedHoursIncluded"||value!=="");
  });
}

function profileMatches(eventProfile={},queryProfile={}){
  for(const field of PROFILE_FIELDS){
    const expected=queryProfile?.[field];
    if(expected===null||expected===undefined||expected==="") continue;
    if(eventProfile?.[field]!==expected) return false;
  }
  return true;
}

function normalizeQuery(input={}){
  const setupId=normalizeSetupId(input.setupId||input.setupFamily||input.setup);
  const direction=normalizeDirection(input.direction);
  const timeframe=normalizeTimeframe(input.timeframe);
  if(!setupId) throw new Error("historical evidence query requires setupId");
  if(!direction) throw new Error("historical evidence query requires BULLISH or BEARISH direction");
  if(!timeframe) throw new Error("historical evidence query requires timeframe");

  const context={};
  for(const field of CONTEXT_FIELDS){
    const value=input[field]??input.context?.[field]??null;
    context[field]=normalizeContextValue(value);
  }
  if(!context.ftfcAlignment){
    context.ftfcAlignment=normalizeContextValue(input.ftfc?.alignment||input.ftfc||null);
  }

  return {
    setupId,
    direction,
    timeframe,
    marketType:text(input.marketType),
    profile:constructionProfile(input),
    context
  };
}

function normalizeEvent(event={}){
  const setupId=normalizeSetupId(event.setupId||event.setupFamily||event.setup);
  const direction=normalizeDirection(event.direction);
  const timeframe=normalizeTimeframe(event.timeframe||event.setupTimeframe);
  const context={};
  for(const field of CONTEXT_FIELDS){
    const value=event[field]??event.context?.[field]??null;
    context[field]=normalizeContextValue(value);
  }
  if(!context.ftfcAlignment){
    context.ftfcAlignment=normalizeContextValue(event.ftfc?.alignment||event.ftfc||null);
  }
  return {
    ...event,
    setupId,
    direction,
    timeframe,
    marketType:text(event.marketType),
    profile:constructionProfile(event),
    context
  };
}

function coreMatches(event,query){
  return !!event&&event.setupId===query.setupId&&event.direction===query.direction&&event.timeframe===query.timeframe&&(!query.marketType||event.marketType===query.marketType);
}

function contextMatches(event,query){
  for(const field of CONTEXT_FIELDS){
    const expected=query.context?.[field];
    if(expected===null||expected===undefined||expected==="") continue;
    if(event.context?.[field]!==expected) return false;
  }
  return true;
}

function summarizeCohort(events,{minResolvedSampleSize=DEFAULT_MIN_RESOLVED_SAMPLE_SIZE}={}){
  const rows=(Array.isArray(events)?events:[]).filter(Boolean);
  const summary=outcomes.summarizeEvents(rows);
  const minimum=Number(minResolvedSampleSize);
  const minResolved=Number.isInteger(minimum)&&minimum>0?minimum:DEFAULT_MIN_RESOLVED_SAMPLE_SIZE;
  const status=rows.length===0
    ?"NOT_AVAILABLE"
    :summary.resolved>=minResolved
      ?"AVAILABLE"
      :"INSUFFICIENT_SAMPLE";
  return {
    status,
    sufficient:status==="AVAILABLE",
    sampleSize:summary.samples,
    resolvedSampleSize:summary.resolved,
    wins:summary.wins,
    losses:summary.losses,
    successRate:summary.winRate,
    successRatePct:summary.winRate===null?null:Number((summary.winRate*100).toFixed(1)),
    ambiguous:summary.ambiguous,
    open:summary.open,
    unresolved:summary.unresolved,
    averageRealizedR:summary.averageRealizedR,
    minResolvedSampleSize:minResolved,
    successDefinition:"MAGNITUDE_BEFORE_STOP"
  };
}

function analyzeHistoricalEvidence({events=[],query,minResolvedSampleSize=DEFAULT_MIN_RESOLVED_SAMPLE_SIZE}={}){
  const q=normalizeQuery(query||{});
  const normalized=(Array.isArray(events)?events:[]).map(normalizeEvent).filter(event=>event.setupId&&event.direction&&event.timeframe);
  const core=normalized.filter(event=>coreMatches(event,q));
  const semanticComparable=hasProfile(q.profile)?core.filter(event=>profileMatches(event.profile,q.profile)):core.slice();
  const exact=semanticComparable.filter(event=>contextMatches(event,q));

  const exactSummary=summarizeCohort(exact,{minResolvedSampleSize});
  const baselineSummary=summarizeCohort(semanticComparable,{minResolvedSampleSize});

  return {
    status:exactSummary.status,
    sufficient:exactSummary.sufficient,
    sampleSize:exactSummary.sampleSize,
    resolvedSampleSize:exactSummary.resolvedSampleSize,
    wins:exactSummary.wins,
    losses:exactSummary.losses,
    successRate:exactSummary.successRate,
    successRatePct:exactSummary.successRatePct,
    ambiguous:exactSummary.ambiguous,
    open:exactSummary.open,
    unresolved:exactSummary.unresolved,
    averageRealizedR:exactSummary.averageRealizedR,
    minResolvedSampleSize:exactSummary.minResolvedSampleSize,
    successDefinition:exactSummary.successDefinition,
    comparisonTier:"EXACT_CONTEXT",
    conditions:{
      setupId:q.setupId,
      direction:q.direction,
      timeframe:q.timeframe,
      marketType:q.marketType,
      profile:q.profile,
      context:q.context
    },
    broaderBaseline:{
      ...baselineSummary,
      comparisonTier:"SETUP_BASELINE",
      note:"Same setup/direction/timeframe and compatible bar-construction semantics; context filters are intentionally not applied."
    },
    audit:{
      inputEvents:normalized.length,
      coreMatches:core.length,
      semanticallyComparable:semanticComparable.length,
      exactContextMatches:exact.length,
      excludedForSemanticMismatch:core.length-semanticComparable.length
    },
    source:"HISTORICAL_EVENT_RECORDS",
    historicalEvidenceIsNotForecast:true,
    note:exactSummary.status==="AVAILABLE"
      ?"Descriptive historical evidence for the exact defined cohort. It is not a forecast."
      :exactSummary.status==="INSUFFICIENT_SAMPLE"
        ?"Comparable events exist, but the resolved sample is below the minimum. Keep guidance rule-based."
        :"No comparable historical events are available for the exact defined cohort."
  };
}

module.exports={
  DEFAULT_MIN_RESOLVED_SAMPLE_SIZE,
  CONTEXT_FIELDS,
  PROFILE_FIELDS,
  normalizeDirection,
  normalizeSetupId,
  normalizeTimeframe,
  constructionProfile,
  profileMatches,
  normalizeQuery,
  normalizeEvent,
  coreMatches,
  contextMatches,
  summarizeCohort,
  analyzeHistoricalEvidence
};
