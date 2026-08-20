"use strict";

const advisoryModule=(typeof module!=="undefined"&&module.exports)?require("./advisory-state.js"):(globalThis.StratAdvisoryState||{});
const deriveAdvisoryState=advisoryModule.deriveAdvisoryState;

function validDirection(value){
  const d=String(value||"").toUpperCase();
  return d==="BULLISH"||d==="BEARISH"?d:null;
}

function normalizeRR({entry,stop,target,direction}={}){
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
  const signal=primarySignal || (Array.isArray(signals)?signals.find(Boolean):null);
  const direction=validDirection(signal?.direction||practiceTrade?.direction);
  const advisory=deriveAdvisoryState({signals,practiceTrade,carrier,breadth:indexBreadth});
  const rr=normalizeRR({entry:entry??signal?.triggerPrice??signal?.trigger??practiceTrade?.entryPrice,stop:stop??practiceTrade?.stopPrice,target:target??practiceTrade?.targetPrice,direction});
  const minRR=Number(minRewardRisk);
  const rrGate=rr.valid?{status:rr.rr>=(Number.isFinite(minRR)?minRR:2)?"PASS":"FAIL",minimum:Number.isFinite(minRR)?minRR:2,...rr}:{status:"UNKNOWN",minimum:Number.isFinite(minRR)?minRR:2,...rr};

  const evidence=[
    {label:"SETUP",status:signal?"PRESENT":"ABSENT",value:signal?.setupId||signal?.setupFamily||signal?.setup||signal?.label||signal?.pattern||null},
    evidenceStatus(direction,"FTFC",ftfc?.alignment||null),
    evidenceStatus(direction,"BREADTH",indexBreadth?.context||null),
    {label:"SECTOR_BREADTH",status:evidenceStatus(direction,"BREADTH",sectorBreadth?.context||null).status,value:sectorBreadth?.context||null},
    {label:"RISK_REWARD",status:rrGate.status,value:rrGate.rr},
    {label:"HISTORICAL_EVIDENCE",status:historicalEvidence?.sampleSize>0?"AVAILABLE":"NOT_AVAILABLE",value:historicalEvidence||null}
  ];

  const why=evidence.map(item=>({...item,explanatoryOnly:item.label!=="SETUP"&&item.label!=="RISK_REWARD"}));
  return {
    advisory,direction,signal:signal||null,rrGate,evidence,why,probabilityScore:null,
    safeguards:{breadthDoesNotCreateSetup:true,ftfcDoesNotCreateSetup:true,historicalEvidenceIsNotForecast:true,opaqueProbabilityDisabled:true}
  };
}

const setupContextApi={validDirection,normalizeRR,evidenceStatus,buildSetupContext};
if(typeof module!=="undefined"&&module.exports) module.exports=setupContextApi;
if(typeof globalThis!=="undefined") globalThis.StratSetupContext=setupContextApi;
