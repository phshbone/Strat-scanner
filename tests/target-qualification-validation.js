"use strict";

const q=require("../target-qualification.js");
const magnitude=require("../magnitude.js");

let pass=0,fail=0; const failures=[];
function t(name,actual,expected){
  const ok=JSON.stringify(actual)===JSON.stringify(expected);
  if(ok) pass++; else { fail++; failures.push({name,actual,expected}); }
}

const setup={id:"setup",high:105,low:95};
const ranges=[
  {id:"D",high:110,low:90,timeframe:"D",lowTaken:true,highTaken:true},
  {id:"W",high:120,low:80,timeframe:"W",lowTaken:false,highTaken:true},
  {id:"M",high:130,low:70,timeframe:"M",lowTaken:true,highTaken:false},
  {id:"bad",high:104,low:90,timeframe:"D",lowTaken:true,highTaken:true}
];

t("broader range contains setup",q.containsRange(ranges[0],setup),true);
t("partial overlap does not count as containment",q.containsRange(ranges[3],setup),false);
t("same range is not a broader containing range",q.containsRange(setup,setup),false);
t("bullish traversal requires larger-range low taken",q.requiredSideTaken(ranges[0],"BULLISH"),true);
t("bearish traversal requires larger-range high taken",q.requiredSideTaken(ranges[0],"BEARISH"),true);
t("bullish excludes weekly range whose low was not taken",q.qualifyTargetRanges({direction:"BULLISH",setupRange:setup,magnitude:105,candidateRanges:ranges}).map(x=>x.id),["D","M"]);
t("bearish excludes monthly range whose high was not taken",q.qualifyTargetRanges({direction:"BEARISH",setupRange:setup,magnitude:95,candidateRanges:ranges}).map(x=>x.id),["D","W"]);
t("bullish target order is nearest eligible boundary first",q.buildQualifiedTargets({direction:"BULLISH",setupRange:setup,magnitude:105,candidateRanges:ranges}).map(x=>[x.id,x.price]),[["D",110],["M",130]]);
t("bearish target order is nearest eligible boundary first",q.buildQualifiedTargets({direction:"BEARISH",setupRange:setup,magnitude:95,candidateRanges:ranges}).map(x=>[x.id,x.price]),[["D",90],["W",80]]);
t("inactive candidate range is excluded",q.qualifyTargetRanges({direction:"BULLISH",setupRange:setup,magnitude:105,candidateRanges:[{id:"X",high:115,low:85,lowTaken:true,active:false}]}).length,0);
t("invalid range is ignored",q.qualifyTargetRanges({direction:"BULLISH",setupRange:setup,magnitude:105,candidateRanges:[{id:"X",high:100,low:100,lowTaken:true}]}).length,0);
t("boundary must extend beyond magnitude",q.qualifyTargetRanges({direction:"BULLISH",setupRange:setup,magnitude:112,candidateRanges:[ranges[0]]}).length,0);

const bullTargets=q.buildQualifiedTargets({direction:"BULLISH",setupRange:setup,magnitude:105,candidateRanges:ranges});
const bullState=magnitude.buildObjectiveState({originPrice:100,currentPrice:106,direction:"BULLISH",magnitude:105,pivots:bullTargets});
t("qualified layer feeds magnitude engine",bullState.nextObjective.price,110);
t("qualified layer marks target structural eligibility",bullTargets.map(x=>x.structurallyRelevant),[true,true]);

const bullAfterD=magnitude.buildObjectiveState({originPrice:100,currentPrice:111,direction:"BULLISH",magnitude:105,pivots:bullTargets});
t("first broader target consumed then next promotes",bullAfterD.nextObjective.price,130);
t("not exhausted while a qualified broader target remains",bullAfterD.exhaustionRisk,false);

const bullAll=magnitude.buildObjectiveState({originPrice:100,currentPrice:131,direction:"BULLISH",magnitude:105,pivots:bullTargets});
t("exhaustion after all qualified active structures clear",bullAll.exhaustionRisk,true);

const none=q.buildQualifiedTargets({direction:"BULLISH",setupRange:setup,magnitude:105,candidateRanges:[ranges[1]]});
const noTargetState=magnitude.buildObjectiveState({originPrice:100,currentPrice:106,direction:"BULLISH",magnitude:105,pivots:none});
t("unengaged larger range is not silently promoted",noTargetState.nextObjective,null);
t("current known structure is exhausted when no larger range qualifies",noTargetState.exhaustionRisk,true);

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
