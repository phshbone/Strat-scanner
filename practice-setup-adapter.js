"use strict";

const {createPracticeTrade}=require("./practice-trade-engine.js");
const {setupToSignal}=require("./setup-signal-adapter.js");

function finite(v){
  return v!==null && v!==undefined && v!=="" && Number.isFinite(Number(v));
}

/*
  Convert a deterministic Strat setup/signal into an ARMED practice trade.

  Safeguards:
  - trigger comes from the normalized deterministic signal;
  - target defaults only to a validated signal magnitude;
  - stop must be supplied explicitly by a named stop rule/source;
  - no arbitrary percent/ATR/inside-bar stop is invented here;
  - practice trades are research objects only and carry no broker/execution authority.
*/
function setupToPracticeTrade(setup,{
  symbol,
  timeframe=null,
  stopPrice,
  stopSource,
  targetPrice=null,
  targetSource=null,
  quantity=1,
  createdAt=null,
  signalOptions={},
  context={}
}={}){
  const signal=setupToSignal(setup,{...signalOptions,timeframe:timeframe || signalOptions.timeframe || setup?.timeframe || null});
  if(!signal) throw new Error("directional setup with finite trigger required");

  const sym=String(symbol || setup?.symbol || "").trim().toUpperCase();
  if(!sym) throw new Error("symbol required");
  if(!finite(stopPrice)) throw new Error("explicit stopPrice required");
  const stopRule=String(stopSource || "").trim();
  if(!stopRule) throw new Error("explicit stopSource required");

  let target;
  let resolvedTargetSource;
  if(finite(targetPrice)){
    target=Number(targetPrice);
    resolvedTargetSource=String(targetSource || "EXPLICIT_TARGET").trim() || "EXPLICIT_TARGET";
  }else if(finite(signal.magnitude)){
    target=Number(signal.magnitude);
    resolvedTargetSource=signal.magnitudeSource || "SETUP_MAGNITUDE";
  }else if(finite(signal.borrowedMagnitude)){
    target=Number(signal.borrowedMagnitude);
    resolvedTargetSource="BORROWED_MAGNITUDE";
  }else{
    throw new Error("practice trade requires explicit targetPrice or validated signal magnitude");
  }

  const direction=signal.direction==="BULLISH" ? "BULL" : "BEAR";
  const tf=String(signal.timeframe || timeframe || "").trim().toUpperCase();
  if(!tf) throw new Error("timeframe required");

  return createPracticeTrade({
    symbol:sym,
    timeframe:tf,
    direction,
    setupType:signal.setupId || signal.setupFamily || setup?.name || "STRAT_SETUP",
    triggerPrice:Number(signal.trigger),
    stopPrice:Number(stopPrice),
    targetPrice:target,
    quantity,
    createdAt,
    context:{
      ...context,
      practiceOnly:true,
      source:"DETERMINISTIC_STRAT_SIGNAL",
      signal,
      stopSource:stopRule,
      targetSource:resolvedTargetSource,
      brokerAuthority:false
    }
  });
}

module.exports={setupToPracticeTrade};
