"use strict";

const core=require("./core-engine-v0.3.js");
const live=require("./live-candidates-ui.js");
const builder=require("./historical-event-builder.js");

const SAMPLE_CONSTRUCTION="LOWER_5M_CHECKPOINT_FIRST_OBSERVABLE";
const SUCCESS_DEFINITION="MAGNITUDE_BEFORE_STOP_AFTER_OBSERVATION_CHECKPOINT";

function finite(v){return v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));}
function epoch(bar){return Date.parse(bar?.semantics?.barOpenTimestamp||bar?.datetime||bar?.time||"");}
function closeEpoch(bar){return Date.parse(bar?.semantics?.barCloseTimestamp||"");}
function semanticDate(bar){return String(bar?.semantics?.periodOpenId||"").split("|")[2]||null;}
function parentKey(bar,parentMinutes=15){
  const date=semanticDate(bar);
  const offset=Number(bar?.semantics?.barAnchorOffsetMinutes);
  if(!date||!Number.isFinite(offset)) return null;
  return date+"|"+String(Math.floor(offset/parentMinutes)*parentMinutes);
}

function groupLowerBars(lowerBars,{parentMinutes=15}={}){
  const map=new Map();
  (Array.isArray(lowerBars)?lowerBars:[]).forEach((bar,index)=>{
    const key=parentKey(bar,parentMinutes);
    if(!key) return;
    if(!map.has(key)) map.set(key,[]);
    map.get(key).push({bar,index});
  });
  for(const rows of map.values()) rows.sort((a,b)=>epoch(a.bar)-epoch(b.bar));
  return map;
}

function aggregatePartialParent(parentBar,lowerRows,throughIndex){
  const rows=lowerRows.slice(0,throughIndex+1).map(x=>x.bar);
  if(!rows.length) throw new Error("lower timeframe rows required");
  const volume=rows.reduce((sum,row)=>sum+(finite(row.volume)?Number(row.volume):0),0);
  const partial={
    ...parentBar,
    open:Number(rows[0].open),
    high:Math.max(...rows.map(row=>Number(row.high))),
    low:Math.min(...rows.map(row=>Number(row.low))),
    close:Number(rows.at(-1).close),
    partial:true,
    observationTimestamp:rows.at(-1)?.semantics?.barCloseTimestamp||null
  };
  if(rows.some(row=>finite(row.volume))) partial.volume=volume;
  return partial;
}

function inferOutsidePathDirection(lowerRows,priorParent,throughIndex){
  if(!priorParent) return null;
  let firstSide=null;
  for(let i=0;i<=throughIndex;i++){
    const bar=lowerRows[i]?.bar;
    if(!bar) continue;
    const up=Number(bar.high)>Number(priorParent.high);
    const down=Number(bar.low)<Number(priorParent.low);
    if(!up&&!down) continue;
    if(up&&down){
      if(firstSide==="UP") return "BEARISH";
      if(firstSide==="DOWN") return "BULLISH";
      return null;
    }
    const side=up?"UP":"DOWN";
    if(firstSide===null){firstSide=side;continue;}
    if(firstSide==="UP"&&side==="DOWN") return "BEARISH";
    if(firstSide==="DOWN"&&side==="UP") return "BULLISH";
  }
  return null;
}

function magnitudeTouched(partial,setup){
  if(!finite(setup?.magnitude)) return false;
  return setup.direction==="BULLISH"?Number(partial.high)>=Number(setup.magnitude):Number(partial.low)<=Number(setup.magnitude);
}

function actionableAtCheckpoint(partial,setup){
  if(!setup||!["BULLISH","BEARISH"].includes(setup.direction)||setup.pathResolved===false||!finite(setup.trigger)||!finite(setup.magnitude)) return false;
  const price=Number(partial.close),trigger=Number(setup.trigger);
  const inForce=setup.direction==="BULLISH"?price>trigger:price<trigger;
  if(!inForce) return false;
  if(magnitudeTouched(partial,setup)) return false;
  return true;
}

function progressContext(setup,price){
  const trigger=Number(setup.trigger),magnitude=Number(setup.magnitude),p=Number(price);
  const total=setup.direction==="BULLISH"?magnitude-trigger:trigger-magnitude;
  const moved=setup.direction==="BULLISH"?p-trigger:trigger-p;
  if(!(total>0)||!Number.isFinite(moved)) return {activationProgressPct:null,priceBucket:null};
  const pct=Math.max(0,Math.min(100,(moved/total)*100));
  const priceBucket=pct<33.333?"EARLY":pct<66.667?"MID":"LATE";
  return {activationProgressPct:Number(pct.toFixed(1)),priceBucket};
}

