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

function cryptoPayload(){return {
  meta:{symbol:"BTC/USD",interval:"15min",timezone:"UTC"},
  values:[
    {datetime:"2026-08-22 04:30:00",open:"115000",high:"115300",low:"114900",close:"115150",volume:"12"},
    {datetime:"2026-08-22 04:45:00",open:"115150",high:"115400",low:"115050",close:"115250",volume:"11"},
    {datetime:"2026-08-22 05:00:00",open:"115250",high:"115700",low:"115200",close:"115650",volume:"15"}
  ]
};}

(async()=>{
  check("5/15/30 are production browser timeframes",ui.normalizeTimeframe("5m")==="5"&&ui.normalizeTimeframe("15")==="15"&&ui.normalizeTimeframe("30min")==="30");
  let blocked=false;try{ui.normalizeTimeframe("60");}catch(_){blocked=true;}check("60m remains blocked",blocked);
  const url=ui.buildProxyUrl({symbol:"spy",timeframe:"15",outputsize:50});
  check("browser request uses Cloudflare proxy",url.startsWith("https://thestrat.phshbone.workers.dev/time-series?"));
  check("browser request contains no API key",!url.toLowerCase().includes("apikey"));

  check("manual scan cap is explicit",ui.MAX_SCAN_SYMBOLS===20);
  check("symbol list normalizes and deduplicates",ui.prepareSymbolList(" spy, QQQ,spy , iwm ").join(",")==="SPY,QQQ,IWM");
  check("slash-form crypto pair is accepted",ui.normalizeSymbol(" btc/usd ")==="BTC/USD"&&ui.isCryptoSymbol("BTC/USD")===true);
  check("stock symbol is not misclassified as crypto",ui.isCryptoSymbol("SPY")===false);
  const cryptoUrl=new URL(ui.buildProxyUrl({symbol:"btc/usd",timeframe:"15",outputsize:50}));
  check("crypto pair is preserved in proxy request",cryptoUrl.searchParams.get("symbol")==="BTC/USD");
  let tooMany=false;try{ui.prepareSymbolList(Array.from({length:21},(_,i)=>`S${i}`));}catch(error){tooMany=/limited to 20/.test(error.message);}check("more than 20 unique symbols is rejected",tooMany);
  let empty=false;try{ui.prepareSymbolList(" , ");}catch(error){empty=/at least one symbol/.test(error.message);}check("empty watchlist is rejected before provider calls",empty);

  check("plain Enter is the live-load shortcut",ui.isLoadShortcut({key:"Enter"})===true);
  check("modified Enter does not trigger live load",ui.isLoadShortcut({key:"Enter",ctrlKey:true})===false&&ui.isLoadShortcut({key:"Enter",shiftKey:true})===false);
  check("IME composition Enter does not trigger live load",ui.isLoadShortcut({key:"Enter",isComposing:true})===false);
  check("non-Enter key does not trigger live load",ui.isLoadShortcut({key:"Tab"})===false);

  const saved=ui.buildSavedWatchlist(" spy, qqq, spy ","15m");
  check("saved watchlist normalizes symbols and timeframe",saved.symbols.join(",")==="SPY,QQQ"&&saved.timeframe==="15"&&saved.version===1);
  const savedCrypto=ui.buildSavedWatchlist(" btc/usd, eth/usd ","5m");
  check("saved watchlist retains crypto pairs",savedCrypto.symbols.join(",")==="BTC/USD,ETH/USD"&&savedCrypto.timeframe==="5");
  const restored=ui.parseSavedWatchlist(JSON.stringify(saved));
  check("saved watchlist round-trips without provider access",restored.symbols.join(",")==="SPY,QQQ"&&restored.timeframe==="15");
  let oldFormat=false;try{ui.parseSavedWatchlist(JSON.stringify({version:2,symbols:["SPY"],timeframe:"15"}));}catch(error){oldFormat=/not supported/.test(error.message);}check("unsupported saved watchlist format is rejected",oldFormat);

  const series=ui.normalizePayload(payload(),{symbol:"SPY",timeframe:"15"});
  check("provider bars are sorted ascending",series.bars[0].datetime==="2026-08-21 13:30:00"&&series.bars[2].datetime==="2026-08-21 14:00:00");
  check("RTH semantic provenance is attached",series.bars[0].semantics?.session==="REGULAR"&&series.bars[0].semantics?.barAnchor==="US_EQUITY_RTH_0930"&&series.bars[0].semantics?.marketType==="US_EQUITY");
  check("semantic key is retained",typeof series.bars[2].semanticKey==="string"&&series.bars[2].semanticKey.includes("SPY|15"));

  const cryptoSeries=ui.normalizePayload(cryptoPayload(),{symbol:"BTC/USD",timeframe:"15"});
  check("Saturday crypto bars are accepted",cryptoSeries.bars.length===3&&cryptoSeries.marketType==="CRYPTO");
  check("crypto uses 24/7 UTC semantics",cryptoSeries.bars[0].semantics?.session==="CONTINUOUS_24_7"&&cryptoSeries.bars[0].semantics?.marketTimezone==="UTC"&&cryptoSeries.bars[0].semantics?.barAnchor==="UTC_0000_CONTINUOUS");
  check("crypto UTC anchor offset is deterministic",cryptoSeries.bars[0].semantics?.barAnchorOffsetMinutes===270&&cryptoSeries.bars[2].semantics?.barAnchorOffsetMinutes===300);
  check("crypto semantic key is explicit",cryptoSeries.bars[0].semanticKey.includes("CONTINUOUS_24_7")&&cryptoSeries.bars[0].semanticKey.includes("UTC_0000_CONTINUOUS"));

  const continuity=ui.deriveIntradayContinuity(series);
  check("15m stream derives 30m and 15m FTFC locally",continuity.states.map(x=>x.timeframe).join(",")==="30,15");
  check("derived FTFC uses current price versus each period open",continuity.states.every(x=>x.currentPrice===9.8&&x.periodOpen===8));
  check("derived 15m FTFC resolves full bullish continuity",continuity.alignment==="FULL_BULLISH");
  check("derived FTFC is explicitly validated-intraday scope",continuity.scope==="VALIDATED_INTRADAY");
  check("30m-only stream does not overclaim FTFC",ui.deriveIntradayContinuity({timeframe:"30",bars:[series.bars[2]]}).alignment==="NO_DATA");

  const cryptoContinuity=ui.deriveIntradayContinuity(cryptoSeries);
  check("crypto FTFC uses validated 24/7 scope",cryptoContinuity.scope==="VALIDATED_CRYPTO_24_7");
  check("crypto FTFC derives from same stream",cryptoContinuity.states.length===2&&cryptoContinuity.states.every(x=>x.source==="DERIVED_FROM_VALIDATED_CRYPTO_STREAM"));

  const candidate=ui.buildCandidate(series,{engine:core,scannerCardApi:scanner,now:Date.parse("2026-08-21T14:05:00Z")});
  check("deterministic core detects live 2-2",candidate.setup.name==="2-2"&&candidate.setup.direction==="BULLISH");
  check("live signal is actionable before source bar closes",candidate.signal?.actionable===true&&candidate.card.actionable===true);
  check("live candidate carries derived FTFC context",candidate.card.ftfc?.alignment==="FULL_BULLISH"&&candidate.card.ftfc?.status==="ALIGNED"&&candidate.card.ftfc?.states?.length===2);
  check("compact FTFC text is readable",ui.ftfcText(candidate.card)==="BULL 2/2");
  check("live candidate keeps R:R unknown without stop",candidate.card.rewardRisk===null&&candidate.card.rewardRiskStatus==="UNKNOWN");
  check("unknown R:R renders as dash instead of zero",ui.rewardRiskText(candidate.card)==="—");
  check("real numeric R:R still renders",ui.rewardRiskText({rewardRisk:3.83})==="3.83R");
  check("no probability is manufactured",candidate.card.probabilityScore===null);

  const cryptoCandidate=ui.buildCandidate(cryptoSeries,{engine:core,scannerCardApi:scanner,now:Date.parse("2026-08-22T05:05:00Z")});
  check("crypto candidate retains market type",cryptoCandidate.card.marketType==="CRYPTO"&&cryptoCandidate.signal?.metadata?.marketType==="CRYPTO");

  const liveCopy=ui.consoleModeCopy("LIVE");
  check("live mode badge is explicit",liveCopy.badge==="LIVE CANDIDATES");
  check("live mode does not claim Monitor is live",/sample Monitor/.test(liveCopy.subtitle));
  check("live mode has broker verification guardrail",liveCopy.referencePriceNotice==="REFERENCE PRICE — VERIFY WITH BROKER");
  check("live mode note explains zero-cost local FTFC derivation",/adds no provider calls/.test(liveCopy.note));
  check("live mode note states bounded manual scan",/capped at 20 unique symbols/.test(liveCopy.note));
  check("live mode note distinguishes equity and crypto semantics",/09:30 RTH/.test(liveCopy.note)&&/24\/7 UTC/.test(liveCopy.note));
  const sampleCopy=ui.consoleModeCopy("SAMPLE");
  check("sample mode restores sample badge",sampleCopy.badge==="SAMPLE DATA"&&sampleCopy.referencePriceNotice===null);

  const expired=ui.buildCandidate(series,{engine:core,scannerCardApi:scanner,now:Date.parse("2026-08-21T14:20:00Z")});
  check("expired live bar cannot stay actionable",expired.signal?.expired===true&&expired.card.actionable===false);

  let outside=false;try{ui.attachSemantics({datetime:"2026-08-21 12:00:00",open:1,high:2,low:1,close:2},{symbol:"SPY",timeframe:"15",providerAggregation:"15min"});}catch(_){outside=true;}check("pre-market bars are rejected for RTH production semantics",outside);
  let badCryptoAnchor=false;try{ui.attachSemantics({datetime:"2026-08-22 05:07:00",open:1,high:2,low:1,close:2},{symbol:"BTC/USD",timeframe:"15",providerAggregation:"15min"});}catch(_){badCryptoAnchor=true;}check("misaligned crypto bars are rejected",badCryptoAnchor);

  let fetchCount=0;const fakeFetch=async()=>{fetchCount+=1;return {ok:true,json:async()=>payload()};};
  const scan=await ui.scan({symbols:["SPY","QQQ","SPY"],timeframe:"15",fetchImpl:fakeFetch,engine:core,scannerCardApi:scanner,now:Date.parse("2026-08-21T14:05:00Z")});
  check("browser watchlist scan returns ranked cards",scan.requested===2&&scan.succeeded===2&&scan.cards.length===2);
  check("duplicate symbols do not create duplicate provider calls",fetchCount===2);
  check("derived FTFC adds no provider calls",fetchCount===scan.requested);
  check("scan identifies manual bounded mode",scan.manual===true&&scan.maxSymbols===20);

  let cryptoFetchCount=0;const fakeCryptoFetch=async()=>{cryptoFetchCount+=1;return {ok:true,json:async()=>cryptoPayload()};};
  const cryptoScan=await ui.scan({symbols:["BTC/USD"],timeframe:"15",fetchImpl:fakeCryptoFetch,engine:core,scannerCardApi:scanner,now:Date.parse("2026-08-22T05:05:00Z")});
  check("crypto scan uses same deterministic scanner path",cryptoScan.requested===1&&cryptoScan.succeeded===1&&cryptoScan.cards[0]?.marketType==="CRYPTO");
  check("crypto scan adds no extra provider calls",cryptoFetchCount===1);

  console.log(JSON.stringify({pass,fail,failures:fail}));
  if(fail) process.exit(1);
})().catch(error=>{console.error(error);process.exit(1);});