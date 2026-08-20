"use strict";

const assert=require("assert");
const {contextFingerprint,changed,deriveTradeCoachGuidance}=require("../trade-coach.js");

let pass=0;
function t(name,fn){fn();pass+=1;console.log(`PASS ${pass}: ${name}`);}

const alignedContext={
  advisory:{state:"WATCH_ACTIONABLE_SETUP"},
  rrGate:{status:"PASS",rr:2.5},
  evidence:[
    {label:"FTFC",status:"ALIGNED",value:"FULL_BULLISH"},
    {label:"BREADTH",status:"ALIGNED",value:"BULLISH_MAJORITY"},
    {label:"SECTOR_BREADTH",status:"ALIGNED",value:"BULLISH_MAJORITY"}
  ],
  why:[{label:"FTFC",status:"ALIGNED",value:"FULL_BULLISH"}]
};

const opposedFtfc={...alignedContext,evidence:[
  {label:"FTFC",status:"OPPOSED",value:"BEARISH_MAJORITY"},
  {label:"BREADTH",status:"ALIGNED",value:"BULLISH_MAJORITY"},
  {label:"SECTOR_BREADTH",status:"ALIGNED",value:"BULLISH_MAJORITY"}
]};

const opposedBreadth={...alignedContext,evidence:[
  {label:"FTFC",status:"ALIGNED",value:"FULL_BULLISH"},
  {label:"BREADTH",status:"OPPOSED",value:"BEARISH_MAJORITY"},
  {label:"SECTOR_BREADTH",status:"ALIGNED",value:"BULLISH_MAJORITY"}
]};

const waitContext={...alignedContext,advisory:{state:"WAIT_NO_ACTIONABLE_SETUP"}};
const failRR={...alignedContext,rrGate:{status:"FAIL",rr:1.4}};

const armed={state:"ARMED",symbol:"SPY"};
const open={state:"OPEN",symbol:"SPY"};
const stopped={state:"STOPPED",symbol:"SPY"};
const target={state:"TARGET_HIT",symbol:"SPY"};
const ambiguous={state:"AMBIGUOUS",symbol:"SPY"};

t("fingerprint stable for identical state",()=>assert.equal(contextFingerprint({setupContext:alignedContext,practiceTrade:armed}),contextFingerprint({setupContext:alignedContext,practiceTrade:armed})));
t("changed false for identical state",()=>assert.equal(changed({setupContext:alignedContext,practiceTrade:armed},{setupContext:alignedContext,practiceTrade:armed}),false));
t("changed true for FTFC transition",()=>assert.equal(changed({setupContext:alignedContext},{setupContext:opposedFtfc}),true));

t("no repeated guidance without meaningful change",()=>{
  const g=deriveTradeCoachGuidance({setupContext:alignedContext,previousSetupContext:alignedContext,practiceTrade:armed,previousPracticeTrade:armed});
  assert.equal(g.emit,false); assert.equal(g.code,"NO_MEANINGFUL_STATE_CHANGE");
});

t("entry transition emits",()=>{
  const g=deriveTradeCoachGuidance({setupContext:alignedContext,previousSetupContext:alignedContext,practiceTrade:open,previousPracticeTrade:armed});
  assert.equal(g.emit,true); assert.equal(g.code,"PRACTICE_ENTRY_TRIGGERED");
});

t("target transition emits",()=>{
  const g=deriveTradeCoachGuidance({setupContext:alignedContext,previousSetupContext:alignedContext,practiceTrade:target,previousPracticeTrade:open});
  assert.equal(g.code,"PRACTICE_TARGET_REACHED");
});

t("stop transition emits",()=>{
  const g=deriveTradeCoachGuidance({setupContext:alignedContext,previousSetupContext:alignedContext,practiceTrade:stopped,previousPracticeTrade:open});
  assert.equal(g.code,"PRACTICE_STOP_REACHED");
});

t("ambiguous path transition emits high severity",()=>{
  const g=deriveTradeCoachGuidance({setupContext:alignedContext,previousSetupContext:alignedContext,practiceTrade:ambiguous,previousPracticeTrade:open});
  assert.equal(g.code,"TRADE_AMBIGUOUS"); assert.equal(g.severity,"HIGH");
});

t("carrier opposing reversal emits",()=>{
  const g=deriveTradeCoachGuidance({setupContext:alignedContext,previousSetupContext:alignedContext,carrier:{overall:"REVERSAL_AGAINST"},previousCarrier:{overall:"STABLE"}});
  assert.equal(g.code,"OPPOSING_REVERSAL_IN_FORCE");
});

t("carrier caution emits",()=>{
  const g=deriveTradeCoachGuidance({setupContext:alignedContext,previousSetupContext:alignedContext,carrier:{overall:"CAUTION"},previousCarrier:{overall:"CONFIRMED"}});
  assert.equal(g.code,"CARRIER_CAUTION");
});

t("FTFC deterioration emits caution",()=>{
  const g=deriveTradeCoachGuidance({setupContext:opposedFtfc,previousSetupContext:alignedContext});
  assert.equal(g.code,"FTFC_OPPOSED"); assert.equal(g.severity,"CAUTION");
});

t("breadth deterioration emits caution",()=>{
  const g=deriveTradeCoachGuidance({setupContext:opposedBreadth,previousSetupContext:alignedContext});
  assert.equal(g.code,"INDEX_BREADTH_OPPOSED");
});

t("R:R gate failure emits",()=>{
  const g=deriveTradeCoachGuidance({setupContext:failRR,previousSetupContext:alignedContext});
  assert.equal(g.code,"RISK_REWARD_BELOW_GATE");
});

t("wait transition emits",()=>{
  const g=deriveTradeCoachGuidance({setupContext:waitContext,previousSetupContext:alignedContext});
  assert.equal(g.code,"WAIT_NO_ACTIONABLE_SETUP");
});

t("watch transition emits",()=>{
  const g=deriveTradeCoachGuidance({setupContext:alignedContext,previousSetupContext:waitContext});
  assert.equal(g.code,"WATCH_ACTIONABLE_SETUP");
});

t("guidance carries why evidence",()=>{
  const g=deriveTradeCoachGuidance({setupContext:opposedFtfc,previousSetupContext:alignedContext});
  assert.ok(Array.isArray(g.why)); assert.ok(g.why.length>0);
});

t("guidance has no broker authority",()=>{
  const g=deriveTradeCoachGuidance({setupContext:failRR,previousSetupContext:alignedContext});
  assert.equal(g.brokerAuthority,false); assert.equal(g.aiAuthority,false);
});

t("initial context can be explicitly emitted once",()=>{
  const g=deriveTradeCoachGuidance({setupContext:alignedContext,forceInitial:true});
  assert.equal(g.emit,true); assert.equal(g.code,"INITIAL_CONTEXT");
});

console.log(`\n${pass}/${pass} PASS trade coach validation`);
