const r=require('../research-outcomes.js');
let pass=0,fail=0;const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++;failures.push({name,actual,expected});}}

const bull={direction:'BULLISH',entry:100,stop:95,magnitude:110};
const bear={direction:'BEARISH',entry:100,stop:105,magnitude:90};
t('bull risk',r.riskPerShare(bull),5);
t('bear risk',r.riskPerShare(bear),5);
t('bull reward',r.rewardToMagnitude(bull),10);
t('bear reward',r.rewardToMagnitude(bear),10);
t('planned R',r.plannedRMultiple(bull),2);
t('magnitude only win',r.classifyOutcome({...bull,magnitudeHit:true}),{status:'WIN',reason:'MAGNITUDE_HIT'});
t('stop only loss',r.classifyOutcome({...bull,stopHit:true}),{status:'LOSS',reason:'STOP_HIT'});
t('both magnitude first',r.classifyOutcome({...bull,magnitudeHit:true,stopHit:true,firstHit:'MAGNITUDE'}),{status:'WIN',reason:'MAGNITUDE_FIRST'});
t('both stop first',r.classifyOutcome({...bull,magnitudeHit:true,stopHit:true,firstHit:'STOP'}),{status:'LOSS',reason:'STOP_FIRST'});
t('both unknown ambiguous',r.classifyOutcome({...bull,magnitudeHit:true,stopHit:true}),{status:'AMBIGUOUS',reason:'BOTH_HIT_SEQUENCE_UNKNOWN'});
t('realized bullish R',r.realizedR({...bull,exit:107}),1.4);
t('realized bearish R',r.realizedR({...bear,exit:93}),1.4);
const events=[
 {...bull,setup:'2-2',ftfc:'4/4',magnitudeHit:true,exit:110},
 {...bull,setup:'2-2',ftfc:'4/4',stopHit:true,exit:95},
 {...bull,setup:'2-2',ftfc:'3/4',magnitudeHit:true,exit:110},
 {...bull,setup:'2-2',ftfc:'3/4',magnitudeHit:true,stopHit:true}
];
const s=r.summarizeEvents(events);
t('summary samples',s.samples,4);
t('summary resolved',s.resolved,3);
t('summary wins',s.wins,2);
t('summary losses',s.losses,1);
t('summary win rate',s.winRate,2/3);
t('summary ambiguous',s.ambiguous,1);
const cmp=r.compareScenarios(events,['setup','ftfc']);
t('scenario groups',cmp.length,2);
t('4/4 sample count',cmp.find(x=>x.scenario==='setup=2-2|ftfc=4/4').samples,2);
console.log(JSON.stringify({pass,fail,failures},null,2));process.exit(fail?1:0);
