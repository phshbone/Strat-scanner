"use strict";

function finite(v){ return v!==null && v!==undefined && v!=="" && Number.isFinite(Number(v)); }
function validDirection(d){ return d==="BULLISH" || d==="BEARISH"; }

/*
  Normalized actionable-signal schema.

  Important: levelOfReclaim is a first-class field, but this module deliberately
  does not calculate it. Unknown reclaim must stay null rather than being
  inferred from midpointStop or structureStop.

  Data-construction semantics are also preserved as first-class provenance so
  a signal can always be traced back to the exact timeframe/session/aggregation
  rules that created its source bars.
*/
function normalizeSignal(input={}){
  if(!validDirection(input.direction)) throw new Error("direction must be BULLISH or BEARISH");
  if(!finite(input.trigger)) throw new Error("trigger must be numeric");

  const magnitude=finite(input.magnitude)?Number(input.magnitude):null;
  const borrowedMagnitude=finite(input.borrowedMagnitude)?Number(input.borrowedMagnitude):null;

  return {
    setupId:input.setupId || input.name || null,
    setupFamily:input.setupFamily || null,
    direction:input.direction,
    timeframe:input.timeframe || null,
    trigger:Number(input.trigger),
    magnitude,
    magnitudeSource:magnitude!==null ? (input.magnitudeSource || "SETUP") : borrowedMagnitude!==null ? "BORROWED" : null,
    borrowedMagnitude,
    borrowedMagnitudeTimeframe:borrowedMagnitude!==null ? (input.borrowedMagnitudeTimeframe || null) : null,
    levelOfReclaim:finite(input.levelOfReclaim)?Number(input.levelOfReclaim):null,
    reclaimSource:finite(input.levelOfReclaim)?(input.reclaimSource || "EXPLICIT"):null,
    reclaimVerified:input.reclaimVerified===true,
    signalStartsAt:input.signalStartsAt ?? input.startsAt ?? input.barStart ?? null,
    signalExpiresAt:input.signalExpiresAt ?? input.expiresAt ?? input.barEnd ?? null,
    reference:input.reference || null,
    currentType:input.currentType || null,
    pathResolved:input.pathResolved!==false,
    dataSemantics:input.dataSemantics || null,
    semanticKey:input.semanticKey || input.dataSemantics?.semanticKey || null,
    metadata:input.metadata || null
  };
}

function effectiveMagnitude(signal={}){
  if(finite(signal.magnitude)) return {price:Number(signal.magnitude),source:"SETUP",timeframe:signal.timeframe||null};
  if(finite(signal.borrowedMagnitude)) return {price:Number(signal.borrowedMagnitude),source:"BORROWED",timeframe:signal.borrowedMagnitudeTimeframe||null};
  return null;
}

function reclaimStatus(signal={}){
  if(!finite(signal.levelOfReclaim)) return {known:false,verified:false,price:null};
  return {known:true,verified:signal.reclaimVerified===true,price:Number(signal.levelOfReclaim)};
}

if(typeof module!=="undefined") module.exports={normalizeSignal,effectiveMagnitude,reclaimStatus};
