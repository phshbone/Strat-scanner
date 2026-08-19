"use strict";

const {buildObjectivePipeline}=require("../objective-pipeline.js");

let pass=0,fail=0; const failures=[];
function t(name,actual,expected){
  const ok=JSON.stringify(actual)===JSON.stringify(expected);
  if(ok) pass++; else {fail++; failures.push({name,actual,expected});}
}

// SWING-STYLE STACK: setup can live inside Daily/Weekly/Monthly structures.
const swingRanges=[
  {id:"D1",timeframe:"D",high:110,low:95,lowTaken:true,active:true},
  {id:"W1",timeframe:"W",high:115,low:90,lowTaken:true,active:true},
  {id:"M1",timeframe:"M",high:120,low:80,lowTaken:false,active:true}
];

let state=buildObjectivePipeline({
  direction:"BULLISH",
  setupRange:{high:104,low:100},
  magnitude:105,
  originPrice:103,
  currentPrice:104.5,
  candidateRanges:swingRanges
});
t("swing magnitude remains first objective before hit",state.nextObjective,{type:"MAGNITUDE",price:105});
t("swing only engaged D/W ranges qualify",state.qualifiedTargets.map(x=>x.rangeId),["D1","W1"]);
t("unengaged monthly range is excluded",state.qualifiedTargets.some(x=>x.rangeId==="M1"),false);

state=buildObjectivePipeline({
  direction:"BULLISH",
  setupRange:{high:104,low:100},
  magnitude:105,
  originPrice:103,
  currentPrice:106,
  candidateRanges:swingRanges
});
t("after magnitude, daily target is next",{type:state.nextObjective.type,price:state.nextObjective.price},{type:"TARGET",price:110});
t("daily precedes weekly by price path",state.targetHierarchy.objectives.map(x=>x.price),[110,115]);
t("not exhausted while qualified targets remain",state.exhaustionRisk,false);

state=buildObjectivePipeline({
  direction:"BULLISH",
  setupRange:{high:104,low:100},
  magnitude:105,
  originPrice:103,
  currentPrice:111,
  candidateRanges:swingRanges
});
t("weekly target promotes after daily consumed",state.nextObjective.price,115);

state=buildObjectivePipeline({
  direction:"BULLISH",
  setupRange:{high:104,low:100},
  magnitude:105,
  originPrice:103,
  currentPrice:116,
  candidateRanges:swingRanges
});
t("swing structure exhausted after D/W cleared",state.exhaustionRisk,true);
t("unengaged monthly is not silently promoted after exhaustion",state.nextObjective,null);

// EXACT LEVEL AGREEMENT: multiple timeframes can support one objective.
state=buildObjectivePipeline({
  direction:"BULLISH",
  setupRange:{high:104,low:100},
  magnitude:105,
  originPrice:103,
  currentPrice:106,
  candidateRanges:[
    {id:"D2",timeframe:"D",high:110,low:95,lowTaken:true},
    {id:"W2",timeframe:"W",high:110,low:90,lowTaken:true}
  ]
});
t("exact D/W agreement becomes one objective",state.targetHierarchy.objectives.length,1);
t("exact agreement preserves both timeframes",state.targetHierarchy.objectives[0].supportingTimeframes,["D","W"]);
t("exact agreement still targets 110",state.nextObjective.price,110);

// INTRADAY / DAY-TRADING STACK: same engine, different timeframe set.
const intradayRanges=[
  {id:"30m",timeframe:"30m",high:106,low:98,highTaken:true,active:true},
  {id:"60m",timeframe:"60m",high:106,low:98,highTaken:true,active:true},
  {id:"D3",timeframe:"D",high:110,low:95,highTaken:true,active:true},
  {id:"W3",timeframe:"W",high:115,low:90,highTaken:false,active:true}
];

state=buildObjectivePipeline({
  direction:"BEARISH",
  setupRange:{high:104,low:100},
  magnitude:99,
  originPrice:101,
  currentPrice:100,
  candidateRanges:intradayRanges
});
t("intraday magnitude remains first before hit",state.nextObjective,{type:"MAGNITUDE",price:99});
t("30/60 duplicate boundary merges",state.targetHierarchy.objectives[0].supportingTimeframes,["30m","60m"]);
t("intraday first post-magnitude target is 98",state.targetHierarchy.objectives[0].price,98);
t("daily bearish extension remains later target",state.targetHierarchy.objectives[1].price,95);
t("unengaged weekly bearish range excluded",state.qualifiedTargets.some(x=>x.rangeId==="W3"),false);

state=buildObjectivePipeline({
  direction:"BEARISH",
  setupRange:{high:104,low:100},
  magnitude:99,
  originPrice:101,
  currentPrice:98.5,
  candidateRanges:intradayRanges
});
t("after bearish magnitude hit, 98 target is next",state.nextObjective.price,98);

state=buildObjectivePipeline({
  direction:"BEARISH",
  setupRange:{high:104,low:100},
  magnitude:99,
  originPrice:101,
  currentPrice:97.5,
  candidateRanges:intradayRanges
});
t("after 98 consumed, daily 95 promotes",state.nextObjective.price,95);

state=buildObjectivePipeline({
  direction:"BEARISH",
  setupRange:{high:104,low:100},
  magnitude:99,
  originPrice:101,
  currentPrice:94,
  candidateRanges:intradayRanges
});
t("intraday chain exhausted after engaged structures cleared",state.exhaustionRisk,true);

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
