"use strict";

const h=require("../target-hierarchy.js");
let pass=0,fail=0; const failures=[];
function t(name,actual,expected){
  const ok=JSON.stringify(actual)===JSON.stringify(expected);
  if(ok) pass++;
  else { fail++; failures.push({name,actual,expected}); }
}

const targets=[
  {id:"d1",price:105,timeframe:"D",rangeId:"rd",structurallyRelevant:true,eligibleTarget:true},
  {id:"w1",price:105,timeframe:"W",rangeId:"rw",structurallyRelevant:true,eligibleTarget:true},
  {id:"d2",price:108,timeframe:"D",rangeId:"rd2",structurallyRelevant:true,eligibleTarget:true,consumed:true},
  {id:"m1",price:112,timeframe:"M",rangeId:"rm",structurallyRelevant:true,eligibleTarget:true}
];

t("bullish price-path sort",h.sortTargets(targets,"BULLISH").map(x=>x.price),[105,105,108,112]);
t("bearish price-path sort",h.sortTargets(targets,"BEARISH").map(x=>x.price),[112,108,105,105]);

const exact=h.mergeExactPriceTargets(targets,"BULLISH");
t("exact duplicate levels merge",exact.length,3);
t("merged level keeps source count",exact[0].sourceCount,2);
t("merged level keeps both timeframes",exact[0].supportingTimeframes,["D","W"]);
t("merged level keeps range evidence",exact[0].supportingRangeIds,["rd","rw"]);
t("merged level marks duplicate",exact[0].exactDuplicate,true);
t("merged exact level not consumed unless every source consumed",exact[0].consumed,false);
t("single consumed level remains consumed",exact[1].consumed,true);

const built=h.buildTargetHierarchy({targets,direction:"BULLISH"});
t("objective order follows travel path",built.objectives.map(x=>[x.price,x.objectiveOrder]),[[105,1],[108,2],[112,3]]);
t("first unconsumed level is next target",built.nextTarget.price,105);
t("raw target count preserved",built.rawTargetCount,4);
t("exact level count exposed",built.exactLevelCount,3);

const consumedExact=targets.map(x=>x.price===105?{...x,consumed:true}:x);
const built2=h.buildTargetHierarchy({targets:consumedExact,direction:"BULLISH"});
t("next target skips fully consumed exact level and consumed 108",built2.nextTarget.price,112);

const near=[
  {id:"a",price:100,timeframe:"D"},
  {id:"b",price:100.02,timeframe:"W"},
  {id:"c",price:101,timeframe:"M"}
];
const defaultNear=h.buildTargetHierarchy({targets:near,direction:"BULLISH"});
t("default tolerance does not merge nearby levels",defaultNear.proximityClusters.map(c=>c.memberCount),[1,1,1]);
t("nearby levels remain separate objectives",defaultNear.objectives.length,3);

const clustered=h.buildTargetHierarchy({targets:near,direction:"BULLISH",proximityTolerance:0.05});
t("caller-provided tolerance groups nearby display levels",clustered.proximityClusters.map(c=>c.memberCount),[2,1]);
t("near-price cluster is advisory only",clustered.proximityClusters[0].advisoryOnly,true);
t("advisory clustering does not alter target prices",clustered.objectives.map(x=>x.price),[100,100.02,101]);
t("bearish hierarchy reverses price-path order",h.buildTargetHierarchy({targets:near,direction:"BEARISH"}).objectives.map(x=>x.price),[101,100.02,100]);

try{ h.buildTargetHierarchy({targets:near,direction:"SIDEWAYS"}); t("invalid direction rejected",false,true); }
catch(e){ t("invalid direction rejected",true,true); }

try{ h.clusterNearbyTargets(near,{direction:"BULLISH",tolerance:-1}); t("negative tolerance rejected",false,true); }
catch(e){ t("negative tolerance rejected",true,true); }

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
