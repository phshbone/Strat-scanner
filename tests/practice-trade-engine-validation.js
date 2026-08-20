"use strict";

const p=require("../practice-trade-engine.js");
let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}
function near(name,actual,expected,eps=1e-9){const ok=Math.abs(actual-expected)<=eps; if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}
function throws(name,fn){let ok=false; try{fn();}catch{ok=true;} t(name,ok,true);}

const bull=p.createPracticeTrade({symbol:"SPY",timeframe:"15",direction:"BULL",setupType:"2-1-2U",triggerPrice:100,stopPrice:98,targetPrice:104,createdAt:"2026-08-20T14:00:00Z"});
t("bull starts armed",bull.state,"ARMED");
t("bull risk",p.riskPerUnit(bull),2);

let x=p.processBar(bull,{datetime:"t1",open:99,high:100,low:99,close:100});
t("equality does not trigger",x.state,"ARMED");

x=p.processBar(x,{datetime:"t2",open:100,high:101,low:99,close:100.5});
t("strict break triggers",x.state,"OPEN");
t("entry at trigger",x.entryPrice,100);
t("initial lot created",x.lots.length,1);
t("entry event",x.events[0].type,"ENTRY_TRIGGERED");

x=p.processBar(x,{datetime:"t3",open:100.5,high:103,low:99.5,close:102});
t("open trade remains open",x.state,"OPEN");
t("mfe tracked",x.mfe,3);
t("mae tracked",x.mae,1);

x=p.processBar(x,{datetime:"t4",open:102,high:104.2,low:101,close:104});
t("target hit",x.state,"TARGET_HIT");
t("target result R",x.resultR,2);

const bear=p.createPracticeTrade({symbol:"QQQ",timeframe:"5",direction:"BEAR",setupType:"2-2D",triggerPrice:200,stopPrice:203,targetPrice:194});
let b=p.processBar(bear,{datetime:"b1",open:201,high:202,low:199.5,close:200});
t("bear opens on strict downside break",b.state,"OPEN");
b=p.processBar(b,{datetime:"b2",open:200,high:203.5,low:198,close:202});
t("bear stop hit",b.state,"STOPPED");
t("bear stopped result R",b.resultR,-1);

const scale=p.createPracticeTrade({symbol:"AAPL",timeframe:"15",direction:"BULL",setupType:"2-2U",triggerPrice:100,stopPrice:98,targetPrice:106,quantity:10});
let s=p.processBar(scale,{datetime:"s1",open:99.5,high:101,low:99,close:100.5});
s=p.addPracticeShares(s,{quantity:5,price:102,at:"s2",reason:"LOWER_TF_2_2_CONTINUATION",source:"PRACTICE_RULE"});
t("scale-in lot added",s.lots.length,2);
t("scale-in count",s.scaleInCount,1);
t("total quantity after add",s.quantity,15);
near("weighted average entry",s.averageEntryPrice,(1000+510)/15);
t("shares-added event",s.events[1].type,"SHARES_ADDED");
near("risk capital includes both lots",p.totalRiskCapital(s),10*2+5*4);
s=p.processBar(s,{datetime:"s3",open:103,high:106.5,low:102.5,close:106});
t("scaled trade target hit",s.state,"TARGET_HIT");
near("scaled trade pnl",s.pnl,(106-((1000+510)/15))*15);
near("scaled trade result R",s.resultR,s.pnl/40);

throws("cannot scale an armed trade",()=>p.addPracticeShares(scale,{quantity:1,price:101}));
throws("cannot add zero shares",()=>p.addPracticeShares(p.processBar(p.createPracticeTrade({symbol:"MSFT",timeframe:"15",direction:"BULL",setupType:"2-2U",triggerPrice:100,stopPrice:99,targetPrice:103}),{datetime:"m1",open:100,high:101,low:99.5,close:100.5}),{quantity:0,price:101}));

const amb=p.createPracticeTrade({symbol:"IWM",timeframe:"15",direction:"BULL",setupType:"2-1-2U",triggerPrice:50,stopPrice:49,targetPrice:52});
const a=p.processBar(amb,{datetime:"a1",open:49.8,high:52.5,low:48.5,close:51});
t("entry bar path ambiguity preserved",a.state,"AMBIGUOUS");
t("ambiguous result has no R",a.resultR,null);

const amb2=p.createPracticeTrade({symbol:"DIA",timeframe:"30",direction:"BULL",setupType:"2-2U",triggerPrice:300,stopPrice:298,targetPrice:304});
let a2=p.processBar(amb2,{datetime:"c1",open:300,high:301,low:299,close:300.5});
t("second ambiguity trade opens",a2.state,"OPEN");
a2=p.processBar(a2,{datetime:"c2",open:300.5,high:304.5,low:297.5,close:301});
t("later bar crossing stop and target is ambiguous",a2.state,"AMBIGUOUS");

const done=p.processBar(x,{datetime:"t5",open:104,high:110,low:90,close:100});
t("terminal trade is immutable to later bars",done.state,"TARGET_HIT");
t("terminal bars observed unchanged",done.barsObserved,x.barsObserved);

throws("reject invalid bull geometry",()=>p.createPracticeTrade({symbol:"SPY",timeframe:"15",direction:"BULL",setupType:"x",triggerPrice:100,stopPrice:101,targetPrice:104}));
throws("reject invalid bear geometry",()=>p.createPracticeTrade({symbol:"SPY",timeframe:"15",direction:"BEAR",setupType:"x",triggerPrice:100,stopPrice:99,targetPrice:95}));
throws("reject zero quantity",()=>p.createPracticeTrade({symbol:"SPY",timeframe:"15",direction:"BULL",setupType:"x",triggerPrice:100,stopPrice:99,targetPrice:101,quantity:0}));

const summary=p.summarizePracticeTrade(s);
t("summary state",summary.state,"TARGET_HIT");
t("summary quantity",summary.quantity,15);
t("summary scale-in count",summary.scaleInCount,1);

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
