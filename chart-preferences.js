"use strict";

(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  if(root) root.StratChartPreferences=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const STORAGE_KEY="strat.chartPreferences.v1";
  const DEFAULTS={spacing:"NORMAL",grid:true};
  const SPACING={TIGHT:4,NORMAL:7,WIDE:11};
  let prefs={...DEFAULTS};
  let applying=false;

  function normalize(value){
    const source=value&&typeof value==="object"?value:{};
    const spacing=Object.prototype.hasOwnProperty.call(SPACING,String(source.spacing||"").toUpperCase())?String(source.spacing).toUpperCase():DEFAULTS.spacing;
    return {spacing,grid:source.grid!==false};
  }

  function load(){
    if(typeof window==="undefined") return {...prefs};
    try{prefs=normalize(JSON.parse(window.localStorage.getItem(STORAGE_KEY)||"null"));}catch(_){prefs={...DEFAULTS};}
    return {...prefs};
  }

  function save(next){
    prefs=normalize(next);
    if(typeof window!=="undefined"){
      try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify(prefs));}catch(_){ }
    }
    return {...prefs};
  }

  function applyToCharts(){
    if(typeof window==="undefined"||applying) return false;
    applying=true;
    try{
      const charts=Array.isArray(window.__stratLightweightCharts)?window.__stratLightweightCharts:[];
      for(const chart of charts){
        try{chart.timeScale().applyOptions({barSpacing:SPACING[prefs.spacing]});}catch(_){ }
        try{chart.applyOptions({grid:{vertLines:{color:prefs.grid?"#18213b":"rgba(0,0,0,0)"},horzLines:{color:prefs.grid?"#18213b":"rgba(0,0,0,0)"}}});}catch(_){ }
      }
      return charts.length>0;
    }finally{applying=false;}
  }

  function ensureControls(){
    if(typeof document==="undefined") return false;
    const host=document.getElementById("chartWorkspaceControls");
    if(!host||!document.getElementById("chartPanelCount")) return false;
    let group=document.getElementById("chartViewControls");
    if(!group){
      group=document.createElement("span");
      group.id="chartViewControls";
      group.style.cssText="display:flex;gap:8px;align-items:center;flex-wrap:wrap";
      group.innerHTML='<label class="small">Spacing <select id="chartBarSpacing"><option value="TIGHT">Tight</option><option value="NORMAL">Normal</option><option value="WIDE">Wide</option></select></label><label class="checkrow" style="padding:0"><input id="chartGridVisible" type="checkbox"> Grid</label>';
      host.appendChild(group);
      const spacing=group.querySelector("#chartBarSpacing"),grid=group.querySelector("#chartGridVisible");
      spacing.addEventListener("change",()=>{save({...prefs,spacing:spacing.value});applyToCharts();});
      grid.addEventListener("change",()=>{save({...prefs,grid:grid.checked});applyToCharts();});
    }
    const spacing=group.querySelector("#chartBarSpacing"),grid=group.querySelector("#chartGridVisible");
    if(spacing&&spacing.value!==prefs.spacing) spacing.value=prefs.spacing;
    if(grid&&grid.checked!==prefs.grid) grid.checked=prefs.grid;
    setTimeout(applyToCharts,0);
    return true;
  }

  function refresh(){ensureControls();setTimeout(applyToCharts,0);}

  function installResearchConsole(){
    if(typeof window==="undefined"||typeof document==="undefined"||window.__stratChartPreferencesInstalled) return false;
    window.__stratChartPreferencesInstalled=true;
    load();refresh();
    const target=document.getElementById("charts")||document.body;
    const observer=new MutationObserver(()=>refresh());
    observer.observe(target,{childList:true,subtree:true});
    window.__stratChartPreferencesObserver=observer;
    return true;
  }

  return {STORAGE_KEY,DEFAULTS,SPACING,normalize,load,save,applyToCharts,ensureControls,refresh,installResearchConsole};
});
