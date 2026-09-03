"use strict";

(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  if(root) root.StratUICleanup=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const STYLE_ID="stratUiCleanupStyles";

  function setText(el,text){
    if(el&&el.textContent!==text) el.textContent=text;
  }
  function setAttr(el,name,value){
    if(el&&el.getAttribute(name)!==value) el.setAttribute(name,value);
  }

  function injectStyles(){
    if(typeof document==="undefined"||document.getElementById(STYLE_ID)) return false;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #candidateWorkflowHint{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 10px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:#0a1129;color:#b7c3df;font-size:11px}
      #candidateWorkflowHint b{color:#eef2ff}
      #candidateScrollHint{display:none;margin:-2px 0 8px;color:var(--muted);font-size:10px}
      #candidateBody .chartBtn{background:#1e2a4d;color:#fff;border-color:#43557e}
      #chartWorkspaceReference{font-weight:800}
      @media(max-width:620px){
        #liveCandidateSymbols{flex:1 1 100%;min-width:0!important;width:100%}
        #liveCandidateTimeframe{flex:1 1 auto}
        #loadLiveCandidates{flex:1 1 auto}
        #saveLiveWatchlist,#loadSavedWatchlist,#useSampleCandidates{flex:1 1 30%}
        #liveCandidateStatus,#liveCandidateBudget{flex:1 1 100%;line-height:1.45}
        #candidateScrollHint{display:block}
        #candidateBody td,.view#candidates th{padding-left:6px;padding-right:6px}
        #charts .toolbar{align-items:flex-start}
        #chartLiveWatchControls .btn{flex:1 1 auto}
        #chartLiveWatchStatus,#chartLiveWatchBudget{flex:1 1 100%;line-height:1.45}
      }
    `;
    document.head.appendChild(style);
    return true;
  }

  function ensureCandidateHints(){
    const card=document.querySelector("#candidates .card");
    if(!card) return false;
    let hint=document.getElementById("candidateWorkflowHint");
    if(!hint){
      hint=document.createElement("div");
      hint.id="candidateWorkflowHint";
      hint.innerHTML="<b>Workflow</b><span>Scan → Why → Chart → Watch live</span>";
      const controls=document.querySelector("#liveCandidateSymbols")?.closest(".toolbar");
      if(controls?.parentNode) controls.parentNode.insertBefore(hint,controls.nextSibling);
      else card.insertBefore(hint,card.querySelector(".toolbar")||card.firstChild);
    }
    let scroll=document.getElementById("candidateScrollHint");
    if(!scroll){
      scroll=document.createElement("div");
      scroll.id="candidateScrollHint";
      scroll.textContent="Swipe the table sideways for supporting columns.";
      const tableWrap=card.querySelector("table")?.parentElement;
      if(tableWrap?.parentNode) tableWrap.parentNode.insertBefore(scroll,tableWrap);
    }
    return true;
  }

  function cleanCandidateTable(){
    const table=document.querySelector("#candidates table");
    if(!table) return false;
    const headers=Array.from(table.querySelectorAll("thead th"));
    setText(headers.at(-1),"Actions");
    document.querySelectorAll("#candidateBody .whyBtn").forEach(button=>{
      setText(button,"Why");
      setAttr(button,"aria-label",`Why ${button.dataset?.symbol||"candidate"}`);
    });
    document.querySelectorAll("#candidateBody .chartBtn").forEach(button=>{
      if(button.classList.contains("secondary")) button.classList.remove("secondary");
      setAttr(button,"aria-label",`Chart ${button.dataset?.symbol||"candidate"}`);
      setAttr(button,"title","Open chart workspace");
    });
    return true;
  }

  function cleanChartWorkspace(){
    const charts=document.getElementById("charts");
    if(!charts) return false;
    setText(charts.querySelector("h2"),"Chart");
    const reference=document.getElementById("chartWorkspaceReference");
    if(reference){
      setText(reference,"REFERENCE DATA • VERIFY WITH BROKER");
      setAttr(reference,"title","Charts use the same scanner response. No independent market-data request is made. Confirm execution price in your broker before trading.");
    }
    const status=document.getElementById("chartWorkspaceStatus");
    if(status&&/Select Chart from a live Candidate/i.test(status.textContent||"")) setText(status,"Open Chart from a live candidate to inspect the exact scanner bars.");
    return true;
  }

  function refresh(){
    injectStyles();
    ensureCandidateHints();
    cleanCandidateTable();
    cleanChartWorkspace();
  }

  function installResearchConsole(){
    if(typeof window==="undefined"||typeof document==="undefined"||window.__stratUiCleanupInstalled) return false;
    window.__stratUiCleanupInstalled=true;
    refresh();
    const observer=new MutationObserver(()=>refresh());
    observer.observe(document.body,{childList:true,subtree:true});
    window.__stratUiCleanupObserver=observer;
    return true;
  }

  return {STYLE_ID,setText,setAttr,injectStyles,ensureCandidateHints,cleanCandidateTable,cleanChartWorkspace,refresh,installResearchConsole};
});
