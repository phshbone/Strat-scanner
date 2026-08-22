"use strict";

(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  if(root) root.StratChartLiveWatch=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const WATCH_INTERVAL_MS=15000;
  const SUPPORTED_TFS=Object.freeze(["5","15","30"]);

  function normalizeWatchTarget(handoff){
    const symbol=String(handoff?.candidate?.symbol||"").trim().toUpperCase();
    const timeframe=String(handoff?.candidate?.timeframe||"").trim().toUpperCase();
    if(!symbol) throw new Error("watch symbol required");
    if(!SUPPORTED_TFS.includes(timeframe)) throw new Error("watch live supports validated 5m, 15m, or 30m only");
    return {symbol,timeframe};
  }

  function sameTarget(a,b){
    if(!a||!b) return false;
    return String(a.symbol||"").toUpperCase()===String(b.symbol||"").toUpperCase()&&String(a.timeframe||"").toUpperCase()===String(b.timeframe||"").toUpperCase();
  }

  function normalizePanelCount(value){
    const n=Number(value);
    return Number.isInteger(n)&&n>=1&&n<=4?n:1;
  }

  function watchBudgetText(intervalMs=WATCH_INTERVAL_MS){
    const seconds=Math.round(Number(intervalMs)/1000);
    return `One symbol • one ${seconds}s polling request • higher chart panels update by local aggregation`;
  }

  function installResearchConsole(){
    if(typeof window==="undefined"||typeof document==="undefined"||window.__stratChartLiveWatchInstalled) return false;
    window.__stratChartLiveWatchInstalled=true;

    let active=false,target=null,timer=null,refreshing=false,lastHandoff=null;

    function ensureControls(){
      const shell=document.getElementById("chartWorkspaceShell");
      if(!shell) return null;
      let box=document.getElementById("chartLiveWatchControls");
      if(box) return box;
      box=document.createElement("div");
      box.id="chartLiveWatchControls";
      box.className="toolbar";
      box.style.marginTop="12px";
      box.innerHTML='<button class="btn" id="startChartLiveWatch" type="button">Start watch live</button><button class="btn secondary" id="stopChartLiveWatch" type="button" disabled>Stop watch</button><span id="chartLiveWatchStatus" class="small">SNAPSHOT • chart does not update until watch live is started</span><span id="chartLiveWatchBudget" class="small"></span>';
      shell.parentNode.insertBefore(box,shell);
      box.querySelector("#chartLiveWatchBudget").textContent=watchBudgetText();
      box.querySelector("#startChartLiveWatch").addEventListener("click",start);
      box.querySelector("#stopChartLiveWatch").addEventListener("click",()=>stop("WATCH STOPPED • snapshot retained"));
      return box;
    }

    function setStatus(text,kind="small"){
      const el=document.getElementById("chartLiveWatchStatus");
      if(el){el.textContent=text;el.className=kind;}
      const startButton=document.getElementById("startChartLiveWatch"),stopButton=document.getElementById("stopChartLiveWatch");
      if(startButton) startButton.disabled=active;
      if(stopButton) stopButton.disabled=!active;
    }

    function stop(message="SNAPSHOT • watch live is off"){
      active=false;refreshing=false;
      if(timer){clearInterval(timer);timer=null;}
      if(message) setStatus(message,"small");
    }

    function updateRankedCard(card){
      try{
        if(typeof rankedCards==="undefined"||!Array.isArray(rankedCards)) return false;
        const index=rankedCards.findIndex(row=>String(row?.symbol||"").toUpperCase()===String(card?.symbol||"").toUpperCase());
        if(index<0) return false;
        rankedCards[index]=card;
        return true;
      }catch(_){return false;}
    }

    function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

    async function restorePanelCount(desiredCount){
      const desired=normalizePanelCount(desiredCount);
      if(desired<=1) return true;
      for(let attempt=0;attempt<40;attempt++){
        const select=document.getElementById("chartPanelCount"),option=select?.querySelector(`option[value="${desired}"]`);
        if(select&&option&&!option.disabled){
          if(Number(select.value)!==desired){select.value=String(desired);select.dispatchEvent(new Event("change",{bubbles:true}));}
          return true;
        }
        await wait(25);
      }
      return false;
    }

    async function clickCurrentChart(symbol){
      const desiredPanelCount=normalizePanelCount(document.getElementById("chartPanelCount")?.value);
      const buttons=Array.from(document.querySelectorAll(".chartBtn"));
      const button=buttons.find(btn=>String(btn.dataset?.symbol||"").toUpperCase()===String(symbol||"").toUpperCase());
      if(!button) return false;
      button.click();
      return restorePanelCount(desiredPanelCount);
    }

    async function refresh(){
      if(!active||refreshing||!target) return;
      if(document.hidden){setStatus("WATCH LIVE PAUSED • tab hidden to conserve provider requests","small warn");return;}
      const live=window.StratLiveCandidatesUI,scanner=window.StratScannerCard;
      if(!live?.fetchSeries||!live?.buildCandidate||!scanner||typeof detectSetup!=="function"){
        stop("WATCH LIVE UNAVAILABLE • scanner dependencies missing");
        setStatus("WATCH LIVE UNAVAILABLE • scanner dependencies missing","small bad");
        return;
      }
      refreshing=true;setStatus(`WATCH LIVE • refreshing ${target.symbol} ${target.timeframe}m…`,"small warn");
      try{
        const series=await live.fetchSeries({symbol:target.symbol,timeframe:target.timeframe,outputsize:100});
        const result=live.buildCandidate(series,{engine:{detectSetup},scannerCardApi:scanner,now:Date.now()});
        updateRankedCard(result.card);
        const clicked=await clickCurrentChart(target.symbol);
        const t=new Date();
        setStatus(`WATCH LIVE • ${target.symbol} ${target.timeframe}m • updated ${t.toLocaleTimeString([], {hour:"numeric",minute:"2-digit",second:"2-digit"})}${clicked?"":" • chart refresh unavailable"}`,clicked?"small ok":"small warn");
      }catch(error){
        setStatus(`WATCH LIVE • refresh failed: ${error?.message||String(error)}`,"small bad");
      }finally{refreshing=false;}
    }

    async function start(){
      try{target=normalizeWatchTarget(lastHandoff||window.__stratChartWorkspaceHandoff);}catch(error){setStatus(error.message,"small bad");return;}
      if(active) return;
      active=true;setStatus(`WATCH LIVE • ${target.symbol} ${target.timeframe}m • ${WATCH_INTERVAL_MS/1000}s polling`,"small ok");
      await refresh();
      if(active&&!timer) timer=setInterval(refresh,WATCH_INTERVAL_MS);
    }

    window.addEventListener("strat:candidate-chart",event=>{
      const handoff=event?.detail||window.__stratChartWorkspaceHandoff||null;
      let next=null;
      try{next=normalizeWatchTarget(handoff);}catch(_){ }
      const preserve=active&&sameTarget(target,next);
      lastHandoff=handoff;
      ensureControls();
      if(!preserve){stop("SNAPSHOT • chart does not update until watch live is started");target=next;}
      else target=next;
    });

    document.addEventListener("visibilitychange",()=>{
      if(!active) return;
      if(document.hidden) setStatus("WATCH LIVE PAUSED • tab hidden to conserve provider requests","small warn");
      else refresh();
    });

    ensureControls();
    return true;
  }

  return {WATCH_INTERVAL_MS,SUPPORTED_TFS,normalizeWatchTarget,sameTarget,normalizePanelCount,watchBudgetText,installResearchConsole};
});
