function normalizePivots(pivots){
  return (Array.isArray(pivots)?pivots:[])
    .filter(p=>p && Number.isFinite(Number(p.price)))
    .map(p=>({ ...p, price:Number(p.price) }));
}

function directionalStack({originPrice,direction,pivots}){
  const origin=Number(originPrice);
  if(!Number.isFinite(origin)) throw new Error('originPrice must be numeric');
  if(!['BULLISH','BEARISH'].includes(direction)) throw new Error('direction must be BULLISH or BEARISH');
  const valid=normalizePivots(pivots);
  return direction==='BULLISH'
    ? valid.filter(p=>p.price>origin).sort((a,b)=>a.price-b.price)
    : valid.filter(p=>p.price<origin).sort((a,b)=>b.price-a.price);
}

function markTargetsConsumed({originPrice,currentPrice,direction,pivots}){
  const current=Number(currentPrice), origin=Number(originPrice);
  if(!Number.isFinite(current)||!Number.isFinite(origin)) throw new Error('originPrice/currentPrice must be numeric');
  return directionalStack({originPrice:origin,direction,pivots}).map(p=>({
    ...p,
    consumed:p.consumed===true || (direction==='BULLISH' ? current>=p.price : current<=p.price)
  }));
}

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

if(typeof module!=='undefined') module.exports={directionalStack,markTargetsConsumed,selectNextMagnitudeTarget,buildMagnitudeState};
