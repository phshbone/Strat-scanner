"use strict";

const assert=require("assert");
const {buildScannerCard,rankScannerCards}=require("../scanner-card.js");

let pass=0;
function t(name,fn){fn();pass+=1;console.log(`PASS ${pass}: ${name}`);}

const signal={symbol:"spy",timeframe:"15",direction:"BULLISH",setupId:"2-1-2U",trigger:101,magnitude:106,actionable:true};
const card=buildScannerCard({
  symbol:"spy",
  timeframe:"15",
  signals:[signal],
  primarySignal:signal,
  ftfc:{alignment:"FULL_BULLISH"},
  indexBreadth:{context:"BULLISH_MAJORITY"},
  sectorBreadth:{context:"BULLISH_MAJORITY"},
  entry:101,
  stop:99,
  target:106,
  historicalEvidence:{sampleSize:120,successRate:68.3,successDefinition:"T1 before invalidation",window:"90d",source:"RESEARCH"},
  observedAt:"2026-08-20T21:00:00Z"
});

t("symbol normalized",()=>assert.equal(card.symbol,"SPY"));
t("timeframe retained",()=>assert.equal(card.timeframe,"15"));
t("setup retained",()=>assert.equal(card.setup,"2-1-2U"));
t("explicit primary status retained",()=>assert.equal(card.primarySignalStatus,"EXPLICIT"));
t("actionable state present",()=>assert.equal(card.advisoryState,"WATCH_ACTIONABLE_SETUP"));
t("actionable true",()=>assert.equal(card.actionable,true));
t("rr computed",()=>assert.equal(card.rewardRisk,2.5));
t("rr passes gate",()=>assert.equal(card.rewardRiskStatus,"PASS"));
t("ftfc aligned",()=>assert.equal(card.ftfc.status,"ALIGNED"));
t("index breadth aligned",()=>assert.equal(card.breadth.index.status,"ALIGNED"));
t("sector breadth aligned",()=>assert.equal(card.breadth.sector.status,"ALIGNED"));
t("historical sample retained",()=>assert.equal(card.historicalEvidence.sampleSize,120));
t("historical evidence remains descriptive",()=>assert.equal(card.probabilityScore,null));
t("no broker authority",()=>assert.equal(card.brokerAuthority,false));
t("why list is present",()=>assert.ok(Array.isArray(card.why)&&card.why.length>0));

const waitCard=buildScannerCard({symbol:"IWM",timeframe:"D",signals:[],ftfc:{alignment:"FULL_BULLISH"},indexBreadth:{context:"BULLISH_MAJORITY"}});
t("context cannot manufacture setup",()=>assert.equal(waitCard.advisoryState,"WAIT_NO_ACTIONABLE_SETUP"));
t("wait card is not actionable",()=>assert.equal(waitCard.actionable,false));
t("wait card can still show supporting ftfc",()=>assert.equal(waitCard.ftfc.alignment,"FULL_BULLISH"));

const ambiguousCard=buildScannerCard({
  symbol:"SPY",timeframe:"15",
  signals:[
    {symbol:"SPY",timeframe:"15",direction:"BULLISH",setupId:"2-1-2U",trigger:101,actionable:true},
    {symbol:"SPY",timeframe:"15",direction:"BEARISH",setupId:"2-2D",trigger:99,actionable:true}
  ],
  ftfc:{alignment:"MIXED"}
});
t("multiple signals expose ambiguous primary",()=>assert.equal(ambiguousCard.primarySignalStatus,"AMBIGUOUS"));
t("ambiguous primary is not marked actionable",()=>assert.equal(ambiguousCard.actionable,false));
t("ambiguous primary does not borrow first setup",()=>assert.equal(ambiguousCard.setup,null));
t("ambiguous primary does not borrow first trigger",()=>assert.equal(ambiguousCard.trigger,null));

const practiceContext={
  advisory:{state:"ACTIVE_TRADE_CONTEXT"},direction:"BULLISH",signal:{symbol:"QQQ",timeframe:"15",direction:"BULLISH",setupId:"2-2U",trigger:400},primarySignalResolution:{status:"PRACTICE_CONTEXT",candidateCount:0},rrGate:{status:"PASS",rr:3},
  evidence:[{label:"FTFC",status:"ALIGNED",value:"FULL_BULLISH"},{label:"BREADTH",status:"MIXED_OR_UNKNOWN",value:"MIXED"},{label:"SECTOR_BREADTH",status:"ALIGNED",value:"BULLISH_MAJORITY"},{label:"HISTORICAL_EVIDENCE",status:"NOT_AVAILABLE",value:null}],
  why:[{label:"FTFC",status:"ALIGNED",value:"FULL_BULLISH"}],probabilityScore:null
};
const practiceCard=buildScannerCard({symbol:"QQQ",timeframe:"15",practiceTrade:{symbol:"QQQ",timeframe:"15",direction:"BULL",setupType:"2-2U",triggerPrice:400,stopPrice:396,targetPrice:412,context:{setupContext:practiceContext}}});
t("practice card reuses existing setupContext",()=>assert.equal(practiceCard.setupContext,practiceContext));
t("practice state retained",()=>assert.equal(practiceCard.advisoryState,"ACTIVE_TRADE_CONTEXT"));
t("practice context primary status retained",()=>assert.equal(practiceCard.primarySignalStatus,"PRACTICE_CONTEXT"));

const ranked=rankScannerCards([
  {...waitCard,symbol:"ZZZ"},
  {...card,symbol:"AAA",rewardRisk:2.5,rewardRiskStatus:"PASS"},
  {...practiceCard,symbol:"BBB"}
]);
t("active trade context ranks first",()=>assert.equal(ranked[0].symbol,"BBB"));
t("actionable setup ranks ahead of wait",()=>assert.equal(ranked[1].symbol,"AAA"));

console.log(`\n${pass}/${pass} PASS scanner card validation`);
