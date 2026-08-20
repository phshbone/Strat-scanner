"use strict";

const assert=require("assert");
const {normalizeTimeframe,sortTimeframes,buildChartWorkspace,setChartCount,setTimeframes,toggleTimeframe}=require("../chart-workspace-layout.js");
let pass=0;
function t(name,fn){fn();pass+=1;console.log(`PASS ${pass}: ${name}`);}
function throws(name,fn){t(name,()=>assert.throws(fn));}

t("15m alias normalizes",()=>assert.equal(normalizeTimeframe("15m"),"15"));
t("1h alias normalizes",()=>assert.equal(normalizeTimeframe("1h"),"60"));
t("daily alias normalizes",()=>assert.equal(normalizeTimeframe("daily"),"D"));
t("unsupported timeframe rejected",()=>assert.equal(normalizeTimeframe("2h"),null));
t("timeframes sort lowest to highest",()=>assert.deepEqual(sortTimeframes(["D","15","60","5","30"]),["5","15","30","60","D"]));
t("duplicates removed",()=>assert.deepEqual(sortTimeframes(["15","15m","D","daily"]),["15","D"]));

const four=buildChartWorkspace({count:4,timeframes:["M","15","D","60"]});
t("four-chart count retained",()=>assert.equal(four.count,4));
t("four-chart order locked low to high",()=>assert.deepEqual(four.timeframes,["15","60","D","M"]));
t("workspace records max four",()=>assert.equal(four.maxCharts,4));

const two=setChartCount(four,2);
t("count can reduce to two",()=>assert.equal(two.count,2));
t("reduced layout remains ordered",()=>assert.deepEqual(two.timeframes,["15","60"]));

const custom=setTimeframes({count:2,timeframes:["15","D"]},["30","W"]);
t("custom pair accepted",()=>assert.deepEqual(custom.timeframes,["30","W"]));
throws("wrong number of selected timeframes rejected",()=>setTimeframes({count:3},["15","D"]));
throws("more than four charts rejected",()=>buildChartWorkspace({count:5}));

const partiallySelected={count:3,timeframes:["15","D"]};
const added=toggleTimeframe(partiallySelected,"30",true);
t("timeframe toggle fills open slot",()=>assert.deepEqual(added.timeframes,["15","30","D"]));
throws("timeframe toggle cannot exceed selected count",()=>toggleTimeframe(added,"W",true));
const removed=toggleTimeframe(added,"30",false);
t("timeframe can be removed before replacement",()=>assert.deepEqual(removed.timeframes,["15","D"]));

console.log(`\n${pass}/${pass} PASS chart workspace layout validation`);
