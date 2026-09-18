"use strict";
const assert=require("assert");
const r=require("../historical-path-resolver.js");
let pass=0;function t(name,fn){fn();pass++;console.log("PASS "+pass+": "+name);}
const base={timestamp:"2026-01-02T14:30:00.000Z",signalBarTimestamp:"2026-01-02T14:30:00.000Z",direction:"BULLISH",entry:100,stop:95,magnitude:110,horizonBars:20,sequenceAmbiguous:true,resolution:"AMBIGUOUS",magnitudeHit:true,stopHit:true};
const bars=[0,5,10,15,20].map((m,i)=>({datetime:new Date(Date.parse("2026-01-02T14:30:00Z")+m*60000).toISOString(),open:[99,101,106,108,109][i],high:[101,106,108,111,112][i],low:[98,100,104,107,108][i],close:[100.5,105,107,110,111][i]}));
t("lower timeframe can resolve target after entry",()=>{const x=r.resolveAmbiguousEvent(base,bars);assert.equal(x.sequenceAmbiguous,false);assert.equal(x.resolution,"WIN");assert.equal(x.pathResolutionSource,"LOWER_TIMEFRAME_5M");});
const lossBars=[{datetime:"2026-01-02T14:30:00.000Z",open:101,high:103,low:96,close:98},{datetime:"2026-01-02T14:35:00.000Z",open:98,high:99,low:94,close:95}];
t("gap/open beyond entry makes later stop deterministic",()=>{const x=r.resolveAmbiguousEvent(base,lossBars);assert.equal(x.resolution,"LOSS");assert.equal(x.sequenceAmbiguous,false);});
const sameBar=[{datetime:"2026-01-02T14:30:00.000Z",open:99,high:102,low:94,close:100}];
t("entry and stop in same lower bar stays ambiguous",()=>{const x=r.resolveAmbiguousEvent(base,sameBar);assert.equal(x.sequenceAmbiguous,true);assert.match(x.ambiguityReason,/LOWER_TIMEFRAME_ENTRY_STOP/);});
t("non-ambiguous events pass through",()=>{const x=r.resolveAmbiguousEvent({...base,sequenceAmbiguous:false,resolution:"WIN"},bars);assert.equal(x.resolution,"WIN");});
const batch=r.resolveAmbiguousEvents([base,{...base,sequenceAmbiguous:false,resolution:"WIN"}],bars);
t("batch reports ambiguity reduction",()=>{assert.equal(batch.beforeAmbiguous,1);assert.equal(batch.afterAmbiguous,0);assert.equal(batch.resolvedAmbiguities,1);});
console.log("\n"+pass+"/"+pass+" PASS historical path resolver validation");