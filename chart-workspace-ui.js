"use strict";

(function(root,factory){
  const workspaceApi=(typeof module!=="undefined"&&module.exports)?require("./chart-workspace-layout.js"):(root?.StratChartWorkspace||{});
  const api=factory(workspaceApi);
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  if(root) root.StratChartWorkspaceUI=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(workspaceApi){
  const EVENT_NAME="strat:candidate-chart";

  function finite(value){return value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value));}
  function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

  function normalizeCandidateCard(card){
    if(!card||typeof card!=="object") throw new Error("candidate card required");
    const symbol=String(card.symbol||"").trim().toUpperCase();
    const timeframe=String(card.timeframe||"").trim().toUpperCase();
    if(!symbol) throw new Error("candidate symbol required");
    if(!timeframe) throw new Error("candidate timeframe required");
    return {
      symbol,
      timeframe,
      setup:card.setup||null,
      direction:card.direction||null,
      price:finite(card.price)?Number(card.price):null,
      observedAt:card.observedAt||null,
      advisoryState:card.advisoryState||null,
      ftfc:card.ftfc||null,
      rewardRisk:finite(card.rewardRisk)?Number(card.rewardRisk):null,
      source:"LIVE_CANDIDATE_CARD",
      dataStatus:"CARD_CONTEXT_ONLY",
      exactBarsAttached:false,
      referencePrice:true,
      brokerAuthority:false,
      probabilityScore:null
    };
  }

  function buildInitialWorkspace(timeframe){
    if(!workspaceApi||typeof workspaceApi.buildChartWorkspace!=="function") return {count:1,timeframes:[String(timeframe||"15")],order:"LOWEST_TO_HIGHEST",maxCharts:4};
    const tf=workspaceApi.normalizeTimeframe?.(timeframe)||"15";
    return workspaceApi.buildChartWorkspace({count:1,timeframes:[tf]});
  }

  function buildHandoff(card){
    const candidate=normalizeCandidateCard(card);
    return {candidate,workspace:buildInitialWorkspace(candidate.timeframe),createdAt:new Date().toISOString()};
  }

  function findRankedCard(symbol){
    try{
      if(typeof rankedCards!=="undefined"&&Array.isArray(rankedCards)) return rankedCards.find(card=>String(card?.symbol||"").toUpperCase()===String(symbol||"").toUpperCase())||null;
    }catch(_){ }
    return null;
  }

  function activateView(viewId){
    document.querySelectorAll(".tab").forEach(btn=>btn.classList.toggle("active",btn.dataset.view===viewId));
    document.querySelectorAll(".view").forEach(view=>view.classList.toggle("active",view.id===viewId));
  }

  function ensureWorkspaceSurface(){
    let section=document.getElementById("charts");
    if(section) return section;
    const nav=document.querySelector("nav.tabs");
    const historyTab=nav?.querySelector('[data-view="history"]');
    if(nav&&!nav.querySelector('[data-view="charts"]')){
      const tab=document.createElement("button");
      tab.className="tab";tab.dataset.view="charts";tab.textContent="Charts";
      tab.addEventListener("click",()=>activateView("charts"));
      nav.insertBefore(tab,historyTab||null);
    }
    section=document.createElement("section");
    section.id="charts";section.className="view";
    section.innerHTML='<div class="grid"><div class="card"><h2>Chart Workspace</h2><div id="chartWorkspaceStatus" class="mutedBox">Select Chart from a live Candidate to open its deterministic context here.</div><div id="chartWorkspaceReference" class="banner" style="margin-top:12px">REFERENCE PRICE — VERIFY WITH BROKER. Chart rendering will use scanner-normalized bars only; this workspace will not independently source candles.</div><div id="chartWorkspaceMeta" class="whyGrid" style="margin-top:12px"></div><div id="chartWorkspaceShell" style="margin-top:12px;min-height:280px;border:1px solid var(--line);border-radius:12px;background:#070c20;display:flex;align-items:center;justify-content:center;padding:18px"><div class="small">Renderer shell ready. Exact scanner bar handoff is the next integration gate; no duplicate market-data request is made.</div></div></div></div>';
    const settings=document.getElementById("settings");
    settings?.parentNode?.insertBefore(section,settings);
    return section;
  }

  function renderHandoff(handoff){
    ensureWorkspaceSurface();
    const c=handoff.candidate;
    const status=document.getElementById("chartWorkspaceStatus"),meta=document.getElementById("chartWorkspaceMeta"),shell=document.getElementById("chartWorkspaceShell");
    if(status) status.innerHTML=`<div class="whyTitle">${escapeHtml(c.symbol)} • ${escapeHtml(c.timeframe)}m${c.setup?` • ${escapeHtml(c.setup)}`:""}</div><div>Candidate context transferred from the live scanner without a second provider request.</div>`;
    if(meta) meta.innerHTML=`<div class="whyItem"><b>Direction</b><div>${escapeHtml(c.direction||"—")}</div></div><div class="whyItem"><b>Reference price</b><div>${finite(c.price)?`$${Number(c.price).toFixed(2)}`:"—"}</div></div><div class="whyItem"><b>FTFC</b><div>${escapeHtml(c.ftfc?.alignment||"—")}</div></div><div class="whyItem"><b>Workspace</b><div>${escapeHtml(handoff.workspace.timeframes.join(" / "))}</div></div>`;
    if(shell) shell.innerHTML='<div class="small">Candidate selected. Renderer shell is active; exact scanner bars are intentionally not re-fetched. Next gate: attach the scanner\'s already-normalized bar series, then render it with Lightweight Charts.</div>';
    if(typeof window!=="undefined") window.__stratChartWorkspaceHandoff=handoff;
  }

  function addChartButtons(){
    const body=document.getElementById("candidateBody");
    if(!body) return;
    body.querySelectorAll("tr").forEach(row=>{
      const symbol=row.querySelector(".whyBtn")?.dataset?.symbol;
      const cell=row.lastElementChild;
      if(!symbol||!cell||cell.querySelector(".chartBtn")) return;
      const button=document.createElement("button");
      button.type="button";button.className="btn tiny secondary chartBtn";button.dataset.symbol=symbol;button.textContent="Chart";button.style.marginLeft="6px";
      button.addEventListener("click",()=>{
        const card=findRankedCard(symbol);
        if(!card) return;
        const handoff=buildHandoff(card);
        renderHandoff(handoff);activateView("charts");
        window.dispatchEvent(new CustomEvent(EVENT_NAME,{detail:handoff}));
      });
      cell.appendChild(button);
    });
  }

  function installResearchConsole(){
    if(typeof window==="undefined"||typeof document==="undefined"||window.__stratChartWorkspaceUIInstalled) return false;
    window.__stratChartWorkspaceUIInstalled=true;
    ensureWorkspaceSurface();
    const body=document.getElementById("candidateBody");
    if(body){
      const observer=new MutationObserver(addChartButtons);
      observer.observe(body,{childList:true,subtree:true});
      window.__stratChartWorkspaceObserver=observer;
    }
    addChartButtons();
    return true;
  }

  return {EVENT_NAME,finite,normalizeCandidateCard,buildInitialWorkspace,buildHandoff,installResearchConsole};
});
