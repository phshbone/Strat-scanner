"use strict";

const ui=require("../chart-workspace-ui.js");

let pass=0,fail=0;
function check(name,condition){if(condition){pass++;console.log(`PASS ${pass}: ${name}`);}else{fail++;console.error(`FAIL: ${name}`);}}

const card={symbol:"spy",timeframe:"15",setup:"2-2",direction:"BULLISH",price:645.12,observedAt:"2026-08-22T13:45:00.000Z",advisoryState:"WATCH_ACTIONABLE_SETUP",ftfc:{alignment:"FULL_BULLISH"},rewardRisk:null,probabilityScore:null,brokerAuthority:false};
const series={symbol:"SPY",timeframe:"15",bars:[
  {open:644,high:646,low:643.5,close:645,semantics:{barOpenTimestamp:"2026-08-22T13:30:00.000Z"}},
  {open:645,high:647,low:644.5,close:646.5,semantics:{barOpenTimestamp:"2026-08-22T13:45:00.000Z"}}
]};

const normalized=ui.normalizeCandidateCard(card);
check("candidate symbol normalizes",normalized.symbol==="SPY");
check("candidate timeframe is retained",normalized.timeframe==="15");
check("candidate context remains reference price only",normalized.referencePrice===true&&normalized.brokerAuthority===false);
check("handoff does not invent probability",normalized.probabilityScore===null);
check("card-only handoff starts without exact bars",normalized.exactBarsAttached===false&&normalized.dataStatus==="CARD_CONTEXT_ONLY");

const handoff=ui.buildHandoff(card,series);
check("handoff carries candidate setup",handoff.candidate.setup==="2-2"&&handoff.candidate.direction==="BULLISH");
check("exact scanner series is attached",handoff.candidate.exactBarsAttached===true&&handoff.candidate.dataStatus==="EXACT_SCANNER_RESPONSE"&&handoff.series===series);
check("initial workspace uses candidate timeframe",handoff.workspace.count===1&&handoff.workspace.timeframes.length===1&&handoff.workspace.timeframes[0]==="15");
check("workspace ordering contract is retained",handoff.workspace.order==="LOWEST_TO_HIGHEST");
check("workspace stays within four-chart cap",handoff.workspace.maxCharts===4);
check("handoff event name is stable",ui.EVENT_NAME==="strat:candidate-chart");

const chartData=ui.chartDataFromSeries(series);
check("chart data uses exact semantic bar timestamps",chartData.length===2&&chartData[0].time===Math.floor(Date.parse("2026-08-22T13:30:00.000Z")/1000));
check("chart data retains OHLC",chartData[1].open===645&&chartData[1].high===647&&chartData[1].low===644.5&&chartData[1].close===646.5);
check("proxy request cache key resolves scanner timeframe",ui.requestCacheKey("https://thestrat.phshbone.workers.dev/time-series?symbol=spy&interval=15min&outputsize=100")==="SPY|15");
check("unrelated URLs are not cached",ui.requestCacheKey("https://example.com/time-series?symbol=SPY&interval=15min")===null);
check("renderer dependency is pinned",/lightweight-charts@4\.2\.3/.test(ui.LIGHTWEIGHT_CHARTS_SRC));

let mismatch=false;
try{ui.buildHandoff(card,{symbol:"QQQ",timeframe:"15",bars:series.bars});}catch(error){mismatch=/does not match/.test(error.message);}
check("mismatched series cannot attach to candidate",mismatch);

let missingSymbol=false;
try{ui.normalizeCandidateCard({timeframe:"15"});}catch(error){missingSymbol=/symbol required/.test(error.message);}
check("missing symbol is rejected",missingSymbol);

let missingTf=false;
try{ui.normalizeCandidateCard({symbol:"SPY"});}catch(error){missingTf=/timeframe required/.test(error.message);}
check("missing timeframe is rejected",missingTf);

console.log(JSON.stringify({pass,fail,failures:fail}));
if(fail) process.exit(1);