function stopPrice(setup,stopModel){
  const trade=core.calculateTrade(setup,Number(setup.trigger));
  const stop=builder.resolveStop(trade,stopModel);
  if(!finite(stop)) throw new Error("historical checkpoint stop unavailable");
  return Number(stop);
}

function evaluateAfterObservation({lowerBars,activationLowerIndex,setup,stopModel="MIDPOINT",horizonParentBars=20,parentMinutes=15,lowerMinutes=5}={}){
  const ratio=parentMinutes/lowerMinutes;
  if(!Number.isInteger(ratio)||ratio<1) throw new Error("lower timeframe must divide parent timeframe");
  const stop=stopPrice(setup,stopModel),magnitude=Number(setup.magnitude);
  const start=activationLowerIndex+1;
  const end=Math.min(lowerBars.length-1,activationLowerIndex+Math.max(1,Number(horizonParentBars)||20)*ratio);
  for(let i=start;i<=end;i++){
    const bar=lowerBars[i];
    const targetHit=builder.levelHits(bar,setup.direction,magnitude,"TARGET");
    const stopHit=builder.levelHits(bar,setup.direction,stop,"STOP");
    if(targetHit&&stopHit){
      return {resolution:"AMBIGUOUS",magnitudeHit:true,stopHit:true,firstHit:null,sequenceAmbiguous:true,ambiguityReason:"LOWER_TIMEFRAME_TARGET_STOP_SEQUENCE_UNKNOWN",resolvedLowerIndex:i,resolutionTimestamp:bar?.semantics?.barCloseTimestamp||null,timeToMagnitudeBars:Math.floor((i-activationLowerIndex)/ratio)};
    }
    if(targetHit){
      return {resolution:"WIN",magnitudeHit:true,stopHit:false,firstHit:"MAGNITUDE",sequenceAmbiguous:false,ambiguityReason:null,resolvedLowerIndex:i,resolutionTimestamp:bar?.semantics?.barCloseTimestamp||null,timeToMagnitudeBars:Math.floor((i-activationLowerIndex)/ratio)};
    }
    if(stopHit){
      return {resolution:"LOSS",magnitudeHit:false,stopHit:true,firstHit:"STOP",sequenceAmbiguous:false,ambiguityReason:null,resolvedLowerIndex:i,resolutionTimestamp:bar?.semantics?.barCloseTimestamp||null,timeToMagnitudeBars:null};
    }
  }
  return {resolution:"HORIZON_UNRESOLVED",magnitudeHit:false,stopHit:false,firstHit:null,sequenceAmbiguous:false,ambiguityReason:null,resolvedLowerIndex:null,resolutionTimestamp:null,timeToMagnitudeBars:null};
}

function ftfcAtCheckpoint(parentSeries,parentIndex,partial){
  try{
    return live.deriveIntradayContinuity({...parentSeries,bars:[...parentSeries.bars.slice(0,parentIndex),partial]});
  }catch(_){
    return {alignment:"NO_DATA",states:[],scope:"VALIDATED_INTRADAY",sourceTimeframe:String(parentSeries?.timeframe||"15")};
  }
}

function checkpointEventId({symbol,parentBar,setup,stopModel,activationTimestamp}){
  const period=parentBar?.semantics?.periodOpenId||parentBar?.datetime||"UNKNOWN";
  return [String(symbol||"UNKNOWN").toUpperCase(),"15",period,setup.name,setup.direction,builder.normalizeStopModel(stopModel),activationTimestamp||"UNKNOWN"].join("|");
}

