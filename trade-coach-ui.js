"use strict";

function severityClass(severity){
  const s=String(severity||"INFO").toUpperCase();
  if(s==="HIGH") return "bad";
  if(s==="CAUTION") return "warn";
  if(s==="POSITIVE") return "ok";
  return "";
}

function compactWhy(why=[]){
  return (Array.isArray(why)?why:[]).map(item=>({
    label:item?.label||"EVIDENCE",
    status:item?.status||"UNKNOWN",
    value:item?.value??null,
    explanatoryOnly:item?.explanatoryOnly===true
  }));
}

function buildTradeCoachViewModel(guidance){
  if(!guidance||guidance.emit!==true){
    return {
      visible:false,
      code:guidance?.code||"NO_GUIDANCE",
      severity:"INFO",
      severityClass:"",
      title:"No new guidance",
      message:"No meaningful state change requires a new Trade Coach message.",
      why:[],
      brokerAuthority:false,
      aiAuthority:false
    };
  }
  return {
    visible:true,
    code:String(guidance.code||"GUIDANCE"),
    severity:String(guidance.severity||"INFO").toUpperCase(),
    severityClass:severityClass(guidance.severity),
    title:String(guidance.title||"Trade Coach"),
    message:String(guidance.message||""),
    why:compactWhy(guidance.why),
    observedAt:guidance.observedAt||null,
    brokerAuthority:false,
    aiAuthority:false
  };
}

const api={severityClass,compactWhy,buildTradeCoachViewModel};
if(typeof module!=="undefined"&&module.exports) module.exports=api;
if(typeof globalThis!=="undefined") globalThis.StratTradeCoachUI=api;
