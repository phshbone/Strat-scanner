"use strict";

// Research-only RTH 60m/D aggregation from validated completed 15m source bars.
// Does not relax the production 60-minute provider/session resolver.
const core=require("./core-engine-v0.3.js");
const sourceCheck=require("./historical-intrabar-reconstruction.js");
const semantics=require("./data-semantics.js");
const period=require("./period-resolver.js");

const CONSTRUCTION="RTH_15M_DERIVED_FIRST_COMPLETED_15M_CHECKPOINT";
const RTH_MINUTES=390;
function isoPlus(iso,minutes){return new Date(Date.parse(iso)+minutes*60000).toISOString();}
function sourceBarDate(bar){return String(bar?.semantics?.periodOpenId||"").split("|")[2]||null;}
function sourceOffset(bar){return Number(bar?.semantics?.barAnchorOffsetMinutes);}

function validateSourceBar(bar,symbol){
  const s=bar?.semantics||{};
  if(s.symbol!==symbol||String(s.timeframe)!=="15"||s.marketType!=="US_EQUITY"||
     s.marketTimezone!=="America/New_York"||s.session!=="REGULAR"||
     s.extendedHoursIncluded!==false||s.barAnchor!=="US_EQUITY_RTH_0930"||
     !s.provider||!s.providerAggregation){
    throw new Error("unsupported 15m source semantics");
  }
  const date=sourceBarDate(bar),offset=sourceOffset(bar);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||"")||!Number.isInteger(offset)||offset<0||
     offset>=RTH_MINUTES||offset%15!==0) throw new Error("invalid RTH 15m date/offset");
  const expectedOpen=isoPlus(period.localDateTimeToUtcIso({date,time:"09:30"}),offset);
  if(s.barOpenTimestamp!==expectedOpen||s.periodOpenTimestamp!==expectedOpen||
     s.barCloseTimestamp!==isoPlus(expectedOpen,15)||
     !String(s.periodOpenId).startsWith(symbol+"|15|"+date+"|REGULAR|")){
    throw new Error("15m UTC/session period identity mismatch");
  }
  for(const key of ["open","high","low","close"]){
    if(!Number.isFinite(Number(bar[key]))) throw new Error("15m bar has invalid OHLC");
  }
  if(Number(bar.high)<Math.max(Number(bar.open),Number(bar.close))||
     Number(bar.low)>Math.min(Number(bar.open),Number(bar.close))){
    throw new Error("15m bar has contradictory OHLC");
  }
  return {date,offset};
}

function groupCompleteSessions(series){
  if(!series||String(series.timeframe)!=="15"||series.marketType!=="US_EQUITY"||
     !Array.isArray(series.bars)||!series.symbol) throw new Error("US equity 15m source series required");
  const symbol=String(series.symbol).toUpperCase();
  const days=new Map(),seen=new Set();
  for(const bar of series.bars){
    const {date,offset}=validateSourceBar(bar,symbol);
    const key=date+"|"+offset;
    if(seen.has(key)) throw new Error("duplicate RTH 15m bar: "+key);
    seen.add(key);
    if(!days.has(date)) days.set(date,[]);
    days.get(date).push(bar);
  }
  const sessions=[],excluded=[],dates=[...days.keys()].sort();
  let segment=0;
  for(const date of dates){
    const bars=days.get(date).sort((a,b)=>sourceOffset(a)-sourceOffset(b));
    const complete=bars.length===26&&bars.every((bar,i)=>sourceOffset(bar)===i*15);
    if(!complete){
      excluded.push({date,observed15m:bars.length,reason:"INCOMPLETE_OR_SHORT_RTH_SESSION"});
      segment++;
    }else sessions.push({date,bars,segment});
  }
  return {symbol,sessions,excluded,sourceBarCount:series.bars.length,
    completeness:"REQUIRES_26_VALID_15M_BARS; SHORT_DAYS_EXCLUDED; MISSING_WHOLE_DAYS_NOT_INFERRED"};
}

