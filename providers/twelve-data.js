"use strict";

const INTERVAL_MAP={
  "5":"5min",
  "15":"15min",
  "30":"30min",
  "60":"1h",
  "D":"1day",
  "W":"1week",
  "M":"1month"
};

function normalizeTimeframe(tf){
  if(tf==null) return null;
  const raw=String(tf).trim().toUpperCase();
  const aliases={"5M":"5","15M":"15","30M":"30","60M":"60","1H":"60","1D":"D","1W":"W","1M":"M","DAY":"D","WEEK":"W","MONTH":"M"};
  const n=aliases[raw]||raw;
  return INTERVAL_MAP[n]?n:null;
}

function isIntraday(tf){ return ["5","15","30","60"].includes(normalizeTimeframe(tf)); }

function buildTimeSeriesUrl({
  apiKey,
  symbol,
  timeframe,
  startDate=null,
  endDate=null,
  outputsize=null,
  baseUrl="https://api.twelvedata.com/time_series"
}={}){
  if(!apiKey) throw new Error("apiKey required");
  if(!symbol) throw new Error("symbol required");
  const tf=normalizeTimeframe(timeframe);
  if(!tf) throw new Error("unsupported timeframe");

  const url=new URL(baseUrl);
  url.searchParams.set("apikey",apiKey);
  url.searchParams.set("symbol",String(symbol).trim().toUpperCase());
  url.searchParams.set("interval",INTERVAL_MAP[tf]);
  url.searchParams.set("format","JSON");
  url.searchParams.set("order","ASC");

  // Twelve Data allows timezone normalization only for intraday intervals.
  // Request UTC there so timestamps are machine-unambiguous. Daily/weekly/
  // monthly are returned in exchange-local calendar dates by provider design.
  if(isIntraday(tf)) url.searchParams.set("timezone","UTC");
  if(startDate) url.searchParams.set("start_date",String(startDate));
  if(endDate) url.searchParams.set("end_date",String(endDate));
  if(outputsize!=null){
    const n=Number(outputsize);
    if(!Number.isInteger(n)||n<1||n>5000) throw new Error("outputsize must be an integer from 1 to 5000");
    url.searchParams.set("outputsize",String(n));
  }
  return url.toString();
}

function providerError(payload){
  if(!payload || typeof payload!=="object") return "invalid provider response";
  if(payload.status==="error") return payload.message || payload.code || "provider error";
  return null;
}

function normalizeValues(payload,{symbol=null,timeframe=null}={}){
  const err=providerError(payload);
  if(err) throw new Error(`Twelve Data: ${err}`);
  const tf=normalizeTimeframe(timeframe || payload?.meta?.interval);
  const rows=Array.isArray(payload?.values)?payload.values:[];
  const out=rows.map((row,index)=>{
    const open=Number(row.open), high=Number(row.high), low=Number(row.low), close=Number(row.close);
    if(![open,high,low,close].every(Number.isFinite)) throw new Error(`Twelve Data: invalid OHLC at row ${index}`);
    const bar={
      datetime:String(row.datetime),
      open,high,low,close,
      provider:"TWELVE_DATA",
      providerTimeframe:payload?.meta?.interval || null,
      timeframe:tf,
      symbol:String(symbol || payload?.meta?.symbol || "").toUpperCase() || null,
      exchange:payload?.meta?.exchange || null,
      exchangeTimezone:payload?.meta?.timezone || null,
      rawDatetime:String(row.datetime)
    };
    if(row.volume!==undefined && row.volume!==null && row.volume!=="" && Number.isFinite(Number(row.volume))) bar.volume=Number(row.volume);
    return bar;
  });

  return out.sort((a,b)=>String(a.datetime).localeCompare(String(b.datetime)));
}

async function fetchTimeSeries(args={},fetchImpl=globalThis.fetch){
  if(typeof fetchImpl!=="function") throw new Error("fetch implementation required");
  const url=buildTimeSeriesUrl(args);
  const response=await fetchImpl(url);
  if(!response || response.ok===false) throw new Error(`Twelve Data HTTP ${response?.status || "error"}`);
  const payload=await response.json();
  return {
    provider:"TWELVE_DATA",
    requestUrl:url,
    meta:payload?.meta || null,
    bars:normalizeValues(payload,{symbol:args.symbol,timeframe:args.timeframe})
  };
}

if(typeof module!=="undefined") module.exports={
  INTERVAL_MAP,
  normalizeTimeframe,
  isIntraday,
  buildTimeSeriesUrl,
  providerError,
  normalizeValues,
  fetchTimeSeries
};
