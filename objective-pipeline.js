"use strict";

const qualification=require("./target-qualification.js");
const hierarchy=require("./target-hierarchy.js");
const magnitude=require("./magnitude.js");

/*
  Integrated deterministic objective pipeline.

  1. First magnitude is supplied by the setup engine.
  2. Broader ranges are structurally qualified.
  3. Qualified target levels are ordered/de-duplicated by price path.
  4. The current objective/exhaustion state is calculated.

  No timeframe receives automatic priority. A higher timeframe contributes only
  when its range is structurally engaged and its boundary lies beyond magnitude.
*/
function buildObjectivePipeline({
  direction,
  setupRange,
  magnitude:setupMagnitude,
  originPrice,
  currentPrice,
  candidateRanges=[],
  proximityTolerance=0
}={}){
  const qualifiedTargets=qualification.buildQualifiedTargets({
    direction,
    setupRange,
    magnitude:setupMagnitude,
    candidateRanges
  });

  const targetHierarchy=hierarchy.buildTargetHierarchy({
    targets:qualifiedTargets,
    direction,
    proximityTolerance
  });

  const objectiveState=magnitude.buildObjectiveState({
    originPrice,
    currentPrice,
    direction,
    magnitude:setupMagnitude,
    pivots:targetHierarchy.objectives
  });

  return {
    direction,
    setupRange,
    setupMagnitude:Number(setupMagnitude),
    qualifiedTargets,
    targetHierarchy,
    objectiveState,
    nextObjective:objectiveState.nextObjective,
    exhaustionRisk:objectiveState.exhaustionRisk
  };
}

if(typeof module!=="undefined") module.exports={buildObjectivePipeline};
