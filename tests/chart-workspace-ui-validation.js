"use strict";

const ui=require("../chart-workspace-ui.js");

let pass=0,fail=0;
function check(name,condition){if(condition){pass++;console.log(`PASS ${pass}: ${name}`);}else{fail++;console.error(`FAIL: ${name}`);}}

const card={symbol:"spy",timeframe:"5",setup:"2-2",direction:"BULLISH",price:645.12,observedAt:"2026-08-22T13:55:00.000Z",advisoryState:"WATCH_ACTIONABLE_SETUP",ftfc:{alignment:"FULL_BULLISH"},rewardRisk:null,probabilityScore:null,brokerAuthority:false};
const bars=Array.from({length:6},(_,i)=>{
  const start=Date.parse("2026-08-22T13:30:00.000Z")+i*5*60000;
  return {open:640+i,high:642+i,low:639+i,close:641+i,volume:100+i,datetime:new Date(start).toISOString(),semantics:{barOpenTimestamp:new Date(start).toISOString(),barCloseTimestamp:new Date(start+5*60000).toISOString(),barAnchorOffsetMinutes:i*5,periodOpenId:`SPY|5|2026-08-22|REGULAR|${String(9+Math.floor((30+i*5)/60)).padStart(2,"0")}:${String((30+i*5)%60).padStart(2,"0")}`}};
});
const series={source:"LIVE_PROXY",provider:"TWELVE_DATA",symbol:"SPY",timeframe:"5",interval:"5min",bars};

const normalized=ui.normalizeCandidateCard(card);
check("candidate symbol normalizes",normalized.symbol==="SPY");
check("candidate timeframe is retained",normalized.timeframe==="5");
check("candidate context remains reference price only",normalized.referencePrice===true&&normalized.brokerAuthority===false);
check("handoff does not invent probability",normalized.probabilityScore===null);
check("card-only handoff starts without exact bars",normalized.exactBarsAttached===false&&normalized.dataStatus==="CARD_CONTEXT_ONLY");

const handoff=ui.buildHandoff(card,series);
check("handoff carries candidate setup",handoff.candidate.setup==="2-2"&&handoff.candidate.direction==="BULLISH");
check("exact scanner series is attached",handoff.candidate.exactBarsAttached===true&&handoff.candidate.dataStatus==="EXACT_SCANNER_RESPONSE"&&handoff.series===series);
check("initial workspace uses candidate timeframe",handoff.workspace.count===1&&handoff.workspace.timeframes[0]==="5");
check("workspace ordering contract is retained",handoff.workspace.order==="LOWEST_TO_HIGHEST");
check("workspace model retains four-chart ceiling",handoff.workspace.maxCharts===4);
check("handoff event name is stable",ui.EVENT_NAME==="strat:candidate-chart");

const chartData=ui.chartDataFromSeries(series);
check("chart data uses exact semantic bar timestamps",chartData.length===6&&chartData[0].time===Math.floor(Date.parse("2026-08-22T13:30:00.000Z")/1000));
check("chart data retains OHLC",chartData[1].open===641&&chartData[1].high===643&&chartData[1].low===640&&chartData[1].close===642);
check("proxy request cache key resolves scanner timeframe",ui.requestCacheKey("https://thestrat.phshbone.workers.dev/time-series?symbol=spy&interval=5min&outputsize=100")==="SPY|5");
check("unrelated URLs are not cached",ui.requestCacheKey("https://example.com/time-series?symbol=SPY&interval=5min")===null);
check("renderer dependency is pinned",/lightweight-charts@4\.2\.3/.test(ui.LIGHTWEIGHT_CHARTS_SRC));

check("production chart ladder is constrained to validated intraday",ui.PRODUCTION_TFS.join(",")==="5,15,30");
check("5m response can supply 5/15/30 panels",ui.productionTimeframesForSource("5").join(",")==="5,15,30");
check("15m response can only supply 15/30 panels",ui.productionTimeframesForSource("15").join(",")==="15,30");
check("30m response can only supply one 30m panel",ui.productionTimeframesForSource("30").join(",")==="30");
check("60m is not silently promoted into production charts",ui.productionTimeframesForSource("60").length===0);
check("three-panel default from 5m is lowest to highest",ui.defaultPanelTimeframes("5",3).join(",")==="5,15,30");
let fourBlocked=false;try{ui.defaultPanelTimeframes("5",4);}catch(error){fourBlocked=/1-3/.test(error.message);}check("fourth panel remains blocked until another timeframe is validated",fourBlocked);

const fifteen=ui.aggregateSeries(series,"15");
check("5m bars aggregate locally into 15m without provider request",fifteen.timeframe==="15"&&fifteen.bars.length===2&&fifteen.exactProviderRequest===false&&fifteen.source==="DERIVED_FROM_EXACT_SCANNER_RESPONSE");
check("15m aggregation preserves OHLC geometry",fifteen.bars[0].open===640&&fifteen.bars[0].high===644&&fifteen.bars[0].low===639&&fifteen.bars[0].close===643);
check("15m aggregation sums available volume",fifteen.bars[0].volume===303);
check("15m semantic bucket stays RTH anchored",fifteen.bars[0].semantics.barAnchorOffsetMinutes===0&&fifteen.bars[1].semantics.barAnchorOffsetMinutes===15);

const thirty=ui.aggregateSeries(series,"30");
check("5m bars aggregate locally into 30m",thirty.timeframe==="30"&&thirty.bars.length===1);
check("30m aggregation spans the full six-bar source bucket",thirty.bars[0].open===640&&thirty.bars[0].high===647&&thirty.bars[0].low===639&&thirty.bars[0].close===646);

const panels=ui.panelSeriesForWorkspace(series,["5","15","30"]);
check("workspace builds exact plus derived panel series",panels.length===3&&panels[0].mode==="EXACT"&&panels[1].mode==="DERIVED"&&panels[2].mode==="DERIVED");
check("panel ordering follows validated ladder",panels.map(x=>x.timeframe).join(",")==="5,15,30");
let lowerBlocked=false;try{ui.panelSeriesForWorkspace({symbol:"SPY",timeframe:"15",bars},["5"]);}catch(error){lowerBlocked=/unavailable/.test(error.message);}check("higher-timeframe source cannot fabricate a lower timeframe panel",lowerBlocked);

let mismatch=false;try{ui.buildHandoff(card,{symbol:"QQQ",timeframe:"5",bars});}catch(error){mismatch=/does not match/.test(error.message);}check("mismatched series cannot attach to candidate",mismatch);
let missingSymbol=false;try{ui.normalizeCandidateCard({timeframe:"5"});}catch(error){missingSymbol=/symbol required/.test(error.message);}check("missing symbol is rejected",missingSymbol);
let missingTf=false;try{ui.normalizeCandidateCard({symbol:"SPY"});}catch(error){missingTf=/timeframe required/.test(error.message);}check("missing timeframe is rejected",missingTf);

console.log(JSON.stringify({pass,fail,failures:fail}));
if(fail) process.exit(1);
