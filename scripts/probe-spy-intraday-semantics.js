"use strict";

const {normalizeValues}=require("../providers/twelve-data.js");
const {resolveUsEquityIntradayPeriod}=require("../period-resolver.js");

const PROXY=process.env.MARKET_DATA_PROXY || "https://thestrat.phshbone.workers.dev";
const SYMBOL="SPY";
const CASES=[
  {timeframe:"5",interval:"5min",outputsize:100,validate:true},
  {timeframe:"15",interval:"15min",outputsize:50,validate:true},
  {timeframe:"30",interval:"30min",outputsize:30,validate:true},
  {timeframe:"60",interval:"1h",outputsize:20,validate:false}
];

function localLabel(value){
  const raw=String(value).trim().replace(" ","T")+(String(value).includes("Z")?"":"Z");
  const d=new Date(raw);
  if(!Number.isFinite(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US",{
    timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  }).format(d);
}

async function pull(c){
  const url=`${PROXY}/time-series?symbol=${SYMBOL}&interval=${c.interval}&outputsize=${c.outputsize}`;
  const response=await fetch(url,{headers:{Accept:"application/json"}});
  const payload=await response.json();
  if(!response.ok || payload?.status==="error") throw new Error(`${c.interval}: ${payload?.message || `HTTP ${response.status}`}`);
  const bars=normalizeValues(payload,{symbol:SYMBOL,timeframe:c.timeframe});
  if(!bars.length) throw new Error(`${c.interval}: no bars returned`);

  const summary={
    interval:c.interval,
    timeframe:c.timeframe,
    providerTimezone:payload?.meta?.timezone || null,
    providerInterval:payload?.meta?.interval || null,
    count:bars.length,
    firstRaw:bars[0].datetime,
    firstNewYork:localLabel(bars[0].datetime),
    lastRaw:bars[bars.length-1].datetime,
    lastNewYork:localLabel(bars[bars.length-1].datetime)
  };

  if(c.validate){
    let accepted=0,rejected=0; const rejectedExamples=[];
    for(const bar of bars){
      try{
        resolveUsEquityIntradayPeriod({bar,symbol:SYMBOL,timeframe:c.timeframe});
        accepted++;
      }catch(error){
        rejected++;
        if(rejectedExamples.length<5) rejectedExamples.push({datetime:bar.datetime,message:error.message});
      }
    }
    summary.resolver={accepted,rejected,rejectedExamples};
    if(accepted===0) throw new Error(`${c.interval}: resolver accepted zero bars`);
  }else{
    summary.observationOnly=true;
    summary.note="60-minute bars are intentionally not promoted to production semantics until anchor behavior is explicitly verified.";
    summary.sampleLocalOpens=bars.slice(0,8).map(b=>localLabel(b.datetime));
  }
  return summary;
}

(async()=>{
  const results=[];
  for(const c of CASES) results.push(await pull(c));
  console.log(JSON.stringify({ok:true,symbol:SYMBOL,proxy:PROXY,results},null,2));
})().catch(error=>{
  console.error(JSON.stringify({ok:false,error:error.message},null,2));
  process.exit(1);
});