function aggregatedBar({rows,timeframe,date,symbol,bucketOffset,segment}){
  const first=rows[0],last=rows[rows.length-1],isClosingHalf=timeframe==="60"&&bucketOffset===360;
  const duration=rows.length*15;
  const data={
    datetime:first.semantics.barOpenTimestamp,open:Number(first.open),
    high:Math.max(...rows.map(x=>Number(x.high))),
    low:Math.min(...rows.map(x=>Number(x.low))),
    close:Number(last.close),symbol,timeframe,
    researchOnly:true,sourceTimeframe:"15",sourceBars:rows.length,
    derivedDurationMinutes:duration,sessionSegment:segment,
    closingHalfHour:isClosingHalf
  };
  if(rows.every(x=>Number.isFinite(Number(x.volume)))) data.volume=rows.reduce((sum,x)=>sum+Number(x.volume),0);
  const open=first.semantics.barOpenTimestamp,close=last.semantics.barCloseTimestamp;
  const periodId=timeframe==="D"?symbol+"|D|"+date+"|REGULAR":symbol+"|60|"+date+"|REGULAR|"+bucketOffset+(isClosingHalf?"|FINAL_30M":"");
  const meta={
    symbol,timeframe,marketTimezone:"America/New_York",session:"REGULAR",
    extendedHoursIncluded:false,barAnchor:"RESEARCH_DERIVED_RTH_0930",
    barAnchorOffsetMinutes:bucketOffset,provider:"RECONSTRUCTED_FROM_TWELVE_DATA",
    providerAggregation:"RTH_15M_TO_"+timeframe+(isClosingHalf?"_FINAL_30M":""),
    periodOpenId:periodId,periodOpenTimestamp:open,barOpenTimestamp:open,barCloseTimestamp:close
  };
  return semantics.attachSemanticsToBar(data,meta);
}

function buildFrames(series){
  const grouped=groupCompleteSessions(series);
  const hourly=[],daily=[];
  for(const session of grouped.sessions){
    const common={date:session.date,symbol:grouped.symbol,segment:session.segment};
    for(let bucket=0;bucket<390;bucket+=60){
      const rows=session.bars.filter(b=>sourceOffset(b)>=bucket&&sourceOffset(b)<bucket+60);
      const expected=bucket===360?2:4;
      if(rows.length!==expected) throw new Error("complete session has incomplete hourly bucket");
      hourly.push({bar:aggregatedBar({...common,rows,timeframe:"60",bucketOffset:bucket}),rows,segment:session.segment});
    }
    daily.push({bar:aggregatedBar({...common,rows:session.bars,timeframe:"D",bucketOffset:0}),rows:session.bars,segment:session.segment});
  }
  return {source:grouped,hourly,daily};
}

function observedPartial(parent,rows,checkpoint){
  // Only completed lower bars through the checkpoint are materialized.
  const sample=rows.slice(0,checkpoint+1);
  const last=sample.at(-1);
  const s={...parent.semantics,barCloseTimestamp:last.semantics.barCloseTimestamp};
  return {...parent,open:Number(sample[0].open),
    high:Math.max(...sample.map(x=>Number(x.high))),
    low:Math.min(...sample.map(x=>Number(x.low))),
    close:Number(last.close),
    semantics:s,partial:true,observed15m:sample.length,
    observationTimestamp:last.semantics.barCloseTimestamp};
}

