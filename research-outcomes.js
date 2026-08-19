"use strict";

function finite(v){ return Number.isFinite(Number(v)); }

function normalizeEvent(event){
  if(!event || typeof event!=="object") return null;
  const required=["entry","stop","magnitude","direction"];
  if(!required.every(k=>event[k]!=null)) return null;
  if(!finite(event.entry)||!finite(event.stop)||!finite(event.magnitude)) return null;
  if(!["BULLISH","BEARISH"].includes(event.direction)) return null;
  return {
    ...event,
    entry:Number(event.entry),
    stop:Number(event.stop),
    magnitude:Number(event.magnitude)
  };
}

function riskPerShare(event){
  const e=normalizeEvent(event); if(!e) return null;
  const r=e.direction==="BULLISH" ? e.entry-e.stop : e.stop-e.entry;
  return r>0?r:null;
}

function rewardToMagnitude(event){
  const e=normalizeEvent(event); if(!e) return null;
  const r=e.direction==="BULLISH" ? e.magnitude-e.entry : e.entry-e.magnitude;
  return r>0?r:null;
}

function plannedRMultiple(event){
  const risk=riskPerShare(event), reward=rewardToMagnitude(event);
  return risk&&reward?reward/risk:null;
}

function classifyOutcome(event){
  const e=normalizeEvent(event); if(!e) return {status:"INVALID"};
  const magnitudeHit=e.magnitudeHit===true;
  const stopHit=e.stopHit===true;
  const order=e.firstHit||null;

  if(magnitudeHit && stopHit){
    if(order==="MAGNITUDE") return {status:"WIN",reason:"MAGNITUDE_FIRST"};
    if(order==="STOP") return {status:"LOSS",reason:"STOP_FIRST"};
    return {status:"AMBIGUOUS",reason:"BOTH_HIT_SEQUENCE_UNKNOWN"};
  }
  if(magnitudeHit) return {status:"WIN",reason:"MAGNITUDE_HIT"};
  if(stopHit) return {status:"LOSS",reason:"STOP_HIT"};
  if(e.closed===true) return {status:"UNRESOLVED",reason:"CLOSED_WITHOUT_MAGNITUDE_OR_STOP"};
  return {status:"OPEN",reason:"STILL_ACTIVE"};
}

function realizedR(event){
  const e=normalizeEvent(event); if(!e || !finite(e.exit)) return null;
  const risk=riskPerShare(e); if(!risk) return null;
  const pnl=e.direction==="BULLISH" ? Number(e.exit)-e.entry : e.entry-Number(e.exit);
  return pnl/risk;
}

function summarizeEvents(events){
  const rows=(Array.isArray(events)?events:[]).map(e=>({event:e,outcome:classifyOutcome(e)}));
  const resolved=rows.filter(x=>x.outcome.status==="WIN"||x.outcome.status==="LOSS");
  const wins=resolved.filter(x=>x.outcome.status==="WIN").length;
  const losses=resolved.length-wins;
  const ambiguous=rows.filter(x=>x.outcome.status==="AMBIGUOUS").length;
  const open=rows.filter(x=>x.outcome.status==="OPEN").length;
  const unresolved=rows.filter(x=>x.outcome.status==="UNRESOLVED").length;
  const rValues=rows.map(x=>realizedR(x.event)).filter(Number.isFinite);
  const avgR=rValues.length?rValues.reduce((a,b)=>a+b,0)/rValues.length:null;
  return {
    samples:rows.length,
    resolved:resolved.length,
    wins,
    losses,
    winRate:resolved.length?wins/resolved.length:null,
    ambiguous,
    open,
    unresolved,
    averageRealizedR:avgR
  };
}

function groupKey(event,fields){
  return fields.map(f=>`${f}=${event?.[f]??"UNKNOWN"}`).join("|");
}

function compareScenarios(events,fields){
  const groups=new Map();
  (Array.isArray(events)?events:[]).forEach(event=>{
    const key=groupKey(event,fields);
    if(!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(event);
  });
  return Array.from(groups.entries()).map(([scenario,rows])=>({scenario,...summarizeEvents(rows)}));
}

if(typeof module!=="undefined") module.exports={normalizeEvent,riskPerShare,rewardToMagnitude,plannedRMultiple,classifyOutcome,realizedR,summarizeEvents,compareScenarios};
