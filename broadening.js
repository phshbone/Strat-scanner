function rangeOf(bars){
  if(!Array.isArray(bars) || bars.length===0) return null;
  let high=-Infinity, low=Infinity;
  for(const bar of bars){
    const h=Number(bar.high), l=Number(bar.low);
    if(!Number.isFinite(h) || !Number.isFinite(l)) throw new Error('bars require numeric high/low');
    if(h>high) high=h;
    if(l<low) low=l;
  }
  return {high,low};
}

function isOutsideRange(outer, inner){
  if(!outer || !inner) return false;
  return Number(outer.high)>Number(inner.high) && Number(outer.low)<Number(inner.low);
}

function compoundOutside(outerBars, innerBars){
  const outerRange=rangeOf(outerBars);
  const innerRange=rangeOf(innerBars);
  return {
    outerRange,
    innerRange,
    qualifies:isOutsideRange(outerRange,innerRange)
  };
}

function sweptPriorLevels({side,extreme,levels}){
  const x=Number(extreme);
  if(!Number.isFinite(x)) throw new Error('extreme must be numeric');
  if(!['HIGH','LOW'].includes(side)) throw new Error('side must be HIGH or LOW');
  const vals=(Array.isArray(levels)?levels:[])
    .map(v=>typeof v==='object'?{...v,price:Number(v.price)}:{price:Number(v)})
    .filter(v=>Number.isFinite(v.price));

  const swept=side==='HIGH'
    ? vals.filter(v=>x>v.price).sort((a,b)=>b.price-a.price)
    : vals.filter(v=>x<v.price).sort((a,b)=>a.price-b.price);

  return swept;
}

function broadeningExpansion(currentRange, priorRange){
  const higherHigh=Number(currentRange.high)>Number(priorRange.high);
  const lowerLow=Number(currentRange.low)<Number(priorRange.low);
  return {
    higherHigh,
    lowerLow,
    broadening:higherHigh && lowerLow
  };
}

if(typeof module!=='undefined') module.exports={rangeOf,isOutsideRange,compoundOutside,sweptPriorLevels,broadeningExpansion};
