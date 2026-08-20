"use strict";

const advisoryModule=(typeof module!=="undefined"&&module.exports)?require("./advisory-state.js"):(globalThis.StratAdvisoryState||{});
const deriveAdvisoryState=advisoryModule.deriveAdvisoryState;

function validDirection(value){
  const d=String(value||"").toUpperCase();
  return d==="BULLISH"||d==="BEARISH"?d:null;
}

function resolvePrimarySignal({signals=[],primarySignal=null,practiceTrade=null}={}){
  if(primarySignal&&typeof primarySignal==="object") return {signal:primarySignal,status:"EXPLICIT",candidateCount:Array.isArray(signals)?signals.filter(Boolean).length:0};
  const practiceSignal=practiceTrade?.context?.signal;
  if(practiceSignal&&typeof practiceSignal==="object") return {signal:practiceSignal,status:"PRACTICE_CONTEXT",candidateCount:Array.isArray(signals)?signals.filter(Boolean).length:0};
  const candidates=(Array.isArray(signals)?signals:[]).filter(Boolean);
  if(candidates.length===0) return {signal:null,status:"NONE",candidateCount:0};
  if(candidates.length===1) return {signal:candidates[0],status:"ONLY_SIGNAL",candidateCount:1};
  return {signal:null,status:"AMBIGUOUS",candidateCount:candidates.length};
}

function normalizeRR({entry,stop,target,direction}={}){
  const present=v=>v!==null&&v!==undefined&&v!=="";
  if(![entry,stop,target].every(present)) return {valid:false,rr:null,risk:null,reward:null};
  const e=Number(entry), s=Number(stop), t=Number(target), d=validDirection(direction);
  if(![e,s,t].every(Number.isFinite)||!d) return {valid:false,rr:null,risk:null,reward:null};
  const risk=d==="BULLISH"?e-s:s-e;
  const reward=d==="BULLISH"?t-e:e-t;
  if(!(risk>0)||!(reward>0)) return {valid:false,rr:null,risk,reward};
  return {valid:true,risk:Number(risk.toFixed(8)),reward:Number(reward.toFixed(8)),rr:Number((reward/risk).toFixed(2))};
}

function evidenceStatus(direction,label,value){
  if(!direction||value==null) return {label,status:"UNKNOWN",value:value??null};
  const upper=String(value).toUpperCase();
  const bull=direction==="BULLISH";
  if(label==="FTFC"){
    if(upper===(bull?"FULL_BULLISH":"FULL_BEARISH")||upper===(bull?"BULLISH_MAJORITY":"BEARISH_MAJORITY")) return {label,status:"ALIGNED",value};
    if(upper==="MIXED"||upper==="NO_DATA") return {label,status:"MIXED_OR_UNKNOWN",value};
    return {label,status:"OPPOSED",value};
  }
  if(label==="BREADTH"){
    if(upper===(bull?"BULLISH_MAJORITY":"BEARISH_MAJORITY")) return {label,status:"ALIGNED",value};
    if(upper==="MIXED"||upper==="NO_DATA") return {label,status:"MIXED_OR_UNKNOWN",value};
    return {label,status:"OPPOSED",value};
  }
  return {label,status:"UNKNOWN",value};
}

function buildSetupContext({
  signals=[],primarySignal=null,practiceTrade=null,carrier=null,ftfc=null,indexBreadth=null,sectorBreadth=null,
  entry=null,stop=null,target=null,minRewardRisk=2,historicalEvidence=null
}={}){
  if(typeof deriveAdvisoryState!=="function") throw new Error("advisory-state dependency unavailable");
  const primary=resolvePrimarySignal({signals,primarySignal,practiceTrade});
  const signal=primary.signal;
  const direction=validDirection(signal?.direction||practiceTrade?.direction);
  const advisory=deriveAdvisoryState({signals,practiceTrade,carrier,breadth:indexBreadth});
  const rr=normalizeRR({entry:entry??signal?.triggerPrice??signal?.trigger??practiceTrade?.entryPrice,stop:stop??practiceTrade?.stopPrice,target:target??practiceTrade?.targetPrice,direction});
  const minRR=Number(minRewardRisk);
  const rrGate=rr.valid?{status:rr.rr>=(Number.isFinite(minRR)?minRR:2)?"PASS":"FAIL",minimum:Number.isFinite(minRR)?minRR:2,...rr}:{status:"UNKNOWN",minimum:Number.isFinite(minRR)?minRR:2,...rr};

  const setupEvidence=primary.status==="AMBIGUOUS"
    ? {label:"SETUP",status:"AMBIGUOUS_PRIMARY",value:`${primary.candidateCount} candidates — explicit primary required`}
    : {label:"SETUP",status:signal?"PRESENT":"ABSENT",value:signal?.setupId||signal?.setupFamily||signal?.setup||signal?.label||signal?.pattern||null};
  const evidence=[
    setupEvidence,
    evidenceStatus(direction,"FTFC",ftfc?.alignment||null),
    evidenceStatus(direction,"BREADTH",indexBreadth?.context||null),
    {label:"SECTOR_BREADTH",status:evidenceStatus(direction,"BREADTH",sectorBreadth?.context||null).status,value:sectorBreadth?.context||null},
    {label:"RISK_REWARD",status:rrGate.status,value:rrGate.rr},
    {label:"HISTORICAL_EVIDENCE",status:historicalEvidence?.sampleSize>0?"AVAILABLE":"NOT_AVAILABLE",value:historicalEvidence||null}
  ];

  const why=evidence.map(item=>({...item,explanatoryOnly:item.label!=="SETUP"&&item.label!=="RISK_REWARD"}));
  return {
    advisory,direction,signal:signal||null,primarySignalResolution:primary,rrGate,evidence,why,probabilityScore:null,
    safeguards:{breadthDoesNotCreateSetup:true,ftfcDoesNotCreateSetup:true,historicalEvidenceIsNotForecast:true,opaqueProbabilityDisabled:true,ambiguousPrimarySignalNotGuessed:true}
  };
}

const setupContextApi={validDirection,resolvePrimarySignal,normalizeRR,evidenceStatus,buildSetupContext};
if(typeof module!=="undefined"&&module.exports) module.exports=setupContextApi;
if(typeof globalThis!=="undefined") globalThis.StratSetupContext=setupContextApi;
