"use strict";

const {buildObjectivePipeline,reclaimObjectivesToTargets}=require("../objective-pipeline.js");

let pass=0,fail=0; const failures=[];
function t(name,actual,expected){
  const ok=JSON.stringify(actual)===JSON.stringify(expected);
  if(ok) pass++; else { fail++; failures.push({name,actual,expected}); }
}

t(
  "adapter marks reclaim objective structural",
  reclaimObjectivesToTargets([{id:"r",price:115,sourceRangeId:"W",timeframe:"W",consumed:false}])[0].structurallyRelevant,
  true
);

let state=buildObjectivePipeline({
  direction:"BULLISH",
  setupRange:{high:104,low:100},
  magnitude:105,
  originPrice:103,
  currentPrice:106,
  candidateRanges:[],
  reclaimRanges:[{id:"W-3",timeframe:"W",low:102,high:115,verified:true}]
});
t("bull reclaimed range enters objective hierarchy",state.targetHierarchy.objectives.map(x=>x.price),[115]);
t("bull reclaimed range is next post-magnitude objective",state.nextObjective.price,115);
t("bull reclaim provenance retained",state.targetHierarchy.objectives[0].supportingRangeIds,["W-3"]);
t("bull reclaim source retained",state.targetHierarchy.objectives[0].supportingSources,["RANGE_RECLAIM"]);
t("not exhausted while reclaim objective remains",state.exhaustionRisk,false);

state=buildObjectivePipeline({
  direction:"BULLISH",
  setupRange:{high:104,low:100},
  magnitude:105,
  originPrice:103,
  currentPrice:116,
  reclaimRanges:[{id:"W-3",timeframe:"W",low:102,high:115,verified:true}]
});
t("reclaim completion clears active reclaim target",state.reclaimTargets.length,0);
t("completed reclaim contributes exhaustion",state.exhaustionRisk,true);
t("completed reclaim recorded",state.reclaimStack.completedCount,1);

state=buildObjectivePipeline({
  direction:"BEARISH",
  setupRange:{high:104,low:100},
  magnitude:99,
  originPrice:101,
  currentPrice:98,
  reclaimRanges:[{id:"D-3",timeframe:"D",low:90,high:100,verified:true}]
});
t("bear reclaimed range target is low boundary",state.reclaimTargets[0].price,90);
t("bear reclaimed range next objective",state.nextObjective.price,90);

state=buildObjectivePipeline({
  direction:"BULLISH",
  setupRange:{high:104,low:100},
  magnitude:105,
  originPrice:103,
  currentPrice:106,
  candidateRanges:[{id:"D1",timeframe:"D",high:110,low:95,lowTaken:true,active:true}],
  reclaimRanges:[{id:"W-3",timeframe:"W",low:102,high:115,verified:true}]
});
t("structural and reclaim objectives share one ordered path",state.targetHierarchy.objectives.map(x=>x.price),[110,115]);
t("nearest price wins regardless source",state.nextObjective.price,110);

state=buildObjectivePipeline({
  direction:"BULLISH",
  setupRange:{high:104,low:100},
  magnitude:105,
  originPrice:103,
  currentPrice:106,
  candidateRanges:[{id:"D1",timeframe:"D",high:110,low:95,lowTaken:true,active:true}],
  reclaimRanges:[{id:"W-3",timeframe:"W",low:102,high:110,verified:true}]
});
t("exact structural/reclaim agreement merges",state.targetHierarchy.objectives.length,1);
t("merged agreement has two sources",state.targetHierarchy.objectives[0].sourceCount,2);
t(
  "merged agreement preserves source types",
  state.targetHierarchy.objectives[0].supportingSourceTypes.sort(),
  ["RANGE_BOUNDARY","RECLAIMED_RANGE_OPPOSITE_BOUNDARY"].sort()
);

state=buildObjectivePipeline({
  direction:"BULLISH",
  setupRange:{high:104,low:100},
  magnitude:105,
  originPrice:103,
  currentPrice:104.5,
  reclaimRanges:[{id:"W-3",timeframe:"W",low:102,high:115,verified:true}]
});
t("setup magnitude still stays first before hit",state.nextObjective,{type:"MAGNITUDE",price:105});

state=buildObjectivePipeline({
  direction:"BULLISH",
  setupRange:{high:104,low:100},
  magnitude:105,
  originPrice:103,
  currentPrice:106,
  reclaimRanges:[{id:"bad",timeframe:"W",low:102,high:120,verified:false}]
});
t("unverified reclaim range cannot create objective",state.reclaimTargets.length,0);
t("unverified reclaim cannot suppress exhaustion",state.exhaustionRisk,true);

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
