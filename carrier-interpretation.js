"use strict";

const {normalizeTimeframe,timeframeRank}=require("./timeframe-domino.js");

function opposite(direction){
  if(direction==="BULLISH") return "BEARISH";
  if(direction==="BEARISH") return "BULLISH";
  return null;
}

function validDirection(direction){ return direction==="BULLISH" || direction==="BEARISH"; }

/*
  Deterministic interpretation of a lower-timeframe state relative to an
  already-active higher-timeframe carrier.

  This module does NOT decide whether the higher-timeframe carrier itself is
  valid; that comes from lifecycle/domino state. It only classifies the lower
  timeframe as confirming, neutral, conflicting, or reversing relative to the
  carrier direction.
*/
function interpretRelativeToCarrier({
  carrierDirection,
  carrierTimeframe,
  lowerTimeframe,
  lowerDirection=null,
  lowerInForce=false,
  lowerType=null,
  insideBar=false,
  opposingReversalForming=false,
  opposingReversalInForce=false,
  higherTfChanged=false,
  motherBarConfined=false,
  rangeExitDirection=null
}={}){
  if(!validDirection(carrierDirection)) throw new Error("carrierDirection must be BULLISH or BEARISH");
  const carrierTf=normalizeTimeframe(carrierTimeframe);
  const lowerTf=normalizeTimeframe(lowerTimeframe);
  if(!carrierTf || !lowerTf) throw new Error("carrierTimeframe/lowerTimeframe must be valid");
  if(timeframeRank(lowerTf)<=timeframeRank(carrierTf)) throw new Error("lowerTimeframe must be lower than carrierTimeframe");

  const opp=opposite(carrierDirection);

  if(higherTfChanged===true){
    return {state:"HIGHER_TF_CHANGE",severity:"HIGH",carrierDirection,carrierTimeframe:carrierTf,lowerTimeframe:lowerTf};
  }
  if(motherBarConfined===true){
    return {state:"MOTHER_BAR_CONFINED",severity:"CAUTION",carrierDirection,carrierTimeframe:carrierTf,lowerTimeframe:lowerTf};
  }
  if(rangeExitDirection && validDirection(rangeExitDirection)){
    if(rangeExitDirection===carrierDirection){
      return {state:"RANGE_EXIT_CONFIRMING",severity:"POSITIVE",carrierDirection,carrierTimeframe:carrierTf,lowerTimeframe:lowerTf};
    }
    return {state:"OPPOSING_REVERSAL_IN_FORCE",severity:"HIGH",carrierDirection,carrierTimeframe:carrierTf,lowerTimeframe:lowerTf};
  }
  if(opposingReversalInForce===true){
    return {state:"OPPOSING_REVERSAL_IN_FORCE",severity:"HIGH",carrierDirection,carrierTimeframe:carrierTf,lowerTimeframe:lowerTf};
  }
  if(opposingReversalForming===true){
    return {state:"OPPOSING_REVERSAL_FORMING",severity:"CAUTION",carrierDirection,carrierTimeframe:carrierTf,lowerTimeframe:lowerTf};
  }
  if(insideBar===true || lowerType==="1"){
    return {state:"NEUTRAL_INSIDE",severity:"NEUTRAL",carrierDirection,carrierTimeframe:carrierTf,lowerTimeframe:lowerTf};
  }
  if(validDirection(lowerDirection) && lowerDirection===carrierDirection && lowerInForce===true){
    return {state:"CONFIRMING",severity:"POSITIVE",carrierDirection,carrierTimeframe:carrierTf,lowerTimeframe:lowerTf};
  }
  if(validDirection(lowerDirection) && lowerDirection===opp && lowerInForce===true){
    return {state:"CONFLICT",severity:"CAUTION",carrierDirection,carrierTimeframe:carrierTf,lowerTimeframe:lowerTf};
  }

  return {state:"NEUTRAL",severity:"NEUTRAL",carrierDirection,carrierTimeframe:carrierTf,lowerTimeframe:lowerTf};
}

function summarizeCarrierStack({carrier,lowerStates=[]}={}){
  if(!carrier || !validDirection(carrier.direction) || carrier.inForce!==true) return {carrier:null,states:[],overall:"NO_ACTIVE_CARRIER"};
  const states=(Array.isArray(lowerStates)?lowerStates:[]).map(row=>interpretRelativeToCarrier({
    carrierDirection:carrier.direction,
    carrierTimeframe:carrier.timeframe,
    lowerTimeframe:row.timeframe,
    lowerDirection:row.direction,
    lowerInForce:row.inForce===true,
    lowerType:row.currentType || row.type || null,
    insideBar:row.insideBar===true,
    opposingReversalForming:row.opposingReversalForming===true,
    opposingReversalInForce:row.opposingReversalInForce===true,
    higherTfChanged:row.higherTfChanged===true,
    motherBarConfined:row.motherBarConfined===true,
    rangeExitDirection:row.rangeExitDirection||null
  }));

  let overall="STABLE";
  if(states.some(s=>s.state==="HIGHER_TF_CHANGE")) overall="CHANGED";
  else if(states.some(s=>s.state==="OPPOSING_REVERSAL_IN_FORCE")) overall="REVERSAL_AGAINST";
  else if(states.some(s=>["CONFLICT","OPPOSING_REVERSAL_FORMING","MOTHER_BAR_CONFINED"].includes(s.state))) overall="CAUTION";
  else if(states.length && states.every(s=>["CONFIRMING","RANGE_EXIT_CONFIRMING"].includes(s.state))) overall="CONFIRMED";

  return {carrier,states,overall};
}

if(typeof module!=="undefined") module.exports={opposite,interpretRelativeToCarrier,summarizeCarrierStack};
