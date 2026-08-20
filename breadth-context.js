"use strict";

const STATES=Object.freeze({
  TWO_UP:"TWO_UP",
  TWO_DOWN:"TWO_DOWN",
  SIDEWAYS:"SIDEWAYS",
  FAILED_DOWN_TO_OUTSIDE_UP:"FAILED_DOWN_TO_OUTSIDE_UP",
  FAILED_UP_TO_OUTSIDE_DOWN:"FAILED_UP_TO_OUTSIDE_DOWN",
  OUTSIDE_UNRESOLVED:"OUTSIDE_UNRESOLVED",
  UNKNOWN:"UNKNOWN"
});

const ALIASES=Object.freeze({
  "2U":STATES.TWO_UP,
  "2UP":STATES.TWO_UP,
  "UP":STATES.TWO_UP,
  "BULLISH":STATES.TWO_UP,
  "2D":STATES.TWO_DOWN,
  "2DOWN":STATES.TWO_DOWN,
  "DOWN":STATES.TWO_DOWN,
  "BEARISH":STATES.TWO_DOWN,
  "1":STATES.SIDEWAYS,
  "INSIDE":STATES.SIDEWAYS,
  "SIDEWAYS":STATES.SIDEWAYS,
  "FAILED_2D_TO_3U":STATES.FAILED_DOWN_TO_OUTSIDE_UP,
  "FAILED_2U_TO_3D":STATES.FAILED_UP_TO_OUTSIDE_DOWN,
  "3":STATES.OUTSIDE_UNRESOLVED,
  "OUTSIDE":STATES.OUTSIDE_UNRESOLVED,
  "UNKNOWN":STATES.UNKNOWN
});

function normalizeState(value){
  if(value==null) return STATES.UNKNOWN;
  const raw=String(value).trim().toUpperCase();
  return Object.values(STATES).includes(raw)?raw:(ALIASES[raw]||STATES.UNKNOWN);
}

function normalizeObservation(row){
  if(!row || typeof row!=="object") return null;
  const symbol=String(row.symbol||"").trim().toUpperCase();
  if(!symbol) return null;
  return {
    ...row,
    symbol,
    state:normalizeState(row.state),
    source:row.source||null,
    timestamp:row.timestamp||null
  };
}

function percent(count,total){
  return total>0?Number(((count/total)*100).toFixed(2)):0;
}

function buildBreadthSnapshot({universe="UNSPECIFIED",timeframe="D",observations=[]}={}){
  const bySymbol=new Map();
  for(const row of (Array.isArray(observations)?observations:[])){
    const normalized=normalizeObservation(row);
    if(normalized) bySymbol.set(normalized.symbol,normalized);
  }

  const rows=Array.from(bySymbol.values());
  const counts={};
  for(const state of Object.values(STATES)) counts[state]=0;
  for(const row of rows) counts[row.state]+=1;

  const total=rows.length;
  const bullishCount=counts[STATES.TWO_UP]+counts[STATES.FAILED_DOWN_TO_OUTSIDE_UP];
  const bearishCount=counts[STATES.TWO_DOWN]+counts[STATES.FAILED_UP_TO_OUTSIDE_DOWN];
  const sidewaysCount=counts[STATES.SIDEWAYS];
  const unresolvedCount=counts[STATES.OUTSIDE_UNRESOLVED]+counts[STATES.UNKNOWN];

  const participation={
    bullish:{count:bullishCount,pct:percent(bullishCount,total)},
    bearish:{count:bearishCount,pct:percent(bearishCount,total)},
    sideways:{count:sidewaysCount,pct:percent(sidewaysCount,total)},
    unresolved:{count:unresolvedCount,pct:percent(unresolvedCount,total)}
  };

  let context="MIXED";
  if(total===0) context="NO_DATA";
  else if(participation.bullish.pct>50) context="BULLISH_MAJORITY";
  else if(participation.bearish.pct>50) context="BEARISH_MAJORITY";

  return {
    universe:String(universe||"UNSPECIFIED"),
    timeframe:String(timeframe||"D"),
    totalTracked:total,
    counts,
    participation,
    directionalSpreadPct:Number((participation.bullish.pct-participation.bearish.pct).toFixed(2)),
    context,
    dataComplete:unresolvedCount===0,
    observations:rows
  };
}

function compareBreadthSnapshots(previous,current){
  if(!previous || !current) return null;
  const prevBull=Number(previous.participation?.bullish?.pct||0);
  const prevBear=Number(previous.participation?.bearish?.pct||0);
  const curBull=Number(current.participation?.bullish?.pct||0);
  const curBear=Number(current.participation?.bearish?.pct||0);
  return {
    bullishDeltaPct:Number((curBull-prevBull).toFixed(2)),
    bearishDeltaPct:Number((curBear-prevBear).toFixed(2)),
    spreadDeltaPct:Number(((curBull-curBear)-(prevBull-prevBear)).toFixed(2)),
    contextChanged:previous.context!==current.context,
    from:previous.context,
    to:current.context
  };
}

if(typeof module!=="undefined") module.exports={STATES,normalizeState,normalizeObservation,buildBreadthSnapshot,compareBreadthSnapshots};
