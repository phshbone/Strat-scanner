"use strict";

function upper(v){return String(v||"").toUpperCase();}
function evidenceByLabel(context,label){return context?.evidence?.find?.(e=>e.label===label)||null;}

function contextFingerprint({setupContext=null,practiceTrade=null,carrier=null,exhaustion=null}={}){
  const advisory=setupContext?.advisory?.state||null;
  const tradeState=practiceTrade?.state||null;
  const rr=setupContext?.rrGate?.status||null;
  const ftfc=evidenceByLabel(setupContext,"FTFC");
  const index=evidenceByLabel(setupContext,"BREADTH");
  const sector=evidenceByLabel(setupContext,"SECTOR_BREADTH");
  return JSON.stringify({
    advisory,
    tradeState,
    rr,
    ftfcStatus:ftfc?.status||null,
    ftfcValue:ftfc?.value||null,
    indexStatus:index?.status||null,
    indexValue:index?.value||null,
    sectorStatus:sector?.status||null,
    sectorValue:sector?.value||null,
    carrier:carrier?.overall||carrier?.state||null,
    priceExhaustion:exhaustion?.price||exhaustion?.priceState||null,
    timeExhaustion:exhaustion?.time||exhaustion?.timeState||null
  });
}

function changed(previous,current){
  return contextFingerprint(previous)!==contextFingerprint(current);
}

function makeGuidance({code,severity="INFO",title,message,why=[],observedAt=null}={}){
  return {emit:true,code,severity,title,message,why,observedAt,brokerAuthority:false,aiAuthority:false};
}

