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
    plannedInitialQuantity:qty,
    createdAt,
    state:"ARMED",
    entryPrice:null,
    averageEntryPrice:null,
    entryAt:null,
    exitPrice:null,
    exitAt:null,
    lots:[],
    scaleInCount:0,
    barsObserved:0,
    barsSinceEntry:0,
    mfe:0,
    mae:0,
    resultR:null,
    pnl:null,
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

function weightedAverageEntry(lots){
  const active=Array.isArray(lots)?lots:[];
  const qty=active.reduce((s,l)=>s+Number(l.quantity||0),0);
  if(!(qty>0)) return null;
  return active.reduce((s,l)=>s+Number(l.price)*Number(l.quantity),0)/qty;
}

function totalQuantity(trade){
  if(Array.isArray(trade.lots) && trade.lots.length){
    return trade.lots.reduce((s,l)=>s+Number(l.quantity||0),0);
  }
  return Number(trade.quantity||0);
}

function totalRiskCapital(trade){
  if(Array.isArray(trade.lots) && trade.lots.length){
    return trade.lots.reduce((sum,lot)=>sum + Math.abs(Number(lot.price)-Number(lot.stopPriceAtEntry))*Number(lot.quantity),0);
  }
  return Math.abs(Number(trade.triggerPrice)-Number(trade.stopPrice))*Number(trade.quantity||0);
}

function updateExcursions(trade,bar){
  const basis=trade.averageEntryPrice ?? trade.entryPrice;
  if(basis==null) return;
  const high=finite(bar.high,"bar.high");
  const low=finite(bar.low,"bar.low");
  let favorable,adverse;
  if(trade.direction==="BULL"){
    favorable=Math.max(0,high-basis);
    adverse=Math.max(0,basis-low);
  }else{
    favorable=Math.max(0,basis-low);
    adverse=Math.max(0,high-basis);
  }
  trade.mfe=Math.max(trade.mfe,favorable);
  trade.mae=Math.max(trade.mae,adverse);
}

function riskPerUnit(trade){ return Math.abs(trade.triggerPrice-trade.stopPrice); }
function computePnl(trade,exitPrice){
  const avg=trade.averageEntryPrice ?? trade.entryPrice;
  const qty=totalQuantity(trade);
  if(avg==null || !(qty>0)) return null;
  const perUnit=trade.direction==="BULL" ? exitPrice-avg : avg-exitPrice;
  return perUnit*qty;
}
function computeResultR(trade,exitPrice){
  const risk=totalRiskCapital(trade);
  if(!(risk>0)) return null;
  const pnl=computePnl(trade,exitPrice);
  return pnl==null?null:pnl/risk;
}

function addPracticeShares(inputTrade,{quantity,price,at=null,reason="MANUAL_SCALE_IN",source="PRACTICE"}={}){
  const trade=JSON.parse(JSON.stringify(inputTrade));
  if(trade.state!=="OPEN") throw new Error("shares may only be added to an OPEN practice trade");
  const qty=finite(quantity,"quantity");
  const px=finite(price,"price");
  if(qty<=0) throw new Error("quantity must be > 0");

  trade.lots=Array.isArray(trade.lots)?trade.lots:[];
  trade.lots.push({
    sequence:trade.lots.length+1,
    quantity:qty,
    price:px,
    at,
    stopPriceAtEntry:Number(trade.stopPrice),
    reason:String(reason||"MANUAL_SCALE_IN"),
    source:String(source||"PRACTICE")
  });
  trade.quantity=totalQuantity(trade);
  trade.averageEntryPrice=weightedAverageEntry(trade.lots);
  trade.scaleInCount=(trade.scaleInCount||0)+1;
  trade.events.push({
    type:"SHARES_ADDED",
    at,
    price:px,
    quantity:qty,
    totalQuantity:trade.quantity,
    averageEntryPrice:trade.averageEntryPrice,
    reason:String(reason||"MANUAL_SCALE_IN"),
    source:String(source||"PRACTICE")
  });
  return trade;
}

function terminalize(trade,state,price,time,reason){
  trade.state=state;
  trade.exitPrice=price;
  trade.exitAt=time||null;
  trade.pnl=state==="AMBIGUOUS"?null:computePnl(trade,price);
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

    const targetSameBar=hitsTarget(trade,bar);
    const stopSameBar=hitsStop(trade,bar);
    trade.entryPrice=trade.triggerPrice;
    trade.averageEntryPrice=trade.triggerPrice;
    trade.entryAt=time;
    trade.state="OPEN";
    trade.lots=[{
      sequence:1,
      quantity:Number(trade.plannedInitialQuantity ?? trade.quantity),
      price:trade.triggerPrice,
      at:time,
      stopPriceAtEntry:Number(trade.stopPrice),
      reason:"INITIAL_TRIGGER",
      source:"STRAT_SETUP"
    }];
    trade.quantity=totalQuantity(trade);
    trade.events.push({type:"ENTRY_TRIGGERED",at:time,price:trade.entryPrice,quantity:trade.quantity});
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
    return terminalize(trade,"AMBIGUOUS",trade.averageEntryPrice ?? trade.entryPrice,time,"bar crossed both stop and target; intrabar order unknown");
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
    averageEntryPrice:trade.averageEntryPrice,
    exitPrice:trade.exitPrice,
    quantity:trade.quantity,
    scaleInCount:trade.scaleInCount||0,
    resultR:trade.resultR,
    pnl:trade.pnl,
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
  addPracticeShares,
  summarizePracticeTrade,
  riskPerUnit,
  totalRiskCapital,
  totalQuantity,
  weightedAverageEntry,
  computePnl,
  computeResultR
};