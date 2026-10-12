"use strict";
const assert=require("assert");
const research=require("../historical-higher-timeframe.js");
const period=require("../period-resolver.js");

let passed=0;
function test(name,fn){fn();passed++;console.log("PASS "+passed+": "+name);}

function barFor(date,offset,prices,symbol="SPY"){
  const openIso=period.localDateTimeToUtcIso({date,time:"09:30"});
  const start=new Date(Date.parse(openIso)+offset*60000).toISOString();
  const end=new Date(Date.parse(start)+15*60000).toISOString();
  const localHHMM=new Date(Date.parse(start)).toLocaleTimeString("en-GB",{timeZone:"America/New_York",hour:"2-digit",minute:"2-digit",hour12:false});
  const sem={
    symbol,timeframe:"15",marketType:"US_EQUITY",marketTimezone:"America/New_York",
    session:"REGULAR",extendedHoursIncluded:false,barAnchor:"US_EQUITY_RTH_0930",
    barAnchorOffsetMinutes:offset,provider:"TWELVE_DATA",providerAggregation:"15min",
    periodOpenId:symbol+"|15|"+date+"|REGULAR|"+localHHMM,periodOpenTimestamp:start,
    barOpenTimestamp:start,barCloseTimestamp:end
  };
  return {datetime:start,symbol,timeframe:"15",
    open:prices[0],high:prices[1],low:prices[2],close:prices[3],
    volume:100,semantics:sem,semanticKey:"TEST"};
}

function session(date,delta=0){
  const rows=[];
  for(let n=0;n<26;n++){
    const v=100+delta+n*0.02;
    rows.push(barFor(date,n*15,[v,v+0.15,v-0.15,v+0.05]));
  }
  return rows;
}
const dates=["2026-08-19","2026-08-20","2026-08-21","2026-08-24","2026-08-25"];
const all=dates.flatMap((date,i)=>session(date,i*0.2));
const series={symbol:"SPY",timeframe:"15",marketType:"US_EQUITY",bars:all};

test("full session reconstructs six 60m plus one final 30m bar",()=>{
  const built=research.buildFrames({symbol:"SPY",timeframe:"15",marketType:"US_EQUITY",bars:session(dates[0])});
  assert.equal(built.hourly.length,7);
  assert.equal(built.daily.length,1);
  assert.deepEqual(built.hourly.map(x=>x.rows.length),[4,4,4,4,4,4,2]);
  assert.deepEqual(built.hourly.map(x=>x.bar.derivedDurationMinutes),[60,60,60,60,60,60,30]);
  assert.equal(built.hourly[6].bar.closingHalfHour,true);
  assert.equal(built.hourly[6].bar.semantics.barOpenTimestamp,"2026-08-19T19:30:00.000Z");
  assert.equal(built.hourly[6].bar.semantics.barCloseTimestamp,"2026-08-19T20:00:00.000Z");
  assert.equal(built.daily[0].bar.semantics.barCloseTimestamp,"2026-08-19T20:00:00.000Z");
  assert.equal(built.hourly[0].bar.semantics.timeframe,"60");
  assert.equal(built.daily[0].bar.semantics.timeframe,"D");
});

test("derived OHLC and volume aggregate from constituent 15m bars",()=>{
  const source=session(dates[0]);const built=research.buildFrames({...series,bars:source});
  const p=built.hourly[0].bar;
  assert.equal(p.open,source[0].open);
  assert.equal(p.close,source[3].close);
  assert.equal(p.high,Math.max(...source.slice(0,4).map(x=>x.high)));
  assert.equal(p.low,Math.min(...source.slice(0,4).map(x=>x.low)));
  assert.equal(p.volume,400);
  assert.equal(built.daily[0].bar.volume,2600);
});

test("winter session anchor uses EST and summer uses EDT",()=>{
  const winter=research.buildFrames({...series,bars:session("2026-01-15")});
  const summer=research.buildFrames({...series,bars:session("2026-08-19")});
  assert.equal(winter.hourly[0].bar.semantics.barOpenTimestamp,"2026-01-15T14:30:00.000Z");
  assert.equal(summer.hourly[0].bar.semantics.barOpenTimestamp,"2026-08-19T13:30:00.000Z");
});

test("missing 15m source bar excludes the entire incomplete session",()=>{
  const missing=all.filter(x=>!(x.semantics.periodOpenId.includes("2026-08-21")&&x.semantics.barAnchorOffsetMinutes===75));
  const built=research.buildFrames({...series,bars:missing});
  assert.equal(built.source.sessions.length,4);
  assert.equal(built.source.excluded.length,1);
  assert.equal(built.source.excluded[0].observed15m,25);
  assert.equal(built.daily.length,4);
  assert.equal(built.hourly.length,28);
  assert.notEqual(built.hourly[13].segment,built.hourly[14].segment);
});

test("duplicate provider bars fail closed",()=>{
  assert.throws(()=>research.buildFrames({...series,bars:[...session(dates[0]),session(dates[0])[0]]}),/duplicate/);
});

test("corrupt timestamp provenance fails closed",()=>{
  const corrupt=session(dates[0]);corrupt[0].semantics.barOpenTimestamp="2026-08-19T13:45:00.000Z";
  assert.throws(()=>research.buildFrames({...series,bars:corrupt}),/timestamp|period|mismatch/i);
});

test("non-RTH and non-15m input are rejected",()=>{
  const corrupt=session(dates[0]);corrupt[0].semantics.session="EXTENDED";
  assert.throws(()=>research.buildFrames({...series,bars:corrupt}),/unsupported/);
  assert.throws(()=>research.buildFrames({...series,timeframe:"5"}),/15m/);
});

test("first checkpoint uses no future constituent OHLC",()=>{
  const source=session(dates[0]);const built=research.buildFrames({...series,bars:source});
  const parent=built.daily[0];
  const first=research.observedPartial(parent.bar,parent.rows,0);
  const last=research.observedPartial(parent.bar,parent.rows,25);
  assert.equal(first.high,source[0].high);
  assert.equal(first.low,source[0].low);
  assert.equal(first.close,source[0].close);
  assert.equal(first.semantics.barCloseTimestamp,source[0].semantics.barCloseTimestamp);
  assert.notEqual(first.high,last.high);
  assert.equal(first.observed15m,1);
  assert.equal(last.observed15m,26);
});

test("higher timeframe observations carry no historical performance claim",()=>{
  const result=research.buildHigherTimeframeResearch(series);
  assert.equal(result.completeSessions,5);
  assert.equal(result.derivedBars["60"],35);
  assert.equal(result.derivedBars.D,5);
  assert.equal(result.timeframes["60"].evidenceEligible,0);
  assert.equal(result.timeframes.D.successRate,null);
  for(const tf of ["60","D"]){
    for(const row of result.timeframes[tf].events){
      assert.equal(row.evidenceEligible,false);
      assert.equal(row.resolution,"NOT_EVALUATED");
      assert.equal(row.timeframe,tf);
      assert.ok(Date.parse(row.activationTimestamp)>=Date.parse(row.periodOpenTimestamp));
    }
  }
});

console.log("\n"+passed+"/"+passed+" PASS research higher-timeframe aggregation validation");
