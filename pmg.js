"use strict";

function finite(v){ return Number.isFinite(Number(v)); }

function normalizeBars(bars){
  return (Array.isArray(bars)?bars:[]).map((bar,index)=>{
    if(!bar || !finite(bar.high) || !finite(bar.low)) return null;
    return {
      ...bar,
      index,
      high:Number(bar.high),
      low:Number(bar.low)
    };
  }).filter(Boolean);
}

function strictlyHigherLows(bars){
  if(bars.length<2) return false;
  for(let i=1;i<bars.length;i++){
    if(!(bars[i].low>bars[i-1].low)) return false;
  }
  return true;
}

function strictlyLowerHighs(bars){
  if(bars.length<2) return false;
  for(let i=1;i<bars.length;i++){
    if(!(bars[i].high<bars[i-1].high)) return false;
  }
  return true;
}

/*
  PMG geometry detector.

  General TheStrat implementation:
  - bearish PMG candidate = series of consecutive higher lows;
  - bullish PMG candidate = series of consecutive lower highs.

  Default minimum is 5 bars because common TheStrat PMG descriptions use
  "5 or more consecutive candles". Sara Strat Sniper's published monthly PMG
  short scanner is stricter in its literal implementation: it compares current
  low through low[5], i.e. six monthly candles connected by five strict > steps.
  Use preset="SARA_MONTHLY_SHORT" (or minBars:6) when reproducing that scanner.
*/
function detectPmg(bars,{minBars=5,preset=null,timeframe=null}={}){
  const normalized=normalizeBars(bars);
  let required=Number(minBars);
  if(preset==="SARA_MONTHLY_SHORT") required=6;
  if(!Number.isInteger(required) || required<2) throw new Error("minBars must be an integer >= 2");
  if(normalized.length<required) return {qualifies:false,direction:null,reason:"INSUFFICIENT_BARS",requiredBars:required,barCount:normalized.length};

  const window=normalized.slice(-required);
  const bearish=strictlyHigherLows(window);
  const bullish=strictlyLowerHighs(window);

  if(bearish && bullish){
    return {qualifies:true,direction:"BOTH",pattern:"CONTRACTING_PMG",requiredBars:required,barCount:required,timeframe,bars:window};
  }
  if(bearish){
    return {qualifies:true,direction:"BEARISH",pattern:"HIGHER_LOWS",requiredBars:required,barCount:required,timeframe,bars:window};
  }
  if(bullish){
    return {qualifies:true,direction:"BULLISH",pattern:"LOWER_HIGHS",requiredBars:required,barCount:required,timeframe,bars:window};
  }
  return {qualifies:false,direction:null,reason:"NO_CONSECUTIVE_PMG_GEOMETRY",requiredBars:required,barCount:required,timeframe,bars:window};
}

function pmgLevels(detection){
  if(!detection || detection.qualifies!==true || !Array.isArray(detection.bars)) return [];
  if(detection.direction==="BEARISH"){
    return detection.bars.map((bar,i)=>({
      id:bar.id || `pmg-low-${i+1}`,
      price:bar.low,
      type:"LOW",
      timeframe:detection.timeframe || bar.timeframe || null,
      source:"PMG",
      pmgDirection:"BEARISH",
      structurallyRelevant:true,
      eligibleTarget:true
    })).sort((a,b)=>b.price-a.price);
  }
  if(detection.direction==="BULLISH"){
    return detection.bars.map((bar,i)=>({
      id:bar.id || `pmg-high-${i+1}`,
      price:bar.high,
      type:"HIGH",
      timeframe:detection.timeframe || bar.timeframe || null,
      source:"PMG",
      pmgDirection:"BULLISH",
      structurallyRelevant:true,
      eligibleTarget:true
    })).sort((a,b)=>a.price-b.price);
  }
  return [];
}

/*
  PMG geometry by itself is not a trade trigger. The caller must separately
  supply an actionable Strat reversal/in-force condition in the PMG direction.
*/
function buildPmgState({bars,minBars=5,preset=null,timeframe=null,reversalDirection=null,reversalInForce=false}={}){
  const detection=detectPmg(bars,{minBars,preset,timeframe});
  const actionable=detection.qualifies===true &&
    ["BULLISH","BEARISH"].includes(detection.direction) &&
    reversalInForce===true && reversalDirection===detection.direction;

  return {
    detection,
    levels:pmgLevels(detection),
    reversalDirection,
    reversalInForce:reversalInForce===true,
    actionable,
    status:!detection.qualifies ? "NO_PMG" : actionable ? "PMG_IN_FORCE" : "PMG_WAITING_FOR_REVERSAL"
  };
}

if(typeof module!=="undefined") module.exports={
  normalizeBars,
  strictlyHigherLows,
  strictlyLowerHighs,
  detectPmg,
  pmgLevels,
  buildPmgState
};
