"use strict";

const assert=require("assert");
const temporal=require("../historical-temporal-audit.js");

let pass=0;
function t(name,fn){fn();pass++;console.log("PASS "+pass+": "+name);}

function e(id,date,{resolution="WIN",direction="BULLISH",priceBucket="EARLY",eligible=true}={}){
  return {id,activationTimestamp:date+"T15:35:00Z",setup:"2-2",setupId:"2-2",direction,stopModel:"STRUCTURE",ftfcAlignment:direction==="BULLISH"?"FULL_BULLISH":"FULL_BEARISH",priceBucket,observationPhase:"FIRST_5M",resolution,evidenceEligible:eligible,sequenceAmbiguous:resolution==="AMBIGUOUS"};
}

const rows=[
  e("1","2026-04-01"),e("2","2026-04-02",{resolution:"LOSS"}),e("3","2026-04-03"),
  e("4","2026-05-01"),e("5","2026-05-02"),e("6","2026-05-03",{resolution:"LOSS"}),
  e("7","2026-06-01",{resolution:"LOSS"}),e("8","2026-06-02"),e("9","2026-06-03",{resolution:"LOSS"}),
  e("10","2026-06-04",{eligible:false})
];

t("month key is UTC calendar month",()=>assert.equal(temporal.monthKey("2026-04-30T23:00:00Z"),"2026-04"));

t("period summary excludes unresolved/ambiguous from win denominator",()=>{
  const s=temporal.summarizePeriod([e("a","2026-04-01"),e("b","2026-04-02",{resolution:"LOSS"}),e("c","2026-04-03",{resolution:"AMBIGUOUS"})],{minResolvedPerPeriod:2});
  assert.equal(s.resolvedSampleSize,2);assert.equal(s.wins,1);assert.equal(s.losses,1);assert.equal(s.ambiguous,1);assert.equal(s.successRatePct,50);assert.equal(s.populated,true);
});

t("temporal audit reports populated months without stability scoring",()=>{
  const a=temporal.temporalAudit(rows,{setup:"2-2",direction:"BULLISH",stopModel:"STRUCTURE"},{minResolvedPerPeriod:3,minPopulatedPeriods:3});
  assert.equal(a.sampleSize,9);
  assert.equal(a.periods.length,3);
  assert.equal(a.populatedPeriods,3);
  assert.equal(a.coverageStatus,"TEMPORAL_COVERAGE");
  assert.equal(a.populatedRateMinPct,33.3);
  assert.equal(a.populatedRateMaxPct,66.7);
  assert.equal(a.populatedRateSpreadPct,33.4);
  assert.ok(!("confidence" in a));
});

t("weak period coverage is explicit",()=>{
  const a=temporal.temporalAudit(rows,{priceBucket:"EARLY"},{minResolvedPerPeriod:4,minPopulatedPeriods:3});
  assert.equal(a.coverageStatus,"LIMITED_PERIOD_COVERAGE");
});

t("ineligible completed-bar events are excluded",()=>{
  const a=temporal.temporalAudit(rows,{setup:"2-2"},{minResolvedPerPeriod:1,minPopulatedPeriods:1});
  assert.equal(a.sampleSize,9);
});

t("cohort batch keeps conditions attached to temporal result",()=>{
  const out=temporal.auditsForCohorts(rows,[{setup:"2-2",direction:"BULLISH",stopModel:"STRUCTURE",sampleSize:9}],{minResolvedPerPeriod:3,minPopulatedPeriods:3});
  assert.equal(out.length,1);assert.equal(out[0].cohort.direction,"BULLISH");assert.equal(out[0].temporal.populatedPeriods,3);
});

console.log("\n"+pass+"/"+pass+" PASS historical temporal audit validation");
