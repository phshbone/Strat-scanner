const {priceInForce,magnitudeReached,resolveMagnitude,buildSignalLifecycle,carrierTimeframes}=require('../signal-lifecycle.js');
let pass=0,fail=0,failures=[];
function t(name,a,e){const ok=JSON.stringify(a)===JSON.stringify(e); if(ok)pass++; else {fail++; failures.push({name,a,e});}}
function throws(name,fn){let ok=false; try{fn();}catch(e){ok=true;} t(name,ok,true);}

t('bull strict trigger',priceInForce('BULLISH',100,101),true);
t('bull equality not in force',priceInForce('BULLISH',100,100),false);
t('bear strict trigger',priceInForce('BEARISH',100,99),true);
t('bear equality not in force',priceInForce('BEARISH',100,100),false);
t('bull magnitude reached equality',magnitudeReached('BULLISH',105,105),true);
t('bear magnitude reached equality',magnitudeReached('BEARISH',95,95),true);
t('setup magnitude preferred',resolveMagnitude({magnitude:105,borrowedMagnitude:110,timeframe:'D'}),{price:105,source:'SETUP',timeframe:'D'});
t('borrowed magnitude supported',resolveMagnitude({borrowedMagnitude:110,borrowedMagnitudeTimeframe:'W'}),{price:110,source:'BORROWED',timeframe:'W'});
t('no magnitude stays null',resolveMagnitude({}),null);

const base={direction:'BULLISH',timeframe:'D',trigger:100,magnitude:105,signalStartsAt:0,signalExpiresAt:1000};
let s=buildSignalLifecycle({signal:base,currentPrice:101,now:500});
t('active signal',s.status,'ACTIVE');
t('active elapsed pct',s.timeElapsedPct,50);
t('active remaining pct',s.timeRemainingPct,50);
t('level reclaim absent remains null',s.levelOfReclaim,null);
s=buildSignalLifecycle({signal:{...base,levelOfReclaim:99},currentPrice:101,now:500});
t('level reclaim preserved',s.levelOfReclaim,99);
s=buildSignalLifecycle({signal:base,currentPrice:100,now:500});
t('not triggered standby',s.status,'STANDBY');
s=buildSignalLifecycle({signal:base,currentPrice:105,now:500});
t('magnitude completed',s.status,'COMPLETED');
t('completed is not active',s.active,false);
s=buildSignalLifecycle({signal:base,currentPrice:101,now:1000});
t('expires exactly at close',s.status,'EXPIRED');
s=buildSignalLifecycle({signal:{...base,signalStartsAt:100,signalExpiresAt:1100},currentPrice:101,now:0});
t('not started',s.status,'NOT_STARTED');

const expansion={direction:'BEARISH',timeframe:'60',trigger:100,magnitude:null,borrowedMagnitude:90,borrowedMagnitudeTimeframe:'D',signalStartsAt:0,signalExpiresAt:1000};
s=buildSignalLifecycle({signal:expansion,currentPrice:99,now:500});
t('borrowed magnitude source',s.magnitude,{price:90,source:'BORROWED',timeframe:'D'});
t('borrowed magnitude setup active',s.status,'ACTIVE');
s=buildSignalLifecycle({signal:expansion,currentPrice:89,now:500});
t('borrowed magnitude completion',s.status,'COMPLETED');

const carriers=carrierTimeframes({signals:[base,{...base,timeframe:'W',trigger:99,magnitude:110,signalExpiresAt:2000}],currentPrice:101,now:500});
t('multiple active carriers retained',carriers,['D','W']);
const carriers2=carrierTimeframes({signals:[base,{...base,timeframe:'W',trigger:99,magnitude:110,signalExpiresAt:2000}],currentPrice:101,now:1500});
t('expired lower carrier drops while higher remains',carriers2,['W']);
throws('invalid window rejected',()=>buildSignalLifecycle({signal:{...base,signalStartsAt:1000,signalExpiresAt:1000},currentPrice:101,now:500}));

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