function buildFrameObservations(frames,timeframe,symbol){
  const events=[];
  for(let i=3;i<frames.length;i++){
    const current=frames[i],prior=frames[i-1];
    if(frames.slice(i-3,i+1).some(x=>x.segment!==current.segment)) continue;
    const seen=new Set();
    const history=frames.slice(0,i).map(x=>x.bar);
    for(let j=0;j<current.rows.length;j++){
      const partial=observedPartial(current.bar,current.rows,j);
      const lower=current.rows.slice(0,j+1).map(bar=>({bar}));
      const pathDirection=sourceCheck.inferOutsidePathDirection(lower,prior.bar,j);
      const setup=core.detectSetup([...history,partial],{currentBarPathDirection:pathDirection});
      if(!sourceCheck.actionableAtCheckpoint(partial,setup)) continue;
      const variant=setup.name==="2-1-2"?(setup.variant==="CONTINUATION"?"CONTINUATION":"REVERSAL"):"UNSPECIFIED";
      const key=setup.name+"|"+variant+"|"+setup.direction;
      if(seen.has(key)) continue;
      seen.add(key);
      const observedAt=partial.observationTimestamp;
      const lag=Math.round((Date.parse(observedAt)-Date.parse(current.bar.semantics.barOpenTimestamp))/60000);
      events.push({
        id:[symbol,timeframe,current.bar.semantics.periodOpenId,setup.name,variant,setup.direction,observedAt].join("|"),
        symbol,timeframe,setup:setup.name,setupId:setup.name,setupVariant:variant,
        direction:setup.direction,trigger:Number(setup.trigger),magnitude:Number(setup.magnitude),
        activationTimestamp:observedAt,activationPrice:Number(partial.close),
        observationLagMinutes:lag,observationPhase:"CLOSED_15M_CHECKPOINT",
        sourceTimeframe:"15",sourceProvider:current.rows[0].semantics.provider,
        parentPeriodOpenId:current.bar.semantics.periodOpenId,
        periodOpenTimestamp:current.bar.semantics.barOpenTimestamp,
        partialBarThrough:observedAt,
        pathResolutionSource:pathDirection?"15M_OBSERVED_SEQUENCE":"15M_COMPLETED_CHECKPOINT",
        sourceBarsObserved:partial.observed15m,
        parentDurationMinutes:current.bar.derivedDurationMinutes,
        closingHalfHour:current.bar.closingHalfHour,
        sessionSegment:current.segment,
        evidenceEligible:false,resolution:"NOT_EVALUATED",ftfcAlignment:"NOT_EVALUATED",
        sampleConstruction:CONSTRUCTION,
        limitation:"RESEARCH_ONLY; NO_FILLS_OR_MAGNITUDE_BEFORE_STOP_OUTCOMES"
      });
    }
  }
  return events;
}

function summary(events){
  const bySetup={};
  for(const e of events){
    const key=[e.setup,e.setupVariant,e.direction].join("|");
    bySetup[key]=(bySetup[key]||0)+1;
  }
  return {observations:events.length,bySetup,evidenceEligible:0,
    successRate:null,sourceResolution:"15m",outcomeState:"NOT_EVALUATED"};
}

function buildHigherTimeframeResearch(series){
  const built=buildFrames(series);
  const hourlyEvents=buildFrameObservations(built.hourly,"60",built.source.symbol);
  const dailyEvents=buildFrameObservations(built.daily,"D",built.source.symbol);
  return {
    schemaVersion:1,marketType:"US_EQUITY",symbol:built.source.symbol,
    sourceTimeframe:"15",sourceBars:built.source.sourceBarCount,
    construction:CONSTRUCTION,productionEligible:false,
    completeSessions:built.source.sessions.length,
    excludedSessions:built.source.excluded,
    completenessRule:built.source.completeness,
    derivedBars:{"60":built.hourly.length,"D":built.daily.length},
    warnings:["No same-trade outcome measurements; signals are first observable at completed 15m checkpoints.",
      "60m is derived from 09:30 ET RTH; the final 15:30–16:00 bar lasts 30 minutes.",
      "Short/partial market sessions are excluded and no external exchange calendar is assumed.",
      "No provider 60m candle equivalence is claimed; production 60m resolver remains disabled."],
    timeframes:{
      "60":{...summary(hourlyEvents),events:hourlyEvents},
      "D":{...summary(dailyEvents),events:dailyEvents}
    }
  };
}

module.exports={CONSTRUCTION,validateSourceBar,groupCompleteSessions,aggregatedBar,buildFrames,observedPartial,buildFrameObservations,buildHigherTimeframeResearch};
