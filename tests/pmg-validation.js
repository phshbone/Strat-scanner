"use strict";

const {detectPmg,pmgLevels,buildPmgState}=require("../pmg.js");
let pass=0, fail=0; const failures=[];
function t(name,actual,expected){
  const ok=JSON.stringify(actual)===JSON.stringify(expected);
  if(ok) pass++; else { fail++; failures.push({name,actual,expected}); }
}

const bearish=[
  {id:"b1",high:110,low:90},
  {id:"b2",high:111,low:92},
  {id:"b3",high:112,low:94},
  {id:"b4",high:113,low:96},
  {id:"b5",high:114,low:98}
];
const bullish=[
  {id:"u1",high:120,low:100},
  {id:"u2",high:118,low:99},
  {id:"u3",high:116,low:98},
  {id:"u4",high:114,low:97},
  {id:"u5",high:112,low:96}
];
const sara=[
  {low:90,high:100},{low:91,high:101},{low:92,high:102},
  {low:93,high:103},{low:94,high:104},{low:95,high:105}
];

t("five higher lows qualifies bearish",detectPmg(bearish).direction,"BEARISH");
t("five lower highs qualifies bullish",detectPmg(bullish).direction,"BULLISH");
t("bearish pattern name",detectPmg(bearish).pattern,"HIGHER_LOWS");
t("bullish pattern name",detectPmg(bullish).pattern,"LOWER_HIGHS");
t("four bars insufficient by default",detectPmg(bearish.slice(0,4)).reason,"INSUFFICIENT_BARS");
t("equal low breaks higher-low PMG",detectPmg([...bearish.slice(0,4),{high:115,low:96}]).qualifies,false);
t("equal high breaks lower-high PMG",detectPmg([...bullish.slice(0,4),{high:114,low:95}]).qualifies,false);
t("Sara monthly preset requires six bars",detectPmg(sara.slice(0,5),{preset:"SARA_MONTHLY_SHORT"}).reason,"INSUFFICIENT_BARS");
t("Sara monthly preset six rising lows qualifies",detectPmg(sara,{preset:"SARA_MONTHLY_SHORT"}).direction,"BEARISH");
t("Sara preset requiredBars is six",detectPmg(sara,{preset:"SARA_MONTHLY_SHORT"}).requiredBars,6);

const bearLevels=pmgLevels(detectPmg(bearish,{timeframe:"15"}));
t("bearish PMG levels use lows",bearLevels.map(x=>x.price),[98,96,94,92,90]);
t("bearish PMG level source",bearLevels[0].source,"PMG");
t("bearish PMG levels target eligible",bearLevels.every(x=>x.eligibleTarget===true),true);

const bullLevels=pmgLevels(detectPmg(bullish,{timeframe:"D"}));
t("bullish PMG levels use highs",bullLevels.map(x=>x.price),[112,114,116,118,120]);
t("bullish PMG timeframe preserved",bullLevels[0].timeframe,"D");

t("PMG alone waits for reversal",buildPmgState({bars:bearish}).status,"PMG_WAITING_FOR_REVERSAL");
t("matching bearish reversal in force activates",buildPmgState({bars:bearish,reversalDirection:"BEARISH",reversalInForce:true}).actionable,true);
t("opposite reversal does not activate",buildPmgState({bars:bearish,reversalDirection:"BULLISH",reversalInForce:true}).actionable,false);
t("matching direction but not in force does not activate",buildPmgState({bars:bullish,reversalDirection:"BULLISH",reversalInForce:false}).actionable,false);
t("no geometry returns NO_PMG",buildPmgState({bars:[{high:10,low:5},{high:12,low:4},{high:11,low:6},{high:13,low:3},{high:12,low:7}]}).status,"NO_PMG");

let badMin=false;
try{ detectPmg(bearish,{minBars:1}); }catch(e){ badMin=true; }
t("invalid minBars rejected",badMin,true);

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
