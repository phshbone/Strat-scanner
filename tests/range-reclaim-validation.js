"use strict";

const assert=require("assert");
const {
  normalizeRange,
  deriveReclaimFromRange,
  reclaimEntered,
  reclaimTargetHit,
  reclaimFailed,
  buildRangeReclaimState,
  buildReclaimStack
}=require("../range-reclaim");

let pass=0, fail=0;
function test(name,fn){
  try{ fn(); pass++; }
  catch(err){ fail++; console.error(`FAIL ${name}: ${err.message}`); }
}

const verified={id:"W-3-001",high:110,low:90,timeframe:"W",sourceType:"OUTSIDE_BAR",source:"ROB/JERMAINE",verified:true};
const unverified={id:"D-X",high:55,low:50,timeframe:"D",verified:false};

test("normalizes valid range",()=>assert.deepStrictEqual(normalizeRange(verified).high,110));
test("rejects inverted range",()=>assert.strictEqual(normalizeRange({high:90,low:110,verified:true}),null));
test("bullish reclaim enters through low boundary",()=>assert.strictEqual(deriveReclaimFromRange({range:verified,direction:"BULLISH"}).reclaimPrice,90));
test("bullish reclaim targets high boundary",()=>assert.strictEqual(deriveReclaimFromRange({range:verified,direction:"BULLISH"}).oppositeBoundary,110));
test("bearish reclaim enters through high boundary",()=>assert.strictEqual(deriveReclaimFromRange({range:verified,direction:"BEARISH"}).reclaimPrice,110));
test("bearish reclaim targets low boundary",()=>assert.strictEqual(deriveReclaimFromRange({range:verified,direction:"BEARISH"}).oppositeBoundary,90));
test("unverified range does not generate reclaim",()=>assert.strictEqual(deriveReclaimFromRange({range:unverified,direction:"BULLISH"}),null));
test("bullish equality is not yet re-entry",()=>assert.strictEqual(reclaimEntered({direction:"BULLISH",currentPrice:90,reclaimPrice:90}),false));
test("bearish equality is not yet re-entry",()=>assert.strictEqual(reclaimEntered({direction:"BEARISH",currentPrice:110,reclaimPrice:110}),false));
test("bullish target equality completes",()=>assert.strictEqual(reclaimTargetHit({direction:"BULLISH",currentPrice:110,oppositeBoundary:110}),true));
test("bearish target equality completes",()=>assert.strictEqual(reclaimTargetHit({direction:"BEARISH",currentPrice:90,oppositeBoundary:90}),true));
test("bullish reclaimed range fails back at boundary",()=>assert.strictEqual(reclaimFailed({direction:"BULLISH",currentPrice:90,reclaimPrice:90,wasReclaimed:true}),true));
test("bearish reclaimed range fails back at boundary",()=>assert.strictEqual(reclaimFailed({direction:"BEARISH",currentPrice:110,reclaimPrice:110,wasReclaimed:true}),true));
test("bullish below range is pending",()=>assert.strictEqual(buildRangeReclaimState({range:verified,direction:"BULLISH",currentPrice:88}).state,"RANGE_RECLAIM_PENDING"));
test("bullish inside range is traversing",()=>assert.strictEqual(buildRangeReclaimState({range:verified,direction:"BULLISH",currentPrice:100}).state,"TRAVERSING_RECLAIMED_RANGE"));
test("bullish at high is target hit",()=>assert.strictEqual(buildRangeReclaimState({range:verified,direction:"BULLISH",currentPrice:110}).state,"RECLAIM_RANGE_TARGET_HIT"));
test("bearish above range is pending",()=>assert.strictEqual(buildRangeReclaimState({range:verified,direction:"BEARISH",currentPrice:112}).state,"RANGE_RECLAIM_PENDING"));
test("bearish inside range is traversing",()=>assert.strictEqual(buildRangeReclaimState({range:verified,direction:"BEARISH",currentPrice:100}).state,"TRAVERSING_RECLAIMED_RANGE"));
test("bearish at low is target hit",()=>assert.strictEqual(buildRangeReclaimState({range:verified,direction:"BEARISH",currentPrice:90}).state,"RECLAIM_RANGE_TARGET_HIT"));
test("failed prior bullish reclaim loses objective",()=>{
  const s=buildRangeReclaimState({range:verified,direction:"BULLISH",currentPrice:89,wasReclaimed:true});
  assert.strictEqual(s.state,"RECLAIM_RANGE_FAILED");
  assert.strictEqual(s.objective,null);
});
test("active reclaimed range emits opposite-boundary objective",()=>{
  const s=buildRangeReclaimState({range:verified,direction:"BULLISH",currentPrice:95});
  assert.strictEqual(s.objective.price,110);
  assert.strictEqual(s.objective.sourceRangeId,"W-3-001");
});
test("stack ignores invalid ranges and preserves verified objectives",()=>{
  const ranges=[verified,{id:"D-3",high:105,low:95,timeframe:"D",verified:true},{high:1,low:2,verified:true},unverified];
  const s=buildReclaimStack({ranges,direction:"BULLISH",currentPrice:100});
  assert.strictEqual(s.states.length,3);
  assert.strictEqual(s.activeObjectives.length,2);
  assert.strictEqual(s.nextObjective.price,105);
});
test("stack orders bearish objectives by price path",()=>{
  const ranges=[verified,{id:"D-3",high:105,low:95,timeframe:"D",verified:true}];
  const s=buildReclaimStack({ranges,direction:"BEARISH",currentPrice:100});
  assert.strictEqual(s.nextObjective.price,95);
});
test("target hit marks objective consumed",()=>{
  const s=buildRangeReclaimState({range:verified,direction:"BULLISH",currentPrice:111});
  assert.strictEqual(s.objective.consumed,true);
});

console.log(JSON.stringify({pass,fail},null,2));
if(fail) process.exit(1);
