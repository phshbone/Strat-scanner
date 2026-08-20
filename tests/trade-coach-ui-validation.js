"use strict";

const assert=require("assert");
const {buildTradeCoachViewModel,severityClass}=require("../trade-coach-ui.js");
let pass=0;
function t(name,fn){fn();pass+=1;console.log(`PASS ${pass}: ${name}`);}

t("high severity maps to bad",()=>assert.equal(severityClass("HIGH"),"bad"));
t("caution severity maps to warn",()=>assert.equal(severityClass("CAUTION"),"warn"));
t("positive severity maps to ok",()=>assert.equal(severityClass("POSITIVE"),"ok"));

const silent=buildTradeCoachViewModel({emit:false,code:"NO_MEANINGFUL_STATE_CHANGE"});
t("silent guidance hidden",()=>assert.equal(silent.visible,false));
t("silent guidance preserves code",()=>assert.equal(silent.code,"NO_MEANINGFUL_STATE_CHANGE"));

const visible=buildTradeCoachViewModel({emit:true,code:"FTFC_OPPOSED",severity:"CAUTION",title:"Timeframe continuity deteriorated",message:"FTFC moved against the setup.",why:[{label:"FTFC",status:"OPPOSED",value:"BEARISH_MAJORITY",explanatoryOnly:true}],observedAt:"2026-08-20T21:30:00Z",brokerAuthority:true,aiAuthority:true});
t("guidance visible",()=>assert.equal(visible.visible,true));
t("title retained",()=>assert.equal(visible.title,"Timeframe continuity deteriorated"));
t("why evidence retained",()=>assert.equal(visible.why[0].status,"OPPOSED"));
t("UI cannot grant broker authority",()=>assert.equal(visible.brokerAuthority,false));
t("UI cannot grant AI authority",()=>assert.equal(visible.aiAuthority,false));

console.log(`\n${pass}/${pass} PASS trade coach UI validation`);
