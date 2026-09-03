"use strict";

const assert=require("assert");
const coach=require("../chart-trade-coach.js");

let pass=0;
function test(name,fn){try{fn();pass++;console.log(`PASS ${name}`);}catch(error){console.error(`FAIL ${name}: ${error.message}`);process.exitCode=1;}}

const base={key:"BTC/USD|15",symbol:"BTC/USD",timeframe:"15",setupName:"2-1-2",direction:"BULLISH",pathResolved:true,trigger:100,magnitude:105,price:99,inForce:false,magnitudeHit:false,observedAt:"2026-09-03T20:00:00Z"};

test("initial chart context emits one rule based message",()=>{
  const g=coach.meaningfulChartGuidance(null,base);
  assert.equal(g.emit,true);assert.equal(g.code,"CHART_INITIAL_CONTEXT");
});

test("trigger transition emits only when setup moves into force",()=>{
  const g=coach.meaningfulChartGuidance(base,{...base,price:101,inForce:true});
  assert.equal(g.code,"CHART_TRIGGER_CROSSED");
  assert.equal(coach.meaningfulChartGuidance({...base,inForce:true},{...base,inForce:true}),null);
});

test("magnitude transition is positive deterministic guidance",()=>{
  const g=coach.meaningfulChartGuidance({...base,inForce:true},{...base,inForce:true,magnitudeHit:true,price:105});
  assert.equal(g.code,"CHART_MAGNITUDE_REACHED");assert.equal(g.severity,"POSITIVE");
});

test("lost directional setup emits caution",()=>{
  const g=coach.meaningfulChartGuidance(base,{...base,setupName:"NONE",direction:null,trigger:null,magnitude:null,inForce:false});
  assert.equal(g.code,"CHART_SETUP_LOST");assert.equal(g.severity,"CAUTION");
});

test("outside path ambiguity is never promoted to direction",()=>{
  const g=coach.meaningfulChartGuidance(base,{...base,pathResolved:false,direction:null,setupName:"OUTSIDE PATH AMBIGUOUS"});
  assert.equal(g.code,"CHART_PATH_AMBIGUOUS");assert.equal(g.severity,"HIGH");
});

if(!process.exitCode) console.log(`Chart Trade Coach validation: ${pass}/${pass} PASS`);
