"use strict";

const assert=require("assert");
const audit=require("../historical-cohort-audit.js");

let pass=0;
function t(name,fn){fn();pass++;console.log("PASS "+pass+": "+name);}

function e(id,{setup="2-2",direction="BULLISH",stopModel="MIDPOINT",ftfcAlignment="FULL_BULLISH",priceBucket="EARLY",observationPhase="FIRST_5M",resolution="WIN",eligible=true}={}){
  return {id,setup,setupId:setup,direction,stopModel,ftfcAlignment,priceBucket,observationPhase,resolution,evidenceEligible:eligible,sequenceAmbiguous:resolution==="AMBIGUOUS"};
}

const rows=[
  e("1"),e("2"),e("3",{resolution:"LOSS"}),e("4",{resolution:"AMBIGUOUS"}),
  e("5",{priceBucket:"MID"}),e("6",{priceBucket:"MID",resolution:"LOSS"}),
  e("7",{direction:"BEARISH",ftfcAlignment:"FULL_BEARISH"}),
  e("8",{eligible:false})
];

t("summary excludes ambiguous from resolved denominator",()=>{
  const s=audit.summarize(rows.slice(0,4),{minResolved:3});
  assert.equal(s.sampleSize,4);assert.equal(s.resolvedSampleSize,3);assert.equal(s.wins,2);assert.equal(s.losses,1);assert.equal(s.ambiguous,1);assert.equal(s.status,"AVAILABLE");
});

t("grouping ignores ineligible research probes",()=>{
  const g=audit.groupCohorts(rows,["setup","direction","stopModel"],{minResolved:1});
  assert.equal(g.reduce((sum,row)=>sum+row.sampleSize,0),7);
});

t("additional conditions split comparable cohorts",()=>{
  const base=audit.groupCohorts(rows,["setup","direction","stopModel"],{minResolved:1});
  const exact=audit.groupCohorts(rows,["setup","direction","stopModel","ftfcAlignment","priceBucket","observationPhase"],{minResolved:1});
  assert.ok(exact.length>base.length);
});

t("audit exposes four controlled comparison levels",()=>{
  const x=audit.buildCohortAudit(rows,{minResolved:3});
  assert.ok(Array.isArray(x.levels.setupBaseline));
  assert.ok(Array.isArray(x.levels.ftfc));
  assert.ok(Array.isArray(x.levels.ftfcPrice));
  assert.ok(Array.isArray(x.levels.exactCheckpoint));
});

console.log("\n"+pass+"/"+pass+" PASS historical cohort audit validation");
