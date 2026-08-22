"use strict";

(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  if(root) root.StratLiveCandidatesUI=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const DEFAULT_PROXY_BASE="https://thestrat.phshbone.workers.dev";
  const INTERVALS={"5":"5min","15":"15min","30":"30min"};
  const MAX_SCAN_SYMBOLS=20;
  const WATCHLIST_STORAGE_KEY="strat.liveCandidates.watchlist.v1";
  const INTRADAY_CONTINUITY_LADDER={"5":["30","15","5"],"15":["30","15"],"30":["30"]};

  function normalizeTimeframe(value){
    const raw=String(value||"").trim().toUpperCase();
    const aliases={"5M":"5","15M":"15","30M":"30","5MIN":"5","15MIN":"15","30MIN":"30"};
    const tf=aliases[raw]||raw;
    if(!INTERVALS[tf]) throw new Error("live Candidates supports 5, 15, or 30 minutes only");
    return tf;
  }

  function isCryptoSymbol(value){
    return /^[A-Z0-9.\-]{1,15}\/[A-Z0-9.\-]{1,15}$/.test(String(value||"").trim().toUpperCase());
  }

  function normalizeSymbol(value){
    const symbol=String(value||"").trim().toUpperCase();
    const equity=/^[A-Z0-9.\-]{1,20}$/.test(symbol),crypto=isCryptoSymbol(symbol);
    if(!symbol||(!equity&&!crypto)) throw new Error("invalid symbol");
    return symbol;
  }

  function prepareSymbolList(value,{maxSymbols=MAX_SCAN_SYMBOLS}={}){
    const raw=Array.isArray(value)?value:String(value||"").split(",");
    const list=[];const seen=new Set();
    for(const item of raw){
      if(String(item||"").trim()==="") continue;
      const symbol=normalizeSymbol(item);
      if(seen.has(symbol)) continue;
      seen.add(symbol);list.push(symbol);
    }
    if(!list.length) throw new Error("at least one symbol required");
    const max=Number(maxSymbols);
    if(!Number.isInteger(max)||max<1) throw new Error("maxSymbols must be a positive integer");
    if(list.length>max) throw new Error(`manual live scan is limited to ${max} unique symbols per run`);
    return list;
  }

  function isLoadShortcut(event){return event?.key==="Enter"&&!event.shiftKey&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.isComposing;}
  function buildSavedWatchlist(symbols,timeframe){return {version:1,symbols:prepareSymbolList(symbols),timeframe:normalizeTimeframe(timeframe)};}
  function parseSavedWatchlist(value){const record=typeof value==="string"?JSON.parse(value):value;if(!record||Number(record.version)!==1) throw new Error("saved watchlist format is not supported");return buildSavedWatchlist(record.symbols,record.timeframe);}
  function finiteValue(value){return value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value));}
  function rewardRiskText(card){return finiteValue(card?.rewardRisk)?`${Number(card.rewardRisk).toFixed(2)}R`:"—";}

  function ftfcText(card){
    const ftfc=card?.ftfc||{},alignment=String(ftfc.alignment||"");
    if(!alignment||alignment==="NO_DATA") return "—";
    const states=Array.isArray(ftfc.states)?ftfc.states:[],total=states.length;
    const bullish=states.filter(row=>row.state==="BULLISH").length,bearish=states.filter(row=>row.state==="BEARISH").length;
    if(alignment==="FULL_BULLISH"||alignment==="BULLISH_MAJORITY") return total?`BULL ${bullish}/${total}`:"BULL";
    if(alignment==="FULL_BEARISH"||alignment==="BEARISH_MAJORITY") return total?`BEAR ${bearish}/${total}`:"BEAR";
    if(alignment==="MIXED") return "MIXED";
    return alignment;
  }

  function consoleModeCopy(mode){
    const live=String(mode||"").toUpperCase()==="LIVE";
    return live?{
      badge:"LIVE CANDIDATES",
      subtitle:"Deterministic engine monitor • live Candidates • sample Monitor",
      referencePriceNotice:"REFERENCE PRICE — VERIFY WITH BROKER",
      note:"Live scanner cards use the deterministic scanner-card/setup-context model. US equities use validated 09:30 RTH semantics; slash-form crypto pairs use validated 24/7 UTC semantics. Intraday FTFC is derived locally from the same bar stream, so it adds no provider calls. A 30m-only scan leaves FTFC unknown until higher validated context is available. Manual scans are capped at 20 unique symbols and one timeframe per run. Context supports a setup; it cannot create one."
    }:{badge:"SAMPLE DATA",subtitle:"Deterministic engine monitor • shared setup context • sample-data mode",referencePriceNotice:null,note:"Sample cards use the same scanner-card/setup-context model intended for Practice Mode and Trade Coach. Context supports a setup; it cannot create one."};
  }

  function parseUtc(value){
    const raw=String(value||"").trim();let iso=raw;
    if(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(raw)) iso=raw.replace(" ","T")+(raw.length===16?":00Z":"Z");
    else if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(raw)) iso=raw+(raw.length===16?":00Z":"Z");
    const epoch=Date.parse(iso);if(!Number.isFinite(epoch)) throw new Error("provider timestamp must be parseable UTC");return epoch;
  }

  function partsForZone(epoch,timeZone){
    const formatter=new Intl.DateTimeFormat("en-US",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
    return Object.fromEntries(formatter.formatToParts(new Date(epoch)).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
  }
  function nyParts(epoch){return partsForZone(epoch,"America/New_York");}
  function utcParts(epoch){return partsForZone(epoch,"UTC");}

  function attachEquitySemantics(bar,{symbol,timeframe,providerAggregation}){
    const tf=normalizeTimeframe(timeframe),intervalMinutes=Number(tf),epoch=parseUtc(bar.datetime||bar.rawDatetime||bar.time),p=nyParts(epoch);
    const minuteOfDay=Number(p.hour)*60+Number(p.minute),rthOpen=570,rthClose=960;
    if(Number(p.second)!==0) throw new Error("intraday bar open must be minute-aligned");
    if(minuteOfDay<rthOpen||minuteOfDay>=rthClose) throw new Error("intraday bar open is outside regular session");
    const offset=minuteOfDay-rthOpen;if(offset%intervalMinutes!==0) throw new Error("intraday bar open is not aligned to 09:30 RTH anchor");
    const closeEpoch=epoch+intervalMinutes*60000,cp=nyParts(closeEpoch),closeMinute=Number(cp.hour)*60+Number(cp.minute),date=`${p.year}-${p.month}-${p.day}`;
    if(`${cp.year}-${cp.month}-${cp.day}`!==date||closeMinute>rthClose) throw new Error("intraday bar extends beyond regular session");
    const sym=normalizeSymbol(symbol),hhmm=`${p.hour}:${p.minute}`,periodOpenId=`${sym}|${tf}|${date}|REGULAR|${hhmm}`,barOpenTimestamp=new Date(epoch).toISOString();
    const semantics={symbol:sym,timeframe:tf,marketType:"US_EQUITY",marketTimezone:"America/New_York",session:"REGULAR",extendedHoursIncluded:false,barAnchor:"US_EQUITY_RTH_0930",barAnchorOffsetMinutes:offset,provider:"TWELVE_DATA",providerAggregation:providerAggregation||INTERVALS[tf],periodOpenId,periodOpenTimestamp:barOpenTimestamp,barOpenTimestamp,barCloseTimestamp:new Date(closeEpoch).toISOString()};
    return {...bar,semantics,semanticKey:[sym,tf,"America/New_York","REGULAR","NOEXT","US_EQUITY_RTH_0930",String(offset),"TWELVE_DATA",semantics.providerAggregation,periodOpenId].join("|")};
  }

  function attachCryptoSemantics(bar,{symbol,timeframe,providerAggregation}){
    const tf=normalizeTimeframe(timeframe),intervalMinutes=Number(tf),epoch=parseUtc(bar.datetime||bar.rawDatetime||bar.time),p=utcParts(epoch);
    const minuteOfDay=Number(p.hour)*60+Number(p.minute);
    if(Number(p.second)!==0) throw new Error("crypto bar open must be minute-aligned");
    if(minuteOfDay%intervalMinutes!==0) throw new Error("crypto bar open is not aligned to the UTC midnight anchor");
    const sym=normalizeSymbol(symbol),date=`${p.year}-${p.month}-${p.day}`,hhmm=`${p.hour}:${p.minute}`,barOpenTimestamp=new Date(epoch).toISOString(),closeEpoch=epoch+intervalMinutes*60000;
    const periodOpenId=`${sym}|${tf}|${date}|CONTINUOUS_24_7|${hhmm}`;
    const semantics={symbol:sym,timeframe:tf,marketType:"CRYPTO",marketTimezone:"UTC",session:"CONTINUOUS_24_7",extendedHoursIncluded:false,barAnchor:"UTC_0000_CONTINUOUS",barAnchorOffsetMinutes:minuteOfDay,provider:"TWELVE_DATA",providerAggregation:providerAggregation||INTERVALS[tf],periodOpenId,periodOpenTimestamp:barOpenTimestamp,barOpenTimestamp,barCloseTimestamp:new Date(closeEpoch).toISOString()};
    return {...bar,semantics,semanticKey:[sym,tf,"UTC","CONTINUOUS_24_7","24X7","UTC_0000_CONTINUOUS",String(minuteOfDay),"TWELVE_DATA",semantics.providerAggregation,periodOpenId].join("|")};
  }

  function attachSemantics(bar,{symbol,timeframe,providerAggregation}){
    const sym=normalizeSymbol(symbol);
    return isCryptoSymbol(sym)?attachCryptoSemantics(bar,{symbol:sym,timeframe,providerAggregation}):attachEquitySemantics(bar,{symbol:sym,timeframe,providerAggregation});
  }

  function normalizePayload(payload,{symbol,timeframe}){
    if(payload?.status==="error") throw new Error(payload.message||payload.code||"provider error");
    const tf=normalizeTimeframe(timeframe),sym=normalizeSymbol(symbol),rows=Array.isArray(payload?.values)?payload.values:[];
    if(!rows.length) throw new Error("provider returned no bars");
    const bars=rows.map((row,index)=>{
      const open=Number(row.open),high=Number(row.high),low=Number(row.low),close=Number(row.close);
      if(![open,high,low,close].every(Number.isFinite)) throw new Error(`invalid OHLC at row ${index}`);
      const base={datetime:String(row.datetime),rawDatetime:String(row.datetime),open,high,low,close,provider:"TWELVE_DATA",providerTimeframe:payload?.meta?.interval||INTERVALS[tf],timeframe:tf,symbol:sym};
      if(row.volume!==undefined&&row.volume!==null&&row.volume!==""&&Number.isFinite(Number(row.volume))) base.volume=Number(row.volume);
      return attachSemantics(base,{symbol:sym,timeframe:tf,providerAggregation:payload?.meta?.interval||INTERVALS[tf]});
    });
    bars.sort((a,b)=>String(a.datetime).localeCompare(String(b.datetime)));
    return {source:"LIVE_PROXY",provider:"TWELVE_DATA",marketType:isCryptoSymbol(sym)?"CRYPTO":"US_EQUITY",symbol:sym,timeframe:tf,interval:INTERVALS[tf],bars};
  }

  function semanticDate(bar){return String(bar?.semantics?.periodOpenId||"").split("|")[2]||null;}

  function deriveIntradayContinuity(series){
    const tf=normalizeTimeframe(series?.timeframe),bars=Array.isArray(series?.bars)?series.bars:[],current=bars.at(-1),crypto=String(series?.marketType||current?.semantics?.marketType||"")==="CRYPTO";
    const scope=crypto?"VALIDATED_CRYPTO_24_7":"VALIDATED_INTRADAY";
    if(!current||!finiteValue(current.close)||!finiteValue(current?.semantics?.barAnchorOffsetMinutes)) return {alignment:"NO_DATA",states:[],scope,sourceTimeframe:tf};
    const price=Number(current.close),currentOffset=Number(current.semantics.barAnchorOffsetMinutes),currentDate=semanticDate(current),targets=INTRADAY_CONTINUITY_LADDER[tf]||[],states=[];
    for(const target of targets){
      const minutes=Number(target),bucketStart=Math.floor(currentOffset/minutes)*minutes;
      const openingBar=bars.find(bar=>semanticDate(bar)===currentDate&&Number(bar?.semantics?.barAnchorOffsetMinutes)===bucketStart);
      if(!openingBar||!finiteValue(openingBar.open)) continue;
      const periodOpen=Number(openingBar.open),state=price>periodOpen?"BULLISH":price<periodOpen?"BEARISH":"FLAT";
      states.push({timeframe:target,state,currentPrice:price,periodOpen,periodOpenTimestamp:openingBar.semantics?.barOpenTimestamp||null,source:crypto?"DERIVED_FROM_VALIDATED_CRYPTO_STREAM":"DERIVED_FROM_VALIDATED_INTRADAY_STREAM"});
    }
    if(states.length<2) return {alignment:"NO_DATA",states,scope,sourceTimeframe:tf};
    const bullish=states.filter(row=>row.state==="BULLISH").length,bearish=states.filter(row=>row.state==="BEARISH").length;let alignment="MIXED";
    if(bullish===states.length) alignment="FULL_BULLISH";else if(bearish===states.length) alignment="FULL_BEARISH";else if(bullish>bearish) alignment="BULLISH_MAJORITY";else if(bearish>bullish) alignment="BEARISH_MAJORITY";
    return {alignment,states,scope,sourceTimeframe:tf};
  }

  function buildProxyUrl({symbol,timeframe,outputsize=100,proxyBase=DEFAULT_PROXY_BASE}){
    const tf=normalizeTimeframe(timeframe),sym=normalizeSymbol(symbol),n=Number(outputsize);if(!Number.isInteger(n)||n<3||n>5000) throw new Error("outputsize must be an integer from 3 to 5000");
    const base=new URL(String(proxyBase));base.pathname=base.pathname.replace(/\/+$/g,"")+"/time-series";base.search="";base.hash="";base.searchParams.set("symbol",sym);base.searchParams.set("interval",INTERVALS[tf]);base.searchParams.set("outputsize",String(n));return base.toString();
  }

  async function fetchSeries({symbol,timeframe,outputsize=100,proxyBase=DEFAULT_PROXY_BASE,fetchImpl=globalThis.fetch}){
    if(typeof fetchImpl!=="function") throw new Error("fetch implementation required");
    const response=await fetchImpl(buildProxyUrl({symbol,timeframe,outputsize,proxyBase}),{headers:{Accept:"application/json"}});if(!response||response.ok===false) throw new Error(`market data proxy HTTP ${response?.status||"error"}`);return normalizePayload(await response.json(),{symbol,timeframe});
  }

  function buildCandidate(series,{engine,scannerCardApi,now=Date.now()}={}){
    if(!engine||typeof engine.detectSetup!=="function") throw new Error("deterministic engine required");if(!scannerCardApi||typeof scannerCardApi.buildScannerCard!=="function") throw new Error("scanner card API required");
    const bars=series?.bars||[];if(bars.length<3) throw new Error("at least three semantic bars required");
    const current=bars.at(-1),price=Number(current.close),setup=engine.detectSetup(bars),continuity=deriveIntradayContinuity(series);
    const directional=["BULLISH","BEARISH"].includes(setup?.direction)&&Number.isFinite(Number(setup?.trigger));const closeAt=Date.parse(current?.semantics?.barCloseTimestamp||""),expired=Number.isFinite(closeAt)&&Number(now)>=closeAt;
    const inForce=directional?(setup.direction==="BULLISH"?price>Number(setup.trigger):price<Number(setup.trigger)):false;
    const magnitudeHit=directional&&Number.isFinite(Number(setup.magnitude))?(setup.direction==="BULLISH"?price>=Number(setup.magnitude):price<=Number(setup.magnitude)):false;
    const actionable=directional&&!expired&&inForce&&!magnitudeHit&&setup.pathResolved!==false;
    const signal=directional?{setupId:setup.name,setupFamily:setup.name,direction:setup.direction,timeframe:series.timeframe,trigger:Number(setup.trigger),magnitude:Number.isFinite(Number(setup.magnitude))?Number(setup.magnitude):null,reference:setup.reference||null,currentType:setup.currentType||null,pathResolved:setup.pathResolved!==false,dataSemantics:current.semantics||null,semanticKey:current.semanticKey||null,actionable,expired,metadata:{marketDataSource:"LIVE_PROXY",provider:"TWELVE_DATA",marketType:series.marketType||current?.semantics?.marketType||null,interval:series.interval}}:null;
    const card=scannerCardApi.buildScannerCard({symbol:series.symbol,timeframe:series.timeframe,signals:signal?[signal]:[],primarySignal:signal,ftfc:continuity,entry:signal?.trigger??null,stop:null,target:signal?.magnitude??null,observedAt:new Date(Number(now)).toISOString(),price});
    card.ftfc={...card.ftfc,states:continuity.states,scope:continuity.scope,sourceTimeframe:continuity.sourceTimeframe};card.marketType=series.marketType||current?.semantics?.marketType||null;
    return {series,setup,signal,card,continuity,expired,actionable};
  }

  async function scan({symbols,timeframe="15",outputsize=100,fetchImpl=globalThis.fetch,engine,scannerCardApi,now=Date.now(),maxSymbols=MAX_SCAN_SYMBOLS}={}){
    const list=prepareSymbolList(symbols,{maxSymbols}),candidates=[],errors=[];
    for(const symbol of list){try{candidates.push(buildCandidate(await fetchSeries({symbol,timeframe,outputsize,fetchImpl}),{engine,scannerCardApi,now}));}catch(error){errors.push({symbol,timeframe:String(timeframe),error:error?.message||String(error)});}}
    return {requested:list.length,succeeded:candidates.length,failed:errors.length,candidates,cards:scannerCardApi.rankScannerCards(candidates.map(x=>x.card)),errors,manual:true,maxSymbols};
  }

  function installResearchConsole(){
    if(typeof document==="undefined"||typeof window==="undefined"||window.__stratLiveCandidatesInstalled) return false;
    if(typeof renderCandidates!=="function"||typeof sampleScannerCards!=="function"||!window.StratScannerCard||typeof detectSetup!=="function") return false;
    window.__stratLiveCandidatesInstalled=true;const originalRenderCandidates=renderCandidates;let liveCards=null;
    const card=document.querySelector("#candidates .card"),toolbar=document.querySelector("#candidates .toolbar");if(!card||!toolbar) return false;
    const controls=document.createElement("div");controls.className="toolbar";
    controls.innerHTML='<input id="liveCandidateSymbols" value="SPY,QQQ,IWM" aria-label="Live candidate symbols" style="min-width:180px"><select id="liveCandidateTimeframe" aria-label="Live candidate timeframe"><option value="5">5m</option><option value="15" selected>15m</option><option value="30">30m</option></select><button class="btn" id="loadLiveCandidates" type="button">Load live</button><button class="btn secondary" id="saveLiveWatchlist" type="button">Save list</button><button class="btn secondary" id="loadSavedWatchlist" type="button">Load saved</button><button class="btn secondary" id="useSampleCandidates" type="button">Use sample</button><span id="liveCandidateStatus" class="small">Sample cards active</span><span id="liveCandidateBudget" class="small">Enter = Load live • max 20 unique symbols • one timeframe • stocks or crypto pairs like BTC/USD • no auto-refresh</span>';
    toolbar.parentNode.insertBefore(controls,toolbar);const heading=card.querySelector("h2");if(heading) heading.textContent="Candidate Ranking — Deterministic Scanner";
    const candidateNote=Array.from(card.querySelectorAll(".small")).at(-1)||null,symbolsInput=document.querySelector("#liveCandidateSymbols"),timeframeSelect=document.querySelector("#liveCandidateTimeframe"),loadButton=document.querySelector("#loadLiveCandidates"),status=document.querySelector("#liveCandidateStatus");

    function setConsoleMode(mode){
      const copy=consoleModeCopy(mode),badge=document.querySelector(".topbar .badge"),subtitle=document.querySelector(".topbar .subtitle");let priceNotice=document.querySelector("#liveReferencePriceNotice");
      if(!priceNotice&&subtitle?.parentNode){priceNotice=document.createElement("div");priceNotice.id="liveReferencePriceNotice";priceNotice.className="small warn";priceNotice.style.cssText="margin-top:4px;font-weight:900;letter-spacing:.04em";priceNotice.title="Twelve Data reference feed. Confirm execution price in your broker before trading.";subtitle.parentNode.appendChild(priceNotice);}
      if(badge) badge.textContent=copy.badge;if(subtitle) subtitle.textContent=copy.subtitle;if(candidateNote) candidateNote.textContent=copy.note;if(priceNotice){priceNotice.textContent=copy.referencePriceNotice||"";priceNotice.hidden=!copy.referencePriceNotice;}
    }

    function renderLive(){
      if(!liveCards) return originalRenderCandidates();rankedCards=liveCards.slice();
      const d=document.querySelector("#directionFilter")?.value||"ALL",s=document.querySelector("#statusFilter")?.value||"ALL",rows=rankedCards.filter(c=>(d==="ALL"||(d==="NONE"?!c.direction:c.direction===d))&&(s==="ALL"||c.advisoryState===s));
      const esc2=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])),fmt2=n=>finiteValue(n)?`$${Number(n).toFixed(2)}`:"—",st=c=>c.advisoryState==="ACTIVE_TRADE_CONTEXT"?"ACTIVE":c.advisoryState==="WATCH_ACTIONABLE_SETUP"?"WATCH":"WAIT",body=document.querySelector("#candidateBody");
      body.innerHTML=rows.map(c=>{const rank=rankedCards.indexOf(c)+1;return `<tr><td>${rank}</td><td><strong>${esc2(c.symbol)}</strong></td><td class="${c.direction==="BULLISH"?"ok":c.direction==="BEARISH"?"bad":"warn"}">${esc2(c.direction||"—")}</td><td>${fmt2(c.price)}</td><td>${esc2(c.timeframe)}</td><td>${esc2(c.setup||"—")}</td><td>${esc2(ftfcText(c))}</td><td>${esc2(c.breadth?.index?.context||"—")}</td><td>${esc2(c.breadth?.sector?.context||"—")}</td><td class="${c.rewardRiskStatus==="PASS"?"ok":c.rewardRiskStatus==="FAIL"?"bad":"warn"}">${rewardRiskText(c)}</td><td><span class="statusPill ${st(c)==="WAIT"?"warn":"ok"}">${st(c)}</span></td><td><button class="btn tiny secondary whyBtn" data-symbol="${esc2(c.symbol)}">Why?</button></td></tr>`}).join("");
      document.querySelectorAll(".whyBtn").forEach(btn=>btn.addEventListener("click",()=>showWhy(btn.dataset.symbol)));if(!rows.length) body.innerHTML='<tr><td colspan="12" class="small">No live cards match this filter.</td></tr>';
    }
    renderCandidates=renderLive;setConsoleMode("SAMPLE");

    async function loadLive(){
      if(loadButton.disabled) return;let symbols;try{symbols=prepareSymbolList(symbolsInput.value);}catch(error){status.textContent=error.message;status.className="small bad";return;}
      const timeframe=timeframeSelect.value;status.textContent=`Loading ${symbols.length} live ${timeframe}m symbols…`;status.className="small warn";loadButton.disabled=true;
      try{const result=await scan({symbols,timeframe,engine:{detectSetup},scannerCardApi:window.StratScannerCard,now:Date.now()});liveCards=result.cards;renderCandidates();setConsoleMode("LIVE");status.textContent=`LIVE PROXY • ${result.succeeded}/${result.requested} loaded${result.failed?` • ${result.failed} failed`:""}`;status.className=result.failed?"small warn":"small ok";}catch(error){status.textContent=`Live scan failed: ${error.message}`;status.className="small bad";}finally{loadButton.disabled=false;}
    }

    loadButton.addEventListener("click",loadLive);symbolsInput.addEventListener("keydown",event=>{if(!isLoadShortcut(event)) return;event.preventDefault();loadButton.click();});
    document.querySelector("#saveLiveWatchlist").addEventListener("click",()=>{try{const record=buildSavedWatchlist(symbolsInput.value,timeframeSelect.value);window.localStorage.setItem(WATCHLIST_STORAGE_KEY,JSON.stringify(record));symbolsInput.value=record.symbols.join(",");status.textContent=`Saved ${record.symbols.length} symbols • ${record.timeframe}m`;status.className="small ok";}catch(error){status.textContent=`Save failed: ${error.message}`;status.className="small bad";}});
    document.querySelector("#loadSavedWatchlist").addEventListener("click",()=>{try{const raw=window.localStorage.getItem(WATCHLIST_STORAGE_KEY);if(!raw) throw new Error("no saved watchlist yet");const record=parseSavedWatchlist(raw);symbolsInput.value=record.symbols.join(",");timeframeSelect.value=record.timeframe;status.textContent=`Saved list loaded • ${record.symbols.length} symbols • press Enter or Load live`;status.className="small ok";}catch(error){status.textContent=`Load saved failed: ${error.message}`;status.className="small bad";}});
    document.querySelector("#useSampleCandidates").addEventListener("click",()=>{liveCards=null;setConsoleMode("SAMPLE");status.textContent="Sample cards active";status.className="small";originalRenderCandidates();});
    return true;
  }

  return {DEFAULT_PROXY_BASE,INTERVALS,MAX_SCAN_SYMBOLS,WATCHLIST_STORAGE_KEY,INTRADAY_CONTINUITY_LADDER,normalizeTimeframe,isCryptoSymbol,normalizeSymbol,prepareSymbolList,isLoadShortcut,buildSavedWatchlist,parseSavedWatchlist,finiteValue,rewardRiskText,ftfcText,consoleModeCopy,parseUtc,nyParts,utcParts,attachEquitySemantics,attachCryptoSemantics,attachSemantics,normalizePayload,semanticDate,deriveIntradayContinuity,buildProxyUrl,fetchSeries,buildCandidate,scan,installResearchConsole};
});