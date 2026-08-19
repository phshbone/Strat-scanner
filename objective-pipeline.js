"use strict";

const qualification=require("./target-qualification.js");
const hierarchy=require("./target-hierarchy.js");
const magnitude=require("./magnitude.js");
const reclaim=require("./range-reclaim.js");

/*
  Reclaim objectives are already source-verified by range-reclaim.js. This
  adapter only translates them into the common target-hierarchy shape; it does
  not create reclaim ranges or change their structural meaning.
*/
function reclaimObjectivesToTargets(objectives=[]){
  return (Array.isArray(objectives)?objectives:[]).map((o,index)=>({
    ...o,
    id:o.id || `reclaim-target-${index+1}`,
    rangeId:o.sourceRangeId || o.rangeId || null,
    source:"RANGE_RECLAIM",
    sourceType:o.sourceType || "RECLAIMED_RANGE_OPPOSITE_BOUNDARY",
    structurallyRelevant:true,
    eligibleTarget:true,
    consumed:o.consumed===true
  }));
}

/*
  Integrated deterministic objective pipeline.

  1. First magnitude is supplied by the setup engine.
  2. Broader ranges are structurally qualified.
  3. Verified reclaimed ranges may emit opposite-boundary objectives.
  4. Structural and reclaim objectives share one exact-price hierarchy.
  5. The current objective/exhaustion state is calculated from price path.

  No timeframe or source receives automatic priority. A higher timeframe or a
  reclaimed range contributes only when its own upstream structural conditions
  are satisfied. Exact-price agreement is merged while preserving provenance.
*/
function buildObjectivePipeline({
  direction,
  setupRange,
  magnitude:setupMagnitude,
  originPrice,
  currentPrice,
  candidateRanges=[],
  reclaimRanges=[],
  previousReclaimStates={},
  proximityTolerance=0
}={}){
  const qualifiedTargets=qualification.buildQualifiedTargets({
    direction,
    setupRange,
    magnitude:setupMagnitude,
    candidateRanges
  });

  const reclaimStack=reclaim.buildReclaimStack({
    ranges:reclaimRanges,
    direction,
    currentPrice,
    previousStates:previousReclaimStates
  });

  const reclaimTargets=reclaimObjectivesToTargets(reclaimStack.activeObjectives);
  const combinedTargets=[...qualifiedTargets,...reclaimTargets];

  const targetHierarchy=hierarchy.buildTargetHierarchy({
    targets:combinedTargets,
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
    reclaimStack,
    reclaimTargets,
    combinedTargets,
    targetHierarchy,
    objectiveState,
    nextObjective:objectiveState.nextObjective,
    exhaustionRisk:objectiveState.exhaustionRisk
  };
}

if(typeof module!=="undefined") module.exports={
  reclaimObjectivesToTargets,
  buildObjectivePipeline
};
