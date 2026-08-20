"use strict";

const {setupToPracticeTrade}=require("../practice-setup-adapter.js");
let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}
function throws(name,fn){let ok=false; try{fn();}catch(e){ok=true;} t(name,ok,true);}

const bullSetup={name:"2-1-2U",direction:"BULLISH",trigger:101,magnitude:106,timeframe:"15"};
const bull=setupToPracticeTrade(bullSetup,{symbol:"SPY",stopPrice:98.5,stopSource:"INSIDE_BAR_LOW",createdAt:"2026-08-20T14:00:00Z"});
t("bull state armed",bull.state,"ARMED");
t("bull direction normalized",bull.direction,"BULL");
t("bull trigger preserved",bull.triggerPrice,101);
t("bull setup magnitude becomes target",bull.targetPrice,106);
t("bull target source retained",bull.context.targetSource,"SETUP");
t("bull stop source explicit",bull.context.stopSource,"INSIDE_BAR_LOW");
t("practice only flag",bull.context.practiceOnly,true);
t("no broker authority",bull.context.brokerAuthority,false);

const bearSetup={name:"2-2D",direction:"BEARISH",trigger:200,magnitude:190,timeframe:"30"};
const bear=setupToPracticeTrade(bearSetup,{symbol:"QQQ",stopPrice:204,stopSource:"REFERENCE_HIGH",targetPrice:192,targetSource:"TEST_OVERRIDE"});
t("bear direction normalized",bear.direction,"BEAR");
t("explicit target overrides magnitude",bear.targetPrice,192);
t("explicit target source retained",bear.context.targetSource,"TEST_OVERRIDE");

const borrowed={name:"3-2D",direction:"BEARISH",trigger:50,magnitude:null,timeframe:"15"};
const borrowedTrade=setupToPracticeTrade(borrowed,{symbol:"IWM",stopPrice:53,stopSource:"REFERENCE_HIGH",signalOptions:{borrowedMagnitude:44,borrowedMagnitudeTimeframe:"D"}});
t("borrowed magnitude target",borrowedTrade.targetPrice,44);
t("borrowed target source",borrowedTrade.context.targetSource,"BORROWED_MAGNITUDE");

throws("missing stop rejected",()=>setupToPracticeTrade(bullSetup,{symbol:"SPY",stopSource:"X"}));
throws("missing stop source rejected",()=>setupToPracticeTrade(bullSetup,{symbol:"SPY",stopPrice:98}));
throws("missing target rejected when no magnitude",()=>setupToPracticeTrade({name:"NO_MAG",direction:"BULLISH",trigger:10,timeframe:"15"},{symbol:"AAPL",stopPrice:9,stopSource:"REFERENCE_LOW"}));
throws("non-directional setup rejected",()=>setupToPracticeTrade({name:"1",direction:null,trigger:10,timeframe:"15"},{symbol:"AAPL",stopPrice:9,stopSource:"REFERENCE_LOW",targetPrice:12}));
throws("invalid geometry still rejected",()=>setupToPracticeTrade(bullSetup,{symbol:"SPY",stopPrice:102,stopSource:"BAD"}));

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
