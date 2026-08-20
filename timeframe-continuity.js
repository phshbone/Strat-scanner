"use strict";

const {normalizeTimeframe,sortTimeframes}=require("./timeframe-domino.js");

const CONTINUITY=Object.freeze({
  BULLISH:"BULLISH",
  BEARISH:"BEARISH",
  FLAT:"FLAT",
  UNKNOWN:"UNKNOWN"
});

function classifyContinuity({currentPrice,periodOpen}){
  const p=Number(currentPrice), o=Number(periodOpen);
  if(!Number.isFinite(p)||!Number.isFinite(o)) return CONTINUITY.UNKNOWN;
  if(p>o) return CONTINUITY.BULLISH;
  if(p<o) return CONTINUITY.BEARISH;
  return CONTINUITY.FLAT;
}

function buildContinuityState(row){
  if(!row || typeof row!=="object") return null;
  const timeframe=normalizeTimeframe(row.timeframe);
  if(!timeframe) return null;
  const currentPrice=Number(row.currentPrice);
  const periodOpen=Number(row.periodOpen);
  const state=classifyContinuity({currentPrice,periodOpen});
  const distance=Number.isFinite(currentPrice)&&Number.isFinite(periodOpen)?currentPrice-periodOpen:null;
  const pctFromOpen=Number.isFinite(distance)&&periodOpen!==0?Number(((distance/periodOpen)*100).toFixed(4)):null;
  return {
    timeframe,
    state,
    currentPrice:Number.isFinite(currentPrice)?currentPrice:null,
    periodOpen:Number.isFinite(periodOpen)?periodOpen:null,
    distanceFromOpen:Number.isFinite(distance)?Number(distance.toFixed(8)):null,
    pctFromOpen,
    periodOpenTimestamp:row.periodOpenTimestamp||null,
    observedAt:row.observedAt||null,
    source:row.source||null
  };
}

function summarizeContinuity({states=[],selectedTimeframes=null}={}){
  const normalized=(Array.isArray(states)?states:[]).map(buildContinuityState).filter(Boolean);
  const byTf=new Map(normalized.map(row=>[row.timeframe,row]));
  const ladder=sortTimeframes(selectedTimeframes||normalized.map(row=>row.timeframe));
  const ordered=ladder.map(tf=>byTf.get(tf)).filter(Boolean);
  const counts={BULLISH:0,BEARISH:0,FLAT:0,UNKNOWN:0};
  for(const row of ordered) counts[row.state]+=1;
  const resolved=counts.BULLISH+counts.BEARISH+counts.FLAT;
  let alignment="NO_DATA";
  if(ordered.length){
    if(counts.BULLISH===ordered.length) alignment="FULL_BULLISH";
    else if(counts.BEARISH===ordered.length) alignment="FULL_BEARISH";
    else if(counts.BULLISH>counts.BEARISH) alignment="BULLISH_MAJORITY";
    else if(counts.BEARISH>counts.BULLISH) alignment="BEARISH_MAJORITY";
    else alignment="MIXED";
  }
  return {
    ladder,
    states:ordered,
    counts,
    total:ordered.length,
    resolved,
    bullishPct:ordered.length?Number(((counts.BULLISH/ordered.length)*100).toFixed(2)):0,
    bearishPct:ordered.length?Number(((counts.BEARISH/ordered.length)*100).toFixed(2)):0,
    alignment,
    fullContinuity:alignment==="FULL_BULLISH"||alignment==="FULL_BEARISH"
  };
}

function compareContinuity(previous,current){
  if(!previous||!current) return null;
  const prevBy=new Map((previous.states||[]).map(r=>[r.timeframe,r.state]));
  const changes=(current.states||[]).filter(r=>prevBy.has(r.timeframe)&&prevBy.get(r.timeframe)!==r.state).map(r=>({timeframe:r.timeframe,from:prevBy.get(r.timeframe),to:r.state}));
  return {
    alignmentChanged:previous.alignment!==current.alignment,
    from:previous.alignment,
    to:current.alignment,
    changes
  };
}

if(typeof module!=="undefined") module.exports={CONTINUITY,classifyContinuity,buildContinuityState,summarizeContinuity,compareContinuity};
