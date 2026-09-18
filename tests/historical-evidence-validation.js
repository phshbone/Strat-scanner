"use strict";

const assert=require("assert");
const h=require("../historical-evidence.js");
const {buildSetupContext}=require("../setup-context.js");

let pass=0;
function test(name,fn){fn();pass+=1;console.log(`PASS ${pass}: ${name}`);}

const regular={
  timeframe:"15",
  marketTimezone:"America/New_York",
  session:"REGULAR",
  extendedHoursIncluded:false,
  barAnchor:"US_EQUITY_RTH_0930",
  barAnchorOffsetMinutes:0,
  providerAggregation:"15min"
};
const extended={...regular,session:"EXTENDED",extendedHoursIncluded:true};

function event(id,{ftfc="FULL_BULLISH",semantics=regular,magnitudeHit=false,stopHit=false,firstHit=null,setup="2-2",direction="BULLISH",timeframe="15"}={}){
  return {
    id,
    setup,
    direction,
    timeframe,
    marketType:"US_EQUITY",
    dataSemantics:semantics,
    ftfcAlignment:ftfc,
    stopModel:"MIDPOINT",
    entry:100,
    stop:95,
    magnitude:110,
    magnitudeHit,
    stopHit,
    firstHit,
    closed:true,
    exit:magnitudeHit&&!stopHit?110:stopHit&&!magnitudeHit?95:null
  };
}

const events=[
  event("a",{magnitudeHit:true}),
  event("b",{stopHit:true}),
  event("c",{magnitudeHit:true}),
  event("d",{ftfc:"MIXED",magnitudeHit:true}),
  event("e",{ftfc:"MIXED",stopHit:true}),
  event("f",{semantics:extended,magnitudeHit:true}),
  event("g",{setup:"2-1-2",magnitudeHit:true}),
  event("h",{direction:"BEARISH",magnitudeHit:true})
];

const query={
  setupId:"2-2",
  direction:"BULLISH",
  timeframe:"15",
  marketType:"US_EQUITY",
  dataSemantics:regular,
  ftfcAlignment:"FULL_BULLISH",
  stopModel:"MIDPOINT"
};

test("exact cohort applies known context filters",()=>{
  const r=h.analyzeHistoricalEvidence({events,query,minResolvedSampleSize:2});
  assert.equal(r.sampleSize,3);
  assert.equal(r.resolvedSampleSize,3);
  assert.equal(r.wins,2);
  assert.equal(r.losses,1);
  assert.equal(r.successRate,2/3);
  assert.equal(r.status,"AVAILABLE");
});

test("baseline remains broader and separately labeled",()=>{
  const r=h.analyzeHistoricalEvidence({events,query,minResolvedSampleSize:2});
  assert.equal(r.broaderBaseline.comparisonTier,"SETUP_BASELINE");
  assert.equal(r.broaderBaseline.sampleSize,5);
  assert.equal(r.comparisonTier,"EXACT_CONTEXT");
});

test("semantic mismatch is excluded rather than blended",()=>{
  const r=h.analyzeHistoricalEvidence({events,query,minResolvedSampleSize:2});
  assert.equal(r.audit.coreMatches,6);
  assert.equal(r.audit.semanticallyComparable,5);
  assert.equal(r.audit.excludedForSemanticMismatch,1);
});

test("small exact cohort is explicitly insufficient",()=>{
  const r=h.analyzeHistoricalEvidence({events,query,minResolvedSampleSize:4});
  assert.equal(r.status,"INSUFFICIENT_SAMPLE");
  assert.equal(r.sufficient,false);
  assert.equal(r.sampleSize,3);
  assert.equal(r.broaderBaseline.status,"AVAILABLE");
  assert.match(r.note,/rule-based/i);
});

test("no exact cohort does not borrow baseline evidence",()=>{
  const r=h.analyzeHistoricalEvidence({events,query:{...query,ftfcAlignment:"FULL_BEARISH"},minResolvedSampleSize:2});
  assert.equal(r.status,"NOT_AVAILABLE");
  assert.equal(r.sampleSize,0);
  assert.equal(r.broaderBaseline.sampleSize,5);
});

test("ambiguous outcomes stay out of resolved denominator",()=>{
  const rows=[
    event("x",{magnitudeHit:true,stopHit:true}),
    event("y",{magnitudeHit:true})
  ];
  const r=h.analyzeHistoricalEvidence({events:rows,query,minResolvedSampleSize:1});
  assert.equal(r.sampleSize,2);
  assert.equal(r.resolvedSampleSize,1);
  assert.equal(r.ambiguous,1);
  assert.equal(r.successRate,1);
});

test("setup context respects explicit insufficient status",()=>{
  const evidence=h.analyzeHistoricalEvidence({events,query,minResolvedSampleSize:4});
  const c=buildSetupContext({
    signals:[{actionable:true,direction:"BULLISH",setupId:"2-2"}],
    primarySignal:{actionable:true,direction:"BULLISH",setupId:"2-2"},
    historicalEvidence:evidence
  });
  const row=c.evidence.find(x=>x.label==="HISTORICAL_EVIDENCE");
  assert.equal(row.status,"INSUFFICIENT_SAMPLE");
  assert.equal(c.probabilityScore,null);
  assert.equal(c.safeguards.historicalEvidenceIsNotForecast,true);
});

console.log(`\n${pass}/${pass} PASS historical evidence validation`);
