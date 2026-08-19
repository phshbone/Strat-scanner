"use strict";

function classifyBar(current, prior){
  const H=Number(current.high), L=Number(current.low), PH=Number(prior.high), PL=Number(prior.low);
  if(H <= PH && L >= PL) return "1";
  if(H > PH && L >= PL) return "2U";
  if(L < PL && H <= PH) return "2D";
  if(H > PH && L < PL) return "3";
  return "?";
}

function candleColor(bar){
  if(Number(bar.close) > Number(bar.open)) return "GREEN";
  if(Number(bar.close) < Number(bar.open)) return "RED";
  return "DOJI";
}

function timeframeState(price, open){
  if(Number(price) > Number(open)) return "BULLISH";
  if(Number(price) < Number(open)) return "BEARISH";
  return "NEUTRAL";
}

function calcFTFC(timeframes){
  let bull=0,bear=0,neutral=0;
  (timeframes||[]).forEach(tf=>{
    const s=timeframeState(tf.price,tf.open);
    if(s==="BULLISH") bull++;
    else if(s==="BEARISH") bear++;
    else neutral++;
  });
  const total=(timeframes||[]).length;
  const dir=bull>bear?"BULLISH":bear>bull?"BEARISH":"MIXED";
  const aligned=Math.max(bull,bear);
  return {bull,bear,neutral,total,dir,aligned,label:`${aligned}/${total} ${dir}`};
}

/*
  IMPORTANT PATH RULE
  -------------------
  A completed Scenario 3 proves both sides were taken, but completed OHLC alone
  does not prove which side was taken first. Therefore a completed 3 is NOT
  automatically promoted into a bullish or bearish 2-2 / 2-1-2 reversal.

  If intrabar/lower-timeframe sequence is known, pass pathDirection:
  - "BULLISH" means the bar first broke down, then reversed through the prior high.
  - "BEARISH" means the bar first broke up, then reversed through the prior low.
*/
function resolveDirectionalType(type, pathDirection){
  if(type!=="3") return type;
  if(pathDirection==="BULLISH") return "2U_FROM_3";
  if(pathDirection==="BEARISH") return "2D_FROM_3";
  return "3_AMBIGUOUS";
}

function detectSetup(bars, options={}){
  if(!Array.isArray(bars) || bars.length < 3) return {name:"NONE",direction:"NONE"};
  const a=bars[bars.length-3], b=bars[bars.length-2], c=bars[bars.length-1];
  const priorA=bars[bars.length-4] || a;
  const at=classifyBar(a,priorA);
  const bt=classifyBar(b,a);
  const rawCt=classifyBar(c,b);
  const ct=resolveDirectionalType(rawCt,options.currentBarPathDirection);

  // 2-1-2 reversal: current bar must be directionally resolvable.
  if(at==="2D" && bt==="1" && (ct==="2U" || ct==="2U_FROM_3")){
    return {name:"2-1-2",direction:"BULLISH",trigger:b.high,magnitude:a.high,reference:b,currentType:rawCt,pathResolved:rawCt!=="3" || !!options.currentBarPathDirection};
  }
  if(at==="2U" && bt==="1" && (ct==="2D" || ct==="2D_FROM_3")){
    return {name:"2-1-2",direction:"BEARISH",trigger:b.low,magnitude:a.low,reference:b,currentType:rawCt,pathResolved:rawCt!=="3" || !!options.currentBarPathDirection};
  }

  // 3-1-2: the initial 3 is already historical context; the active bar is directional 2.
  if(at==="3" && bt==="1" && rawCt==="2U"){
    return {name:"3-1-2",direction:"BULLISH",trigger:b.high,magnitude:a.high,reference:b,currentType:rawCt,pathResolved:true};
  }
  if(at==="3" && bt==="1" && rawCt==="2D"){
    return {name:"3-1-2",direction:"BEARISH",trigger:b.low,magnitude:a.low,reference:b,currentType:rawCt,pathResolved:true};
  }

  // 2-2 reversal: completed 3 requires path evidence before assigning direction.
  if(bt==="2D" && (ct==="2U" || ct==="2U_FROM_3")){
    return {name:"2-2",direction:"BULLISH",trigger:b.high,magnitude:a.high,reference:b,currentType:rawCt,pathResolved:rawCt!=="3" || !!options.currentBarPathDirection};
  }
  if(bt==="2U" && (ct==="2D" || ct==="2D_FROM_3")){
    return {name:"2-2",direction:"BEARISH",trigger:b.low,magnitude:a.low,reference:b,currentType:rawCt,pathResolved:rawCt!=="3" || !!options.currentBarPathDirection};
  }

  // If a 3 is present but sequence is not known, preserve the ambiguity explicitly.
  if(rawCt==="3"){
    return {
      name:"OUTSIDE PATH AMBIGUOUS",
      direction:"UNKNOWN",
      reference:b,
      currentType:"3",
      pathResolved:false,
      note:"Completed OHLC shows both sides traded; lower-timeframe or tick sequence is required to assign reversal direction."
    };
  }

  if(bt==="1"){
    return {name:"INSIDE BREAK PENDING",direction:"BOTH",triggerUp:b.high,triggerDown:b.low,reference:b,currentType:rawCt,pathResolved:true};
  }

  return {name:"NONE",direction:"NONE",currentType:rawCt,pathResolved:true};
}

function calculateTrade(setup,currentPrice){
  if(!setup || !["BULLISH","BEARISH"].includes(setup.direction)) return null;
  const r=setup.reference;
  const midpointStop=(Number(r.high)+Number(r.low))/2;
  const trigger=Number(setup.trigger);
  const magnitude=Number(setup.magnitude);
  const price=Number(currentPrice);
  const inForce=setup.direction==="BULLISH" ? price>trigger : price<trigger;
  const structureStop=setup.direction==="BULLISH" ? Number(r.low) : Number(r.high);
  const midpointRisk=setup.direction==="BULLISH" ? trigger-midpointStop : midpointStop-trigger;
  const reward=setup.direction==="BULLISH" ? magnitude-trigger : trigger-magnitude;
  const rr=(midpointRisk>0 && reward>0)?reward/midpointRisk:null;
  const magnitudeHit=setup.direction==="BULLISH" ? price>=magnitude : price<=magnitude;
  return {trigger,magnitude,midpointStop,structureStop,inForce,midpointRisk,reward,rr,magnitudeHit};
}

function timeExhaustion(progressPct){
  const p=Math.max(0,Math.min(100,Number(progressPct)||0));
  if(p<50) return "LOW";
  if(p<=80) return "MEDIUM";
  return "HIGH";
}

if(typeof module!=="undefined"){
  module.exports={classifyBar,candleColor,timeframeState,calcFTFC,resolveDirectionalType,detectSetup,calculateTrade,timeExhaustion};
}
