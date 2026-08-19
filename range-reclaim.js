"use strict";

function finite(v){ return v!==null && v!==undefined && v!=="" && Number.isFinite(Number(v)); }
function validDirection(d){ return d==="BULLISH" || d==="BEARISH"; }

function normalizeRange(range,index=0){
  if(!range || !finite(range.high) || !finite(range.low)) return null;
  const high=Number(range.high), low=Number(range.low);
  if(!(high>low)) return null;
  return {
    ...range,
    id:range.id || `range-${index+1}`,
    high,
    low,
    timeframe:range.timeframe || null,
    sourceType:range.sourceType || "EXPLICIT_RANGE",
    source:range.source || "EXPLICIT",
    verified:range.verified===true
  };
}

/*
  Range-aware Level-of-Reclaim model.

  Canonical/primary-source work supports treating reclaim as a structural
  gateway back into a prior outside/broadening range. This module does NOT
  decide that every historical range is a valid reclaim range. Upstream logic
  must supply an explicit verified source range.

  BULLISH traversal: re-enter through range low -> target range high.
  BEARISH traversal: re-enter through range high -> target range low.
*/
function deriveReclaimFromRange({range,direction}={}){
  if(!validDirection(direction)) throw new Error("direction must be BULLISH or BEARISH");
  const r=normalizeRange(range);
  if(!r || r.verified!==true) return null;

  return {
    reclaimId:`reclaim:${r.id}:${direction}`,
    sourceRangeId:r.id,
    sourceTimeframe:r.timeframe,
    sourceType:r.sourceType,
    source:r.source,
    direction,
    rangeHigh:r.high,
    rangeLow:r.low,
    reclaimPrice:direction==="BULLISH" ? r.low : r.high,
    oppositeBoundary:direction==="BULLISH" ? r.high : r.low,
    verified:true
  };
}

function reclaimEntered({direction,currentPrice,reclaimPrice}={}){
  if(!validDirection(direction) || !finite(currentPrice) || !finite(reclaimPrice)) return false;
  const p=Number(currentPrice), r=Number(reclaimPrice);
  return direction==="BULLISH" ? p>r : p<r;
}

function reclaimTargetHit({direction,currentPrice,oppositeBoundary}={}){
  if(!validDirection(direction) || !finite(currentPrice) || !finite(oppositeBoundary)) return false;
  const p=Number(currentPrice), t=Number(oppositeBoundary);
  return direction==="BULLISH" ? p>=t : p<=t;
}

function reclaimFailed({direction,currentPrice,reclaimPrice,wasReclaimed=false}={}){
  if(wasReclaimed!==true || !validDirection(direction) || !finite(currentPrice) || !finite(reclaimPrice)) return false;
  const p=Number(currentPrice), r=Number(reclaimPrice);
  return direction==="BULLISH" ? p<=r : p>=r;
}

function buildRangeReclaimState({
  range,
  direction,
  currentPrice,
  wasReclaimed=false
}={}){
  if(!finite(currentPrice)) throw new Error("currentPrice must be numeric");
  const reclaim=deriveReclaimFromRange({range,direction});
  if(!reclaim){
    return {
      direction:validDirection(direction)?direction:null,
      currentPrice:Number(currentPrice),
      state:"NO_VERIFIED_RECLAIM_RANGE",
      reclaim:null,
      reclaimed:false,
      targetHit:false,
      failed:false,
      objective:null
    };
  }

  const failed=reclaimFailed({direction,currentPrice,reclaimPrice:reclaim.reclaimPrice,wasReclaimed});
  const targetHit=!failed && reclaimTargetHit({direction,currentPrice,oppositeBoundary:reclaim.oppositeBoundary});
  const entered=!failed && (wasReclaimed===true || reclaimEntered({direction,currentPrice,reclaimPrice:reclaim.reclaimPrice}));

  let state="RANGE_RECLAIM_PENDING";
  if(failed) state="RECLAIM_RANGE_FAILED";
  else if(targetHit) state="RECLAIM_RANGE_TARGET_HIT";
  else if(entered) state="TRAVERSING_RECLAIMED_RANGE";

  return {
    direction,
    currentPrice:Number(currentPrice),
    state,
    reclaim,
    reclaimed:entered,
    targetHit,
    failed,
    objective:entered && !failed ? {
      id:`objective:${reclaim.reclaimId}`,
      price:reclaim.oppositeBoundary,
      direction,
      sourceType:"RECLAIMED_RANGE_OPPOSITE_BOUNDARY",
      sourceRangeId:reclaim.sourceRangeId,
      timeframe:reclaim.sourceTimeframe,
      consumed:targetHit
    } : null
  };
}

function buildReclaimStack({ranges=[],direction,currentPrice,previousStates={}}={}){
  if(!validDirection(direction)) throw new Error("direction must be BULLISH or BEARISH");
  const states=[];
  for(let i=0;i<(Array.isArray(ranges)?ranges:[]).length;i++){
    const r=normalizeRange(ranges[i],i);
    if(!r) continue;
    const prev=previousStates && previousStates[r.id];
    const state=buildRangeReclaimState({
      range:r,
      direction,
      currentPrice,
      wasReclaimed:prev ? (prev.reclaimed===true && prev.failed!==true && prev.targetHit!==true) : false
    });
    states.push(state);
  }

  const activeObjectives=states
    .filter(s=>s.objective && s.objective.consumed!==true)
    .map(s=>s.objective)
    .sort((a,b)=>direction==="BULLISH" ? a.price-b.price : b.price-a.price);

  return {
    direction,
    currentPrice:Number(currentPrice),
    states,
    activeObjectives,
    nextObjective:activeObjectives[0] || null,
    completedCount:states.filter(s=>s.targetHit===true).length,
    failedCount:states.filter(s=>s.failed===true).length
  };
}

if(typeof module!=="undefined") module.exports={
  normalizeRange,
  deriveReclaimFromRange,
  reclaimEntered,
  reclaimTargetHit,
  reclaimFailed,
  buildRangeReclaimState,
  buildReclaimStack
};
