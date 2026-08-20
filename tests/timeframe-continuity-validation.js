"use strict";

const assert=require("assert");
const {CONTINUITY,classifyContinuity,buildContinuityState,summarizeContinuity,compareContinuity}=require("../timeframe-continuity.js");

let passed=0;
function test(name,fn){fn();passed+=1;console.log(`PASS ${passed}: ${name}`);}

test("price above period open is bullish",()=>assert.equal(classifyContinuity({currentPrice:101,periodOpen:100}),CONTINUITY.BULLISH));
test("price below period open is bearish",()=>assert.equal(classifyContinuity({currentPrice:99,periodOpen:100}),CONTINUITY.BEARISH));
test("price equal to period open is flat",()=>assert.equal(classifyContinuity({currentPrice:100,periodOpen:100}),CONTINUITY.FLAT));
test("missing current price is unknown",()=>assert.equal(classifyContinuity({currentPrice:null,periodOpen:100}),CONTINUITY.UNKNOWN));
test("missing period open is unknown",()=>assert.equal(classifyContinuity({currentPrice:100,periodOpen:null}),CONTINUITY.UNKNOWN));
test("empty string values are unknown",()=>assert.equal(classifyContinuity({currentPrice:"",periodOpen:100}),CONTINUITY.UNKNOWN));
test("timeframe aliases normalize",()=>assert.equal(buildContinuityState({timeframe:"1D",currentPrice:101,periodOpen:100}).timeframe,"D"));
test("missing values stay null in state",()=>{
  const row=buildContinuityState({timeframe:"D",currentPrice:null,periodOpen:100});
  assert.equal(row.state,CONTINUITY.UNKNOWN);
  assert.equal(row.currentPrice,null);
  assert.equal(row.distanceFromOpen,null);
});
test("distance from open is retained",()=>assert.equal(buildContinuityState({timeframe:"D",currentPrice:102.5,periodOpen:100}).distanceFromOpen,2.5));
test("percent from open is descriptive",()=>assert.equal(buildContinuityState({timeframe:"D",currentPrice:102.5,periodOpen:100}).pctFromOpen,2.5));
test("all bullish states produce full bullish continuity",()=>{
  const s=summarizeContinuity({states:[
    {timeframe:"M",currentPrice:110,periodOpen:100},
    {timeframe:"W",currentPrice:105,periodOpen:100},
    {timeframe:"D",currentPrice:101,periodOpen:100}
  ]});
  assert.equal(s.alignment,"FULL_BULLISH");
  assert.equal(s.fullContinuity,true);
});
test("all bearish states produce full bearish continuity",()=>{
  const s=summarizeContinuity({states:[
    {timeframe:"M",currentPrice:90,periodOpen:100},
    {timeframe:"W",currentPrice:95,periodOpen:100}
  ]});
  assert.equal(s.alignment,"FULL_BEARISH");
});
test("mixed direction is not full continuity",()=>{
  const s=summarizeContinuity({states:[
    {timeframe:"W",currentPrice:105,periodOpen:100},
    {timeframe:"D",currentPrice:95,periodOpen:100}
  ]});
  assert.equal(s.alignment,"MIXED");
  assert.equal(s.fullContinuity,false);
});
test("bullish majority is descriptive not probability",()=>{
  const s=summarizeContinuity({states:[
    {timeframe:"M",currentPrice:110,periodOpen:100},
    {timeframe:"W",currentPrice:105,periodOpen:100},
    {timeframe:"D",currentPrice:95,periodOpen:100}
  ]});
  assert.equal(s.alignment,"BULLISH_MAJORITY");
  assert.equal(s.bullishPct,66.67);
});
test("selected timeframe order follows canonical ladder",()=>{
  const s=summarizeContinuity({selectedTimeframes:["D","M","W"],states:[
    {timeframe:"D",currentPrice:101,periodOpen:100},
    {timeframe:"M",currentPrice:101,periodOpen:100},
    {timeframe:"W",currentPrice:101,periodOpen:100}
  ]});
  assert.deepEqual(s.states.map(r=>r.timeframe),["M","W","D"]);
});
test("empty state set reports no data",()=>assert.equal(summarizeContinuity({states:[]}).alignment,"NO_DATA"));
test("comparison finds timeframe flips",()=>{
  const a=summarizeContinuity({states:[{timeframe:"D",currentPrice:99,periodOpen:100}]});
  const b=summarizeContinuity({states:[{timeframe:"D",currentPrice:101,periodOpen:100}]});
  const c=compareContinuity(a,b);
  assert.equal(c.changes.length,1);
  assert.deepEqual(c.changes[0],{timeframe:"D",from:"BEARISH",to:"BULLISH"});
});
test("comparison reports alignment change",()=>{
  const a=summarizeContinuity({states:[{timeframe:"W",currentPrice:99,periodOpen:100},{timeframe:"D",currentPrice:99,periodOpen:100}]});
  const b=summarizeContinuity({states:[{timeframe:"W",currentPrice:101,periodOpen:100},{timeframe:"D",currentPrice:101,periodOpen:100}]});
  const c=compareContinuity(a,b);
  assert.equal(c.alignmentChanged,true);
  assert.equal(c.from,"FULL_BEARISH");
  assert.equal(c.to,"FULL_BULLISH");
});

console.log(`\n${passed}/${passed} PASS timeframe continuity validation`);
