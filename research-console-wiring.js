"use strict";

(function(){
  if(typeof window==="undefined"||typeof document==="undefined") return;
  if(window.__stratResearchConsoleWiringLoaded) return;
  window.__stratResearchConsoleWiringLoaded=true;

  let previousSnapshot=null;
  let lastVisibleModel=null;
  let renderWrapped=false;

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      if(document.querySelector(`script[src="${src}"]`)){
        const wait=()=>{
          if((src.includes("trade-coach-ui")&&window.StratTradeCoachUI)||(src.includes("trade-coach.js")&&window.StratTradeCoach)) resolve();
          else setTimeout(wait,25);
        };
        wait();
        return;
      }
      const s=document.createElement("script");
      s.src=src;
      s.onload=resolve;
      s.onerror=()=>reject(new Error(`failed to load ${src}`));
      document.head.appendChild(s);
    });
  }

  function ensurePanel(){
    let panel=document.getElementById("tradeCoachCard");
    if(panel) return panel;
    const grid=document.querySelector("#monitor .grid");
    if(!grid) return null;
    panel=document.createElement("div");
    panel.id="tradeCoachCard";
    panel.className="card";
    panel.innerHTML='<h2>Trade Coach</h2><div id="tradeCoachMessage" class="mutedBox">Waiting for deterministic context…</div><div class="toolbar" style="margin-top:10px;margin-bottom:0"><button id="tradeCoachWhyButton" class="btn tiny secondary" type="button" hidden>Why?</button></div><div id="tradeCoachWhy" class="whyPanel" hidden></div>';
    grid.appendChild(panel);
    panel.querySelector("#tradeCoachWhyButton").addEventListener("click",()=>{
      const why=panel.querySelector("#tradeCoachWhy");
      why.hidden=!why.hidden;
    });
    return panel;
  }

  function finite(v){return v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));}
  function continuityAlignment(rows=[]){
    const states=(Array.isArray(rows)?rows:[]).map(tf=>{
      const price=Number(tf.price),open=Number(tf.open);
      if(!Number.isFinite(price)||!Number.isFinite(open)||price===open) return "FLAT";
      return price>open?"BULLISH":"BEARISH";
    });
    if(!states.length) return "NO_DATA";
    const bull=states.filter(x=>x==="BULLISH").length;
    const bear=states.filter(x=>x==="BEARISH").length;
    if(bull===states.length) return "FULL_BULLISH";
    if(bear===states.length) return "FULL_BEARISH";
    if(bull>bear) return "BULLISH_MAJORITY";
    if(bear>bull) return "BEARISH_MAJORITY";
    return "MIXED";
  }

  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}

  function collectSnapshot(){
    if(typeof state==="undefined"||typeof detectSetup!=="function"||typeof calculateTrade!=="function"||!window.StratSetupContext) return null;
    const bars=Array.isArray(state.bars)?state.bars:[];
    const setup=detectSetup(bars,{currentBarPathDirection:state.currentBarPathDirection||undefined});
    const current=bars.at(-1)||null;
    const trade=current?calculateTrade(setup,current.close):null;
    const directional=setup&&["BULLISH","BEARISH"].includes(String(setup.direction||"").toUpperCase())&&finite(setup.trigger);
    const signal=directional?{
      symbol:String(state.symbol||"DEMO").toUpperCase(),
      timeframe:String(state.primaryTimeframe||"D").toUpperCase(),
      setupId:setup.name||"STRAT_SETUP",
      direction:String(setup.direction).toUpperCase(),
      trigger:Number(setup.trigger),
      magnitude:finite(setup.magnitude)?Number(setup.magnitude):null,
      state:"ARMED"
    }:null;
    const ftfc={alignment:continuityAlignment(state.timeframes||[])};
    const setupContext=window.StratSetupContext.buildSetupContext({
      signals:signal?[signal]:[],
      primarySignal:signal,
      ftfc,
      entry:signal?.trigger??null,
      stop:finite(trade?.structureStop)?Number(trade.structureStop):null,
      target:finite(setup?.magnitude)?Number(setup.magnitude):null
    });
    const exhaustion={
      price:trade?(trade.magnitudeHit?"MAGNITUDE_HIT":"MAGNITUDE_OPEN"):null,
      time:typeof timeExhaustion==="function"?timeExhaustion(state.candleProgressPct):null
    };
    return {setupContext,practiceTrade:null,carrier:null,exhaustion};
  }

  function renderViewModel(model,isNew){
    const panel=ensurePanel();
    if(!panel||!model) return;
    const msg=panel.querySelector("#tradeCoachMessage");
    const whyButton=panel.querySelector("#tradeCoachWhyButton");
    const whyPanel=panel.querySelector("#tradeCoachWhy");
    const cls=model.severityClass||"";
    msg.className=`mutedBox ${cls}`.trim();
    msg.innerHTML=`<div class="whyTitle">${escapeHtml(model.title)}</div><div>${escapeHtml(model.message)}</div><div class="small" style="margin-top:7px">${isNew?"New decision-relevant state change":"Latest guidance — no newer meaningful state change"}</div>`;
    const why=Array.isArray(model.why)?model.why:[];
    whyButton.hidden=why.length===0;
    whyPanel.innerHTML=why.length?`<div class="whyTitle">Why?</div><div class="whyGrid">${why.map(item=>`<div class="whyItem"><b>${escapeHtml(item.label)}</b><div>${escapeHtml(item.status)}</div><div class="small">${escapeHtml(typeof item.value==="object"?JSON.stringify(item.value):item.value??"—")}</div></div>`).join("")}</div>`:"";
    if(!why.length) whyPanel.hidden=true;
  }

  function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

  function updateCoach(){
    if(!window.StratTradeCoach||!window.StratTradeCoachUI) return;
    const current=collectSnapshot();
    if(!current) return;
    const guidance=window.StratTradeCoach.deriveTradeCoachGuidance({
      setupContext:current.setupContext,
      previousSetupContext:previousSnapshot?.setupContext||null,
      practiceTrade:current.practiceTrade,
      previousPracticeTrade:previousSnapshot?.practiceTrade||null,
      carrier:current.carrier,
      previousCarrier:previousSnapshot?.carrier||null,
      exhaustion:current.exhaustion,
      previousExhaustion:previousSnapshot?.exhaustion||null,
      forceInitial:previousSnapshot==null,
      observedAt:new Date().toISOString()
    });
    if(guidance.emit===true){
      lastVisibleModel=window.StratTradeCoachUI.buildTradeCoachViewModel(guidance);
      renderViewModel(lastVisibleModel,true);
    }else if(lastVisibleModel){
      renderViewModel(lastVisibleModel,false);
    }
    previousSnapshot=clone(current);
  }

  function tryWrapRender(){
    if(renderWrapped) return true;
    try{
      if(typeof render!=="function") return false;
      const originalRender=render;
      render=function(){
        const result=originalRender.apply(this,arguments);
        queueMicrotask(updateCoach);
        return result;
      };
      renderWrapped=true;
      return true;
    }catch(_){return false;}
  }

  async function boot(){
    try{
      await loadScript("trade-coach.js");
      await loadScript("trade-coach-ui.js");
      ensurePanel();
      let tries=0;
      const timer=setInterval(()=>{
        tries+=1;
        if(tryWrapRender()){
          clearInterval(timer);
          updateCoach();
        }else if(tries>200){
          clearInterval(timer);
        }
      },25);
    }catch(err){
      const panel=ensurePanel();
      if(panel) panel.querySelector("#tradeCoachMessage").textContent=`Trade Coach wiring error: ${err.message}`;
    }
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