function buildCheckpointEvents({parentSeries,lowerSeries,stopModel="MIDPOINT",horizonBars=20,parentMinutes=15,lowerMinutes=5}={}){
  if(!parentSeries||String(parentSeries.timeframe)!=="15"||!Array.isArray(parentSeries.bars)) throw new Error("15-minute parent series required");
  if(!lowerSeries||String(lowerSeries.timeframe)!=="5"||!Array.isArray(lowerSeries.bars)) throw new Error("5-minute lower series required");
  if(parentMinutes!==15||lowerMinutes!==5) throw new Error("v1 reconstruction supports 15m from 5m only");
  const lowerBars=lowerSeries.bars.slice().sort((a,b)=>epoch(a)-epoch(b));
  const lowerIndexByTimestamp=new Map(lowerBars.map((bar,index)=>[bar?.semantics?.barOpenTimestamp||bar.datetime||bar.time,index]));
  const grouped=groupLowerBars(lowerBars,{parentMinutes});
  const events=[];

  for(let parentIndex=3;parentIndex<parentSeries.bars.length;parentIndex++){
    const parentBar=parentSeries.bars[parentIndex];
    const key=parentKey(parentBar,parentMinutes);
    const rows=grouped.get(key)||[];
    if(!rows.length) continue;
    const priorParent=parentSeries.bars[parentIndex-1];
    const seen=new Set();

    for(let checkpoint=0;checkpoint<rows.length;checkpoint++){
      const partial=aggregatePartialParent(parentBar,rows,checkpoint);
      const pathDirection=inferOutsidePathDirection(rows,priorParent,checkpoint);
      const setup=core.detectSetup([...parentSeries.bars.slice(0,parentIndex),partial],{currentBarPathDirection:pathDirection});
      if(!actionableAtCheckpoint(partial,setup)) continue;
      const stateKey=setup.name+"|"+setup.direction;
      if(seen.has(stateKey)) continue;
      seen.add(stateKey);

      const lowerBar=rows[checkpoint].bar;
      const lowerGlobalIndex=lowerIndexByTimestamp.get(lowerBar?.semantics?.barOpenTimestamp||lowerBar.datetime||lowerBar.time);
      if(!Number.isInteger(lowerGlobalIndex)) continue;
      const activationTimestamp=lowerBar?.semantics?.barCloseTimestamp||null;
      const stop=stopPrice(setup,stopModel);
      const outcome=evaluateAfterObservation({lowerBars,activationLowerIndex:lowerGlobalIndex,setup,stopModel,horizonParentBars:horizonBars,parentMinutes,lowerMinutes});
      const ftfc=ftfcAtCheckpoint(parentSeries,parentIndex,partial);
      const progress=progressContext(setup,partial.close);
      const parentOpen=Date.parse(parentBar?.semantics?.barOpenTimestamp||"");
      const observedAt=Date.parse(activationTimestamp||"");
      const lag=Number.isFinite(parentOpen)&&Number.isFinite(observedAt)?Math.round((observedAt-parentOpen)/60000):null;

      events.push({
        id:checkpointEventId({symbol:parentSeries.symbol,parentBar,setup,stopModel,activationTimestamp}),
        ticker:parentSeries.symbol,
        symbol:parentSeries.symbol,
        timestamp:activationTimestamp,
        signalBarTimestamp:parentBar?.semantics?.barOpenTimestamp||parentBar.datetime||null,
        activationTimestamp,
        activationPrice:Number(partial.close),
        observationLagMinutes:lag,
        setup:setup.name,setupId:setup.name,direction:setup.direction,timeframe:"15",marketType:parentSeries.marketType||parentBar?.semantics?.marketType||null,
        trigger:Number(setup.trigger),entry:Number(setup.trigger),stopModel:builder.normalizeStopModel(stopModel),stop,magnitude:Number(setup.magnitude),
        dataSemantics:parentBar.semantics||null,semanticKey:parentBar.semanticKey||null,currentType:setup.currentType||null,pathResolved:true,
        pathResolutionSource:pathDirection?"LOWER_TIMEFRAME_5M_SETUP_PATH":"LOWER_TIMEFRAME_5M_CHECKPOINT",
        magnitudeHit:outcome.magnitudeHit,stopHit:outcome.stopHit,firstHit:outcome.firstHit,sequenceAmbiguous:outcome.sequenceAmbiguous,ambiguityReason:outcome.ambiguityReason,
        closed:true,resolution:outcome.resolution,resolutionBarTimestamp:outcome.resolutionTimestamp,horizonBars:Number(horizonBars),timeToMagnitudeBars:outcome.timeToMagnitudeBars,
        barsObserved:null,mfeR:null,maeR:null,excursionMeasurement:"DEFERRED_UNTIL_INTRABAR_SAFE",
        ftfcAlignment:ftfc.alignment||"NO_DATA",ftfc:{alignment:ftfc.alignment||"NO_DATA",states:ftfc.states||[]},
        priceBucket:progress.priceBucket,activationProgressPct:progress.activationProgressPct,
        evidenceEligible:true,sampleConstruction:SAMPLE_CONSTRUCTION,successDefinition:SUCCESS_DEFINITION,lookaheadRisk:null,scenarioVersion:"historical-db-v2-checkpoint"
      });
    }
  }
  return {
    sampleConstruction:SAMPLE_CONSTRUCTION,successDefinition:SUCCESS_DEFINITION,events,
    summary:{events:events.length,evidenceEligible:events.filter(e=>e.evidenceEligible===true).length,ambiguous:events.filter(e=>e.sequenceAmbiguous===true).length}
  };
}

module.exports={SAMPLE_CONSTRUCTION,SUCCESS_DEFINITION,parentKey,groupLowerBars,aggregatePartialParent,inferOutsidePathDirection,magnitudeTouched,actionableAtCheckpoint,progressContext,evaluateAfterObservation,ftfcAtCheckpoint,checkpointEventId,buildCheckpointEvents};