const {directionalStack,markTargetsConsumed,selectNextMagnitudeTarget,buildMagnitudeState}=require('../magnitude.js');
let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}
const pivots=[{id:'p1',price:95,timeframe:'15m'},{id:'p2',price:100,timeframe:'15m'},{id:'p3',price:105,timeframe:'D'},{id:'p4',price:112,timeframe:'W'}];
t('bullish stack includes only pivots above origin',directionalStack({originPrice:101,direction:'BULLISH',pivots}).map(p=>p.id),['p3','p4']);
t('bearish stack includes only pivots below origin',directionalStack({originPrice:101,direction:'BEARISH',pivots}).map(p=>p.id),['p2','p1']);
t('bullish next target nearest remaining',selectNextMagnitudeTarget({originPrice:101,currentPrice:102,direction:'BULLISH',pivots}).target.id,'p3');
t('bearish next target nearest remaining',selectNextMagnitudeTarget({originPrice:101,currentPrice:101,direction:'BEARISH',pivots}).target.id,'p2');
t('bullish consumes reached target',markTargetsConsumed({originPrice:101,currentPrice:106,direction:'BULLISH',pivots}).map(p=>[p.id,p.consumed]),[['p3',true],['p4',false]]);
t('bearish consumes reached target',markTargetsConsumed({originPrice:101,currentPrice:99,direction:'BEARISH',pivots}).map(p=>[p.id,p.consumed]),[['p2',true],['p1',false]]);
t('bullish promotes next target after T1',selectNextMagnitudeTarget({originPrice:101,currentPrice:106,direction:'BULLISH',pivots}).target.id,'p4');
t('bearish promotes next target after T1',selectNextMagnitudeTarget({originPrice:101,currentPrice:99,direction:'BEARISH',pivots}).target.id,'p1');
t('bullish exhaustion when stack cleared',selectNextMagnitudeTarget({originPrice:101,currentPrice:115,direction:'BULLISH',pivots}).exhaustionRisk,true);
t('bearish exhaustion when stack cleared',selectNextMagnitudeTarget({originPrice:101,currentPrice:90,direction:'BEARISH',pivots}).exhaustionRisk,true);
t('empty directional stack is exhaustion',buildMagnitudeState({originPrice:120,currentPrice:121,direction:'BULLISH',pivots}).exhaustionRisk,true);
console.log(JSON.stringify({pass,fail,failures},null,2)); process.exit(fail?1:0);
