"use strict";

const dataSemantics=require("./data-semantics.js");

function finite(v){ return v!==null && v!==undefined && v!=="" && Number.isFinite(Number(v)); }

function normalizeProviderBars({bars=[],symbol,timeframe,marketTimezone="America/New_York",session="REGULAR",provider,providerAggregation,barAnchor="PROVIDER_NATIVE",barAnchorOffsetMinutes=0,periodResolver}={}){
  if(typeof periodResolver!=="function") throw new Error("periodResolver required");
  return (Array.isArray(bars)?bars:[]).map((bar,index)=>{
    for(const field of ["open","high","low","close"]){
      if(!finite(bar?.[field])) throw new Error(`invalid ${field} at row ${index}`);
    }
    const resolved=periodResolver({bar,index,symbol,timeframe,marketTimezone,session});
    if(!resolved || !resolved.periodOpenId || !resolved.periodOpenTimestamp) throw new Error(`periodResolver incomplete at row ${index}`);
    const meta={
      symbol:symbol || bar.symbol,
      timeframe,
      marketTimezone,
      session,
      extendedHoursIncluded:session!=="REGULAR",
      barAnchor,
      barAnchorOffsetMinutes,
      provider:provider || bar.provider,
      providerAggregation:providerAggregation || bar.providerTimeframe || "PROVIDER_NATIVE",
      periodOpenId:resolved.periodOpenId,
      periodOpenTimestamp:resolved.periodOpenTimestamp,
      barOpenTimestamp:resolved.barOpenTimestamp || null,
      barCloseTimestamp:resolved.barCloseTimestamp || null
    };
    return dataSemantics.attachSemanticsToBar(bar,meta);
  });
}

function compareSeriesSemantics(leftBars=[],rightBars=[]){
  const left=leftBars[0]?.semantics || null;
  const right=rightBars[0]?.semantics || null;
  if(!left || !right) return {comparable:false,mismatches:[{field:"series",left:!!left,right:!!right}]};
  return dataSemantics.comparableSemantics(left,right);
}

module.exports={normalizeProviderBars,compareSeriesSemantics};
