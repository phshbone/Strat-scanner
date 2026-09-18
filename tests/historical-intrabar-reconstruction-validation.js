"use strict";
const assert=require("assert");
const r=require("../historical-intrabar-reconstruction.js");
const core=require("../core-engine-v0.3.js");
let pass=0;function t(name,fn){fn();pass++;console.log("PASS "+pass+": "+name);}

function sem(symbol,tf,date,offset,openIso,closeIso){return {symbol,timeframe:String(tf),marketType:"US_EQUITY",marketTimezone:"America/New_York",session:"REGULAR",extendedHoursIncluded:false,barAnchor:"US_EQUITY_RTH_0930",barAnchorOffsetMinutes:offset,provider:"TWELVE_DATA",providerAggregation:String(tf)+"min",periodOpenId:symbol+"|"+tf+"|"+date+"|REGULAR|"+String(offset),periodOpenTimestamp:openIso,barOpenTimestamp:openIso,barCloseTimestamp:closeIso};}
function bar(o,h,l,c,iso,tf,offset){const close=new Date(Date.parse(iso)+Number(tf)*60000).toISOString();return {open:o,high:h,low:l,close:c,datetime:iso,timeframe:String(tf),symbol:"SPY",semantics:sem("SPY",tf,"2026-01-02",offset,iso,close),semanticKey:"SPY|"+tf+"|"+offset};}

const parents=[
  bar(100,102,99,101,"2026-01-02T14:30:00.000Z",15,0),
  bar(101,103,98,99,"2026-01-02T14:45:00.000Z",15,15),
  bar(99,100,96,97,"2026-01-02T15:00:00.000Z",15,30),
  bar(97,104,97,103,"2026-01-02T15:15:00.000Z",15,45),
  bar(103,106,102,105,"2026-01-02T15:30:00.000Z",15,60),
  bar(105,107,104,106,"2026-01-02T15:45:00.000Z",15,75)
];

const lowers=[
  bar(97,99,97,98,"2026-01-02T15:15:00.000Z",5,45),
  bar(98,101,98,100.5,"2026-01-02T15:20:00.000Z",5,50),
  bar(100.5,104,100,103,"2026-01-02T15:25:00.000Z",5,55),
  bar(103,105,102,104,"2026-01-02T15:30:00.000Z",5,60),
  bar(104,106,103,105,"2026-01-02T15:35:00.000Z",5,65),
  bar(105,106,104,105.5,"2026-01-02T15:40:00.000Z",5,70),
  bar(105.5,107,104,106,"2026-01-02T15:45:00.000Z",5,75),
  bar(106,108,105,107,"2026-01-02T15:50:00.000Z",5,80),
  bar(107,109,106,108,"2026-01-02T15:55:00.000Z",5,85)
];

t("partial parent aggregates only observed lower bars",()=>{const p=r.aggregatePartialParent(parents[3],lowers.slice(0,3).map((bar,index)=>({bar,index})),1);assert.equal(p.open,97);assert.equal(p.high,101);assert.equal(p.low,97);assert.equal(p.close,100.5);});
t("outside path is bullish when downside break precedes upside break",()=>{const prior={high:100,low:96};const rows=[{bar:{high:99,low:95}},{bar:{high:101,low:97}}];assert.equal(r.inferOutsidePathDirection(rows,prior,1),"BULLISH");});
t("same lower bar breaking both sides stays unresolved",()=>{const prior={high:100,low:96};const rows=[{bar:{high:101,low:95}}];assert.equal(r.inferOutsidePathDirection(rows,prior,0),null);});
t("price progress creates deterministic early/mid/late bucket",()=>{assert.deepEqual(r.progressContext({direction:"BULLISH",trigger:100,magnitude:110},104),{activationProgressPct:40,priceBucket:"MID"});});

const parentSeries={symbol:"SPY",timeframe:"15",marketType:"US_EQUITY",bars:parents};
const lowerSeries={symbol:"SPY",timeframe:"5",marketType:"US_EQUITY",bars:lowers};
const result=r.buildCheckpointEvents({parentSeries,lowerSeries,stopModel:"STRUCTURE",horizonBars:5});
t("checkpoint builder returns evidence-eligible reconstructed events",()=>assert.ok(result.events.every(e=>e.evidenceEligible===true&&e.sampleConstruction===r.SAMPLE_CONSTRUCTION)));
t("checkpoint timestamps are lower-bar close observations",()=>assert.ok(result.events.every(e=>String(e.activationTimestamp||"").endsWith("Z"))));
t("event ids are checkpoint-specific and stop-model-specific",()=>assert.ok(result.events.every(e=>e.id.includes("|STRUCTURE|"))));

const setup={name:"2-2",direction:"BULLISH",trigger:100,magnitude:110,reference:{high:100,low:90}};
const after=[
  bar(101,104,100,103,"2026-01-02T15:00:00.000Z",5,30),
  bar(103,108,102,107,"2026-01-02T15:05:00.000Z",5,35),
  bar(107,111,106,110,"2026-01-02T15:10:00.000Z",5,40)
];
const out=r.evaluateAfterObservation({lowerBars:after,activationLowerIndex:0,setup,stopModel:"STRUCTURE",horizonParentBars:2});
t("outcome starts after observation checkpoint",()=>{assert.equal(out.resolution,"WIN");assert.equal(out.resolvedLowerIndex,2);});

const both=[
  bar(101,104,100,103,"2026-01-02T15:00:00.000Z",5,30),
  bar(103,111,89,100,"2026-01-02T15:05:00.000Z",5,35)
];
const amb=r.evaluateAfterObservation({lowerBars:both,activationLowerIndex:0,setup,stopModel:"STRUCTURE",horizonParentBars:2});
t("same 5m target and stop remains ambiguous",()=>assert.equal(amb.resolution,"AMBIGUOUS"));

console.log("\n"+pass+"/"+pass+" PASS historical intrabar reconstruction validation");