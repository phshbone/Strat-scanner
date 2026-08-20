"use strict";

const DIRECTIONS=new Set(["BULL","BEAR"]);
const TERMINAL_STATES=new Set(["TARGET_HIT","STOPPED","AMBIGUOUS"]);

function finite(v,name){
  const n=Number(v);
  if(!Number.isFinite(n)) throw new Error(`${name} must be finite`);
  return n;
}

function validateLevels(direction,trigger,stop,target){
  if(direction==="BULL"){
    if(!(stop<trigger && target>trigger)) throw new Error("bull levels require stop < trigger < target");
  }else{
    if(!(target<trigger && stop>trigger)) throw new Error("bear levels require target < trigger < stop");
  }
}

function createPracticeTrade({
  id=null,
  symbol,
  timeframe,
  direction,
  setupType,
  triggerPrice,
  stopPrice,
  targetPrice,
  quantity=1,
  createdAt=null,
  context={}
}={}){
  const dir=String(direction||"").toUpperCase();
  if(!DIRECTIONS.has(dir)) throw new Error("direction must be BULL or BEAR");
  const sym=String(symbol||"").trim().toUpperCase();
  const tf=String(timeframe||"").trim().toUpperCase();
  const setup=String(setupType||"").trim();
  if(!sym) throw new Error("symbol required");
  if(!tf) throw new Error("timeframe required");
  if(!setup) throw new Error("setupType required");

  const trigger=finite(triggerPrice,"triggerPrice");
  const stop=finite(stopPrice,"stopPrice");
  const target=finite(targetPrice,"targetPrice");
  const qty=finite(quantity,"quantity");
  if(qty<=0) throw new Error("quantity must be > 0");
  validateLevels(dir,trigger,stop,target);

  return {
    id:id || `${sym}|${tf}|${setup}|${createdAt || "PRACTICE"}`,
    symbol:sym,
    timeframe:tf,
    direction:dir,
    setupType:setup,
    triggerPrice:trigger,
    stopPrice:stop,
    targetPrice:target,
    quantity:qty,
    createdAt,
    state:"ARMED",
    entryPrice:null,
    entryAt:null,
    exitPrice:null,
    exitAt:null,
    barsObserved:0,
    barsSinceEntry:0,
    mfe:0,
    mae:0,
    resultR:null,
    context:{...context},
    events:[]
  };
}

function crossesTrigger(trade,bar){
  return trade.direction==="BULL" ? Number(bar.high)>trade.triggerPrice : Number(bar.low)<trade.triggerPrice;
}
function hitsTarget(trade,bar){
  return trade.direction==="BULL" ? Number(bar.high)>=trade.targetPrice : Number(bar.low)<=trade.targetPrice;
}
function hitsStop(trade,bar){
  return trade.direction==="BULL" ? Number(bar.low)<=trade.stopPrice : Number(bar.high)>=trade.stopPrice;
}

function updateExcursions(trade,bar){
  if(trade.entryPrice==null) return;
  const high=finite(bar.high,"bar.high");
  const low=finite(bar.low,"bar.low");
  let favorable,adverse;
  if(trade.direction==="BULL"){
    favorable=Math.max(0,high-trade.entryPrice);
    adverse=Math.max(0,trade.entryPrice-low);
  }else{
    favorable=Math.max(0,trade.entryPrice-low);
    adverse=Math.max(0,high-trade.entryPrice);
  }
  trade.mfe=Math.max(trade.mfe,favorable);
  trade.mae=Math.max(trade.mae,adverse);
}

function riskPerUnit(trade){ return Math.abs(trade.triggerPrice-trade.stopPrice); }
function computeResultR(trade,exitPrice){
  const risk=riskPerUnit(trade);
  if(!risk) return null;
  const pnl=trade.direction==="BULL" ? exitPrice-trade.entryPrice : trade.entryPrice-exitPrice;
  return pnl/risk;
}

function terminalize(trade,state,price,time,reason){
  trade.state=state;
  trade.exitPrice=price;
  trade.exitAt=time||null;
  trade.resultR=state==="AMBIGUOUS"?null:computeResultR(trade,price);
  trade.events.push({type:state,at:time||null,price,reason});
  return trade;
}

function processBar(inputTrade,bar={}){
  const trade=JSON.parse(JSON.stringify(inputTrade));
  if(TERMINAL_STATES.has(trade.state)) return trade;
  ["open","high","low","close"].forEach(k=>finite(bar[k],`bar.${k}`));
  const time=bar.datetime || bar.time || bar.timestamp || null;
  trade.barsObserved+=1;

  if(trade.state==="ARMED"){
    if(!crossesTrigger(trade,bar)) return trade;

    // Coarse OHLC cannot tell whether target/stop happened before or after the trigger
    // when the same bar spans both levels. Preserve ambiguity instead of inventing path.
    const targetSameBar=hitsTarget(trade,bar);
    const stopSameBar=hitsStop(trade,bar);
    trade.entryPrice=trade.triggerPrice;
    trade.entryAt=time;
    trade.state="OPEN";
    trade.events.push({type:"ENTRY_TRIGGERED",at:time,price:trade.entryPrice});
    updateExcursions(trade,bar);

    if(targetSameBar && stopSameBar){
      return terminalize(trade,"AMBIGUOUS",trade.entryPrice,time,"entry bar crossed both stop and target; intrabar order unknown");
    }
    if(targetSameBar){
      return terminalize(trade,"AMBIGUOUS",trade.entryPrice,time,"entry and target occurred in same coarse bar; trigger-to-target order not proven");
    }
    if(stopSameBar){
      return terminalize(trade,"AMBIGUOUS",trade.entryPrice,time,"entry and stop occurred in same coarse bar; trigger-to-stop order not proven");
    }
    return trade;
  }

  if(trade.state!=="OPEN") throw new Error(`unsupported practice trade state: ${trade.state}`);
  trade.barsSinceEntry+=1;
  updateExcursions(trade,bar);

  const target=hitsTarget(trade,bar);
  const stop=hitsStop(trade,bar);
  if(target && stop){
    return terminalize(trade,"AMBIGUOUS",trade.entryPrice,time,"bar crossed both stop and target; intrabar order unknown");
  }
  if(target) return terminalize(trade,"TARGET_HIT",trade.targetPrice,time,"target reached");
  if(stop) return terminalize(trade,"STOPPED",trade.stopPrice,time,"structural stop reached");
  return trade;
}

function summarizePracticeTrade(trade){
  return {
    id:trade.id,
    symbol:trade.symbol,
    timeframe:trade.timeframe,
    setupType:trade.setupType,
    direction:trade.direction,
    state:trade.state,
    entryPrice:trade.entryPrice,
    exitPrice:trade.exitPrice,
    resultR:trade.resultR,
    mfe:trade.mfe,
    mae:trade.mae,
    barsObserved:trade.barsObserved,
    barsSinceEntry:trade.barsSinceEntry
  };
}

module.exports={
  DIRECTIONS,
  TERMINAL_STATES,
  createPracticeTrade,
  processBar,
  summarizePracticeTrade,
  riskPerUnit,
  computeResultR
};