"use strict";

const core=require("./core-engine-v0.3.js");

const STOP_MODELS=Object.freeze(["MIDPOINT","STRUCTURE"]);

function finite(value){
  return value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value));
}

function normalizeStopModel(value){
  const mode=String(value||"MIDPOINT").trim().toUpperCase();
  if(!STOP_MODELS.includes(mode)) throw new Error("stopModel must be MIDPOINT or STRUCTURE");
  return mode;
}

function timestampForBar(bar,index){
  return bar?.semantics?.barOpenTimestamp||bar?.datetime||bar?.time||String(index);
}

function eventId({symbol,timeframe,bar,index,setup,stopModel="MIDPOINT"}){
  const period=bar?.semantics?.periodOpenId||timestampForBar(bar,index);
  return [String(symbol||bar?.symbol||"UNKNOWN").toUpperCase(),String(timeframe||bar?.timeframe||"UNKNOWN").toUpperCase(),period,setup?.name||"UNKNOWN",setup?.direction||"UNKNOWN",normalizeStopModel(stopModel)].join("|");
}

function levelHits(bar,direction,price,kind){
  if(!bar||!finite(price)) return false;
  const p=Number(price),bullish=direction==="BULLISH";
  if(kind==="TARGET") return bullish?Number(bar.high)>=p:Number(bar.low)<=p;
  if(kind==="STOP") return bullish?Number(bar.low)<=p:Number(bar.high)>=p;
  if(kind==="ENTRY") return bullish?Number(bar.high)>=p:Number(bar.low)<=p;
  return false;
}

function resolveStop(trade,stopModel){
  const mode=normalizeStopModel(stopModel);
  const price=mode==="MIDPOINT"?trade?.midpointStop:trade?.structureStop;
  return finite(price)?Number(price):null;
}

function evaluateEventPath({bars,signalIndex,setup,stopModel="MIDPOINT",horizonBars=20,calculateTrade=core.calculateTrade}={}){
  if(!Array.isArray(bars)||!Number.isInteger(signalIndex)||signalIndex<0||signalIndex>=bars.length) throw new Error("valid signalIndex required");
  if(!setup||!["BULLISH","BEARISH"].includes(setup.direction)) throw new Error("directional setup required");
  const signalBar=bars[signalIndex];
  const trade=calculateTrade(setup,Number(signalBar.close));
  if(!trade) throw new Error("trade geometry unavailable");
  const stop=resolveStop(trade,stopModel);
  const entry=finite(setup.trigger)?Number(setup.trigger):null;
  const magnitude=finite(setup.magnitude)?Number(setup.magnitude):null;
  if(!finite(entry)||!finite(stop)||!finite(magnitude)) throw new Error("entry, stop, and magnitude are required");

  const entryTriggered=levelHits(signalBar,setup.direction,entry,"ENTRY");
  if(!entryTriggered){
    return {
      entryTriggered:false,
      entry,
      stop,
      magnitude,
      stopModel:normalizeStopModel(stopModel),
      magnitudeHit:false,
      stopHit:false,
      firstHit:null,
      sequenceAmbiguous:false,
      closed:true,
      resolution:"ENTRY_NOT_TRIGGERED",
      barsObserved:1,
      timeToMagnitudeBars:null
    };
  }

  const limit=Math.min(bars.length-1,signalIndex+Math.max(0,Number(horizonBars)||0));
  for(let i=signalIndex;i<=limit;i++){
    const bar=bars[i];
    const magnitudeHit=levelHits(bar,setup.direction,magnitude,"TARGET");
    const stopHit=levelHits(bar,setup.direction,stop,"STOP");

    if(i===signalIndex&&stopHit){
      return {
        entryTriggered:true,
        entry,
        stop,
        magnitude,
        stopModel:normalizeStopModel(stopModel),
        magnitudeHit,
        stopHit:true,
        firstHit:null,
        sequenceAmbiguous:true,
        ambiguityReason:magnitudeHit?"ENTRY_BAR_TARGET_STOP_SEQUENCE_UNKNOWN":"ENTRY_BAR_TRIGGER_STOP_SEQUENCE_UNKNOWN",
        closed:true,
        resolution:"AMBIGUOUS",
        resolvedIndex:i,
        barsObserved:i-signalIndex+1,
        timeToMagnitudeBars:magnitudeHit?0:null
      };
    }

    if(magnitudeHit&&stopHit){
      return {
        entryTriggered:true,
        entry,
        stop,
        magnitude,
        stopModel:normalizeStopModel(stopModel),
        magnitudeHit:true,
        stopHit:true,
        firstHit:null,
        sequenceAmbiguous:true,
        ambiguityReason:"TARGET_STOP_SAME_BAR_SEQUENCE_UNKNOWN",
        closed:true,
        resolution:"AMBIGUOUS",
        resolvedIndex:i,
        barsObserved:i-signalIndex+1,
        timeToMagnitudeBars:i-signalIndex
      };
    }
    if(magnitudeHit){
      return {
        entryTriggered:true,
        entry,
        stop,
        magnitude,
        stopModel:normalizeStopModel(stopModel),
        magnitudeHit:true,
        stopHit:false,
        firstHit:"MAGNITUDE",
        sequenceAmbiguous:false,
        closed:true,
        resolution:"WIN",
        resolvedIndex:i,
        barsObserved:i-signalIndex+1,
        timeToMagnitudeBars:i-signalIndex
      };
    }
    if(stopHit){
      return {
        entryTriggered:true,
        entry,
        stop,
        magnitude,
        stopModel:normalizeStopModel(stopModel),
        magnitudeHit:false,
        stopHit:true,
        firstHit:"STOP",
        sequenceAmbiguous:false,
        closed:true,
        resolution:"LOSS",
        resolvedIndex:i,
        barsObserved:i-signalIndex+1,
        timeToMagnitudeBars:null
      };
    }
  }

  return {
    entryTriggered:true,
    entry,
    stop,
    magnitude,
    stopModel:normalizeStopModel(stopModel),
    magnitudeHit:false,
    stopHit:false,
    firstHit:null,
    sequenceAmbiguous:false,
    closed:true,
    resolution:"HORIZON_UNRESOLVED",
    resolvedIndex:null,
    barsObserved:limit-signalIndex+1,
    timeToMagnitudeBars:null
  };
}

