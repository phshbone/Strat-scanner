const {detectSetup}=require('../core-engine-v0.3.js');
const {setupToSignal,buildSetupSignalState,buildDominoFromSetups}=require('../setup-signal-adapter.js');

let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}

const bullish221Bars=[
  {open:10,high:12,low:9,close:11},
  {open:11,high:11.5,low:9.5,close:10},
  {open:10,high:11,low:9.7,close:10.5},
  {open:10.5,high:11.6,low:9.8,close:11.4}
];
const setup212=detectSetup(bullish221Bars);
t('core emits bullish 2-1-2',setup212.name,'2-1-2');
t('core emits bullish direction',setup212.direction,'BULLISH');

const signal=setupToSignal(setup212,{timeframe:'D',signalStartsAt:1000,signalExpiresAt:2000});
t('adapter preserves setup id',signal.setupId,'2-1-2');
t('adapter preserves direction',signal.direction,'BULLISH');
t('adapter preserves trigger',signal.trigger,11);
t('adapter preserves magnitude',signal.magnitude,11.5);
t('adapter does not invent reclaim',signal.levelOfReclaim,null);
t('adapter preserves timeframe',signal.timeframe,'D');

let state=buildSetupSignalState({setup:setup212,currentPrice:11.2,now:1500,signalOptions:{timeframe:'D',signalStartsAt:1000,signalExpiresAt:2000}});
t('active core setup becomes active lifecycle',state.lifecycle.status,'ACTIVE');
t('active core setup trigger in force',state.lifecycle.triggerInForce,true);

state=buildSetupSignalState({setup:setup212,currentPrice:10.9,now:1500,signalOptions:{timeframe:'D',signalStartsAt:1000,signalExpiresAt:2000}});
t('below bullish trigger is standby',state.lifecycle.status,'STANDBY');

state=buildSetupSignalState({setup:setup212,currentPrice:11.2,now:2000,signalOptions:{timeframe:'D',signalStartsAt:1000,signalExpiresAt:2000}});
t('bar close expires setup signal',state.lifecycle.status,'EXPIRED');

const bearish22={name:'2-2',direction:'BEARISH',trigger:50,magnitude:45,reference:{high:52,low:48},currentType:'2D',pathResolved:true};
const dBull={name:'2-2',direction:'BULLISH',trigger:100,magnitude:105,reference:{high:101,low:97},currentType:'2U',pathResolved:true};
const wBull={name:'2-1-2',direction:'BULLISH',trigger:102,magnitude:108,reference:{high:102,low:96},currentType:'2U',pathResolved:true};
const mBull={name:'3-1-2',direction:'BULLISH',trigger:110,magnitude:120,reference:{high:110,low:95},currentType:'2U',pathResolved:true};

let multi=buildDominoFromSetups({
  setupRows:[
    {timeframe:'D',setup:dBull,signalOptions:{signalStartsAt:0,signalExpiresAt:999999}},
    {timeframe:'W',setup:wBull,signalOptions:{signalStartsAt:0,signalExpiresAt:999999}},
    {timeframe:'M',setup:mBull,signalOptions:{signalStartsAt:0,signalExpiresAt:999999}}
  ],
  currentPrice:103,
  now:100,
  selectedTimeframes:['M','W','D'],
  thesisTimeframe:'W',
  executionTimeframe:'D'
});
t('daily active from real setup object',multi.adaptedStates.find(x=>x.timeframe==='D').inForce,true);
t('weekly active from real setup object',multi.adaptedStates.find(x=>x.timeframe==='W').inForce,true);
t('monthly not falsely active',multi.adaptedStates.find(x=>x.timeframe==='M').inForce,false);
t('bullish chain has two active carriers',multi.domino.chains.find(x=>x.direction==='BULLISH').activeCount,2);
t('highest active carrier weekly',multi.domino.chains.find(x=>x.direction==='BULLISH').highestActiveTimeframe,'W');
t('thesis timeframe preserved',multi.domino.thesisTimeframe,'W');
t('execution timeframe preserved',multi.domino.executionTimeframe,'D');

multi=buildDominoFromSetups({
  setupRows:[
    {timeframe:'60',setup:bearish22,signalOptions:{signalStartsAt:0,signalExpiresAt:999999}},
    {timeframe:'D',setup:dBull,signalOptions:{signalStartsAt:0,signalExpiresAt:999999}}
  ],
  currentPrice:49,
  now:100,
  selectedTimeframes:['D','60']
});
t('mixed directions preserved from core-style setups',multi.domino.dominantDirection,'MIXED');
t('bearish chain present',multi.domino.chains.some(x=>x.direction==='BEARISH'),true);
t('bullish daily inactive when below trigger',multi.adaptedStates.find(x=>x.timeframe==='D').inForce,false);

const invalid=setupToSignal({name:'NONE',direction:'NONE'});
t('non-directional core setup ignored',invalid,null);

console.log(JSON.stringify({pass,fail,failures},null,2)); process.exit(fail?1:0);
