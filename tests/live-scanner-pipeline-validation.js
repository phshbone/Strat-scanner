"use strict";

const {buildLiveScannerCandidate,scanLiveWatchlist}=require("../live-scanner-pipeline.js");

let pass=0,fail=0;
function check(name,condition){
  if(condition){pass++;console.log(`PASS ${pass}: ${name}`);}
  else{fail++;console.error(`FAIL: ${name}`);}
}

function semanticBar({open,high,low,close,time,key}){
  const closeTime=new Date(Date.parse(time)+15*60*1000).toISOString();
  return {
    open,high,low,close,datetime:time,semanticKey:key,
    semantics:{
      symbol:"SPY",timeframe:"15",marketTimezone:"America/New_York",session:"REGULAR",
      extendedHoursIncluded:false,barAnchor:"US_EQUITY_RTH_0930",barAnchorOffsetMinutes:0,
      provider:"TWELVE_DATA",providerAggregation:"15min",periodOpenId:key,
      periodOpenTimestamp:time,barOpenTimestamp:time,barCloseTimestamp:closeTime
    }
  };
}

function bullishSeries(symbol="SPY"){
  const bars=[
    semanticBar({open:9,high:10,low:8,close:9.2,time:"2026-08-21T13:00:00.000Z",key:`${symbol}|15|1`}),
    semanticBar({open:9,high:9.5,low:7.5,close:8,time:"2026-08-21T13:15:00.000Z",key:`${symbol}|15|2`}),
    semanticBar({open:8,high:9.9,low:7.6,close:9.8,time:"2026-08-21T13:30:00.000Z",key:`${symbol}|15|3`})
  ];
  bars.forEach(b=>{b.semantics.symbol=symbol;b.semantics.periodOpenId=b.semanticKey;});
  return {source:"LIVE_PROXY",provider:"TWELVE_DATA",symbol,timeframe:"15",interval:"15min",bars};
}

(async()=>{
  const active=buildLiveScannerCandidate({series:bullishSeries(),observedAt:"2026-08-21T13:35:00.000Z"});
  check("deterministic 2-2 setup detected",active.setup.name==="2-2"&&active.setup.direction==="BULLISH");
  check("setup adapted to signal",active.signal?.setupId==="2-2"&&active.signal?.trigger===9.5);
  check("semantic provenance carried into signal",active.signal?.semanticKey==="SPY|15|3");
  check("live lifecycle is active inside source bar",active.lifecycle?.status==="ACTIVE"&&active.lifecycle?.active===true);
  check("scanner card exposes actionable setup",active.card.actionable===true&&active.card.advisoryState==="WATCH_ACTIONABLE_SETUP");
  check("risk reward remains unknown without explicit stop",active.card.rewardRisk===null&&active.card.rewardRiskStatus==="UNKNOWN");
  check("no probability is manufactured",active.card.probabilityScore===null);

  const expired=buildLiveScannerCandidate({series:bullishSeries(),observedAt:"2026-08-21T14:00:00.000Z"});
  check("expired source bar expires lifecycle",expired.lifecycle?.status==="EXPIRED"&&expired.signal?.expired===true);
  check("expired signal is not actionable",expired.card.actionable===false&&expired.card.advisoryState==="WAIT_NO_ACTIONABLE_SETUP");

  const mockFetch=async({symbol})=>{
    if(symbol==="BAD") throw new Error("mock provider failure");
    return bullishSeries(symbol);
  };
  const scan=await scanLiveWatchlist({
    items:[{symbol:"SPY",timeframe:"15"},{symbol:"BAD",timeframe:"15"},{symbol:"QQQ",timeframe:"15"}],
    fetchSeries:mockFetch,
    observedAt:"2026-08-21T13:35:00.000Z"
  });
  check("watchlist isolates per-symbol failures",scan.requested===3&&scan.succeeded===2&&scan.failed===1);
  check("watchlist returns ranked scanner cards",scan.cards.length===2&&scan.cards.every(c=>c.actionable===true));
  check("watchlist error identifies failed symbol",scan.errors[0]?.symbol==="BAD"&&/provider failure/.test(scan.errors[0]?.error||""));
  check("watchlist cards retain requested symbols",scan.cards.map(c=>c.symbol).sort().join(",")==="QQQ,SPY");

  console.log(JSON.stringify({pass,fail,failures:fail}));
  if(fail) process.exit(1);
})().catch(error=>{console.error(error);process.exit(1);});
