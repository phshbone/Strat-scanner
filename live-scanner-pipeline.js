"use strict";

const core=require("./core-engine-v0.3.js");
const signalAdapter=require("./setup-signal-adapter.js");
const scannerCard=require("./scanner-card.js");
const liveData=require("./live-intraday-data.js");

function nonEmpty(v){return typeof v==="string"&&v.trim().length>0;}

function buildLiveScannerCandidate({series,sector=null,minRewardRisk=2,historicalEvidence=null,observedAt=null}={}){
  if(!series||!nonEmpty(series.symbol)||!nonEmpty(series.timeframe)) throw new Error("live series symbol/timeframe required");
  const bars=Array.isArray(series.bars)?series.bars:[];
  if(bars.length<3) throw new Error("at least three semantic bars required");

  const currentBar=bars[bars.length-1];
  const currentPrice=Number(currentBar.close);
  if(!Number.isFinite(currentPrice)) throw new Error("current close required");

  const setup=core.detectSetup(bars);
  const semanticKey=currentBar.semanticKey||null;
  const dataSemantics=currentBar.semantics||null;
  const signalState=signalAdapter.buildSetupSignalState({
    setup,
    currentPrice,
    now:observedAt||Date.now(),
    signalOptions:{
      timeframe:series.timeframe,
      signalStartsAt:dataSemantics?.barOpenTimestamp||null,
      signalExpiresAt:dataSemantics?.barCloseTimestamp||null,
      dataSemantics,
      semanticKey,
      metadata:{
        marketDataSource:series.source||"LIVE_PROXY",
        provider:series.provider||null,
        interval:series.interval||null
      }
    }
  });

  const signal=signalState.signal?{
    ...signalState.signal,
    state:signalState.lifecycle?.status||null,
    actionable:signalState.lifecycle?.active===true,
    expired:signalState.lifecycle?.expired===true
  }:null;
  const signals=signal?[signal]:[];
  const card=scannerCard.buildScannerCard({
    symbol:series.symbol,
    timeframe:series.timeframe,
    signals,
    primarySignal:signal,
    entry:signal?.trigger??null,
    stop:null,
    target:signal?.magnitude??null,
    minRewardRisk,
    historicalEvidence,
    observedAt:observedAt||new Date().toISOString(),
    sector,
    price:currentPrice
  });

  return {
    symbol:series.symbol,
    timeframe:series.timeframe,
    source:series.source||"LIVE_PROXY",
    provider:series.provider||null,
    interval:series.interval||null,
    barCount:bars.length,
    latestSemanticKey:semanticKey,
    setup,
    signal,
    lifecycle:signalState.lifecycle||null,
    card
  };
}

async function scanLiveWatchlist({items=[],outputsize=100,proxyBase=liveData.DEFAULT_PROXY_BASE,minRewardRisk=2,fetchSeries=liveData.fetchLiveIntradaySeries,fetchImpl=globalThis.fetch,observedAt=null}={}){
  if(typeof fetchSeries!=="function") throw new Error("fetchSeries required");
  const rows=Array.isArray(items)?items:[];
  const results=[];
  const errors=[];

  for(const [index,item] of rows.entries()){
    const symbol=String(item?.symbol||"").trim().toUpperCase();
    const timeframe=item?.timeframe;
    try{
      const series=await fetchSeries({symbol,timeframe,outputsize:item?.outputsize??outputsize,proxyBase},fetchImpl);
      results.push(buildLiveScannerCandidate({
        series,
        sector:item?.sector||null,
        minRewardRisk:item?.minRewardRisk??minRewardRisk,
        historicalEvidence:item?.historicalEvidence||null,
        observedAt
      }));
    }catch(error){
      errors.push({index,symbol:symbol||null,timeframe:timeframe==null?null:String(timeframe),error:error?.message||String(error)});
    }
  }

  return {
    source:"LIVE_PROXY",
    requested:rows.length,
    succeeded:results.length,
    failed:errors.length,
    candidates:results,
    cards:scannerCard.rankScannerCards(results.map(r=>r.card)),
    errors
  };
}

module.exports={buildLiveScannerCandidate,scanLiveWatchlist};
