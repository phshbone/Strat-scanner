"use strict";

function finite(v){ return Number.isFinite(Number(v)); }

function toMs(v){
  if(v instanceof Date) return v.getTime();
  if(typeof v==="number" && Number.isFinite(v)) return v;
  const t=Date.parse(v);
  return Number.isFinite(t)?t:NaN;
}

/*
  Time exhaustion is mechanical: how much of the signal's active bar has
  elapsed. No LOW/MEDIUM/HIGH thresholds are invented here; callers may map
  exact percentages to UI labels later under an explicit preset.
*/
function buildTimeExhaustionState({signalStart,signalEnd,now}={}){
  const start=toMs(signalStart), end=toMs(signalEnd), current=toMs(now);
  if(!finite(start)||!finite(end)||!finite(current)) throw new Error("signalStart/signalEnd/now must be valid timestamps");
  if(end<=start) throw new Error("signalEnd must be after signalStart");

  const duration=end-start;
  const rawElapsed=(current-start)/duration;
  const elapsedFraction=Math.min(1,Math.max(0,rawElapsed));
  const remainingFraction=Math.max(0,1-elapsedFraction);
  const expired=current>=end;
  const notStarted=current<start;

  return {
    signalStart:start,
    signalEnd:end,
    now:current,
    durationMs:duration,
    elapsedPct:elapsedFraction*100,
    remainingPct:remainingFraction*100,
    expired,
    notStarted,
    active:!notStarted && !expired,
    timeExhaustionRisk:expired || elapsedFraction>0,
    type:"TIME"
  };
}

/*
  Price exhaustion remains separate from time exhaustion. It is supplied by
  deterministic objective/range logic (for example magnitude completion or
  clearing the currently active structure).
*/
function buildExhaustionState({timeState=null,priceExhaustionRisk=false}={}){
  return {
    timeExhaustion:timeState,
    timeExhaustionRisk:Boolean(timeState && timeState.timeExhaustionRisk),
    priceExhaustionRisk:priceExhaustionRisk===true,
    anyExhaustionRisk:Boolean((timeState && timeState.timeExhaustionRisk) || priceExhaustionRisk===true)
  };
}

if(typeof module!=="undefined") module.exports={
  buildTimeExhaustionState,
  buildExhaustionState
};