function buildHistoricalEvent({
  bars,
  signalIndex,
  setup,
  symbol=null,
  timeframe=null,
  marketType=null,
  stopModel="MIDPOINT",
  horizonBars=20,
  calculateTrade=core.calculateTrade,
  context=null
}={}){
  const bar=bars?.[signalIndex];
  if(!bar) throw new Error("signal bar required");
  const path=evaluateEventPath({bars,signalIndex,setup,stopModel,horizonBars,calculateTrade});
  const ctx=context&&typeof context==="object"?context:{};
  return {
    id:eventId({symbol,timeframe,bar,index:signalIndex,setup,stopModel}),
    ticker:String(symbol||bar.symbol||"").toUpperCase()||null,
    timestamp:timestampForBar(bar,signalIndex),
    signalBarTimestamp:timestampForBar(bar,signalIndex),
    setup:setup.name,
    setupId:setup.name,
    direction:setup.direction,
    timeframe:String(timeframe||bar.timeframe||bar?.semantics?.timeframe||"").toUpperCase()||null,
    marketType:marketType||bar?.semantics?.marketType||null,
    trigger:path.entry,
    entry:path.entry,
    stopModel:path.stopModel,
    stop:path.stop,
    magnitude:path.magnitude,
    dataSemantics:bar.semantics||null,
    semanticKey:bar.semanticKey||null,
    currentType:setup.currentType||null,
    pathResolved:setup.pathResolved!==false,
    pathResolutionSource:setup.currentType==="3"?"LOWER_TIMEFRAME_OR_INTRABAR_REQUIRED":"COMPLETED_OHLC_DIRECTIONAL",
    magnitudeHit:path.magnitudeHit,
    stopHit:path.stopHit,
    firstHit:path.firstHit,
    sequenceAmbiguous:path.sequenceAmbiguous,
    ambiguityReason:path.ambiguityReason||null,
    closed:path.closed,
    resolution:path.resolution,
    resolutionBarTimestamp:Number.isInteger(path.resolvedIndex)?timestampForBar(bars[path.resolvedIndex],path.resolvedIndex):null,
    horizonBars:Number(horizonBars),
    barsObserved:path.barsObserved,
    timeToMagnitudeBars:path.timeToMagnitudeBars,
    mfeR:null,
    maeR:null,
    excursionMeasurement:"DEFERRED_UNTIL_INTRABAR_SAFE",
    evidenceEligible:false,
    sampleConstruction:"COMPLETED_PARENT_BAR_SETUP_STATE",
    lookaheadRisk:"INTRABAR_SETUP_ACTIVATION_NOT_RECONSTRUCTED",
    ...ctx
  };
}

function extractHistoricalEvents({
  bars=[],
  symbol=null,
  timeframe=null,
  marketType=null,
  stopModel="MIDPOINT",
  horizonBars=20,
  detectSetup=core.detectSetup,
  calculateTrade=core.calculateTrade,
  contextResolver=null
}={}){
  if(!Array.isArray(bars)) throw new Error("bars must be an array");
  if(typeof detectSetup!=="function") throw new Error("detectSetup function required");
  if(typeof calculateTrade!=="function") throw new Error("calculateTrade function required");
  const events=[];
  for(let i=3;i<bars.length;i++){
    const setup=detectSetup(bars.slice(0,i+1));
    if(!setup||!["BULLISH","BEARISH"].includes(setup.direction)||setup.pathResolved===false) continue;
    let context=null;
    if(typeof contextResolver==="function"){
      context=contextResolver({bars,index:i,setup,symbol,timeframe,marketType})||null;
    }
    events.push(buildHistoricalEvent({
      bars,
      signalIndex:i,
      setup,
      symbol,
      timeframe,
      marketType,
      stopModel,
      horizonBars,
      calculateTrade,
      context
    }));
  }
  return events;
}

module.exports={
  STOP_MODELS,
  normalizeStopModel,
  timestampForBar,
  eventId,
  levelHits,
  resolveStop,
  evaluateEventPath,
  buildHistoricalEvent,
  extractHistoricalEvents
};
