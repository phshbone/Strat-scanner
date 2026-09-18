"use strict";

const assert=require("assert");
const builder=require("../historical-event-builder.js");
const outcomes=require("../research-outcomes.js");

let pass=0;
function test(name,fn){fn();pass+=1;console.log(`PASS ${pass}: ${name}`);}

const bars=[
  {time:"2021-08-17",open:415.19,high:415.86,low:412.02,close:415.00},
  {time:"2021-08-18",open:413.99,high:415.55,low:410.22,close:410.46},
  {time:"2021-08-19",open:407.74,high:412.29,low:407.60,close:411.10},
  {time:"2021-08-20",open:411.44,high:414.69,low:410.96,close:414.37},
  {time:"2021-08-23",open:416.05,high:418.92,low:414.44,close:418.01},
  {time:"2021-08-24",open:418.68,high:419.21,low:418.16,close:418.68},
  {time:"2021-08-25",open:418.86,high:420.07,low:418.49,close:419.55},
  {time:"2021-08-26",open:419.27,high:419.51,low:416.98,close:417.08}
];

const events=builder.extractHistoricalEvents({bars,symbol:"SPY",timeframe:"D",marketType:"US_EQUITY",stopModel:"MIDPOINT",horizonBars:5});

test("extracts known bullish and bearish 2-2 events",()=>{
  assert.ok(events.some(e=>e.timestamp==="2021-08-20"&&e.setup==="2-2"&&e.direction==="BULLISH"));
  assert.ok(events.some(e=>e.timestamp==="2021-08-26"&&e.setup==="2-2"&&e.direction==="BEARISH"));
});

test("August 20 bullish event reaches magnitude on next bar",()=>{
  const e=events.find(x=>x.timestamp==="2021-08-20"&&x.direction==="BULLISH");
  assert.equal(e.magnitudeHit,true);
  assert.equal(e.stopHit,false);
  assert.equal(e.firstHit,"MAGNITUDE");
  assert.equal(e.timeToMagnitudeBars,1);
  assert.equal(outcomes.classifyOutcome(e).status,"WIN");
});

test("August 26 midpoint event preserves same-bar ambiguity",()=>{
  const e=events.find(x=>x.timestamp==="2021-08-26"&&x.direction==="BEARISH");
  assert.equal(e.magnitudeHit,true);
  assert.equal(e.stopHit,true);
  assert.equal(e.sequenceAmbiguous,true);
  assert.equal(outcomes.classifyOutcome(e).status,"AMBIGUOUS");
});

test("entry-bar stop without sequence proof is ambiguous, not forced loss",()=>{
  const setup={name:"2-2",direction:"BULLISH",trigger:100,magnitude:110,reference:{high:100,low:90},currentType:"2U",pathResolved:true};
  const synthetic=[
    {open:95,high:96,low:90,close:93},
    {open:93,high:97,low:91,close:96},
    {open:96,high:99,low:94,close:98},
    {open:99,high:105,low:94,close:103}
  ];
  const e=builder.buildHistoricalEvent({bars:synthetic,signalIndex:3,setup,symbol:"TEST",timeframe:"15",stopModel:"MIDPOINT"});
  assert.equal(e.sequenceAmbiguous,true);
  assert.equal(outcomes.classifyOutcome(e).status,"AMBIGUOUS");
});

test("structure stop can be evaluated separately from midpoint stop",()=>{
  const setup={name:"2-2",direction:"BEARISH",trigger:418.49,magnitude:418.16,reference:bars[6],currentType:"2D",pathResolved:true};
  const e=builder.buildHistoricalEvent({bars,signalIndex:7,setup,symbol:"SPY",timeframe:"D",stopModel:"STRUCTURE"});
  assert.equal(e.stopModel,"STRUCTURE");
  assert.equal(e.magnitudeHit,true);
  assert.equal(e.stopHit,false);
  assert.equal(outcomes.classifyOutcome(e).status,"WIN");
});

test("context resolver attaches auditable comparison fields",()=>{
  const rows=builder.extractHistoricalEvents({
    bars,
    symbol:"SPY",
    timeframe:"D",
    contextResolver:({index})=>({ftfcAlignment:index===3?"FULL_BULLISH":"MIXED",scenarioVersion:"fixture-v1"})
  });
  const e=rows.find(x=>x.timestamp==="2021-08-20");
  assert.equal(e.ftfcAlignment,"FULL_BULLISH");
  assert.equal(e.scenarioVersion,"fixture-v1");
});

console.log(`\n${pass}/${pass} PASS historical event builder validation`);
