"use strict";

(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  if(root) root.StratChartTradeCoach=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const EVENT_NAME="strat:candidate-chart";

  function finite(value){return value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value));}
  function upper(value){return String(value||"").toUpperCase();}
  function targetKey(handoff){return `${upper(handoff?.candidate?.symbol)}|${upper(handoff?.candidate?.timeframe)}`;}
  function latestClose(series){const bar=Array.isArray(series?.bars)?series.bars.at(-1):null;return finite(bar?.close)?Number(bar.close):null;}

  function deriveChartSnapshot(handoff,deps={}){
    const series=handoff?.series,bars=Array.isArray(series?.bars)?series.bars:[];
    const detectSetupFn=deps.detectSetup||globalThis.detectSetup;
    const calculateTradeFn=deps.calculateTrade||globalThis.calculateTrade;
    const setupContextApi=deps.setupContextApi||globalThis.StratSetupContext;
    let setup=null;
    try{setup=typeof detectSetupFn==="function"?detectSetupFn(bars,{})||null:null;}catch(_){setup=null;}
    const direction=upper(setup?.direction);
    const directional=["BULLISH","BEARISH"].includes(direction)&&finite(setup?.trigger);
    const price=latestClose(series);
    let trade=null;
    if(directional&&typeof calculateTradeFn==="function"&&finite(price)){
      try{trade=calculateTradeFn(setup,price);}catch(_){trade=null;}
    }
    const signal=directional?{
      symbol:upper(handoff?.candidate?.symbol),timeframe:upper(handoff?.candidate?.timeframe),setupId:setup?.name||"STRAT_SETUP",direction,
      trigger:Number(setup.trigger),magnitude:finite(setup?.magnitude)?Number(setup.magnitude):null,
      state:trade?.inForce?"IN_FORCE":"ARMED",actionable:trade?.magnitudeHit!==true
    }:null;
    let setupContext=null;
    if(setupContextApi?.buildSetupContext){
      try{
        setupContext=setupContextApi.buildSetupContext({
          signals:signal?[signal]:[],primarySignal:signal,ftfc:handoff?.candidate?.ftfc||null,
          entry:signal?.trigger??null,stop:null,target:signal?.magnitude??null,historicalEvidence:null
        });
      }catch(_){setupContext=null;}
    }
    return {
      key:targetKey(handoff),symbol:upper(handoff?.candidate?.symbol),timeframe:upper(handoff?.candidate?.timeframe),setupName:setup?.name||null,direction:directional?direction:null,
      currentType:setup?.currentType||null,pathResolved:setup?.pathResolved!==false,trigger:signal?.trigger??null,magnitude:signal?.magnitude??null,price,
      inForce:trade?.inForce===true,magnitudeHit:trade?.magnitudeHit===true,setupContext,observedAt:new Date().toISOString()
    };
  }

  function meaningfulChartGuidance(previous,current){
    if(!current) return null;
    const why=[
      {label:"SETUP",status:current.setupName||"NONE",value:current.direction||"NO DIRECTIONAL SETUP"},
      {label:"PRICE",status:finite(current.price)?String(current.price):"UNKNOWN",value:finite(current.price)?current.price:null},
      {label:"TRIGGER",status:finite(current.trigger)?String(current.trigger):"UNKNOWN",value:current.trigger},
      {label:"MAGNITUDE",status:finite(current.magnitude)?String(current.magnitude):"UNKNOWN",value:current.magnitude}
    ];
    if(!previous){
      return {emit:true,code:"CHART_INITIAL_CONTEXT",severity:"INFO",title:"Current setup context",message:"Rule-based chart context captured. Guidance will change only when the deterministic setup state changes.",why,observedAt:current.observedAt};
    }
    if(previous.pathResolved!==false&&current.pathResolved===false){
      return {emit:true,code:"CHART_PATH_AMBIGUOUS",severity:"HIGH",title:"Outside-bar path ambiguous",message:"Completed price action crossed both sides without enough sequence evidence to assign a directional reversal. Do not infer the path.",why,observedAt:current.observedAt};
    }
    if(previous.direction&&!current.direction){
      return {emit:true,code:"CHART_SETUP_LOST",severity:"CAUTION",title:"Setup no longer present",message:"The previously observed directional Strat setup is no longer the current deterministic setup. Re-evaluate before acting.",why,observedAt:current.observedAt};
    }
    if(current.direction&&previous.direction&&(current.setupName!==previous.setupName||current.direction!==previous.direction)){
      return {emit:true,code:"CHART_SETUP_CHANGED",severity:"CAUTION",title:"Setup changed",message:"The current deterministic Strat setup changed from the prior watched state. Review the new trigger and magnitude before acting.",why,observedAt:current.observedAt};
    }
    if(!previous.inForce&&current.inForce){
      return {emit:true,code:"CHART_TRIGGER_CROSSED",severity:"INFO",title:"Trigger crossed",message:"Price has crossed the deterministic setup trigger and the setup is now in force. This is not broker execution confirmation.",why,observedAt:current.observedAt};
    }
    if(!previous.magnitudeHit&&current.magnitudeHit){
      return {emit:true,code:"CHART_MAGNITUDE_REACHED",severity:"POSITIVE",title:"Magnitude reached",message:"Price has reached the deterministic magnitude objective for the watched setup.",why,observedAt:current.observedAt};
    }
    return null;
  }

  function severityClass(severity){
    const s=upper(severity);return s==="HIGH"?"bad":s==="CAUTION"?"warn":s==="POSITIVE"?"ok":"";
  }
  function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

  function ensureSurface(){
    if(typeof document==="undefined") return null;
    const charts=document.getElementById("charts"),controls=document.getElementById("chartWorkspaceControls");if(!charts||!controls) return null;
    let box=document.getElementById("chartTradeCoach");if(box) return box;
    box=document.createElement("div");box.id="chartTradeCoach";box.className="mutedBox";box.style.marginTop="12px";
    box.innerHTML='<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><div><b>Trade Coach</b> <span class="small">RULE-BASED</span></div><button id="chartTradeCoachWhy" class="btn tiny secondary" type="button">Why?</button></div><div id="chartTradeCoachMessage" style="margin-top:7px">Waiting for chart context…</div><div id="chartTradeCoachWhyPanel" class="whyPanel" hidden></div>';
    controls.parentNode.insertBefore(box,controls);
    box.querySelector("#chartTradeCoachWhy").addEventListener("click",()=>{const panel=box.querySelector("#chartTradeCoachWhyPanel");panel.hidden=!panel.hidden;});
    return box;
  }

  function renderGuidance(guidance,isNew=true){
    const box=ensureSurface();if(!box||!guidance) return false;
    box.className=`mutedBox ${severityClass(guidance.severity)}`.trim();
    const message=box.querySelector("#chartTradeCoachMessage"),whyPanel=box.querySelector("#chartTradeCoachWhyPanel");
    message.innerHTML=`<div class="whyTitle">${escapeHtml(guidance.title||"Trade Coach")}</div><div>${escapeHtml(guidance.message||"")}</div><div class="small" style="margin-top:6px">${isNew?"New decision-relevant state change":"Latest guidance — no newer meaningful state change"}</div>`;
    const why=Array.isArray(guidance.why)?guidance.why:[];
    whyPanel.innerHTML=why.length?`<div class="whyTitle">Why?</div><div class="whyGrid">${why.map(item=>`<div class="whyItem"><b>${escapeHtml(item.label)}</b><div>${escapeHtml(item.status||"—")}</div><div class="small">${escapeHtml(typeof item.value==="object"?JSON.stringify(item.value):item.value??"—")}</div></div>`).join("")}</div>`:'<div class="small">No additional evidence was attached to this state change.</div>';
    return true;
  }

  function installResearchConsole(){
    if(typeof window==="undefined"||typeof document==="undefined"||window.__stratChartTradeCoachInstalled) return false;
    window.__stratChartTradeCoachInstalled=true;
    let previous=null,lastGuidance=null;
    window.addEventListener(EVENT_NAME,event=>{
      const handoff=event?.detail||window.__stratChartWorkspaceHandoff||null;if(!handoff) return;
      const current=deriveChartSnapshot(handoff);
      if(!previous||previous.key!==current.key){previous=null;lastGuidance=null;}
      let guidance=meaningfulChartGuidance(previous,current);
      if(!guidance&&window.StratTradeCoach?.deriveTradeCoachGuidance&&current.setupContext){
        const base=window.StratTradeCoach.deriveTradeCoachGuidance({setupContext:current.setupContext,previousSetupContext:previous?.setupContext||null,observedAt:current.observedAt,forceInitial:false});
        if(base?.emit) guidance=base;
      }
      if(guidance){lastGuidance=guidance;renderGuidance(guidance,true);}else if(lastGuidance) renderGuidance(lastGuidance,false);
      previous=current;
    });
    ensureSurface();return true;
  }

  return {EVENT_NAME,finite,targetKey,latestClose,deriveChartSnapshot,meaningfulChartGuidance,severityClass,ensureSurface,renderGuidance,installResearchConsole};
});
