"use strict";

const twelveData=require("./providers/twelve-data.js");
const marketDataAdapter=require("./market-data-adapter.js");
const periodResolver=require("./period-resolver.js");

const DEFAULT_PROXY_BASE="https://thestrat.phshbone.workers.dev";
const PRODUCTION_INTRADAY_TIMEFRAMES=new Set(["5","15","30"]);

function normalizeProductionTimeframe(timeframe){
  const tf=twelveData.normalizeTimeframe(timeframe);
  if(!PRODUCTION_INTRADAY_TIMEFRAMES.has(tf)){
    if(tf==="60") throw new Error("60-minute live semantics remain observation-only");
    throw new Error("live intraday production timeframe must be 5, 15, or 30 minutes");
  }
  return tf;
}

function normalizeProxyBase(baseUrl=DEFAULT_PROXY_BASE){
  const url=new URL(String(baseUrl));
  url.pathname=url.pathname.replace(/\/+$/g,"");
  url.search="";
  url.hash="";
  return url.toString().replace(/\/$/,"");
}

function buildProxyTimeSeriesUrl({
  symbol,
  timeframe,
  outputsize=100,
  startDate=null,
  endDate=null,
  proxyBase=DEFAULT_PROXY_BASE
}={}){
  const tf=normalizeProductionTimeframe(timeframe);
  const cleanSymbol=String(symbol||"").trim().toUpperCase();
  if(!cleanSymbol || !/^[A-Z0-9.\-]{1,20}$/.test(cleanSymbol)) throw new Error("valid symbol required");

  const n=Number(outputsize);
  if(!Number.isInteger(n) || n<1 || n>5000) throw new Error("outputsize must be an integer from 1 to 5000");

  const url=new URL(normalizeProxyBase(proxyBase)+"/time-series");
  url.searchParams.set("symbol",cleanSymbol);
  url.searchParams.set("interval",twelveData.INTERVAL_MAP[tf]);
  url.searchParams.set("outputsize",String(n));
  if(startDate) url.searchParams.set("start_date",String(startDate));
  if(endDate) url.searchParams.set("end_date",String(endDate));
  return url.toString();
}

async function fetchLiveIntradaySeries(args={},fetchImpl=globalThis.fetch){
  if(typeof fetchImpl!=="function") throw new Error("fetch implementation required");
  const tf=normalizeProductionTimeframe(args.timeframe);
  const symbol=String(args.symbol||"").trim().toUpperCase();
  const requestUrl=buildProxyTimeSeriesUrl({...args,symbol,timeframe:tf});
  const response=await fetchImpl(requestUrl,{headers:{Accept:"application/json"}});
  if(!response || response.ok===false) throw new Error(`market data proxy HTTP ${response?.status || "error"}`);
  const payload=await response.json();
  const providerError=twelveData.providerError(payload);
  if(providerError) throw new Error(`Twelve Data: ${providerError}`);

  const providerBars=twelveData.normalizeValues(payload,{symbol,timeframe:tf});
  const resolver=periodResolver.createUsEquityPeriodResolver({timeframe:tf});
  const bars=marketDataAdapter.normalizeProviderBars({
    bars:providerBars,
    symbol,
    timeframe:tf,
    marketTimezone:"America/New_York",
    session:"REGULAR",
    provider:"TWELVE_DATA",
    providerAggregation:twelveData.INTERVAL_MAP[tf],
    barAnchor:"US_EQUITY_RTH_0930",
    periodResolver:resolver
  });

  return {
    source:"LIVE_PROXY",
    provider:"TWELVE_DATA",
    symbol,
    timeframe:tf,
    interval:twelveData.INTERVAL_MAP[tf],
    requestUrl,
    meta:payload?.meta || null,
    bars
  };
}

module.exports={
  DEFAULT_PROXY_BASE,
  PRODUCTION_INTRADAY_TIMEFRAMES,
  normalizeProductionTimeframe,
  normalizeProxyBase,
  buildProxyTimeSeriesUrl,
  fetchLiveIntradaySeries
};
