"use strict";

const ui=require("../live-candidates-ui.js");
const core=require("../core-engine-v0.3.js");
const scanner=require("../scanner-card.js");

let pass=0,fail=0;
function check(name,condition){if(condition){pass++;console.log(`PASS ${pass}: ${name}`);}else{fail++;console.error(`FAIL: ${name}`);}}

function payload(){return {
  meta:{symbol:"SPY",interval:"15min",timezone:"UTC"},
  values:[
    {datetime:"2026-08-21 14:00:00",open:"8",high:"9.9",low:"7.6",close:"9.8",volume:"100"},
    {datetime:"2026-08-21 13:30:00",open:"9",high:"10",low:"8",close:"9.2",volume:"100"},
    {datetime:"2026-08-21 13:45:00",open:"9",high:"9.5",low:"7.5",close:"8",volume:"100"}
  ]
};}

(async()=>{
  check("5/15/30 are production browser timeframes",ui.normalizeTimeframe("5m")==="5"&&ui.normalizeTimeframe("15")==="15"&&ui.normalizeTimeframe("30min")==="30");
  let blocked=false;try{ui.normalizeTimeframe("60");}catch(_){blocked=true;}check("60m remains blocked",blocked);
  const url=ui.buildProxyUrl({symbol:"spy",timeframe:"15",outputsize:50});
  check("browser request uses Cloudflare proxy",url.startsWith("https://thestrat.phshbone.workers.dev/time-series?"));
  check("browser request contains no API key",!url.toLowerCase().includes("apikey"));

  const series=ui.normalizePayload(payload(),{symbol:"SPY",timeframe:"15"});
  check("provider bars are sorted ascending",series.bars[0].datetime==="2026-08-21 13:30:00"&&series.bars[2].datetime==="2026-08-21 14:00:00");
  check("RTH semantic provenance is attached",series.bars[0].semantics?.session==="REGULAR"&&series.bars[0].semantics?.barAnchor==="US_EQUITY_RTH_0930");
  check("semantic key is retained",typeof series.bars[2].semanticKey==="string"&&series.bars[2].semanticKey.includes("SPY|15"));

  const candidate=ui.buildCandidate(series,{engine:core,scannerCardApi:scanner,now:Date.parse("2026-08-21T14:05:00Z")});
  check("deterministic core detects live 2-2",candidate.setup.name==="2-2"&&candidate.setup.direction==="BULLISH");
  check("live signal is actionable before source bar closes",candidate.signal?.actionable===true&&candidate.card.actionable===true);
  check("live candidate keeps R:R unknown without stop",candidate.card.rewardRisk===null&&candidate.card.rewardRiskStatus==="UNKNOWN");
  check("unknown R:R renders as dash instead of zero",ui.rewardRiskText(candidate.card)==="—");
  check("real numeric R:R still renders",ui.rewardRiskText({rewardRisk:3.83})==="3.83R");
  check("no probability is manufactured",candidate.card.probabilityScore===null);

  const liveCopy=ui.consoleModeCopy("LIVE");
  check("live mode badge is explicit",liveCopy.badge==="LIVE CANDIDATES");
  check("live mode does not claim Monitor is live",/sample Monitor/.test(liveCopy.subtitle));
  check("live mode note no longer says sample cards",/^Live scanner cards/.test(liveCopy.note));
  const sampleCopy=ui.consoleModeCopy("SAMPLE");
  check("sample mode restores sample badge",sampleCopy.badge==="SAMPLE DATA");

  const expired=ui.buildCandidate(series,{engine:core,scannerCardApi:scanner,now:Date.parse("2026-08-21T14:20:00Z")});
  check("expired live bar cannot stay actionable",expired.signal?.expired===true&&expired.card.actionable===false);

  let outside=false;try{ui.attachSemantics({datetime:"2026-08-21 12:00:00",open:1,high:2,low:1,close:2},{symbol:"SPY",timeframe:"15",providerAggregation:"15min"});}catch(_){outside=true;}check("pre-market bars are rejected for RTH production semantics",outside);

  const fakeFetch=async()=>({ok:true,json:async()=>payload()});
  const scan=await ui.scan({symbols:["SPY","QQQ"],timeframe:"15",fetchImpl:fakeFetch,engine:core,scannerCardApi:scanner,now:Date.parse("2026-08-21T14:05:00Z")});
  check("browser watchlist scan returns ranked cards",scan.requested===2&&scan.succeeded===2&&scan.cards.length===2);

  console.log(JSON.stringify({pass,fail,failures:fail}));
  if(fail) process.exit(1);
})().catch(error=>{console.error(error);process.exit(1);});
