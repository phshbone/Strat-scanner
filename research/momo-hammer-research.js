"use strict";
// Research only. This module never authorizes entries, modifies Strat setups, or places orders.
function num(v){return v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v))?Number(v):null;}
function classifyMomoHammer(bars,index,{maxBodyFraction=1/3,minLowerWickToBody=1,trendLookback=3}={}){
  if(!Array.isArray(bars)||!Number.isInteger(index)||index<trendLookback||index>=bars.length)return {status:"INSUFFICIENT_DATA"};
  const b=bars[index],high=num(b.high),low=num(b.low),open=num(b.open),close=num(b.close);
  if([high,low,open,close].some(v=>v===null)||high<=low||Math.max(open,close)>high||Math.min(open,close)<low)return {status:"INVALID_BAR"};
  const range=high-low,body=Math.abs(close-open),lowerWick=Math.min(open,close)-low;
  const prior=bars.slice(index-trendLookback,index);
  if(prior.some(x=>num(x.close)===null||num(x.open)===null||num(x.high)===null))return {status:"INSUFFICIENT_DATA"};
  // Operational research proxy for prior bullish momentum, not an asserted canonical Strat rule.
  const bullishContext=prior.at(-1).close>prior[0].close&&prior.at(-1).close>prior.at(-1).open;
  const geometry=(high-Math.min(open,close))/range<=maxBodyFraction&&lowerWick>=body*minLowerWickToBody&&lowerWick>0;
  return {status:geometry&&bullishContext?"CANDIDATE":"NOT_QUALIFIED",geometry,bullishContext,hammerHigh:high,hammerLow:low,bodyFraction:body/range,lowerWickFraction:lowerWick/range,definitionVersion:"MOMO_RESEARCH_PROXY_V1"};
}
function confirmMomoBreak(bars,index,options={}){
  const state=classifyMomoHammer(bars,index,options);
  if(state.status!=="CANDIDATE")return {...state,confirmation:"NOT_CONFIRMED"};
  const next=bars[index+1];
  if(!next)return {...state,confirmation:"AWAITING_NEXT_BAR"};
  const high=num(next.high),low=num(next.low);
  if(high===null||low===null)return {...state,confirmation:"INVALID_NEXT_BAR"};
  if(high>state.hammerHigh&&low<=state.hammerLow)return {...state,confirmation:"SEQUENCE_AMBIGUOUS"};
  return {...state,confirmation:high>state.hammerHigh?"HIGH_BROKEN":"NOT_TRIGGERED"};
}
function scenarioRiskPlans({entry,originalStop,originalShares,hammerHigh,hammerLow,addShares=0,maxTotalRisk=null}={}){
  const e=num(entry),s=num(originalStop),n=num(originalShares),h=num(hammerHigh),l=num(hammerLow),a=num(addShares),cap=maxTotalRisk===null?null:num(maxTotalRisk);
  if([e,s,n,h,l,a].some(v=>v===null)||!(e>s&&h>l&&n>0&&a>=0)||(cap!==null&&cap<0))throw new Error("valid bullish trade and hammer geometry required");
  // Adding is modeled at hammer breakout level (not assumed executable fill).
  const originalRisk=n*Math.max(0,e-s),trailStop=Math.max(s,l);
  const trailsRisk=n*Math.max(0,e-trailStop),addRisk=a*Math.max(0,h-s),addTrailRisk=a*Math.max(0,h-trailStop);
  const plans=[
    {scenario:"HOLD",stop:s,addShares:0,capitalRisk:originalRisk},
    {scenario:"TRAIL",stop:trailStop,addShares:0,capitalRisk:trailsRisk},
    {scenario:"ADD",stop:s,addShares:a,capitalRisk:originalRisk+addRisk},
    {scenario:"ADD_AND_TRAIL",stop:trailStop,addShares:a,capitalRisk:trailsRisk+addTrailRisk}
  ];
  return plans.map(p=>({...p,withinRiskBudget:cap===null?null:p.capitalRisk<=cap,riskBudget:cap,fillAssumption:"HAMMER_HIGH_IDEALIZED_NO_SLIPPAGE",liveAuthorized:false}));
}
module.exports={classifyMomoHammer,confirmMomoBreak,scenarioRiskPlans};
