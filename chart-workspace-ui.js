"use strict";

(function(root,factory){
  const workspaceApi=(typeof module!=="undefined"&&module.exports)?require("./chart-workspace-layout.js"):(root?.StratChartWorkspace||{});
  const api=factory(workspaceApi);
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  if(root) root.StratChartWorkspaceUI=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(workspaceApi){
  const EVENT_NAME="strat:candidate-chart";
  const LIGHTWEIGHT_CHARTS_SRC="https://unpkg.com/lightweight-charts@4.2.3/dist/lightweight-charts.standalone.production.js";
  const PROXY_ORIGIN="https://thestrat.phshbone.workers.dev";
  const INTERVAL_TO_TF={"5min":"5","15min":"15","30min":"30"};
  const PRODUCTION_TFS=["5","15","30"];
  const responseCache=new Map();

  function finite(value){return value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value));}
  function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
  function cacheKey(symbol,timeframe){return `${String(symbol||"").trim().toUpperCase()}|${String(timeframe||"").trim().toUpperCase()}`;}
  function semanticDate(bar){return String(bar?.semantics?.periodOpenId||"").split("|")[2]||String(bar?.semantics?.barOpenTimestamp||"").slice(0,10)||null;}

  function requestCacheKey(input){
    try{
      const raw=typeof input==="string"?input:input?.url;
      const url=new URL(raw,typeof location!=="undefined"?location.href:PROXY_ORIGIN);
      if(url.origin!==PROXY_ORIGIN||url.pathname!=="/time-series") return null;
      const symbol=String(url.searchParams.get("symbol")||"").trim().toUpperCase();
      const timeframe=INTERVAL_TO_TF[String(url.searchParams.get("interval")||"")];
      return symbol&&timeframe?cacheKey(symbol,timeframe):null;
    }catch(_){return null;}
  }

  function normalizeCandidateCard(card){
    if(!card||typeof card!=="object") throw new Error("candidate card required");
    const symbol=String(card.symbol||"").trim().toUpperCase(),timeframe=String(card.timeframe||"").trim().toUpperCase();
    if(!symbol) throw new Error("candidate symbol required");
    if(!timeframe) throw new Error("candidate timeframe required");
    return {symbol,timeframe,setup:card.setup||null,direction:card.direction||null,price:finite(card.price)?Number(card.price):null,observedAt:card.observedAt||null,advisoryState:card.advisoryState||null,ftfc:card.ftfc||null,rewardRisk:finite(card.rewardRisk)?Number(card.rewardRisk):null,source:"LIVE_CANDIDATE_CARD",dataStatus:"CARD_CONTEXT_ONLY",exactBarsAttached:false,referencePrice:true,brokerAuthority:false,probabilityScore:null};
  }

  function buildInitialWorkspace(timeframe){
    if(!workspaceApi||typeof workspaceApi.buildChartWorkspace!=="function") return {count:1,timeframes:[String(timeframe||"15")],order:"LOWEST_TO_HIGHEST",maxCharts:4};
    const tf=workspaceApi.normalizeTimeframe?.(timeframe)||"15";
    return workspaceApi.buildChartWorkspace({count:1,timeframes:[tf]});
  }

  function validateSeries(candidate,series){
    if(!series||typeof series!=="object"||!Array.isArray(series.bars)||!series.bars.length) return null;
    if(String(series.symbol||"").toUpperCase()!==candidate.symbol||String(series.timeframe||"").toUpperCase()!==candidate.timeframe) throw new Error("chart series does not match selected candidate");
    return series;
  }

  function buildHandoff(card,series=null){
    const candidate=normalizeCandidateCard(card),exact=validateSeries(candidate,series);
    if(exact){candidate.dataStatus="EXACT_SCANNER_RESPONSE";candidate.exactBarsAttached=true;}
    return {candidate,workspace:buildInitialWorkspace(candidate.timeframe),series:exact,createdAt:new Date().toISOString()};
  }

  function chartDataFromSeries(series){
    return (Array.isArray(series?.bars)?series.bars:[]).map(bar=>{
      const timestamp=Date.parse(bar?.semantics?.barOpenTimestamp||bar?.datetime||""),open=Number(bar?.open),high=Number(bar?.high),low=Number(bar?.low),close=Number(bar?.close);
      if(!Number.isFinite(timestamp)||![open,high,low,close].every(Number.isFinite)) return null;
      return {time:Math.floor(timestamp/1000),open,high,low,close};
    }).filter(Boolean).sort((a,b)=>a.time-b.time);
  }

  function productionTimeframesForSource(sourceTimeframe){
    const source=String(sourceTimeframe||"").toUpperCase(),index=PRODUCTION_TFS.indexOf(source);
    return index<0?[]:PRODUCTION_TFS.slice(index);
  }

  function defaultPanelTimeframes(sourceTimeframe,count=1){
    const allowed=productionTimeframesForSource(sourceTimeframe),n=Number(count);
    if(!Number.isInteger(n)||n<1||n>allowed.length) throw new Error(`validated chart count for ${sourceTimeframe}m is 1-${allowed.length}`);
    return allowed.slice(0,n);
  }

  function aggregateSeries(series,targetTimeframe){
    if(!series||!Array.isArray(series.bars)||!series.bars.length) throw new Error("source series required");
    const source=Number(series.timeframe),target=Number(targetTimeframe);
    if(!PRODUCTION_TFS.includes(String(target))||!PRODUCTION_TFS.includes(String(source))||target<source||target%source!==0) throw new Error("unsupported validated intraday aggregation");
    if(target===source) return series;
    const groups=new Map();
    for(const bar of series.bars){
      const offset=Number(bar?.semantics?.barAnchorOffsetMinutes),date=semanticDate(bar);
      if(!Number.isFinite(offset)||!date) continue;
      const bucketStart=Math.floor(offset/target)*target,key=`${date}|${bucketStart}`;
      if(!groups.has(key)) groups.set(key,[]);
      groups.get(key).push(bar);
    }
    const bars=[];
    for(const rows of groups.values()){
      rows.sort((a,b)=>Date.parse(a?.semantics?.barOpenTimestamp||a?.datetime||"")-Date.parse(b?.semantics?.barOpenTimestamp||b?.datetime||""));
      const first=rows[0],last=rows.at(-1),open=Number(first.open),high=Math.max(...rows.map(x=>Number(x.high))),low=Math.min(...rows.map(x=>Number(x.low))),close=Number(last.close);
      if(![open,high,low,close].every(Number.isFinite)) continue;
      const start=Date.parse(first?.semantics?.barOpenTimestamp||first?.datetime||""),semantics={...(first.semantics||{}),timeframe:String(target),providerAggregation:`${target}min`,barAnchorOffsetMinutes:Math.floor(Number(first?.semantics?.barAnchorOffsetMinutes||0)/target)*target,barCloseTimestamp:Number.isFinite(start)?new Date(start+target*60000).toISOString():first?.semantics?.barCloseTimestamp||null};
      const out={...first,timeframe:String(target),providerTimeframe:`${target}min`,open,high,low,close,semantics,derivedFromTimeframe:String(source),derivation:"LOCAL_RTH_AGGREGATION"};
      if(rows.some(x=>finite(x.volume))) out.volume=rows.reduce((sum,x)=>sum+(finite(x.volume)?Number(x.volume):0),0);
      bars.push(out);
    }
    bars.sort((a,b)=>Date.parse(a?.semantics?.barOpenTimestamp||a?.datetime||"")-Date.parse(b?.semantics?.barOpenTimestamp||b?.datetime||""));
    return {source:"DERIVED_FROM_EXACT_SCANNER_RESPONSE",provider:series.provider||"TWELVE_DATA",symbol:series.symbol,timeframe:String(target),interval:`${target}min`,bars,derivedFromTimeframe:String(source),exactProviderRequest:false};
  }

  function panelSeriesForWorkspace(series,timeframes){
    const allowed=productionTimeframesForSource(series?.timeframe),selected=(Array.isArray(timeframes)?timeframes:[]).map(String);
    if(!selected.length||selected.some(tf=>!allowed.includes(tf))) throw new Error("workspace contains an unavailable timeframe");
    return selected.map(tf=>({timeframe:tf,series:aggregateSeries(series,tf),mode:tf===String(series.timeframe)?"EXACT":"DERIVED"}));
  }

  function installFetchTap(){
    if(typeof window==="undefined"||typeof window.fetch!=="function"||window.__stratChartFetchTapInstalled) return false;
    window.__stratChartFetchTapInstalled=true;
    const originalFetch=window.fetch.bind(window);window.__stratChartOriginalFetch=originalFetch;
    window.fetch=async function(input,init){
      const response=await originalFetch(input,init);
      try{const key=requestCacheKey(input);if(key&&response&&typeof response.clone==="function") responseCache.set(key,response.clone().json().catch(()=>null));}catch(_){ }
      return response;
    };
    return true;
  }

  async function cachedSeries(symbol,timeframe){
    const promise=responseCache.get(cacheKey(symbol,timeframe));
    if(!promise||typeof window==="undefined"||!window.StratLiveCandidatesUI?.normalizePayload) return null;
    const payload=await promise;if(!payload) return null;
    try{return window.StratLiveCandidatesUI.normalizePayload(payload,{symbol,timeframe});}catch(_){return null;}
  }

  function findRankedCard(symbol){
    try{if(typeof rankedCards!=="undefined"&&Array.isArray(rankedCards)) return rankedCards.find(card=>String(card?.symbol||"").toUpperCase()===String(symbol||"").toUpperCase())||null;}catch(_){ }
    return null;
  }

  function activateView(viewId){
    document.querySelectorAll(".tab").forEach(btn=>btn.classList.toggle("active",btn.dataset.view===viewId));
    document.querySelectorAll(".view").forEach(view=>view.classList.toggle("active",view.id===viewId));
  }

  function ensureWorkspaceSurface(){
    let section=document.getElementById("charts");if(section) return section;
    const nav=document.querySelector("nav.tabs"),historyTab=nav?.querySelector('[data-view="history"]');
    if(nav&&!nav.querySelector('[data-view="charts"]')){const tab=document.createElement("button");tab.className="tab";tab.dataset.view="charts";tab.textContent="Charts";tab.addEventListener("click",()=>activateView("charts"));nav.insertBefore(tab,historyTab||null);}
    section=document.createElement("section");section.id="charts";section.className="view";
    section.innerHTML='<div class="grid"><div class="card"><h2>Chart Workspace</h2><div id="chartWorkspaceStatus" class="mutedBox">Select Chart from a live Candidate to open its deterministic context here.</div><div id="chartWorkspaceReference" class="banner" style="margin-top:12px">REFERENCE PRICE — VERIFY WITH BROKER. Charts use the same scanner response; no independent market-data request is made.</div><div id="chartWorkspaceMeta" class="whyGrid" style="margin-top:12px"></div><div id="chartWorkspaceControls" class="toolbar" style="margin-top:12px"></div><div id="chartWorkspaceShell" style="margin-top:12px;min-height:340px"><div class="small">Renderer ready. Select Chart beside a live candidate.</div></div><div class="small" style="margin-top:8px">Chart rendering: TradingView Lightweight Charts. Market data and Strat logic are supplied by this application, not TradingView. <a href="https://www.tradingview.com/" target="_blank" rel="noopener" style="color:#aeb9d5">TradingView</a></div></div></div>';
    const settings=document.getElementById("settings");settings?.parentNode?.insertBefore(section,settings);return section;
  }

  function loadLightweightCharts(){
    if(typeof window==="undefined") return Promise.reject(new Error("browser required"));
    if(window.LightweightCharts) return Promise.resolve(window.LightweightCharts);
    if(window.__stratLightweightChartsPromise) return window.__stratLightweightChartsPromise;
    window.__stratLightweightChartsPromise=new Promise((resolve,reject)=>{
      const existing=document.querySelector(`script[src="${LIGHTWEIGHT_CHARTS_SRC}"]`);
      if(existing){existing.addEventListener("load",()=>resolve(window.LightweightCharts),{once:true});existing.addEventListener("error",()=>reject(new Error("Lightweight Charts failed to load")),{once:true});return;}
      const script=document.createElement("script");script.src=LIGHTWEIGHT_CHARTS_SRC;script.async=true;script.onload=()=>window.LightweightCharts?resolve(window.LightweightCharts):reject(new Error("Lightweight Charts unavailable after load"));script.onerror=()=>reject(new Error("Lightweight Charts failed to load"));document.head.appendChild(script);
    });
    return window.__stratLightweightChartsPromise;
  }

  function destroyCharts(){
    for(const chart of (window.__stratLightweightCharts||[])){try{chart.remove();}catch(_){ }}
    window.__stratLightweightCharts=[];
    for(const ro of (window.__stratChartResizeObservers||[])){try{ro.disconnect();}catch(_){ }}
    window.__stratChartResizeObservers=[];
  }

  async function renderWorkspacePanels(handoff,timeframes){
    const shell=document.getElementById("chartWorkspaceShell");if(!shell) return;
    if(!handoff.candidate.exactBarsAttached){shell.innerHTML='<div class="small">Exact scanner bars were not available. No fallback provider request was made.</div>';return;}
    let panels;
    try{panels=panelSeriesForWorkspace(handoff.series,timeframes);}catch(error){shell.innerHTML=`<div class="small bad">${escapeHtml(error.message)}</div>`;return;}
    destroyCharts();
    shell.style.cssText="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:10px";
    shell.innerHTML=panels.map((panel,index)=>`<div style="border:1px solid var(--line);border-radius:12px;background:#070c20;overflow:hidden"><div class="small" style="padding:8px 10px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between"><b>${escapeHtml(handoff.candidate.symbol)} • ${escapeHtml(panel.timeframe)}m</b><span>${panel.mode==="EXACT"?"EXACT SCANNER BARS":`DERIVED FROM ${escapeHtml(handoff.series.timeframe)}m`}</span></div><div id="chartPanel${index}" style="width:100%;height:${panels.length===1?380:280}px"></div></div>`).join("");
    try{
      const lib=await loadLightweightCharts();
      for(let index=0;index<panels.length;index++){
        const panel=panels[index],canvas=document.getElementById(`chartPanel${index}`),data=chartDataFromSeries(panel.series);if(!canvas||!data.length) continue;
        const height=panels.length===1?380:280,chart=lib.createChart(canvas,{width:canvas.clientWidth||700,height,layout:{background:{type:"solid",color:"#070c20"},textColor:"#dce5ff"},grid:{vertLines:{color:"#18213b"},horzLines:{color:"#18213b"}},rightPriceScale:{borderColor:"#263251"},timeScale:{borderColor:"#263251",timeVisible:true,secondsVisible:false}});
        const candles=chart.addCandlestickSeries({upColor:"#5fbf86",downColor:"#d86c6c",borderVisible:false,wickUpColor:"#5fbf86",wickDownColor:"#d86c6c"});candles.setData(data);chart.timeScale().fitContent();window.__stratLightweightCharts.push(chart);
        if(typeof ResizeObserver!=="undefined"){const ro=new ResizeObserver(entries=>{const width=Math.floor(entries[0]?.contentRect?.width||0);if(width>0) chart.applyOptions({width});});ro.observe(canvas);window.__stratChartResizeObservers.push(ro);}
      }
    }catch(error){shell.innerHTML=`<div class="small bad" style="padding:18px">Chart renderer unavailable: ${escapeHtml(error.message)}</div>`;}
  }

  function renderControls(handoff){
    const controls=document.getElementById("chartWorkspaceControls");if(!controls) return;
    const allowed=productionTimeframesForSource(handoff.series?.timeframe),max=allowed.length;
    controls.innerHTML=`<label class="small">Panels <select id="chartPanelCount">${[1,2,3,4].map(n=>`<option value="${n}" ${n>max?"disabled":""}>${n}${n===4&&max<4?" — awaiting 60m validation":""}</option>`).join("")}</select></label><span class="small">Available from this exact ${escapeHtml(handoff.series.timeframe)}m response: ${allowed.map(tf=>`${tf}m`).join(" / ")}. Higher panels are aggregated locally; no extra provider calls.</span>`;
    const select=document.getElementById("chartPanelCount");
    select.addEventListener("change",async()=>{const timeframes=defaultPanelTimeframes(handoff.series.timeframe,Number(select.value));handoff.workspace={count:timeframes.length,timeframes,order:"LOWEST_TO_HIGHEST",maxCharts:4};window.__stratChartWorkspaceHandoff=handoff;await renderWorkspacePanels(handoff,timeframes);});
  }

  async function renderHandoff(handoff){
    ensureWorkspaceSurface();const c=handoff.candidate,status=document.getElementById("chartWorkspaceStatus"),meta=document.getElementById("chartWorkspaceMeta");
    if(status) status.innerHTML=`<div class="whyTitle">${escapeHtml(c.symbol)} • ${escapeHtml(c.timeframe)}m${c.setup?` • ${escapeHtml(c.setup)}`:""}</div><div>${c.exactBarsAttached?`${handoff.series.bars.length} normalized bars captured from the exact scanner response.`:"Candidate context transferred, but exact scanner bars were not captured."}</div>`;
    if(meta) meta.innerHTML=`<div class="whyItem"><b>Direction</b><div>${escapeHtml(c.direction||"—")}</div></div><div class="whyItem"><b>Reference price</b><div>${finite(c.price)?`$${Number(c.price).toFixed(2)}`:"—"}</div></div><div class="whyItem"><b>FTFC</b><div>${escapeHtml(c.ftfc?.alignment||"—")}</div></div><div class="whyItem"><b>Data</b><div>${c.exactBarsAttached?"EXACT + LOCAL AGGREGATION":"NO BAR HANDOFF"}</div></div>`;
    if(typeof window!=="undefined") window.__stratChartWorkspaceHandoff=handoff;
    if(c.exactBarsAttached){renderControls(handoff);await renderWorkspacePanels(handoff,handoff.workspace.timeframes);}else{document.getElementById("chartWorkspaceControls").innerHTML="";await renderWorkspacePanels(handoff,[]);}
  }

  function addChartButtons(){
    const body=document.getElementById("candidateBody");if(!body) return;
    body.querySelectorAll("tr").forEach(row=>{
      const symbol=row.querySelector(".whyBtn")?.dataset?.symbol,cell=row.lastElementChild;if(!symbol||!cell||cell.querySelector(".chartBtn")) return;
      const button=document.createElement("button");button.type="button";button.className="btn tiny secondary chartBtn";button.dataset.symbol=symbol;button.textContent="Chart";button.style.marginLeft="6px";
      button.addEventListener("click",async()=>{const card=findRankedCard(symbol);if(!card) return;const series=await cachedSeries(card.symbol,card.timeframe),handoff=buildHandoff(card,series);activateView("charts");await renderHandoff(handoff);window.dispatchEvent(new CustomEvent(EVENT_NAME,{detail:handoff}));});cell.appendChild(button);
    });
  }

  function installResearchConsole(){
    if(typeof window==="undefined"||typeof document==="undefined"||window.__stratChartWorkspaceUIInstalled) return false;
    window.__stratChartWorkspaceUIInstalled=true;ensureWorkspaceSurface();installFetchTap();
    const body=document.getElementById("candidateBody");if(body){const observer=new MutationObserver(addChartButtons);observer.observe(body,{childList:true,subtree:true});window.__stratChartWorkspaceObserver=observer;}addChartButtons();return true;
  }

  return {EVENT_NAME,LIGHTWEIGHT_CHARTS_SRC,PROXY_ORIGIN,INTERVAL_TO_TF,PRODUCTION_TFS,finite,cacheKey,requestCacheKey,normalizeCandidateCard,buildInitialWorkspace,validateSeries,buildHandoff,chartDataFromSeries,productionTimeframesForSource,defaultPanelTimeframes,aggregateSeries,panelSeriesForWorkspace,installResearchConsole};
});
