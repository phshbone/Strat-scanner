"use strict";

const VALID_TIMEFRAMES=["Y","Q","M","W","D","60","30","15","5"];
const VALID_SESSIONS=["REGULAR","EXTENDED","ALL"];

function finite(v){ return v!==null && v!==undefined && v!=="" && Number.isFinite(Number(v)); }
function nonEmpty(v){ return typeof v==="string" && v.trim().length>0; }
function normalizeTimeframe(tf){
  if(tf==null) return null;
  const raw=String(tf).trim().toUpperCase();
  const aliases={YEAR:"Y",YEARLY:"Y","1Y":"Y",QUARTER:"Q",QUARTERLY:"Q","3M":"Q",MONTH:"M",MONTHLY:"M","1M":"M",WEEK:"W",WEEKLY:"W","1W":"W",DAY:"D",DAILY:"D","1D":"D","1H":"60","60M":"60","60MIN":"60","30M":"30","30MIN":"30","15M":"15","15MIN":"15","5M":"5","5MIN":"5"};
  return VALID_TIMEFRAMES.includes(raw)?raw:(aliases[raw]||null);
}

function normalizeSession(session){
  if(session==null) return null;
  const raw=String(session).trim().toUpperCase();
  const aliases={RTH:"REGULAR",REGULAR_HOURS:"REGULAR",ETH:"EXTENDED",EXTENDED_HOURS:"EXTENDED",FULL:"ALL"};
  const normalized=aliases[raw]||raw;
  return VALID_SESSIONS.includes(normalized)?normalized:null;
}

function normalizeTimestamp(value){
  if(value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if(!nonEmpty(value)) return null;
  const d=new Date(value);
  return Number.isNaN(d.getTime())?null:d.toISOString();
}

/*
  Deterministic metadata wrapper for every market-data bar.
  The engine does not assume provider bars are interchangeable: timeframe,
  timezone, session, extended-hours policy, bar anchor/offset, provider
  aggregation and period-open identity are first-class provenance.
*/
function normalizeDataSemantics(meta={}){
  const timeframe=normalizeTimeframe(meta.timeframe);
  const session=normalizeSession(meta.session);
  const barAnchorOffsetMinutes=finite(meta.barAnchorOffsetMinutes)?Number(meta.barAnchorOffsetMinutes):null;
  return {
    symbol:nonEmpty(meta.symbol)?meta.symbol.trim().toUpperCase():null,
    timeframe,
    marketTimezone:nonEmpty(meta.marketTimezone)?meta.marketTimezone.trim():null,
    session,
    extendedHoursIncluded:meta.extendedHoursIncluded===true,
    barAnchor:nonEmpty(meta.barAnchor)?meta.barAnchor.trim():null,
    barAnchorOffsetMinutes,
    provider:nonEmpty(meta.provider)?meta.provider.trim():null,
    providerAggregation:nonEmpty(meta.providerAggregation)?meta.providerAggregation.trim():null,
    periodOpenId:nonEmpty(meta.periodOpenId)?meta.periodOpenId.trim():null,
    periodOpenTimestamp:normalizeTimestamp(meta.periodOpenTimestamp),
    barOpenTimestamp:normalizeTimestamp(meta.barOpenTimestamp),
    barCloseTimestamp:normalizeTimestamp(meta.barCloseTimestamp)
  };
}

function validateDataSemantics(meta={}, {requireProvider=true,requirePeriodIdentity=true}={}){
  const n=normalizeDataSemantics(meta);
  const errors=[];
  if(!n.symbol) errors.push("symbol required");
  if(!n.timeframe) errors.push("valid timeframe required");
  if(!n.marketTimezone) errors.push("marketTimezone required");
  if(!n.session) errors.push("valid session required");
  if(!n.barAnchor) errors.push("barAnchor required");
  if(n.barAnchorOffsetMinutes===null) errors.push("barAnchorOffsetMinutes required");
  if(requireProvider && !n.provider) errors.push("provider required");
  if(requireProvider && !n.providerAggregation) errors.push("providerAggregation required");
  if(requirePeriodIdentity && !n.periodOpenId) errors.push("periodOpenId required");
  if(requirePeriodIdentity && !n.periodOpenTimestamp) errors.push("periodOpenTimestamp required");
  if(n.barOpenTimestamp && n.barCloseTimestamp && new Date(n.barCloseTimestamp)<=new Date(n.barOpenTimestamp)) errors.push("barCloseTimestamp must be after barOpenTimestamp");
  return {valid:errors.length===0,errors,semantics:n};
}

function buildSemanticKey(meta={}){
  const {valid,errors,semantics:n}=validateDataSemantics(meta);
  if(!valid) throw new Error(`invalid data semantics: ${errors.join("; ")}`);
  return [n.symbol,n.timeframe,n.marketTimezone,n.session,n.extendedHoursIncluded?"EXT":"NOEXT",n.barAnchor,String(n.barAnchorOffsetMinutes),n.provider,n.providerAggregation,n.periodOpenId].join("|");
}

function comparableSemantics(a,b){
  const A=normalizeDataSemantics(a), B=normalizeDataSemantics(b);
  const fields=["timeframe","marketTimezone","session","extendedHoursIncluded","barAnchor","barAnchorOffsetMinutes","providerAggregation","periodOpenId"];
  const mismatches=fields.filter(f=>A[f]!==B[f]).map(f=>({field:f,left:A[f],right:B[f]}));
  return {comparable:mismatches.length===0,mismatches,left:A,right:B};
}

function attachSemanticsToBar(bar={},meta={}){
  const validation=validateDataSemantics(meta);
  if(!validation.valid) throw new Error(`invalid data semantics: ${validation.errors.join("; ")}`);
  for(const field of ["open","high","low","close"]){
    if(!finite(bar[field])) throw new Error(`${field} must be numeric`);
  }
  const out={...bar,open:Number(bar.open),high:Number(bar.high),low:Number(bar.low),close:Number(bar.close)};
  if(finite(bar.volume)) out.volume=Number(bar.volume);
  out.semantics=validation.semantics;
  out.semanticKey=buildSemanticKey(validation.semantics);
  return out;
}

if(typeof module!=="undefined") module.exports={
  VALID_TIMEFRAMES,
  VALID_SESSIONS,
  normalizeTimeframe,
  normalizeSession,
  normalizeDataSemantics,
  validateDataSemantics,
  buildSemanticKey,
  comparableSemantics,
  attachSemanticsToBar
};