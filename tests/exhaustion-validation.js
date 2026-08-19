const {buildTimeExhaustionState,buildExhaustionState}=require('../exhaustion.js');
let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}

const start='2026-08-19T09:30:00-04:00';
const end='2026-08-19T10:30:00-04:00';

let s=buildTimeExhaustionState({signalStart:start,signalEnd:end,now:'2026-08-19T09:30:00-04:00'});
t('start elapsed 0',s.elapsedPct,0);
t('start remaining 100',s.remainingPct,100);
t('start active true',s.active,true);
t('start expired false',s.expired,false);

s=buildTimeExhaustionState({signalStart:start,signalEnd:end,now:'2026-08-19T10:00:00-04:00'});
t('half elapsed 50',s.elapsedPct,50);
t('half remaining 50',s.remainingPct,50);
t('half active true',s.active,true);

s=buildTimeExhaustionState({signalStart:start,signalEnd:end,now:'2026-08-19T10:25:00-04:00'});
t('55 minutes elapsed',Math.round(s.elapsedPct*1000)/1000,91.667);
t('5 minutes remaining',Math.round(s.remainingPct*1000)/1000,8.333);

s=buildTimeExhaustionState({signalStart:start,signalEnd:end,now:'2026-08-19T10:30:00-04:00'});
t('at end expired',s.expired,true);
t('at end active false',s.active,false);
t('at end remaining 0',s.remainingPct,0);

s=buildTimeExhaustionState({signalStart:start,signalEnd:end,now:'2026-08-19T09:00:00-04:00'});
t('before start notStarted',s.notStarted,true);
t('before start elapsed clamped 0',s.elapsedPct,0);

let c=buildExhaustionState({timeState:buildTimeExhaustionState({signalStart:start,signalEnd:end,now:'2026-08-19T09:45:00-04:00'}),priceExhaustionRisk:false});
t('combined preserves time risk',c.timeExhaustionRisk,true);
t('combined price false',c.priceExhaustionRisk,false);
t('combined any true from time',c.anyExhaustionRisk,true);

c=buildExhaustionState({timeState:null,priceExhaustionRisk:true});
t('combined price-only risk',c.priceExhaustionRisk,true);
t('combined any true from price',c.anyExhaustionRisk,true);

c=buildExhaustionState({timeState:null,priceExhaustionRisk:false});
t('combined no risk',c.anyExhaustionRisk,false);

let threw=false; try{buildTimeExhaustionState({signalStart:end,signalEnd:start,now:start});}catch(e){threw=true;}
t('invalid duration rejected',threw,true);

console.log(JSON.stringify({pass,fail,failures},null,2)); process.exit(fail?1:0);
