"use strict";

const TWELVE_DATA_BASE="https://api.twelvedata.com/time_series";
const ALLOWED_INTERVALS=new Set(["5min","15min","30min","1h","1day","1week","1month"]);
const ALLOWED_ORIGINS=new Set([
  "https://phshbone.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

function corsHeaders(origin){
  const allowed=origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://phshbone.github.io";
  return {
    "Access-Control-Allow-Origin":allowed,
    "Access-Control-Allow-Methods":"GET,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type",
    "Access-Control-Max-Age":"86400",
    "Vary":"Origin"
  };
}

function json(data,status=200,origin=null){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"Content-Type":"application/json; charset=utf-8",...corsHeaders(origin)}
  });
}

function normalizeSymbol(value){
  const symbol=String(value||"").trim().toUpperCase();
  if(!symbol || !/^[A-Z0-9.\-]{1,20}$/.test(symbol)) throw new Error("invalid symbol");
  return symbol;
}

function normalizeInterval(value){
  const interval=String(value||"").trim();
  if(!ALLOWED_INTERVALS.has(interval)) throw new Error("invalid interval");
  return interval;
}

function normalizeOutputsize(value){
  if(value==null || value==="") return null;
  const n=Number(value);
  if(!Number.isInteger(n) || n<1 || n>5000) throw new Error("outputsize must be 1-5000");
  return n;
}

function safeDate(value){
  if(value==null || value==="") return null;
  const raw=String(value).trim();
  if(!/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(raw)) throw new Error("invalid date");
  return raw;
}

function buildProviderUrl(requestUrl,apiKey){
  if(!apiKey) throw new Error("Twelve Data secret missing");
  const incoming=new URL(requestUrl);
  const symbol=normalizeSymbol(incoming.searchParams.get("symbol"));
  const interval=normalizeInterval(incoming.searchParams.get("interval"));
  const outputsize=normalizeOutputsize(incoming.searchParams.get("outputsize"));
  const startDate=safeDate(incoming.searchParams.get("start_date"));
  const endDate=safeDate(incoming.searchParams.get("end_date"));

  const target=new URL(TWELVE_DATA_BASE);
  target.searchParams.set("apikey",apiKey);
  target.searchParams.set("symbol",symbol);
  target.searchParams.set("interval",interval);
  target.searchParams.set("format","JSON");
  target.searchParams.set("order","ASC");
  if(["5min","15min","30min","1h"].includes(interval)) target.searchParams.set("timezone","UTC");
  if(outputsize!==null) target.searchParams.set("outputsize",String(outputsize));
  if(startDate) target.searchParams.set("start_date",startDate);
  if(endDate) target.searchParams.set("end_date",endDate);
  return target;
}

async function getApiKey(env){
  const binding=env?.TWELVE_DATA_API_KEY;
  if(binding && typeof binding.get==="function") return await binding.get();
  if(typeof binding==="string" && binding) return binding;
  if(typeof env?.A12_DATA_KEY==="string" && env.A12_DATA_KEY) return env.A12_DATA_KEY;
  return null;
}

async function handleTimeSeries(request,env){
  const origin=request.headers.get("Origin");
  try{
    const apiKey=await getApiKey(env);
    const target=buildProviderUrl(request.url,apiKey);
    const upstream=await fetch(target.toString(),{headers:{"Accept":"application/json"}});
    const text=await upstream.text();
    let payload;
    try{ payload=JSON.parse(text); }
    catch{ return json({status:"error",message:"invalid provider response"},502,origin); }

    return json(payload,upstream.ok?200:upstream.status||502,origin);
  }catch(error){
    return json({status:"error",message:error?.message || "request failed"},400,origin);
  }
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const origin=request.headers.get("Origin");

    if(request.method==="OPTIONS"){
      return new Response(null,{status:204,headers:corsHeaders(origin)});
    }
    if(request.method!=="GET") return json({status:"error",message:"method not allowed"},405,origin);
    if(url.pathname==="/health"){
      const apiKey=await getApiKey(env);
      return json({ok:true,provider:"TWELVE_DATA",secretConfigured:!!apiKey},200,origin);
    }
    if(url.pathname==="/time-series") return handleTimeSeries(request,env);
    return json({status:"error",message:"not found"},404,origin);
  }
};

export {
  TWELVE_DATA_BASE,
  ALLOWED_INTERVALS,
  ALLOWED_ORIGINS,
  normalizeSymbol,
  normalizeInterval,
  normalizeOutputsize,
  safeDate,
  buildProviderUrl,
  getApiKey,
  corsHeaders,
  handleTimeSeries
};