"use strict";

const ADVISORY=Object.freeze({
  WAIT_NO_ACTIONABLE_SETUP:"WAIT_NO_ACTIONABLE_SETUP",
  WATCH_ACTIONABLE_SETUP:"WATCH_ACTIONABLE_SETUP",
  ACTIVE_TRADE_CONTEXT:"ACTIVE_TRADE_CONTEXT"
});

function hasActionableSignal(signals=[]){
  return (Array.isArray(signals)?signals:[]).some(signal=>{
    if(!signal || typeof signal!=="object") return false;
    if(signal.invalidated===true || signal.expired===true) return false;
    if(signal.actionable===true) return true;
    return ["ARMED","TRIGGERED","IN_FORCE","ACTIVE"].includes(String(signal.state||"").toUpperCase());
  });
}

function deriveAdvisoryState({signals=[],practiceTrade=null,carrier=null,breadth=null}={}){
  if(practiceTrade && ["OPEN","ARMED"].includes(String(practiceTrade.state||"").toUpperCase())){
    return {
      state:ADVISORY.ACTIVE_TRADE_CONTEXT,
      action:"MANAGE_EXISTING_CONTEXT",
      reason:"A practice trade is already armed or open; do not manufacture a new setup.",
      supporting:{carrier:carrier||null,breadth:breadth||null}
    };
  }

  if(hasActionableSignal(signals)){
    return {
      state:ADVISORY.WATCH_ACTIONABLE_SETUP,
      action:"EVALUATE_EXISTING_SETUP",
      reason:"At least one deterministic actionable signal is present.",
      supporting:{carrier:carrier||null,breadth:breadth||null}
    };
  }

  return {
    state:ADVISORY.WAIT_NO_ACTIONABLE_SETUP,
    action:"WAIT",
    reason:"No deterministic actionable setup is currently present.",
    supporting:{carrier:carrier||null,breadth:breadth||null}
  };
}

if(typeof module!=="undefined") module.exports={ADVISORY,hasActionableSignal,deriveAdvisoryState};
