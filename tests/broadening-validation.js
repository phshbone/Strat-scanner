const {rangeOf,isOutsideRange,compoundOutside,sweptPriorLevels,broadeningExpansion}=require('../broadening.js');

let pass=0,fail=0; const failures=[];
function t(name,actual,expected){
  const ok=JSON.stringify(actual)===JSON.stringify(expected);
  if(ok) pass++; else {fail++; failures.push({name,actual,expected});}
}

t('rangeOf aggregates multiple candles',rangeOf([{high:10,low:7},{high:12,low:8},{high:11,low:6}]),{high:12,low:6});
t('single outside range qualifies',isOutsideRange({high:11,low:4},{high:10,low:5}),true);
t('equal high is not outside',isOutsideRange({high:10,low:4},{high:10,low:5}),false);
t('equal low is not outside',isOutsideRange({high:11,low:5},{high:10,low:5}),false);
t('compound outside across multiple bars',compoundOutside([{high:11,low:7},{high:12,low:4}],[{high:10,low:5},{high:9,low:6}]),{outerRange:{high:12,low:4},innerRange:{high:10,low:5},qualifies:true});
t('non-outside compound range rejected',compoundOutside([{high:11,low:7},{high:12,low:5.5}],[{high:10,low:5},{high:9,low:6}]).qualifies,false);
t('high sweep uses strict take-out',sweptPriorLevels({side:'HIGH',extreme:12,levels:[9,10,12,13]}).map(x=>x.price),[10,9]);
t('low sweep uses strict take-out',sweptPriorLevels({side:'LOW',extreme:5,levels:[3,5,6,8]}).map(x=>x.price),[6,8]);
t('broadening requires both sides',broadeningExpansion({high:12,low:4},{high:10,low:5}),{higherHigh:true,lowerLow:true,broadening:true});
t('higher high only is not full broadening',broadeningExpansion({high:12,low:5.5},{high:10,low:5}),{higherHigh:true,lowerLow:false,broadening:false});

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
