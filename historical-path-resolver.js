"use strict";

function finite(v){return v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));}
function ts(bar){return Date.parse(bar?.semantics?.barOpenTimestamp||bar?.datetime||bar?.time||"");}
function hit(bar,direction,price,kind){
  if(!bar||!finite(price)) return false;
  const p=Number(price),bullish=direction==="BULLISH";
  if(kind==="ENTRY") return bullish?Number(bar.high)>=p:Number(bar.low)<=p;
  if(kind==="TARGET") return bullish?Number(bar.high)>=p:Number(bar.low)<=p;
  if(kind==="STOP") return bullish?Number(bar.low)<=p:Number(bar.high)>=p;
  return false;
}
function openBeyondEntry(bar,direction,entry){
  if(!bar||!finite(bar.open)||!finite(entry)) return false;
  return direction==="BULLISH"?Number(bar.open)>=Number(entry):Number(bar.open)<=Number(entry);
}

function resolveAmbiguousEvent(event,lowerBars,{parentMinutes=15,lowerMinutes=5}={}){
  if(!event||event.sequenceAmbiguous!==true) return {...event};
  if(parentMinutes%lowerMinutes!==0) throw new Error("lower timeframe must divide parent timeframe");
  const start=Date.parse(event.signalBarTimestamp||event.timestamp||"");
  if(!Number.isFinite(start)) throw new Error("ambiguous event requires parseable signal timestamp");
  const horizon=Math.max(1,Number(event.horizonBars)||20);
  const ratio=parentMinutes/lowerMinutes;
  const maxBars=(horizon+1)*ratio;
  const rows=(Array.isArray(lowerBars)?lowerBars:[])
    .filter(bar=>Number.isFinite(ts(bar))&&ts(bar)>=start)
    .sort((a,b)=>ts(a)-ts(b))
    .slice(0,maxBars);
  if(!rows.length) return {...event,pathResolutionSource:"LOWER_TIMEFRAME_UNAVAILABLE"};

  let entered=false;
  for(let i=0;i<rows.length;i++){
    const bar=rows[i];
    const entryHit=hit(bar,event.direction,event.entry,"ENTRY");
    const targetHit=hit(bar,event.direction,event.magnitude,"TARGET");
    const stopHit=hit(bar,event.direction,event.stop,"STOP");

    if(!entered){
      if(openBeyondEntry(bar,event.direction,event.entry)) entered=true;
      else if(!entryHit) continue;
      else {
        if(stopHit){
          return {...event,sequenceAmbiguous:true,ambiguityReason:"LOWER_TIMEFRAME_ENTRY_STOP_SEQUENCE_UNKNOWN",pathResolutionSource:"LOWER_TIMEFRAME_"+lowerMinutes+"M_UNRESOLVED"};
        }
        entered=true;
        if(targetHit){
          return {...event,resolution:"WIN",magnitudeHit:true,stopHit:false,firstHit:"MAGNITUDE",sequenceAmbiguous:false,ambiguityReason:null,pathResolutionSource:"LOWER_TIMEFRAME_"+lowerMinutes+"M",timeToMagnitudeBars:Math.floor(i/ratio)};
        }
        continue;
      }
    }

    if(targetHit&&stopHit){
      return {...event,sequenceAmbiguous:true,ambiguityReason:"LOWER_TIMEFRAME_TARGET_STOP_SEQUENCE_UNKNOWN",pathResolutionSource:"LOWER_TIMEFRAME_"+lowerMinutes+"M_UNRESOLVED"};
    }
    if(targetHit){
      return {...event,resolution:"WIN",magnitudeHit:true,stopHit:false,firstHit:"MAGNITUDE",sequenceAmbiguous:false,ambiguityReason:null,pathResolutionSource:"LOWER_TIMEFRAME_"+lowerMinutes+"M",timeToMagnitudeBars:Math.floor(i/ratio)};
    }
    if(stopHit){
      return {...event,resolution:"LOSS",magnitudeHit:false,stopHit:true,firstHit:"STOP",sequenceAmbiguous:false,ambiguityReason:null,pathResolutionSource:"LOWER_TIMEFRAME_"+lowerMinutes+"M"};
    }
  }

  return {...event,resolution:"HORIZON_UNRESOLVED",magnitudeHit:false,stopHit:false,firstHit:null,sequenceAmbiguous:false,ambiguityReason:null,pathResolutionSource:"LOWER_TIMEFRAME_"+lowerMinutes+"M",timeToMagnitudeBars:null};
}

function resolveAmbiguousEvents(events,lowerBars,options={}){
  const rows=Array.isArray(events)?events:[];
  const resolved=rows.map(event=>resolveAmbiguousEvent(event,lowerBars,options));
  const before=rows.filter(e=>e.sequenceAmbiguous===true).length;
  const after=resolved.filter(e=>e.sequenceAmbiguous===true).length;
  return {events:resolved,beforeAmbiguous:before,afterAmbiguous:after,resolvedAmbiguities:before-after};
}

module.exports={hit,openBeyondEntry,resolveAmbiguousEvent,resolveAmbiguousEvents};