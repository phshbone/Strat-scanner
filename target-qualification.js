"use strict";

function finite(v){ return Number.isFinite(Number(v)); }

function validateDirection(direction){
  if(!["BULLISH","BEARISH"].includes(direction)) throw new Error("direction must be BULLISH or BEARISH");
}

function normalizeRange(range){
  if(!range || !finite(range.high) || !finite(range.low)) return null;
  const high=Number(range.high), low=Number(range.low);
  if(high<=low) return null;
  return {...range,high,low};
}

function containsRange(outer,inner){
  const o=normalizeRange(outer), i=normalizeRange(inner);
  if(!o || !i) return false;
  return o.high>=i.high && o.low<=i.low && (o.high>i.high || o.low<i.low);
}

/*
  Alex's magnitude teaching gives an important prerequisite for a broader range:
  do not project to the opposite side of a larger range merely because that
  boundary exists. The relevant initiating side of that larger range must have
  been taken/engaged first.

  Bullish traversal toward a larger range high requires the larger range low
  to have been taken. Bearish traversal toward a larger range low requires the
  larger range high to have been taken.
*/
function requiredSideTaken(range,direction){
  validateDirection(direction);
  return direction==="BULLISH" ? range.lowTaken===true : range.highTaken===true;
}

function targetBoundary(range,direction){
  validateDirection(direction);
  const r=normalizeRange(range);
  if(!r) return null;
  return direction==="BULLISH" ? r.high : r.low;
}

/*
  Conservative structural qualification for post-magnitude targets.

  A broader range is eligible only when:
  1. it is valid/active;
  2. it contains the setup range;
  3. the required initiating side of that broader range has already been taken;
  4. its opposite boundary extends beyond setup-defined magnitude.

  This is intentionally narrower than "all pivots in the direction". It does
  not infer probabilities or force every nested timeframe range to be active.
*/
function qualifyTargetRanges({direction,setupRange,magnitude,candidateRanges=[]}){
  validateDirection(direction);
  const setup=normalizeRange(setupRange), mag=Number(magnitude);
  if(!setup) throw new Error("setupRange requires numeric high/low");
  if(!Number.isFinite(mag)) throw new Error("magnitude must be numeric");

  return (Array.isArray(candidateRanges)?candidateRanges:[])
    .map(normalizeRange)
    .filter(Boolean)
    .filter(r=>r.active!==false)
    .filter(r=>containsRange(r,setup))
    .filter(r=>requiredSideTaken(r,direction))
    .map(r=>({...r,targetPrice:targetBoundary(r,direction)}))
    .filter(r=>direction==="BULLISH" ? r.targetPrice>mag : r.targetPrice<mag)
    .sort((a,b)=>direction==="BULLISH" ? a.targetPrice-b.targetPrice : b.targetPrice-a.targetPrice);
}

function buildQualifiedTargets(args){
  return qualifyTargetRanges(args).map((r,index)=>({
    id:r.targetId || r.id || `range-target-${index+1}`,
    price:r.targetPrice,
    timeframe:r.timeframe,
    rangeId:r.id,
    source:"RANGE_BOUNDARY",
    structurallyRelevant:true,
    eligibleTarget:true,
    consumed:r.consumed===true
  }));
}

if(typeof module!=="undefined") module.exports={
  normalizeRange,
  containsRange,
  requiredSideTaken,
  targetBoundary,
  qualifyTargetRanges,
  buildQualifiedTargets
};
