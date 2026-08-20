"use strict";

const contextModule=(typeof module!=="undefined"&&module.exports)?require("./setup-context.js"):(globalThis.StratSetupContext||{});
const buildSetupContext=contextModule.buildSetupContext;

function finite(v){return v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));}
function normalizeSymbol(v){return String(v||"").trim().toUpperCase();}
function normalizeTimeframe(v){return String(v||"").trim().toUpperCase();}

function compactHistoricalEvidence(value){
  if(!value||typeof value!=="object"||!(Number(value.sampleSize)>0)) return null;
  return {
    sampleSize:Number(value.sampleSize),
    successRate:finite(value.successRate)?Number(value.successRate):null,
    successDefinition:value.successDefinition||null,
    window:value.window||null,
    source:value.source||null
  };
}

function buildScannerCard({
  symbol,timeframe,signals=[],primarySignal=null,practiceTrade=null,carrier=null,ftfc=null,indexBreadth=null,sectorBreadth=null,
  entry=null,stop=null,target=null,minRewardRisk=2,historicalEvidence=null,observedAt=null,sector=null,price=null
}={}){
  if(typeof buildSetupContext!=="function") throw new Error("setup-context dependency unavailable");
  const sym=normalizeSymbol(symbol||primarySignal?.symbol||practiceTrade?.symbol);
  if(!sym) throw new Error("symbol required");

  const signal=primarySignal||(Array.isArray(signals)?signals.find(Boolean):null)||practiceTrade?.context?.signal||null;
  const tf=normalizeTimeframe(timeframe||signal?.timeframe||practiceTrade?.timeframe);
  if(!tf) throw new Error("timeframe required");

  const context=practiceTrade?.context?.setupContext||buildSetupContext({
    signals,primarySignal:signal,practiceTrade,carrier,ftfc,indexBreadth,sectorBreadth,entry,stop,target,minRewardRisk,historicalEvidence
  });

  const advisoryState=context?.advisory?.state||"WAIT_NO_ACTIONABLE_SETUP";
  const rr=context?.rrGate?.rr??null;
  const setupLabel=signal?.setupId||signal?.setupFamily||signal?.setup||signal?.label||signal?.pattern||practiceTrade?.setupType||null;

  return {
    cardType:"SCANNER_SETUP_CONTEXT",
    symbol:sym,timeframe:tf,sector:sector||null,price:finite(price)?Number(price):null,
    direction:context?.direction||null,setup:setupLabel,advisoryState,
    actionable:advisoryState==="WATCH_ACTIONABLE_SETUP"||advisoryState==="ACTIVE_TRADE_CONTEXT",
    trigger:finite(entry)?Number(entry):finite(signal?.trigger)?Number(signal.trigger):finite(signal?.triggerPrice)?Number(signal.triggerPrice):finite(practiceTrade?.triggerPrice)?Number(practiceTrade.triggerPrice):null,
    stop:finite(stop)?Number(stop):finite(practiceTrade?.stopPrice)?Number(practiceTrade.stopPrice):null,
    target:finite(target)?Number(target):finite(practiceTrade?.targetPrice)?Number(practiceTrade.targetPrice):finite(signal?.magnitude)?Number(signal.magnitude):null,
    rewardRisk:rr,rewardRiskStatus:context?.rrGate?.status||"UNKNOWN",
    ftfc:{alignment:ftfc?.alignment||context?.evidence?.find?.(e=>e.label==="FTFC")?.value||null,status:context?.evidence?.find?.(e=>e.label==="FTFC")?.status||"UNKNOWN"},
    breadth:{
      index:{context:indexBreadth?.context||context?.evidence?.find?.(e=>e.label==="BREADTH")?.value||null,status:context?.evidence?.find?.(e=>e.label==="BREADTH")?.status||"UNKNOWN"},
      sector:{context:sectorBreadth?.context||context?.evidence?.find?.(e=>e.label==="SECTOR_BREADTH")?.value||null,status:context?.evidence?.find?.(e=>e.label==="SECTOR_BREADTH")?.status||"UNKNOWN"}
    },
    historicalEvidence:compactHistoricalEvidence(historicalEvidence||context?.evidence?.find?.(e=>e.label==="HISTORICAL_EVIDENCE")?.value),
    why:Array.isArray(context?.why)?context.why:[],setupContext:context,observedAt:observedAt||null,probabilityScore:null,brokerAuthority:false
  };
}

function rankScannerCards(cards=[]){
  return (Array.isArray(cards)?cards:[]).slice().sort((a,b)=>{
    const stateWeight=s=>s==="ACTIVE_TRADE_CONTEXT"?3:s==="WATCH_ACTIONABLE_SETUP"?2:1;
    const rrWeight=c=>c?.rewardRiskStatus==="PASS"&&Number.isFinite(Number(c?.rewardRisk))?Number(c.rewardRisk):0;
    const alignedWeight=c=>[c?.ftfc?.status,c?.breadth?.index?.status,c?.breadth?.sector?.status].filter(v=>v==="ALIGNED").length;
    return stateWeight(b?.advisoryState)-stateWeight(a?.advisoryState)||alignedWeight(b)-alignedWeight(a)||rrWeight(b)-rrWeight(a)||String(a?.symbol||"").localeCompare(String(b?.symbol||""));
  });
}

const scannerCardApi={compactHistoricalEvidence,buildScannerCard,rankScannerCards};
if(typeof module!=="undefined"&&module.exports) module.exports=scannerCardApi;
if(typeof globalThis!=="undefined") globalThis.StratScannerCard=scannerCardApi;

// Research Console bootstrap only. The model remains side-effect free in Node and in other browser surfaces.
if(typeof window!=="undefined"&&typeof document!=="undefined"&&/^Trading Research Console/.test(document.title||"")&&!window.__stratResearchConsoleBootstrapQueued){
  window.__stratResearchConsoleBootstrapQueued=true;
  const script=document.createElement("script");
  script.src="research-console-wiring.js";
  script.async=true;
  document.head.appendChild(script);
}
