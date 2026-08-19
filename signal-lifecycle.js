"use strict";

function finite(v){ return v!==null && v!==undefined && v!=="" && Number.isFinite(Number(v)); }
function validDirection(d){ return d==="BULLISH" || d==="BEARISH"; }

function priceInForce(direction,trigger,currentPrice){
  if(!validDirection(direction) || !finite(trigger) || !finite(currentPrice)) return false;
  return direction==="BULLISH" ? Number(currentPrice)>Number(trigger) : Number(currentPrice)<Number(trigger);
}

function magnitudeReached(direction,magnitude,currentPrice){
  if(!validDirection(direction) || !finite(magnitude) || !finite(currentPrice)) return false;
  return direction==="BULLISH" ? Number(currentPrice)>=Number(magnitude) : Number(currentPrice)<=Number(magnitude);
}

function normalizeEpoch(v){
  if(v==null) return null;
  if(finite(v)) return Number(v);
  const t=Date.parse(v);
  return Number.isFinite(t)?t:null;
}

function resolveMagnitude(signal={}){
  if(finite(signal.magnitude)) return {price:Number(signal.magnitude),source:"SETUP",timeframe:signal.timeframe||null};
  if(finite(signal.borrowedMagnitude)) return {price:Number(signal.borrowedMagnitude),source:"BORROWED",timeframe:signal.borrowedMagnitudeTimeframe||null};
  return null;
}

/*
  Actionable-signal lifecycle.

  Current TheStrat.ai docs explicitly tie a signal to the bar in which it is
  active. The signal expires when that bar closes. Magnitude completion is a
  separate completion state, not a synonym for time expiration.

  A setup may provide its own magnitude or explicitly borrow a validated
  higher-timeframe magnitude (needed by expansion setups such as a future 3-2).
*/
function buildSignalLifecycle({signal,currentPrice,now=Date.now()}={}){
  if(!signal || !validDirection(signal.direction)) throw new Error("signal.direction must be BULLISH or BEARISH");
  if(!finite(signal.trigger)) throw new Error("signal.trigger must be numeric");

  const startsAt=normalizeEpoch(signal.signalStartsAt ?? signal.startsAt ?? signal.barStart);
  const expiresAt=normalizeEpoch(signal.signalExpiresAt ?? signal.expiresAt ?? signal.barEnd);
  const nowMs=normalizeEpoch(now);
  if(nowMs==null) throw new Error("now must be a valid timestamp");
  if(startsAt!=null && expiresAt!=null && !(expiresAt>startsAt)) throw new Error("signal expiration must be after signal start");

  const notStarted=startsAt!=null && nowMs<startsAt;
  const expired=expiresAt!=null && nowMs>=expiresAt;
  const triggerInForce=priceInForce(signal.direction,signal.trigger,currentPrice);
  const magnitude=resolveMagnitude(signal);
  const completed=!!magnitude && magnitudeReached(signal.direction,magnitude.price,currentPrice);
  const active=!notStarted && !expired && triggerInForce && !completed;

  let status="STANDBY";
  if(notStarted) status="NOT_STARTED";
  else if(expired) status="EXPIRED";
  else if(completed) status="COMPLETED";
  else if(active) status="ACTIVE";

  let timeElapsedPct=null,timeRemainingPct=null;
  if(startsAt!=null && expiresAt!=null){
    const span=expiresAt-startsAt;
    const clamped=Math.max(startsAt,Math.min(expiresAt,nowMs));
    timeElapsedPct=((clamped-startsAt)/span)*100;
    timeRemainingPct=100-timeElapsedPct;
  }

  return {
    timeframe:signal.timeframe||null,
    direction:signal.direction,
    trigger:Number(signal.trigger),
    magnitude,
    levelOfReclaim:finite(signal.levelOfReclaim)?Number(signal.levelOfReclaim):null,
    signalStartsAt:startsAt,
    signalExpiresAt:expiresAt,
    triggerInForce,
    active,
    completed,
    expired,
    status,
    timeElapsedPct,
    timeRemainingPct
  };
}

function carrierTimeframes({signals=[],currentPrice,now=Date.now()}={}){
  return (Array.isArray(signals)?signals:[])
    .map(signal=>buildSignalLifecycle({signal,currentPrice,now}))
    .filter(s=>s.active)
    .map(s=>s.timeframe)
    .filter(Boolean);
}

if(typeof module!=="undefined") module.exports={
  priceInForce,
  magnitudeReached,
  resolveMagnitude,
  buildSignalLifecycle,
  carrierTimeframes
};
