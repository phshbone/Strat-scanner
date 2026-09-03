"use strict";

(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  if(root) root.StratChartAnalysisOverlays=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const STORAGE_KEY="strat.chartAnalysisOverlays.v1";
  const DEFAULTS={volume:true,stratLabels:true,setupLevels:true};
  let prefs={...DEFAULTS};
  const decoratedCharts=new WeakSet();

  function finite(value){return value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value));}
  function normalize(value){
    const source=value&&typeof value==="object"?value:{};
    return {volume:source.volume!==false,stratLabels:source.stratLabels!==false,setupLevels:source.setupLevels!==false};
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

  function classifyBar(current,prior){
    if(!current||!prior) return null;
    const H=Number(current.high),L=Number(current.low),PH=Number(prior.high),PL=Number(prior.low);
    if(![H,L,PH,PL].every(Number.isFinite)) return null;
    if(H<=PH&&L>=PL) return "1";
    if(H>PH&&L>=PL) return "2U";
    if(L<PL&&H<=PH) return "2D";
    if(H>PH&&L<PL) return "3";
    return "?";
  }

  function timestampForBar(bar){
    const value=Date.parse(bar?.semantics?.barOpenTimestamp||bar?.datetime||"");
    return Number.isFinite(value)?Math.floor(value/1000):null;
  }

  function volumeData(series){
    return (Array.isArray(series?.bars)?series.bars:[]).map(bar=>{
      const time=timestampForBar(bar),value=Number(bar?.volume);
      if(time===null||!Number.isFinite(value)||value<0) return null;
      const up=Number(bar.close)>=Number(bar.open);
      return {time,value,color:up?"rgba(95,191,134,0.35)":"rgba(216,108,108,0.35)"};
    }).filter(Boolean).sort((a,b)=>a.time-b.time);
  }

  function stratMarkers(series,limit=40){
    const bars=Array.isArray(series?.bars)?series.bars:[];
    const start=Math.max(1,bars.length-Math.max(1,Number(limit)||40));
    const markers=[];
    for(let i=start;i<bars.length;i++){
      const type=classifyBar(bars[i],bars[i-1]),time=timestampForBar(bars[i]);
      if(!type||time===null) continue;
      markers.push({time,position:"aboveBar",shape:"circle",color:"#aeb9d5",text:type,size:0.7});
    }
    return markers;
  }

  function setupLevels(series,detectSetupFn){
    const bars=Array.isArray(series?.bars)?series.bars:[];
    if(typeof detectSetupFn!=="function"||bars.length<3) return {trigger:null,target:null,direction:null,setup:null};
    let setup=null;
    try{setup=detectSetupFn(bars,{})||null;}catch(_){setup=null;}
    const direction=String(setup?.direction||"").toUpperCase();
    if(!["BULLISH","BEARISH"].includes(direction)) return {trigger:null,target:null,direction:null,setup:setup?.name||null};
    return {trigger:finite(setup?.trigger)?Number(setup.trigger):null,target:finite(setup?.magnitude)?Number(setup.magnitude):null,direction,setup:setup?.name||null};
  }

  function workspacePanels(){
    if(typeof window==="undefined") return [];
    const handoff=window.__stratChartWorkspaceHandoff,api=window.StratChartWorkspaceUI;
    if(!handoff?.series||!api?.panelSeriesForWorkspace) return [];
    const timeframes=handoff?.workspace?.timeframes||[handoff.series.timeframe];
    try{return api.panelSeriesForWorkspace(handoff.series,timeframes);}catch(_){return [];}
  }

  function addVolume(chart,series){
    if(!prefs.volume||typeof chart?.addHistogramSeries!=="function") return false;
    const data=volumeData(series);if(!data.length) return false;
    try{
      const histogram=chart.addHistogramSeries({priceFormat:{type:"volume"},priceScaleId:"",lastValueVisible:false,priceLineVisible:false});
      histogram.priceScale().applyOptions({scaleMargins:{top:0.78,bottom:0}});histogram.setData(data);return true;
    }catch(_){return false;}
  }

  function addStratLabelsAndLevels(chart,series,isExact){
    if((!prefs.stratLabels&&!prefs.setupLevels)||typeof chart?.addLineSeries!=="function") return false;
    const api=window.StratChartWorkspaceUI,data=api?.chartDataFromSeries?api.chartDataFromSeries(series):[];
    if(!data.length) return false;
    try{
      const helper=chart.addLineSeries({color:"rgba(0,0,0,0)",lineVisible:false,lastValueVisible:false,priceLineVisible:false,crosshairMarkerVisible:false});
      helper.setData(data.map(row=>({time:row.time,value:row.close})));
      if(prefs.stratLabels&&typeof helper.setMarkers==="function") helper.setMarkers(stratMarkers(series));
      if(prefs.setupLevels&&isExact&&typeof helper.createPriceLine==="function"){
        const levels=setupLevels(series,window.detectSetup);
        if(finite(levels.trigger)) helper.createPriceLine({price:levels.trigger,color:"#d5a84b",lineWidth:1,lineStyle:2,axisLabelVisible:true,title:"Trigger"});
        if(finite(levels.target)) helper.createPriceLine({price:levels.target,color:"#7abf9b",lineWidth:1,lineStyle:2,axisLabelVisible:true,title:"Magnitude"});
      }
      return true;
    }catch(_){return false;}
  }

  function decorateCharts(){
    if(typeof window==="undefined") return 0;
    const charts=Array.isArray(window.__stratLightweightCharts)?window.__stratLightweightCharts:[],panels=workspacePanels();
    let count=0;
    for(let i=0;i<charts.length;i++){
      const chart=charts[i],panel=panels[i];
      if(!chart||!panel||decoratedCharts.has(chart)) continue;
      addVolume(chart,panel.series);addStratLabelsAndLevels(chart,panel.series,panel.mode==="EXACT");decoratedCharts.add(chart);count++;
    }
    return count;
  }

  function requestRerender(){
    if(typeof document==="undefined") return false;
    const panelCount=document.getElementById("chartPanelCount");
    if(panelCount){panelCount.dispatchEvent(new Event("change",{bubbles:true}));return true;}
    setTimeout(decorateCharts,0);return false;
  }

  function ensureControls(){
    if(typeof document==="undefined") return false;
    const host=document.getElementById("chartWorkspaceControls");
    if(!host||!document.getElementById("chartPanelCount")) return false;
    let group=document.getElementById("chartAnalysisControls");
    if(!group){
      group=document.createElement("span");group.id="chartAnalysisControls";group.style.cssText="display:flex;gap:8px;align-items:center;flex-wrap:wrap";
      group.innerHTML='<label class="checkrow" style="padding:0"><input id="chartVolumeVisible" type="checkbox"> Volume</label><label class="checkrow" style="padding:0"><input id="chartStratLabelsVisible" type="checkbox"> Strat labels</label><label class="checkrow" style="padding:0"><input id="chartSetupLevelsVisible" type="checkbox"> Trigger / magnitude</label>';
      host.appendChild(group);
      const volume=group.querySelector("#chartVolumeVisible"),labels=group.querySelector("#chartStratLabelsVisible"),levels=group.querySelector("#chartSetupLevelsVisible");
      const rerender=()=>{save({volume:volume.checked,stratLabels:labels.checked,setupLevels:levels.checked});requestRerender();};
      volume.addEventListener("change",rerender);labels.addEventListener("change",rerender);levels.addEventListener("change",rerender);
    }
    const volume=group.querySelector("#chartVolumeVisible"),labels=group.querySelector("#chartStratLabelsVisible"),levels=group.querySelector("#chartSetupLevelsVisible");
    if(volume) volume.checked=prefs.volume;if(labels) labels.checked=prefs.stratLabels;if(levels) levels.checked=prefs.setupLevels;
    return true;
  }

  function refresh(){ensureControls();setTimeout(decorateCharts,0);setTimeout(decorateCharts,120);}

  function installResearchConsole(){
    if(typeof window==="undefined"||typeof document==="undefined"||window.__stratChartAnalysisOverlaysInstalled) return false;
    window.__stratChartAnalysisOverlaysInstalled=true;load();refresh();
    const target=document.getElementById("charts")||document.body;
    const observer=new MutationObserver(()=>refresh());observer.observe(target,{childList:true,subtree:true});window.__stratChartAnalysisOverlaysObserver=observer;return true;
  }

  return {STORAGE_KEY,DEFAULTS,normalize,load,save,classifyBar,timestampForBar,volumeData,stratMarkers,setupLevels,decorateCharts,requestRerender,ensureControls,refresh,installResearchConsole};
});
