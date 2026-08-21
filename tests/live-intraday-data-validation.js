"use strict";

const assert=require("assert");
const live=require("../live-intraday-data.js");

let pass=0, fail=0;
function test(name,fn){
  return Promise.resolve().then(fn).then(()=>{pass++; console.log(`PASS ${name}`);}).catch(error=>{fail++; console.error(`FAIL ${name}: ${error.message}`);});
}

const payload={
  meta:{symbol:"SPY",interval:"5min",exchange:"NYSE",timezone:"UTC"},
  values:[
    {datetime:"2026-08-20 13:30:00",open:"640.00",high:"640.50",low:"639.80",close:"640.25",volume:"1000"},
    {datetime:"2026-08-20 13:35:00",open:"640.25",high:"640.80",low:"640.10",close:"640.70",volume:"1200"}
  ]
};

(async()=>{
  await test("production timeframe accepts 5m alias",()=>{
    assert.strictEqual(live.normalizeProductionTimeframe("5m"),"5");
  });

  await test("production timeframe accepts 15 and 30",()=>{
    assert.strictEqual(live.normalizeProductionTimeframe("15"),"15");
    assert.strictEqual(live.normalizeProductionTimeframe("30m"),"30");
  });

  await test("60m remains blocked",()=>{
    assert.throws(()=>live.normalizeProductionTimeframe("60"),/observation-only/);
  });

  await test("daily is not accepted by live intraday source",()=>{
    assert.throws(()=>live.normalizeProductionTimeframe("D"),/must be 5, 15, or 30/);
  });

  await test("proxy URL uses server-side credential path only",()=>{
    const url=new URL(live.buildProxyTimeSeriesUrl({symbol:"spy",timeframe:"5",outputsize:50}));
    assert.strictEqual(url.origin,"https://thestrat.phshbone.workers.dev");
    assert.strictEqual(url.pathname,"/time-series");
    assert.strictEqual(url.searchParams.get("symbol"),"SPY");
    assert.strictEqual(url.searchParams.get("interval"),"5min");
    assert.strictEqual(url.searchParams.get("outputsize"),"50");
    assert.strictEqual(url.searchParams.has("apikey"),false);
  });

  await test("proxy base strips path query and fragment",()=>{
    assert.strictEqual(live.normalizeProxyBase("https://example.com/foo/?x=1#y"),"https://example.com/foo");
  });

  await test("invalid symbol is rejected",()=>{
    assert.throws(()=>live.buildProxyTimeSeriesUrl({symbol:"SPY&apikey=bad",timeframe:"5"}),/valid symbol/);
  });

  await test("invalid outputsize is rejected",()=>{
    assert.throws(()=>live.buildProxyTimeSeriesUrl({symbol:"SPY",timeframe:"5",outputsize:0}),/outputsize/);
  });

  await test("live fetch normalizes provider bars into semantic bars",async()=>{
    let requested=null;
    const fakeFetch=async(url,options)=>{
      requested={url,options};
      return {ok:true,status:200,json:async()=>payload};
    };
    const result=await live.fetchLiveIntradaySeries({symbol:"spy",timeframe:"5",outputsize:2},fakeFetch);
    assert.strictEqual(result.source,"LIVE_PROXY");
    assert.strictEqual(result.provider,"TWELVE_DATA");
    assert.strictEqual(result.symbol,"SPY");
    assert.strictEqual(result.timeframe,"5");
    assert.strictEqual(result.bars.length,2);
    assert.strictEqual(requested.options.headers.Accept,"application/json");
    assert.strictEqual(new URL(requested.url).searchParams.has("apikey"),false);
    assert.strictEqual(result.bars[0].open,640);
    assert.strictEqual(result.bars[0].semantics.provider,"TWELVE_DATA");
    assert.strictEqual(result.bars[0].semantics.timeframe,"5");
    assert.strictEqual(result.bars[0].semantics.session,"REGULAR");
    assert.strictEqual(result.bars[0].semantics.barAnchor,"US_EQUITY_RTH_0930");
    assert.strictEqual(result.bars[0].semantics.barOpenTimestamp,"2026-08-20T13:30:00.000Z");
    assert.strictEqual(result.bars[0].semantics.barCloseTimestamp,"2026-08-20T13:35:00.000Z");
    assert.match(result.bars[0].semantics.periodOpenId,/^SPY\|5\|2026-08-20\|REGULAR\|09:30$/);
  });

  await test("provider errors surface without semantic promotion",async()=>{
    const fakeFetch=async()=>({ok:true,status:200,json:async()=>({status:"error",message:"quota"})});
    await assert.rejects(()=>live.fetchLiveIntradaySeries({symbol:"SPY",timeframe:"5"},fakeFetch),/Twelve Data: quota/);
  });

  await test("proxy HTTP failures surface",async()=>{
    const fakeFetch=async()=>({ok:false,status:503,json:async()=>({})});
    await assert.rejects(()=>live.fetchLiveIntradaySeries({symbol:"SPY",timeframe:"5"},fakeFetch),/HTTP 503/);
  });

  console.log(JSON.stringify({pass,fail,failures:fail}));
  if(fail) process.exitCode=1;
})();