function deriveTradeCoachGuidance({
  setupContext=null,
  previousSetupContext=null,
  practiceTrade=null,
  previousPracticeTrade=null,
  carrier=null,
  previousCarrier=null,
  exhaustion=null,
  previousExhaustion=null,
  observedAt=null,
  forceInitial=false
}={}){
  const current={setupContext,practiceTrade,carrier,exhaustion};
  const previous={setupContext:previousSetupContext,practiceTrade:previousPracticeTrade,carrier:previousCarrier,exhaustion:previousExhaustion};

  const hasPrevious=previousSetupContext||previousPracticeTrade||previousCarrier||previousExhaustion;
  if(!forceInitial && hasPrevious && !changed(previous,current)){
    return {emit:false,code:"NO_MEANINGFUL_STATE_CHANGE",observedAt};
  }

  const state=upper(practiceTrade?.state);
  const prevState=upper(previousPracticeTrade?.state);
  const why=Array.isArray(setupContext?.why)?setupContext.why:[];

  if(state==="AMBIGUOUS" && prevState!=="AMBIGUOUS"){
    return makeGuidance({code:"TRADE_AMBIGUOUS",severity:"HIGH",title:"Path ambiguous",message:"The observed bar crossed execution levels without enough intrabar evidence to establish order. Do not treat the outcome as a proven win or loss.",why,observedAt});
  }
  if(state==="STOPPED" && prevState!=="STOPPED"){
    return makeGuidance({code:"PRACTICE_STOP_REACHED",severity:"HIGH",title:"Practice stop reached",message:"The explicit practice stop was reached. The trade is terminal in Practice Mode.",why,observedAt});
  }
  if(state==="TARGET_HIT" && prevState!=="TARGET_HIT"){
    return makeGuidance({code:"PRACTICE_TARGET_REACHED",severity:"POSITIVE",title:"Target reached",message:"The current practice target was reached. Record the result and evaluate any separately defined runner or next-objective rule.",why,observedAt});
  }
  if(state==="OPEN" && prevState!=="OPEN"){
    return makeGuidance({code:"PRACTICE_ENTRY_TRIGGERED",severity:"INFO",title:"Practice trade in force",message:"The deterministic entry trigger has been crossed and the practice trade is now open.",why,observedAt});
  }

  const carrierOverall=upper(carrier?.overall||carrier?.state);
  const prevCarrier=upper(previousCarrier?.overall||previousCarrier?.state);
  if(carrierOverall==="REVERSAL_AGAINST" && prevCarrier!=="REVERSAL_AGAINST"){
    return makeGuidance({code:"OPPOSING_REVERSAL_IN_FORCE",severity:"HIGH",title:"Opposing reversal in force",message:"A lower-timeframe reversal is now in force against the active carrier. Review the explicit management rule; this does not automatically invalidate the higher-timeframe carrier.",why,observedAt});
  }
  if(carrierOverall==="CHANGED" && prevCarrier!=="CHANGED"){
    return makeGuidance({code:"HIGHER_TIMEFRAME_CHANGED",severity:"HIGH",title:"Higher timeframe changed",message:"The higher-timeframe carrier state changed. Re-evaluate the current thesis and management plan.",why,observedAt});
  }
  if(carrierOverall==="CAUTION" && prevCarrier!=="CAUTION"){
    return makeGuidance({code:"CARRIER_CAUTION",severity:"CAUTION",title:"Carrier support weakened",message:"Lower-timeframe evidence has moved into a caution state relative to the active carrier.",why,observedAt});
  }

  const ftfc=evidenceByLabel(setupContext,"FTFC");
  const prevFtfc=evidenceByLabel(previousSetupContext,"FTFC");
  if(ftfc?.status==="OPPOSED" && prevFtfc?.status!=="OPPOSED"){
    return makeGuidance({code:"FTFC_OPPOSED",severity:"CAUTION",title:"Timeframe continuity deteriorated",message:"FTFC is now opposed to the setup direction. This is supporting evidence, not standalone invalidation.",why,observedAt});
  }
  if(ftfc?.status==="ALIGNED" && prevFtfc?.status!=="ALIGNED"){
    return makeGuidance({code:"FTFC_ALIGNED",severity:"POSITIVE",title:"Timeframe continuity aligned",message:"FTFC has moved into alignment with the setup direction.",why,observedAt});
  }

  const index=evidenceByLabel(setupContext,"BREADTH");
  const prevIndex=evidenceByLabel(previousSetupContext,"BREADTH");
  if(index?.status==="OPPOSED" && prevIndex?.status!=="OPPOSED"){
    return makeGuidance({code:"INDEX_BREADTH_OPPOSED",severity:"CAUTION",title:"Market participation turned against setup",message:"Index-level participation is now opposed to the setup direction. Breadth remains context, not a setup invalidation rule.",why,observedAt});
  }
  if(index?.status==="ALIGNED" && prevIndex?.status!=="ALIGNED"){
    return makeGuidance({code:"INDEX_BREADTH_ALIGNED",severity:"POSITIVE",title:"Market participation aligned",message:"Index-level participation has moved into alignment with the setup direction.",why,observedAt});
  }

  const rr=setupContext?.rrGate?.status;
  const prevRr=previousSetupContext?.rrGate?.status;
  if(rr==="FAIL" && prevRr!=="FAIL"){
    return makeGuidance({code:"RISK_REWARD_BELOW_GATE",severity:"CAUTION",title:"Structural R:R below gate",message:"The current trigger, stop, and target geometry no longer meets the selected minimum reward-to-risk gate.",why,observedAt});
  }

  const advisory=upper(setupContext?.advisory?.state);
  const prevAdvisory=upper(previousSetupContext?.advisory?.state);
  if(advisory==="WAIT_NO_ACTIONABLE_SETUP" && prevAdvisory!=="WAIT_NO_ACTIONABLE_SETUP"){
    return makeGuidance({code:"WAIT_NO_ACTIONABLE_SETUP",severity:"INFO",title:"Wait",message:"No deterministic actionable setup is currently present. Supporting context must not manufacture a trade.",why,observedAt});
  }
  if(advisory==="WATCH_ACTIONABLE_SETUP" && prevAdvisory!=="WATCH_ACTIONABLE_SETUP"){
    return makeGuidance({code:"WATCH_ACTIONABLE_SETUP",severity:"INFO",title:"Actionable setup present",message:"A deterministic setup is present. Evaluate the explicit entry, stop, target, and supporting evidence before arming Practice Mode.",why,observedAt});
  }

  if(!hasPrevious && forceInitial){
    return makeGuidance({code:"INITIAL_CONTEXT",severity:"INFO",title:"Current setup context",message:"Initial deterministic context captured. Future guidance will emit only on meaningful state changes.",why,observedAt});
  }

  return {emit:false,code:"STATE_CHANGE_NOT_GUIDANCE_WORTHY",observedAt};
}

if(typeof module!=="undefined") module.exports={contextFingerprint,changed,deriveTradeCoachGuidance};
