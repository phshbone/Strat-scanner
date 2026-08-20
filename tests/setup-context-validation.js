"use strict";

const assert=require("assert");
const {resolvePrimarySignal,normalizeRR,evidenceStatus,buildSetupContext}=require("../setup-context.js");

let passed=0;
function test(name,fn){fn();passed+=1;console.log(`PASS ${passed}: ${name}`);}

test("bullish RR calculates correctly",()=>{
  const r=normalizeRR({entry:100,stop:95,target:112,direction:"BULLISH"});
  assert.equal(r.valid,true); assert.equal(r.rr,2.4);
});

test("bearish RR calculates correctly",()=>{
  const r=normalizeRR({entry:100,stop:105,target:90,direction:"BEARISH"});
  assert.equal(r.valid,true); assert.equal(r.rr,2);
});

test("invalid geometry is unknown",()=>{
  const r=normalizeRR({entry:100,stop:101,target:110,direction:"BULLISH"});
  assert.equal(r.valid,false);
});

test("missing RR values stay unknown instead of becoming zero",()=>{
  const r=normalizeRR({entry:null,stop:95,target:112,direction:"BULLISH"});
  assert.equal(r.valid,false); assert.equal(r.rr,null);
});

test("bullish FTFC aligns",()=>assert.equal(evidenceStatus("BULLISH","FTFC","FULL_BULLISH").status,"ALIGNED"));
test("opposed FTFC is flagged",()=>assert.equal(evidenceStatus("BULLISH","FTFC","FULL_BEARISH").status,"OPPOSED"));
test("mixed breadth stays mixed",()=>assert.equal(evidenceStatus("BULLISH","BREADTH","MIXED").status,"MIXED_OR_UNKNOWN"));

test("single signal resolves automatically",()=>{
  const s={direction:"BULLISH"};
  const r=resolvePrimarySignal({signals:[s]});
  assert.equal(r.signal,s); assert.equal(r.status,"ONLY_SIGNAL");
});

test("multiple signals are not guessed",()=>{
  const r=resolvePrimarySignal({signals:[{direction:"BULLISH"},{direction:"BEARISH"}]});
  assert.equal(r.signal,null); assert.equal(r.status,"AMBIGUOUS"); assert.equal(r.candidateCount,2);
});

test("explicit primary resolves multiple signals",()=>{
  const a={direction:"BULLISH"},b={direction:"BEARISH"};
  const r=resolvePrimarySignal({signals:[a,b],primarySignal:b});
  assert.equal(r.signal,b); assert.equal(r.status,"EXPLICIT");
});

test("practice context signal takes priority over ambiguous list",()=>{
  const p={direction:"BULLISH"};
  const r=resolvePrimarySignal({signals:[{direction:"BULLISH"},{direction:"BEARISH"}],practiceTrade:{context:{signal:p}}});
  assert.equal(r.signal,p); assert.equal(r.status,"PRACTICE_CONTEXT");
});

test("no setup remains wait even with strong support",()=>{
  const c=buildSetupContext({signals:[],ftfc:{alignment:"FULL_BULLISH"},indexBreadth:{context:"BULLISH_MAJORITY"}});
  assert.equal(c.advisory.state,"WAIT_NO_ACTIONABLE_SETUP");
  assert.equal(c.probabilityScore,null);
});

test("actionable signal becomes watch state",()=>{
  const c=buildSetupContext({signals:[{actionable:true,direction:"BULLISH",setup:"2-1-2U"}]});
  assert.equal(c.advisory.state,"WATCH_ACTIONABLE_SETUP");
});

test("ambiguous primary is exposed rather than guessed",()=>{
  const c=buildSetupContext({signals:[{actionable:true,direction:"BULLISH",setup:"2-1-2U"},{actionable:true,direction:"BEARISH",setup:"2-2D"}]});
  assert.equal(c.signal,null);
  assert.equal(c.primarySignalResolution.status,"AMBIGUOUS");
  assert.equal(c.evidence.find(x=>x.label==="SETUP").status,"AMBIGUOUS_PRIMARY");
  assert.equal(c.safeguards.ambiguousPrimarySignalNotGuessed,true);
});

test("open practice trade takes active context priority",()=>{
  const c=buildSetupContext({signals:[{actionable:true,direction:"BULLISH"}],practiceTrade:{state:"OPEN",direction:"BULLISH"}});
  assert.equal(c.advisory.state,"ACTIVE_TRADE_CONTEXT");
});

test("RR below minimum fails gate",()=>{
  const c=buildSetupContext({signals:[{actionable:true,direction:"BULLISH"}],entry:100,stop:95,target:108,minRewardRisk:2});
  assert.equal(c.rrGate.status,"FAIL");
});

test("RR at minimum passes gate",()=>{
  const c=buildSetupContext({signals:[{actionable:true,direction:"BULLISH"}],entry:100,stop:95,target:110,minRewardRisk:2});
  assert.equal(c.rrGate.status,"PASS");
});

test("historical evidence is separately labeled",()=>{
  const h={sampleSize:214,t1RatePct:68};
  const c=buildSetupContext({signals:[{actionable:true,direction:"BULLISH"}],historicalEvidence:h});
  const row=c.evidence.find(x=>x.label==="HISTORICAL_EVIDENCE");
  assert.equal(row.status,"AVAILABLE"); assert.equal(row.value.sampleSize,214);
});

test("historical evidence never creates probability score",()=>{
  const c=buildSetupContext({signals:[{actionable:true,direction:"BULLISH"}],historicalEvidence:{sampleSize:999,t1RatePct:90}});
  assert.equal(c.probabilityScore,null);
  assert.equal(c.safeguards.historicalEvidenceIsNotForecast,true);
});

test("index and sector breadth remain separate evidence rows",()=>{
  const c=buildSetupContext({signals:[{actionable:true,direction:"BULLISH"}],indexBreadth:{context:"BULLISH_MAJORITY"},sectorBreadth:{context:"BEARISH_MAJORITY"}});
  assert.equal(c.evidence.find(x=>x.label==="BREADTH").status,"ALIGNED");
  assert.equal(c.evidence.find(x=>x.label==="SECTOR_BREADTH").status,"OPPOSED");
});

test("why view marks support layers explanatory only",()=>{
  const c=buildSetupContext({signals:[{actionable:true,direction:"BULLISH"}],ftfc:{alignment:"FULL_BULLISH"}});
  assert.equal(c.why.find(x=>x.label==="FTFC").explanatoryOnly,true);
  assert.equal(c.why.find(x=>x.label==="SETUP").explanatoryOnly,false);
});

console.log(`\n${passed}/${passed} PASS setup context validation`);
