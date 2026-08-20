"use strict";

const assert=require("assert");
const {ADVISORY,hasActionableSignal,deriveAdvisoryState}=require("../advisory-state.js");

let passed=0;
function test(name,fn){ fn(); passed+=1; console.log(`PASS ${passed}: ${name}`); }

test("no signals means wait",()=>{
  const out=deriveAdvisoryState();
  assert.equal(out.state,ADVISORY.WAIT_NO_ACTIONABLE_SETUP);
  assert.equal(out.action,"WAIT");
});

test("non-actionable signal still means wait",()=>{
  const out=deriveAdvisoryState({signals:[{state:"FORMING",actionable:false}]});
  assert.equal(out.state,ADVISORY.WAIT_NO_ACTIONABLE_SETUP);
});

test("explicit actionable signal is detected",()=>assert.equal(hasActionableSignal([{actionable:true}]),true));
test("armed signal is detected",()=>assert.equal(hasActionableSignal([{state:"ARMED"}]),true));
test("triggered signal is detected",()=>assert.equal(hasActionableSignal([{state:"TRIGGERED"}]),true));
test("invalidated signal is ignored",()=>assert.equal(hasActionableSignal([{state:"ARMED",invalidated:true}]),false));
test("expired signal is ignored",()=>assert.equal(hasActionableSignal([{actionable:true,expired:true}]),false));

test("actionable signal yields watch state",()=>{
  const out=deriveAdvisoryState({signals:[{state:"ARMED"}]});
  assert.equal(out.state,ADVISORY.WATCH_ACTIONABLE_SETUP);
  assert.equal(out.action,"EVALUATE_EXISTING_SETUP");
});

test("armed practice trade takes precedence",()=>{
  const out=deriveAdvisoryState({signals:[{state:"ARMED"}],practiceTrade:{state:"ARMED"}});
  assert.equal(out.state,ADVISORY.ACTIVE_TRADE_CONTEXT);
});

test("open practice trade takes precedence",()=>{
  const out=deriveAdvisoryState({signals:[],practiceTrade:{state:"OPEN"}});
  assert.equal(out.state,ADVISORY.ACTIVE_TRADE_CONTEXT);
});

test("closed practice trade does not suppress wait",()=>{
  const out=deriveAdvisoryState({signals:[],practiceTrade:{state:"STOPPED"}});
  assert.equal(out.state,ADVISORY.WAIT_NO_ACTIONABLE_SETUP);
});

test("breadth can support but cannot create a setup",()=>{
  const breadth={context:"BULLISH_MAJORITY",participation:{bullish:{pct:82}}};
  const out=deriveAdvisoryState({signals:[],breadth});
  assert.equal(out.state,ADVISORY.WAIT_NO_ACTIONABLE_SETUP);
  assert.deepEqual(out.supporting.breadth,breadth);
});

test("carrier context can support but cannot create a setup",()=>{
  const carrier={direction:"BULLISH",timeframe:"W",inForce:true};
  const out=deriveAdvisoryState({signals:[],carrier});
  assert.equal(out.state,ADVISORY.WAIT_NO_ACTIONABLE_SETUP);
  assert.deepEqual(out.supporting.carrier,carrier);
});

test("supporting context is preserved on actionable state",()=>{
  const carrier={direction:"BULLISH"};
  const breadth={context:"MIXED"};
  const out=deriveAdvisoryState({signals:[{actionable:true}],carrier,breadth});
  assert.deepEqual(out.supporting,{carrier,breadth});
});

console.log(`\n${passed}/${passed} PASS advisory state validation`);
