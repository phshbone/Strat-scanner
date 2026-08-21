"use strict";

(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  if(root) root.StratLiveCandidatesUI=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const DEFAULT_PROXY_BASE="https://thestrat.phshbone.workers.dev";
  const INTERVALS={"5":"5min","15":"15min","30":"30min"};

  function normalizeTimeframe(value){
    const raw=String(value||"").trim().toUpperCase();
    const aliases={"5M":"5","15M":"15","30M":"30","5MIN":"5","15MIN":"15","30MIN":"30"};
    const tf=aliases[raw]||raw;
    if(!INTERVALS[tf]) throw new Error("live Candidates supports 5, 15, or 30 minutes only");
    return tf;
  }

  function normalizeSymbol(value){
    const symbol=String(value||"").trim().toUpperCase();
    if(!symbol||!/^[A-Z0-9.\-]{1,20}$/.test(symbol)) throw new Error("invalid symbol");
    return symbol;
  }

  function finiteValue(value){
    return value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value));
  }

  function rewardRiskText(card){
    return finiteValue(card?.rewardRisk)?`${Number(card.rewardRisk).toFixed(2)}R`:"—";
  }

  function consoleModeCopy(mode){
    const live=String(mode||"").toUpperCase()==="LIVE";
    return live?{
      badge:"LIVE CANDIDATES",
      subtitle:"Deterministic engine monitor • live Candidates • sample Monitor",
      note:"Live scanner cards use the deterministic scanner-card/setup-context model. Context supports a setup; it cannot create one."
    }:{
      badge:"SAMPLE DATA",
      subtitle:"Deterministic engine monitor • shared setup context • sample-data mode",
      note:"Sample cards use the same scanner-card/setup-context model intended for Practice Mode and Trade Coach. Context supports a setup; it cannot create one."
    };
  }

  function parseUtc(value){
    const raw=String(value||"").trim();
    let iso=raw;
    if(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(raw)) iso=raw.replace(" ","T")+(raw.length===16?":00Z":"Z");
    else if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(raw)) iso=raw+(raw.length===16?":00Z":"Z");
    const epoch=Date.parse(iso);
    if(!Number.isFinite(epoch)) throw new Error("provider timestamp must be parseable UTC");
    return epoch;
  }

  function nyParts(epoch){
    const formatter=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
    return Object.fromEntries(formatter.formatToParts(new Date(epoch)).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
  }

  function attachSemantics(bar,{symbol,timeframe,providerAggregation}){
    const tf=normalizeTimeframe(timeframe);
    const intervalMinutes=Number(tf);
    const epoch=parseUtc(bar.datetime||bar.rawDatetime||bar.time);
    const p=nyParts(epoch);
    const minuteOfDay=Number(p.hour)*60+Number(p.minute);
    const rthOpen=9*60+30,rthClose=16*60;
    if(Number(p.second)!==0) throw new Error("intraday bar open must be minute-aligned");
    if(minuteOfDay<rthOpen||minuteOfDay>=rthClose) throw new Error("intraday bar open is outside regular session");
    const offset=minuteOfDay-rthOpen;
    if(offset%intervalMinutes!==0) throw new Error("intraday bar open is not aligned to 09:30 RTH anchor");
    const closeEpoch=epoch+intervalMinutes*60*1000;
    const cp=nyParts(closeEpoch);
    const closeMinute=Number(cp.hour)*60+Number(cp.minute);
    const date=`${p.year}-${p.month}-${p.day}`;
    if(`${cp.year}-${cp.month}-${cp.day}`!==date||closeMinute>rthClose) throw new Error("intraday bar extends beyond regular session");
    const sym=normalizeSymbol(symbol);
    const hhmm=`${p.hour}:${p.minute}`;
    const periodOpenId=`${sym}|${tf}|${date}|REGULAR|${hhmm}`;
    const barOpenTimestamp=new Date(epoch).toISOString();
    const semantics={symbol:sym,timeframe:tf,marketTimezone:"America/New_York",session:"REGULAR",extendedHoursIncluded:false,barAnchor:"US_EQUITY_RTH_0930",barAnchorOffsetMinutes:offset,provider:"TWELVE_DATA",providerAggregation:providerAggregation||INTERVALS[tf],periodOpenId,periodOpenTimestamp:barOpenTimestamp,barOpenTimestamp,barCloseTimestamp:new Date(closeEpoch).toISOString()};
    return {...bar,semantics,semanticKey:[sym,tf,"America/New_York","REGULAR","NOEXT","US_EQUITY_RTH_0930",String(offset),"TWELVE_DATA",semantics.providerAggregation,periodOpenId].join("|")};
  }

  function normalizePayload(payload,{symbol,timeframe}){
    if(payload?.status==="error") throw new Error(payload.message||payload.code||"provider error");
    const tf=normalizeTimeframe(timeframe);
    const sym=normalizeSymbol(symbol);
    const rows=Array.isArray(payload?.values)?payload.values:[];
    if(!rows.length) throw new Error("provider returned no bars");
    const bars=rows.map((row,index)=>{
      const open=Number(row.open),high=Number(row.high),low=Number(row.low),close=Number(row.close);
      if(![open,high,low,close].every(Number.isFinite)) throw new Error(`invalid OHLC at row ${index}`);
      const base={datetime:String(row.datetime),rawDatetime:String(row.datetime),open,high,low,close,provider:"TWELVE_DATA",providerTimeframe:payload?.meta?.interval||INTERVALS[tf],timeframe:tf,symbol:sym};
      if(row.volume!==undefined&&row.volume!==null&&row.volume!==""&&Number.isFinite(Number(row.volume))) base.volume=Number(row.volume);
      return attachSemantics(base,{symbol:sym,timeframe:tf,providerAggregation:payload?.meta?.interval||INTERVALS[tf]});
    });
    bars.sort((a,b)=>String(a.datetime).localeCompare(String(b.datetime)));
    return {source:"LIVE_PROXY",provider:"TWELVE_DATA",symbol:sym,timeframe:tf,interval:INTERVALS[tf],bars};
  }

  function buildProxyUrl({symbol,timeframe,outputsize=100,proxyBase=DEFAULT_PROXY_BASE}){
    const tf=normalizeTimeframe(timeframe);
    const sym=normalizeSymbol(symbol);
    const n=Number(outputsize);
    if(!Number.isInteger(n)||n<3||n>5000) throw new Error("outputsize must be an integer from 3 to 5000");
    const base=new URL(String(proxyBase));
    base.pathname=base.pathname.replace(/\/+$/g,"")+"/time-series";
    base.search="";base.hash="";
    base.searchParams.set("symbol",sym);
    base.searchParams.set("interval",INTERVALS[tf]);
    base.searchParams.set("outputsize",String(n));
    return base.toString();
  }

  async function fetchSeries({symbol,timeframe,outputsize=100,proxyBase=DEFAULT_PROXY_BASE,fetchImpl=globalThis.fetch}){
    if(typeof fetchImpl!=="function") throw new Error("fetch implementation required");
    const url=buildProxyUrl({symbol,timeframe,outputsize,proxyBase});
    const response=await fetchImpl(url,{headers:{Accept:"application/json"}});
    if(!response||response.ok===false) throw new Error(`market data proxy HTTP ${response?.status||"error"}`);
    return normalizePayload(await response.json(),{symbol,timeframe});
  }

  function buildCandidate(series,{engine,scannerCardApi,now=Date.now()}={}){
    if(!engine||typeof engine.detectSetup!=="function") throw new Error("deterministic engine required");
    if(!scannerCardApi||typeof scannerCardApi.buildScannerCard!=="function") throw new Error("scanner card API required");
    const bars=series?.bars||[];
    if(bars.length<3) throw new Error("at least three semantic bars required");
    const current=bars[bars.length-1];
    const price=Number(current.close);
    const setup=engine.detectSetup(bars);
    const directional=["BULLISH","BEARISH"].includes(setup?.direction)&&Number.isFinite(Number(setup?.trigger));
    const closeAt=Date.parse(current?.semantics?.barCloseTimestamp||"");
    const expired=Number.isFinite(closeAt)&&Number(now)>=closeAt;
    const inForce=directional?(setup.direction==="BULLISH"?price>Number(setup.trigger):price<Number(setup.trigger)):false;
    const magnitudeHit=directional&&Number.isFinite(Number(setup.magnitude))?(setup.direction==="BULLISH"?price>=Number(setup.magnitude):price<=Number(setup.magnitude)):false;
    const actionable=directional&&!expired&&inForce&&!magnitudeHit&&setup.pathResolved!==false;
    const signal=directional?{setupId:setup.name,setupFamily:setup.name,direction:setup.direction,timeframe:series.timeframe,trigger:Number(setup.trigger),magnitude:Number.isFinite(Number(setup.magnitude))?Number(setup.magnitude):null,reference:setup.reference||null,currentType:setup.currentType||null,pathResolved:setup.pathResolved!==false,dataSemantics:current.semantics||null,semanticKey:current.semanticKey||null,actionable,expired,metadata:{marketDataSource:"LIVE_PROXY",provider:"TWELVE_DATA",interval:series.interval}}:null;
    const signals=signal?[signal]:[];
    const card=scannerCardApi.buildScannerCard({symbol:series.symbol,timeframe:series.timeframe,signals,primarySignal:signal,entry:signal?.trigger??null,stop:null,target:signal?.magnitude??null,observedAt:new Date(Number(now)).toISOString(),price});
    return {series,setup,signal,card,expired,actionable};
  }

  async function scan({symbols,timeframe="15",outputsize=100,fetchImpl=globalThis.fetch,engine,scannerCardApi,now=Date.now()}={}){
    const list=(Array.isArray(symbols)?symbols:[]).map(normalizeSymbol);
    const candidates=[],errors=[];
    for(const symbol of list){
      try{candidates.push(buildCandidate(await fetchSeries({symbol,timeframe,outputsize,fetchImpl}),{engine,scannerCardApi,now}));}
      catch(error){errors.push({symbol,timeframe:String(timeframe),error:error?.message||String(error)});}
    }
    return {requested:list.length,succeeded:candidates.length,failed:errors.length,candidates,cards:scannerCardApi.rankScannerCards(candidates.map(x=>x.card)),errors};
  }

  function installResearchConsole(){
    if(typeof document==="undefined"||typeof window==="undefined"||window.__stratLiveCandidatesInstalled) return false;
    if(typeof renderCandidates!=="function"||typeof sampleScannerCards!=="function"||!window.StratScannerCard||typeof detectSetup!=="function") return false;
    window.__stratLiveCandidatesInstalled=true;
    const originalRenderCandidates=renderCandidates;
    let liveCards=null;
    const card=document.querySelector("#candidates .card");
    const toolbar=document.querySelector("#candidates .toolbar");
    if(!card||!toolbar) return false;

    const controls=document.createElement("div");
    controls.className="toolbar";
    controls.innerHTML='<input id="liveCandidateSymbols" value="SPY,QQQ,IWM" aria-label="Live candidate symbols" style="min-width:180px"><select id="liveCandidateTimeframe" aria-label="Live candidate timeframe"><option value="5">5m</option><option value="15" selected>15m</option><option value="30">30m</option></select><button class="btn" id="loadLiveCandidates" type="button">Load live</button><button class="btn secondary" id="useSampleCandidates" type="button">Use sample</button><span id="liveCandidateStatus" class="small">Sample cards active</span>';
    toolbar.parentNode.insertBefore(controls,toolbar);
    const heading=card.querySelector("h2");
    if(heading) heading.textContent="Candidate Ranking — Deterministic Scanner";
    const candidateNote=Array.from(card.querySelectorAll(".small")).at(-1)||null;

    function setConsoleMode(mode){
      const copy=consoleModeCopy(mode);
      const badge=document.querySelector(".topbar .badge");
      const subtitle=document.querySelector(".topbar .subtitle");
      if(badge) badge.textContent=copy.badge;
      if(subtitle) subtitle.textContent=copy.subtitle;
      if(candidateNote) candidateNote.textContent=copy.note;
    }

    function renderLive(){
      if(!liveCards) return originalRenderCandidates();
      rankedCards=liveCards.slice();
      const d=document.querySelector("#directionFilter")?.value||"ALL",s=document.querySelector("#statusFilter")?.value||"ALL";
      const rows=rankedCards.filter(c=>(d==="ALL"||(d==="NONE"?!c.direction:c.direction===d))&&(s==="ALL"||c.advisoryState===s));
      const esc2=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
      const fmt2=n=>finiteValue(n)?`$${Number(n).toFixed(2)}`:"—";
      const st=c=>c.advisoryState==="ACTIVE_TRADE_CONTEXT"?"ACTIVE":c.advisoryState==="WATCH_ACTIONABLE_SETUP"?"WATCH":"WAIT";
      const body=document.querySelector("#candidateBody");
      body.innerHTML=rows.map(c=>{const rank=rankedCards.indexOf(c)+1;return `<tr><td>${rank}</td><td><strong>${esc2(c.symbol)}</strong></td><td class="${c.direction==="BULLISH"?"ok":c.direction==="BEARISH"?"bad":"warn"}">${esc2(c.direction||"—")}</td><td>${fmt2(c.price)}</td><td>${esc2(c.timeframe)}</td><td>${esc2(c.setup||"—")}</td><td>${esc2(c.ftfc?.alignment||"—")}</td><td>${esc2(c.breadth?.index?.context||"—")}</td><td>${esc2(c.breadth?.sector?.context||"—")}</td><td class="${c.rewardRiskStatus==="PASS"?"ok":c.rewardRiskStatus==="FAIL"?"bad":"warn"}">${rewardRiskText(c)}</td><td><span class="statusPill ${st(c)==="WAIT"?"warn":"ok"}">${st(c)}</span></td><td><button class="btn tiny secondary whyBtn" data-symbol="${esc2(c.symbol)}">Why?</button></td></tr>`}).join("");
      document.querySelectorAll(".whyBtn").forEach(btn=>btn.addEventListener("click",()=>showWhy(btn.dataset.symbol)));
      if(!rows.length) body.innerHTML='<tr><td colspan="12" class="small">No live cards match this filter.</td></tr>';
    }
    renderCandidates=renderLive;
    setConsoleMode("SAMPLE");

    document.querySelector("#loadLiveCandidates").addEventListener("click",async()=>{
      const status=document.querySelector("#liveCandidateStatus");
      const symbols=document.querySelector("#liveCandidateSymbols").value.split(",").map(s=>s.trim()).filter(Boolean);
      const timeframe=document.querySelector("#liveCandidateTimeframe").value;
      status.textContent=`Loading ${symbols.length} live ${timeframe}m symbols…`;
      status.className="small warn";
      try{
        const result=await scan({symbols,timeframe,engine:{detectSetup},scannerCardApi:window.StratScannerCard,now:Date.now()});
        liveCards=result.cards;
        renderCandidates();
        setConsoleMode("LIVE");
        status.textContent=`LIVE PROXY • ${result.succeeded}/${result.requested} loaded${result.failed?` • ${result.failed} failed`:""}`;
        status.className=result.failed?"small warn":"small ok";
      }catch(error){
        status.textContent=`Live scan failed: ${error.message}`;
        status.className="small bad";
      }
    });
    document.querySelector("#useSampleCandidates").addEventListener("click",()=>{
      liveCards=null;
      setConsoleMode("SAMPLE");
      document.querySelector("#liveCandidateStatus").textContent="Sample cards active";
      document.querySelector("#liveCandidateStatus").className="small";
      originalRenderCandidates();
    });
    return true;
  }

  return {DEFAULT_PROXY_BASE,INTERVALS,normalizeTimeframe,normalizeSymbol,finiteValue,rewardRiskText,consoleModeCopy,parseUtc,attachSemantics,normalizePayload,buildProxyUrl,fetchSeries,buildCandidate,scan,installResearchConsole};
});
