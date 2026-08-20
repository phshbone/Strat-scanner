"use strict";

const assert=require("assert");
const {
  STATES,
  normalizeState,
  normalizeObservation,
  buildBreadthSnapshot,
  compareBreadthSnapshots
}=require("../breadth-context.js");

let passed=0;
function test(name,fn){
  fn();
  passed+=1;
  console.log(`PASS ${passed}: ${name}`);
}

test("normalizes 2U",()=>assert.equal(normalizeState("2U"),STATES.TWO_UP));
test("normalizes bearish alias",()=>assert.equal(normalizeState("bearish"),STATES.TWO_DOWN));
test("normalizes inside to sideways",()=>assert.equal(normalizeState("inside"),STATES.SIDEWAYS));
test("does not guess unresolved outside direction",()=>assert.equal(normalizeState("3"),STATES.OUTSIDE_UNRESOLVED));
test("unknown values remain unknown",()=>assert.equal(normalizeState("mystery"),STATES.UNKNOWN));
test("observation requires symbol",()=>assert.equal(normalizeObservation({state:"2U"}),null));
test("symbol is normalized",()=>assert.equal(normalizeObservation({symbol:"spy",state:"2U"}).symbol,"SPY"));

test("empty snapshot reports no data",()=>{
  const s=buildBreadthSnapshot();
  assert.equal(s.totalTracked,0);
  assert.equal(s.context,"NO_DATA");
});

test("full denominator includes sideways names",()=>{
  const s=buildBreadthSnapshot({observations:[
    {symbol:"A",state:"2U"},{symbol:"B",state:"2U"},{symbol:"C",state:"1"},{symbol:"D",state:"2D"}
  ]});
  assert.equal(s.totalTracked,4);
  assert.equal(s.participation.bullish.pct,50);
  assert.equal(s.participation.sideways.pct,25);
  assert.equal(s.participation.bearish.pct,25);
});

test("failed down to resolved outside-up counts bullish",()=>{
  const s=buildBreadthSnapshot({observations:[{symbol:"A",state:"FAILED_2D_TO_3U"}]});
  assert.equal(s.participation.bullish.count,1);
});

test("failed up to resolved outside-down counts bearish",()=>{
  const s=buildBreadthSnapshot({observations:[{symbol:"A",state:"FAILED_2U_TO_3D"}]});
  assert.equal(s.participation.bearish.count,1);
});

test("unresolved outside is kept separate",()=>{
  const s=buildBreadthSnapshot({observations:[{symbol:"A",state:"3"}]});
  assert.equal(s.participation.unresolved.pct,100);
  assert.equal(s.dataComplete,false);
});

test("resolved observations can be complete",()=>{
  const s=buildBreadthSnapshot({observations:[{symbol:"A",state:"2U"},{symbol:"B",state:"1"}]});
  assert.equal(s.dataComplete,true);
});

test("duplicate symbol uses latest observation",()=>{
  const s=buildBreadthSnapshot({observations:[{symbol:"A",state:"2D"},{symbol:"A",state:"2U"}]});
  assert.equal(s.totalTracked,1);
  assert.equal(s.participation.bullish.pct,100);
});

test("bullish majority requires more than half of full universe",()=>{
  const s=buildBreadthSnapshot({observations:[{symbol:"A",state:"2U"},{symbol:"B",state:"2U"},{symbol:"C",state:"1"}]});
  assert.equal(s.context,"BULLISH_MAJORITY");
});

test("bearish majority requires more than half of full universe",()=>{
  const s=buildBreadthSnapshot({observations:[{symbol:"A",state:"2D"},{symbol:"B",state:"2D"},{symbol:"C",state:"1"}]});
  assert.equal(s.context,"BEARISH_MAJORITY");
});

test("50/50 directional split is mixed",()=>{
  const s=buildBreadthSnapshot({observations:[{symbol:"A",state:"2U"},{symbol:"B",state:"2D"}]});
  assert.equal(s.context,"MIXED");
  assert.equal(s.directionalSpreadPct,0);
});

test("directional spread uses bullish minus bearish participation",()=>{
  const s=buildBreadthSnapshot({observations:[{symbol:"A",state:"2U"},{symbol:"B",state:"2U"},{symbol:"C",state:"2D"},{symbol:"D",state:"1"}]});
  assert.equal(s.directionalSpreadPct,25);
});

test("snapshot preserves universe and timeframe labels",()=>{
  const s=buildBreadthSnapshot({universe:"S&P 500",timeframe:"D",observations:[]});
  assert.equal(s.universe,"S&P 500");
  assert.equal(s.timeframe,"D");
});

test("comparison reports participation deltas",()=>{
  const a=buildBreadthSnapshot({observations:[{symbol:"A",state:"2U"},{symbol:"B",state:"2D"}]});
  const b=buildBreadthSnapshot({observations:[{symbol:"A",state:"2U"},{symbol:"B",state:"2U"}]});
  const c=compareBreadthSnapshots(a,b);
  assert.equal(c.bullishDeltaPct,50);
  assert.equal(c.bearishDeltaPct,-50);
  assert.equal(c.spreadDeltaPct,100);
});

test("comparison reports context transitions",()=>{
  const a=buildBreadthSnapshot({observations:[{symbol:"A",state:"2D"},{symbol:"B",state:"2D"},{symbol:"C",state:"1"}]});
  const b=buildBreadthSnapshot({observations:[{symbol:"A",state:"2U"},{symbol:"B",state:"2U"},{symbol:"C",state:"1"}]});
  const c=compareBreadthSnapshots(a,b);
  assert.equal(c.contextChanged,true);
  assert.equal(c.from,"BEARISH_MAJORITY");
  assert.equal(c.to,"BULLISH_MAJORITY");
});

console.log(`\n${passed}/${passed} PASS breadth context validation`);
