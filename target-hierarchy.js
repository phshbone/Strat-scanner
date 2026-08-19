"use strict";

function finite(v){ return Number.isFinite(Number(v)); }

function validateDirection(direction){
  if(!["BULLISH","BEARISH"].includes(direction)) throw new Error("direction must be BULLISH or BEARISH");
}

function normalizeTarget(target,index=0){
  if(!target || !finite(target.price)) return null;
  return {
    ...target,
    id:target.id || `target-${index+1}`,
    price:Number(target.price),
    timeframe:target.timeframe || null,
    rangeId:target.rangeId || null
  };
}

function sortTargets(targets,direction){
  validateDirection(direction);
  return targets.slice().sort((a,b)=>direction==="BULLISH" ? a.price-b.price : b.price-a.price);
}

/*
  Exact-price de-duplication is deterministic and does not require an invented
  tolerance. If Daily/Weekly/Monthly structures all resolve to the exact same
  boundary, treat that price as one objective while preserving every source.

  A merged level is considered consumed only when every source level is already
  marked consumed. This avoids silently erasing an active structural source.
*/
function mergeExactPriceTargets(targets,direction){
  validateDirection(direction);
  const normalized=(Array.isArray(targets)?targets:[])
    .map((t,i)=>normalizeTarget(t,i))
    .filter(Boolean);

  const groups=new Map();
  for(const t of normalized){
    const key=String(t.price);
    if(!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(t);
  }

  const merged=[];
  for(const rows of groups.values()){
    const first=rows[0];
    merged.push({
      id:first.id,
      price:first.price,
      timeframe:first.timeframe,
      rangeId:first.rangeId,
      source:first.source || "RANGE_BOUNDARY",
      structurallyRelevant:rows.some(r=>r.structurallyRelevant===true),
      eligibleTarget:rows.some(r=>r.eligibleTarget===true),
      consumed:rows.every(r=>r.consumed===true),
      sourceCount:rows.length,
      supportingTargetIds:rows.map(r=>r.id),
      supportingTimeframes:Array.from(new Set(rows.map(r=>r.timeframe).filter(Boolean))),
      supportingRangeIds:Array.from(new Set(rows.map(r=>r.rangeId).filter(Boolean))),
      exactDuplicate:rows.length>1
    });
  }

  return sortTargets(merged,direction);
}

/*
  Near-price grouping is intentionally advisory only. There is no sourced
  universal threshold for saying two nearby levels are "the same" target.
  Therefore the caller must provide a non-negative absolute-price tolerance.
  Default tolerance=0 means exact levels only.

  Clustering never changes objective prices and never merges semantic targets.
*/
function clusterNearbyTargets(targets,{direction,tolerance=0}={}){
  validateDirection(direction);
  const tol=Number(tolerance);
  if(!Number.isFinite(tol) || tol<0) throw new Error("tolerance must be a non-negative number");

  const sorted=sortTargets(
    (Array.isArray(targets)?targets:[]).map((t,i)=>normalizeTarget(t,i)).filter(Boolean),
    direction
  );
  if(sorted.length===0) return [];

  const clusters=[];
  let current=[sorted[0]];
  for(let i=1;i<sorted.length;i++){
    const prev=current[current.length-1];
    const next=sorted[i];
    if(Math.abs(next.price-prev.price)<=tol){
      current.push(next);
    }else{
      clusters.push(current);
      current=[next];
    }
  }
  clusters.push(current);

  return clusters.map((rows,index)=>({
    clusterId:`cluster-${index+1}`,
    minPrice:Math.min(...rows.map(r=>r.price)),
    maxPrice:Math.max(...rows.map(r=>r.price)),
    memberCount:rows.length,
    members:rows,
    advisoryOnly:tol>0
  }));
}

/*
  Price path determines objective order. A Weekly or Monthly target does not
  leapfrog a nearer Daily target merely because its timeframe is larger.
  Higher-timeframe agreement is preserved as supporting evidence on merged
  exact-price levels rather than used as an arbitrary priority override.
*/
function buildTargetHierarchy({targets=[],direction,proximityTolerance=0}={}){
  validateDirection(direction);
  const raw=(Array.isArray(targets)?targets:[])
    .map((t,i)=>normalizeTarget(t,i))
    .filter(Boolean);
  const exactLevels=mergeExactPriceTargets(raw,direction);
  const ordered=exactLevels.map((t,index)=>({...t,objectiveOrder:index+1}));
  const clusters=clusterNearbyTargets(ordered,{direction,tolerance:proximityTolerance});

  return {
    direction,
    objectives:ordered,
    nextTarget:ordered.find(t=>t.consumed!==true)||null,
    exactLevelCount:ordered.length,
    rawTargetCount:raw.length,
    proximityTolerance:Number(proximityTolerance),
    proximityClusters:clusters
  };
}

if(typeof module!=="undefined") module.exports={
  normalizeTarget,
  sortTargets,
  mergeExactPriceTargets,
  clusterNearbyTargets,
  buildTargetHierarchy
};
