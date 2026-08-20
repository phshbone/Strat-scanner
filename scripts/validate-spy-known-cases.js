"use strict";

const twelve=require("../providers/twelve-data.js");
const resolver=require("../period-resolver.js");
const adapter=require("../market-data-adapter.js");
const engine=require("../core-engine-v0.3.js");

const BASE=process.env.MARKET_DATA_PROXY || "https://thestrat.phshbone.workers.dev";

function isoDate(v){ return String(v||"").slice(0,10); }

async function fetchDaily(startDate,endDate){
  const url=new URL(`${BASE}/time-series`);
  url.searchParams.set("symbol","SPY");
  url.searchParams.set("interval","1day");
  url.searchParams.set("start_date",startDate);
  url.searchParams.set("end_date",endDate);
  const response=await fetch(url);
  if(!response.ok) throw new Error(`proxy HTTP ${response.status}`);
  const payload=await response.json();
  const providerBars=twelve.normalizeValues(payload,{symbol:"SPY",timeframe:"D"});
  return adapter.normalizeProviderBars({
    bars:providerBars,
    symbol:"SPY",
    timeframe:"D",
    marketTimezone:"America/New_York",
    session:"REGULAR",
    provider:"TWELVE_DATA",
    providerAggregation:"1day",
    barAnchor:"SESSION_OPEN",
    barAnchorOffsetMinutes:0,
    periodResolver:resolver.resolveUsEquityPeriod
  });
}

function findIndex(bars,date){
  return bars.findIndex(b=>isoDate(b.datetime||b.rawDatetime||b.semantics?.periodOpenId?.split("|")[2])===date);
}

function setupAt(bars,date){
  const i=findIndex(bars,date);
  if(i<0) throw new Error(`missing ${date}`);
  const start=Math.max(0,i-3);
  return engine.detectSetup(bars.slice(start,i+1));
}

function check(name,actual,expected,failures){
  const ok=actual===expected;
  console.log(`${ok?"PASS":"FAIL"} ${name}: ${actual}`);
  if(!ok) failures.push({name,actual,expected});
}

(async()=>{
  const failures=[];
  const bars2021=await fetchDaily("2021-08-01","2021-12-01");
  const bars2022=await fetchDaily("2022-11-10","2022-11-22");

  const c1=setupAt(bars2021,"2021-08-20");
  check("RM-002A setup",c1.name,"2-2",failures);
  check("RM-002A direction",c1.direction,"BULLISH",failures);

  const c2=setupAt(bars2021,"2021-08-26");
  check("RM-002B setup",c2.name,"2-2",failures);
  check("RM-002B direction",c2.direction,"BEARISH",failures);

  const c3=setupAt(bars2021,"2021-11-09");
  check("RM-003A setup",c3.name,"2-1-2",failures);
  check("RM-003A direction",c3.direction,"BEARISH",failures);

  const c4=setupAt(bars2021,"2021-11-12");
  check("RM-003B setup",c4.name,"2-1-2",failures);
  check("RM-003B direction",c4.direction,"BULLISH",failures);

  const c5=setupAt(bars2022,"2022-11-17");
  check("RM-004 setup",c5.name,"3-1-2",failures);
  check("RM-004 direction",c5.direction,"BEARISH",failures);

  const summary={
    provider:"TWELVE_DATA_VIA_CLOUDFLARE",
    symbol:"SPY",
    cases:10,
    pass:10-failures.length,
    fail:failures.length,
    failures
  };
  console.log(JSON.stringify(summary,null,2));
  process.exit(failures.length?1:0);
})().catch(err=>{
  console.error(err?.stack||err);
  process.exit(1);
});
