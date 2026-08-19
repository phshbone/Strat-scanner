"use strict";

const pmg=require("./pmg.js");
const hierarchy=require("./target-hierarchy.js");
const magnitude=require("./magnitude.js");

/*
  PMG -> objective integration.

  PMG geometry by itself remains non-actionable. The PMG staircase only feeds
  the production objective engine after a matching Strat reversal is in force.

  Objective order remains:
  1. setup-defined magnitude first;
  2. then sequential PMG levels beyond magnitude;
  3. price exhaustion only after magnitude + active PMG levels are cleared.
*/
function buildPmgObjectivePipeline({
  bars,
  minBars=5,
  preset=null,
  timeframe=null,
  reversalDirection=null,
  reversalInForce=false,
  originPrice,
  currentPrice,
  setupMagnitude,
  proximityTolerance=0
}={}){
  const pmgState=pmg.buildPmgState({
    bars,
    minBars,
    preset,
    timeframe,
    reversalDirection,
    reversalInForce
  });

  if(!pmgState.actionable){
    return {
      pmgState,
      targetHierarchy:null,
      objectiveState:null,
      nextObjective:null,
      priceExhaustionRisk:false
    };
  }

  const targetHierarchy=hierarchy.buildTargetHierarchy({
    targets:pmgState.levels,
    direction:pmgState.detection.direction,
    proximityTolerance
  });

  const objectiveState=magnitude.buildObjectiveState({
    originPrice,
    currentPrice,
    direction:pmgState.detection.direction,
    magnitude:setupMagnitude,
    pivots:targetHierarchy.objectives
  });

  return {
    pmgState,
    targetHierarchy,
    objectiveState,
    nextObjective:objectiveState.nextObjective,
    priceExhaustionRisk:objectiveState.priceExhaustionRisk
  };
}

if(typeof module!=="undefined") module.exports={buildPmgObjectivePipeline};
