"use strict";

const ui=require("../chart-workspace-ui.js");

let pass=0,fail=0;
function check(name,condition){if(condition){pass++;console.log(`PASS ${pass}: ${name}`);}else{fail++;console.error(`FAIL: ${name}`);}}

const card={
  symbol:"spy",
  timeframe:"15",
  setup:"2-2",
  direction:"BULLISH",
  price:645.12,
  observedAt:"2026-08-22T13:45:00.000Z",
  advisoryState:"WATCH_ACTIONABLE_SETUP",
  ftfc:{alignment:"FULL_BULLISH"},
  rewardRisk:null,
  probabilityScore:null,
  brokerAuthority:false
};

const normalized=ui.normalizeCandidateCard(card);
check("candidate symbol normalizes",normalized.symbol==="SPY");
check("candidate timeframe is retained",normalized.timeframe==="15");
check("candidate context remains reference price only",normalized.referencePrice===true&&normalized.brokerAuthority===false);
check("handoff does not invent probability",normalized.probabilityScore===null);
check("handoff explicitly says exact bars are not attached yet",normalized.exactBarsAttached===false&&normalized.dataStatus==="CARD_CONTEXT_ONLY");

const handoff=ui.buildHandoff(card);
check("handoff carries candidate setup",handoff.candidate.setup==="2-2"&&handoff.candidate.direction==="BULLISH");
check("initial workspace uses candidate timeframe",handoff.workspace.count===1&&handoff.workspace.timeframes.length===1&&handoff.workspace.timeframes[0]==="15");
check("workspace ordering contract is retained",handoff.workspace.order==="LOWEST_TO_HIGHEST");
check("workspace stays within four-chart cap",handoff.workspace.maxCharts===4);
check("handoff event name is stable",ui.EVENT_NAME==="strat:candidate-chart");

let missingSymbol=false;
try{ui.normalizeCandidateCard({timeframe:"15"});}catch(error){missingSymbol=/symbol required/.test(error.message);}
check("missing symbol is rejected",missingSymbol);

let missingTf=false;
try{ui.normalizeCandidateCard({symbol:"SPY"});}catch(error){missingTf=/timeframe required/.test(error.message);}
check("missing timeframe is rejected",missingTf);

console.log(JSON.stringify({pass,fail,failures:fail}));
if(fail) process.exit(1);
