"use strict";

const DEFAULT_LADDER=["Y","Q","M","W","D","60","30","15","5"];
const ALIASES={
  YEAR:"Y",YEARLY:"Y","1Y":"Y",
  QUARTER:"Q",QUARTERLY:"Q","3M":"Q",
  MONTH:"M",MONTHLY:"M","1M":"M",
  WEEK:"W",WEEKLY:"W","1W":"W",
  DAY:"D",DAILY:"D","1D":"D",
  "1H":"60","60M":"60","60MIN":"60",
  "30M":"30","30MIN":"30",
  "15M":"15","15MIN":"15",
  "5M":"5","5MIN":"5"
};

function normalizeTimeframe(tf){
  if(tf==null) return null;
  const raw=String(tf).trim().toUpperCase();
  return DEFAULT_LADDER.includes(raw)?raw:(ALIASES[raw]||null);
}

function timeframeRank(tf){
  const n=normalizeTimeframe(tf);
  return n==null?null:DEFAULT_LADDER.indexOf(n);
}

function sortTimeframes(timeframes=DEFAULT_LADDER){
  const unique=Array.from(new Set((Array.isArray(timeframes)?timeframes:[]).map(normalizeTimeframe).filter(Boolean)));
  return unique.sort((a,b)=>timeframeRank(a)-timeframeRank(b));
}

function isInForce({direction,trigger,currentPrice}){
  const t=Number(trigger), p=Number(currentPrice);
  if(!Number.isFinite(t)||!Number.isFinite(p)) return false;
  if(direction==="BULLISH") return p>t;
  if(direction==="BEARISH") return p<t;
  return false;
}

function normalizeState(state){
  if(!state || typeof state!=="object") return null;
  const timeframe=normalizeTimeframe(state.timeframe);
  if(!timeframe || !["BULLISH","BEARISH"].includes(state.direction)) return null;
  return {...state,timeframe,inForce:state.inForce===true || isInForce(state)};
}

/*
  Domino = an observable multi-timeframe state chain, not a claim of causality.
  A lower timeframe can become actionable first; if price subsequently puts a
  higher timeframe setup in force in the same direction, the higher timeframe
  is recorded as an advancement of the same directional thesis.
*/
function buildDominoState({states=[],selectedTimeframes=DEFAULT_LADDER,thesisTimeframe=null,executionTimeframe=null}={}){
  const ladder=sortTimeframes(selectedTimeframes);
  const byTf=new Map();
  for(const row of (Array.isArray(states)?states:[])){
    const n=normalizeState(row);
    if(n && ladder.includes(n.timeframe)) byTf.set(n.timeframe,n);
  }

  const active=ladder.map(tf=>byTf.get(tf)).filter(Boolean).filter(s=>s.inForce===true);
  const bullish=active.filter(s=>s.direction==="BULLISH");
  const bearish=active.filter(s=>s.direction==="BEARISH");
  const dominantDirection=bullish.length>bearish.length?"BULLISH":bearish.length>bullish.length?"BEARISH":"MIXED";

  const chains=[];
  for(const direction of ["BULLISH","BEARISH"]){
    const members=active.filter(s=>s.direction===direction);
    if(!members.length) continue;
    const ordered=members.slice().sort((a,b)=>timeframeRank(b.timeframe)-timeframeRank(a.timeframe));
    chains.push({
      direction,
      members:ordered.map((m,index)=>({...m,dominoOrder:index+1})),
      lowestActiveTimeframe:ordered[0].timeframe,
      highestActiveTimeframe:ordered[ordered.length-1].timeframe,
      activeCount:ordered.length
    });
  }

  const thesis=normalizeTimeframe(thesisTimeframe);
  const execution=normalizeTimeframe(executionTimeframe);
  return {
    ladder,
    thesisTimeframe:thesis,
    executionTimeframe:execution,
    activeStates:active,
    chains,
    dominantDirection,
    thesisState:thesis?byTf.get(thesis)||null:null,
    executionState:execution?byTf.get(execution)||null:null
  };
}

function defaultProfiles(){
  return {
    LONG_TERM:["Y","Q","M","W","D"],
    SWING:["M","W","D","60"],
    SWING_WITH_ENTRY:["M","W","D","60","30","15"],
    INTRADAY:["D","60","30","15","5"]
  };
}

if(typeof module!=="undefined") module.exports={DEFAULT_LADDER,normalizeTimeframe,timeframeRank,sortTimeframes,isInForce,normalizeState,buildDominoState,defaultProfiles};
