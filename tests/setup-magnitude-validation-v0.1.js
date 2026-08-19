const {selectSetupMagnitude,buildSetupObjective}=require('../setup-magnitude.js');
let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}
const src={high:120,low:90};
for(const setupName of ['2-2','2-1-2','3-1-2']){
  t(`${setupName} bullish magnitude`,selectSetupMagnitude({setupName,direction:'BULLISH',sourceBar:src}),120);
  t(`${setupName} bearish magnitude`,selectSetupMagnitude({setupName,direction:'BEARISH',sourceBar:src}),90);
}
t('unsupported setup returns null',selectSetupMagnitude({setupName:'1',direction:'BULLISH',sourceBar:src}),null);
t('unknown direction returns null',selectSetupMagnitude({setupName:'2-2',direction:'UNKNOWN',sourceBar:src}),null);
t('missing source returns null',selectSetupMagnitude({setupName:'2-2',direction:'BULLISH'}),null);
t('objective preserves trigger and source range',buildSetupObjective({setupName:'2-1-2',direction:'BULLISH',sourceBar:src,trigger:101}),{setupName:'2-1-2',direction:'BULLISH',trigger:101,magnitude:120,sourceRange:{high:120,low:90}});
console.log(JSON.stringify({pass,fail,failures},null,2)); process.exit(fail?1:0);
