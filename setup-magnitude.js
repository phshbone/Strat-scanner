"use strict";

const SUPPORTED = new Set(["2-2","2-1-2","3-1-2"]);

function selectSetupMagnitude({setupName,direction,sourceBar}){
  if(!SUPPORTED.has(setupName)) return null;
  if(!sourceBar || !Number.isFinite(Number(sourceBar.high)) || !Number.isFinite(Number(sourceBar.low))) return null;
  if(direction === "BULLISH") return Number(sourceBar.high);
  if(direction === "BEARISH") return Number(sourceBar.low);
  return null;
}

function buildSetupObjective({setupName,direction,sourceBar,trigger}){
  const magnitude = selectSetupMagnitude({setupName,direction,sourceBar});
  if(magnitude == null) return null;
  return {
    setupName,
    direction,
    trigger:Number(trigger),
    magnitude,
    sourceRange:{high:Number(sourceBar.high),low:Number(sourceBar.low)}
  };
}

if(typeof module!=="undefined") module.exports={selectSetupMagnitude,buildSetupObjective};
