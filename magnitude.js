"use strict";

function normalizePivots(pivots){
  return (Array.isArray(pivots)?pivots:[])
    .filter(p=>p && Number.isFinite(Number(p.price)))
    .map(p=>({ ...p, price:Number(p.price) }));
}

function validateDirection(direction){
  if(!["BULLISH","BEARISH"].includes(direction)) throw new Error("direction must be BULLISH or BEARISH");
}

function reached(price, level, direction){
  validateDirection(direction);
  const p=Number(price), l=Number(level);
  if(!Number.isFinite(p)||!Number.isFinite(l)) return false;
  return direction==="BULLISH" ? p>=l : p<=l;
}

/*
  Legacy/raw directional helper.
  This function answers geometry only: which pivots are beyond origin?
  It does NOT mean every returned pivot is a valid Strat target.
*/
function directionalStack({originPrice,direction,pivots}){
  const origin=Number(originPrice);
  if(!Number.isFinite(origin)) throw new Error("originPrice must be numeric");
  validateDirection(direction);
  const valid=normalizePivots(pivots);
  return direction==="BULLISH"
    ? valid.filter(p=>p.price>origin).sort((a,b)=>a.price-b.price)
    : valid.filter(p=>p.price<origin).sort((a,b)=>b.price-a.price);
}

/*
  Only pivots explicitly qualified by the upstream structure/range logic may
  become post-magnitude targets. Raw directional pivots are deliberately
  excluded unless structurallyRelevant===true (or eligibleTarget===true).
*/
function structurallyRelevantTargets({originPrice,direction,pivots,magnitude}){
  validateDirection(direction);
  const mag=Number(magnitude);
  if(!Number.isFinite(mag)) throw new Error("magnitude must be numeric");
  return directionalStack({originPrice,direction,pivots})
    .filter(p=>p.structurallyRelevant===true || p.eligibleTarget===true)
    .filter(p=>direction==="BULLISH" ? p.price>mag : p.price<mag);
}

function markTargetsConsumed({originPrice,currentPrice,direction,pivots}){
  const current=Number(currentPrice), origin=Number(originPrice);
  if(!Number.isFinite(current)||!Number.isFinite(origin)) throw new Error("originPrice/currentPrice must be numeric");
  return directionalStack({originPrice:origin,direction,pivots}).map(p=>({
    ...p,
    consumed:p.consumed===true || reached(current,p.price,direction)
  }));
}

/* Legacy behavior retained for regression history. */
function selectNextMagnitudeTarget({originPrice,currentPrice,direction,pivots}){
  const stack=markTargetsConsumed({originPrice,currentPrice,direction,pivots});
  const remaining=stack.filter(p=>p.consumed!==true);
  return {
    target:remaining[0]||null,
    exhaustionRisk:remaining.length===0,
    remainingTargets:remaining.length,
    stack
  };
}

function buildMagnitudeState(args){
  const next=selectNextMagnitudeTarget(args);
  return {
    originPrice:Number(args.originPrice),
    currentPrice:Number(args.currentPrice),
    direction:args.direction,
    stack:next.stack,
    nextTarget:next.target,
    remainingTargets:next.remainingTargets,
    exhaustionRisk:next.exhaustionRisk
  };
}

/*
  Production objective state.

  magnitude = setup/range-defined first objective.
  targets   = only structurally qualified objectives beyond magnitude.

  Exhaustion risk becomes true only after magnitude has been reached AND the
  currently-qualified target structure is cleared. If magnitude has not been
  reached yet, the move is not "post-magnitude exhausted" merely because no
  extra target has been qualified.
*/
function buildObjectiveState({originPrice,currentPrice,direction,magnitude,pivots=[]}){
  const origin=Number(originPrice), current=Number(currentPrice), mag=Number(magnitude);
  if(!Number.isFinite(origin)||!Number.isFinite(current)||!Number.isFinite(mag)) throw new Error("originPrice/currentPrice/magnitude must be numeric");
  validateDirection(direction);

  const magnitudeConsumed=reached(current,mag,direction);
  const targets=structurallyRelevantTargets({originPrice:origin,direction,pivots,magnitude:mag})
    .map(p=>({
      ...p,
      consumed:p.consumed===true || reached(current,p.price,direction)
    }));
  const remaining=targets.filter(p=>p.consumed!==true);

  let nextObjective;
  if(!magnitudeConsumed){
    nextObjective={type:"MAGNITUDE",price:mag};
  }else if(remaining.length){
    nextObjective={type:"TARGET",...remaining[0]};
  }else{
    nextObjective=null;
  }

  return {
    originPrice:origin,
    currentPrice:current,
    direction,
    magnitude:{price:mag,consumed:magnitudeConsumed},
    targets,
    remainingTargets:remaining.length,
    nextObjective,
    exhaustionRisk:magnitudeConsumed && remaining.length===0
  };
}

if(typeof module!=="undefined") module.exports={
  normalizePivots,
  directionalStack,
  structurallyRelevantTargets,
  markTargetsConsumed,
  selectNextMagnitudeTarget,
  buildMagnitudeState,
  buildObjectiveState,
  reached
};
