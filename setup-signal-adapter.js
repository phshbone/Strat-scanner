"use strict";

const {normalizeSignal}=require("./signal-schema.js");
const {buildSignalLifecycle}=require("./signal-lifecycle.js");
const {buildDominoState}=require("./timeframe-domino.js");

function finite(v){ return v!==null && v!==undefined && v!=="" && Number.isFinite(Number(v)); }

/*
  Adapts a setup object emitted by the current core Strat engine into the
  normalized actionable-signal schema used by lifecycle/domino logic.

  Important safeguards:
  - no Level of Reclaim is invented;
  - signal timing metadata is optional and must be supplied by the caller/data layer;
  - setup-defined magnitude is preserved exactly when present;
  - unsupported/no-magnitude setups remain without a magnitude unless an explicit
    borrowed higher-timeframe objective is supplied by the caller;
  - data-construction semantics are carried through unchanged for auditability.
*/
function setupToSignal(setup,{
  timeframe=null,
  signalStartsAt=null,
  signalExpiresAt=null,
  levelOfReclaim=null,
  reclaimSource=null,
  reclaimVerified=false,
  borrowedMagnitude=null,
  borrowedMagnitudeTimeframe=null,
  dataSemantics=null,
  semanticKey=null,
  metadata=null
}={}){
  if(!setup || !["BULLISH","BEARISH"].includes(setup.direction)) return null;
  if(!finite(setup.trigger)) return null;

  return normalizeSignal({
    setupId:setup.name || setup.setupId || null,
    setupFamily:setup.setupFamily || setup.name || null,
    direction:setup.direction,
    timeframe:timeframe || setup.timeframe || null,
    trigger:Number(setup.trigger),
    magnitude:finite(setup.magnitude)?Number(setup.magnitude):null,
    magnitudeSource:finite(setup.magnitude)?"SETUP":null,
    borrowedMagnitude,
    borrowedMagnitudeTimeframe,
    levelOfReclaim,
    reclaimSource,
    reclaimVerified,
    signalStartsAt,
    signalExpiresAt,
    reference:setup.reference || null,
    currentType:setup.currentType || null,
    pathResolved:setup.pathResolved!==false,
    dataSemantics,
    semanticKey,
    metadata:{
      ...(metadata||{}),
      originalSetup:setup.name || null
    }
  });
}

function buildSetupSignalState({setup,currentPrice,now=Date.now(),signalOptions={}}={}){
  const signal=setupToSignal(setup,signalOptions);
  if(!signal) return {signal:null,lifecycle:null};
  return {
    signal,
    lifecycle:buildSignalLifecycle({signal,currentPrice,now})
  };
}

/*
  Build a timeframe/domino state directly from real core-engine setup objects.
  Each row can contain:
    { timeframe, setup, signalOptions }

  Only valid directional setup objects become domino candidates. The lifecycle
  determines whether each candidate is actually active/in force at currentPrice.
*/
function buildDominoFromSetups({
  setupRows=[],
  currentPrice,
  now=Date.now(),
  selectedTimeframes,
  thesisTimeframe=null,
  executionTimeframe=null
}={}){
  const adapted=[];
  for(const row of (Array.isArray(setupRows)?setupRows:[])){
    if(!row) continue;
    const state=buildSetupSignalState({
      setup:row.setup,
      currentPrice,
      now,
      signalOptions:{...(row.signalOptions||{}),timeframe:row.timeframe || row.signalOptions?.timeframe || null}
    });
    if(!state.signal || !state.lifecycle) continue;
    adapted.push({
      timeframe:state.signal.timeframe,
      direction:state.signal.direction,
      trigger:state.signal.trigger,
      currentPrice:Number(currentPrice),
      inForce:state.lifecycle.active,
      setupId:state.signal.setupId,
      semanticKey:state.signal.semanticKey,
      dataSemantics:state.signal.dataSemantics,
      signal:state.signal,
      lifecycle:state.lifecycle
    });
  }

  const domino=buildDominoState({
    states:adapted,
    selectedTimeframes,
    thesisTimeframe,
    executionTimeframe
  });

  return {adaptedStates:adapted,domino};
}

if(typeof module!=="undefined") module.exports={setupToSignal,buildSetupSignalState,buildDominoFromSetups};
