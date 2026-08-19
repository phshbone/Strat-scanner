"use strict";

function finite(v){ return v!==null && v!==undefined && v!=="" && Number.isFinite(Number(v)); }
function validDirection(d){ return d==="BULLISH" || d==="BEARISH"; }

function normalizeReclaimLevel(level,index=0){
  if(!level || !finite(level.price)) return null;
  return {
    ...level,
    id:level.id || `reclaim-${index+1}`,
    price:Number(level.price),
    timeframe:level.timeframe || null,
    source:level.source || "EXPLICIT",
    verified:level.verified===true
  };
}

function sortReclaimLevels(levels,direction){
  if(!validDirection(direction)) throw new Error("direction must be BULLISH or BEARISH");
  const normalized=(Array.isArray(levels)?levels:[]).map((x,i)=>normalizeReclaimLevel(x,i)).filter(Boolean);
  return normalized.sort((a,b)=>direction==="BULLISH" ? b.price-a.price : a.price-b.price);
}

/*
  Level-of-Reclaim management helper.

  Current TheStrat.ai material confirms that, after magnitude/price exhaustion,
  management may tighten the level of defense to the nearest valid Level of
  Reclaim. It does NOT expose one universal formula for deriving reclaim from
  every setup pattern. Therefore this module only consumes explicit, verified
  reclaim levels supplied by upstream pattern-specific logic or audited data.

  For an existing long, the nearest defensive reclaim is the highest verified
  reclaim below current price. For an existing short, it is the lowest verified
  reclaim above current price.
*/
function nearestDefensiveReclaim({direction,currentPrice,levels=[]}={}){
  if(!validDirection(direction)) throw new Error("direction must be BULLISH or BEARISH");
  const p=Number(currentPrice);
  if(!Number.isFinite(p)) throw new Error("currentPrice must be numeric");

  const verified=sortReclaimLevels(levels,direction).filter(x=>x.verified===true);
  const eligible=direction==="BULLISH"
    ? verified.filter(x=>x.price<p)
    : verified.filter(x=>x.price>p);

  if(!eligible.length) return null;
  return direction==="BULLISH"
    ? eligible.sort((a,b)=>b.price-a.price)[0]
    : eligible.sort((a,b)=>a.price-b.price)[0];
}

function reclaimBreach({direction,currentPrice,level}={}){
  if(!validDirection(direction)) throw new Error("direction must be BULLISH or BEARISH");
  if(!level || level.verified!==true || !finite(level.price) || !finite(currentPrice)) return false;
  const p=Number(currentPrice), l=Number(level.price);
  return direction==="BULLISH" ? p<=l : p>=l;
}

function buildReclaimManagementState({
  direction,
  currentPrice,
  levels=[],
  magnitudeReached=false,
  higherTimeframeCarrierActive=false
}={}){
  const defensiveLevel=nearestDefensiveReclaim({direction,currentPrice,levels});
  const breached=reclaimBreach({direction,currentPrice,level:defensiveLevel});

  let guidance="NO_RECLAIM_GUIDANCE";
  if(defensiveLevel){
    if(breached) guidance="RECLAIM_BREACHED";
    else if(magnitudeReached===true && higherTimeframeCarrierActive!==true) guidance="TIGHTEN_TO_NEAREST_RECLAIM";
    else guidance="RECLAIM_AVAILABLE";
  }

  return {
    direction,
    currentPrice:Number(currentPrice),
    defensiveLevel,
    reclaimBreached:breached,
    magnitudeReached:magnitudeReached===true,
    higherTimeframeCarrierActive:higherTimeframeCarrierActive===true,
    guidance
  };
}

if(typeof module!=="undefined") module.exports={
  normalizeReclaimLevel,
  sortReclaimLevels,
  nearestDefensiveReclaim,
  reclaimBreach,
  buildReclaimManagementState
};
