const {normalizeSignal,effectiveMagnitude,reclaimStatus}=require('../signal-schema.js');
let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}

const base=normalizeSignal({name:'2-2',direction:'BULLISH',timeframe:'D',trigger:101,magnitude:105});
t('setup id preserved',base.setupId,'2-2');
t('direction preserved',base.direction,'BULLISH');
t('trigger numeric',base.trigger,101);
t('setup magnitude numeric',base.magnitude,105);
t('setup magnitude source',base.magnitudeSource,'SETUP');
t('unknown reclaim remains null',base.levelOfReclaim,null);
t('unknown reclaim not falsely verified',base.reclaimVerified,false);
t('unknown reclaim status',reclaimStatus(base),{known:false,verified:false,price:null});

const explicit=normalizeSignal({setupId:'X',direction:'BEARISH',trigger:99,magnitude:95,levelOfReclaim:100,reclaimSource:'DOC_VISUAL',reclaimVerified:true});
t('explicit reclaim numeric',explicit.levelOfReclaim,100);
t('explicit reclaim source preserved',explicit.reclaimSource,'DOC_VISUAL');
t('explicit reclaim verification preserved',explicit.reclaimVerified,true);
t('known reclaim status',reclaimStatus(explicit),{known:true,verified:true,price:100});

const borrowed=normalizeSignal({setupId:'3-2',direction:'BEARISH',timeframe:'60',trigger:98,borrowedMagnitude:92,borrowedMagnitudeTimeframe:'D'});
t('3-2-style setup magnitude can remain null',borrowed.magnitude,null);
t('borrowed magnitude stored',borrowed.borrowedMagnitude,92);
t('borrowed magnitude source',borrowed.magnitudeSource,'BORROWED');
t('borrowed timeframe preserved',borrowed.borrowedMagnitudeTimeframe,'D');
t('effective borrowed magnitude',effectiveMagnitude(borrowed),{price:92,source:'BORROWED',timeframe:'D'});

const noMag=normalizeSignal({setupId:'NO-MAG',direction:'BULLISH',trigger:10});
t('no invented magnitude',effectiveMagnitude(noMag),null);

let threw=false; try{normalizeSignal({direction:'NONE',trigger:10});}catch(e){threw=true;}
t('invalid direction rejected',threw,true);
threw=false; try{normalizeSignal({direction:'BULLISH',trigger:'x'});}catch(e){threw=true;}
t('invalid trigger rejected',threw,true);

console.log(JSON.stringify({pass,fail,failures},null,2)); process.exit(fail?1:0);
