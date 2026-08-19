"use strict";
const d=require('../timeframe-domino.js');
let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else{fail++;failures.push({name,actual,expected});}}
t('year alias',d.normalizeTimeframe('yearly'),'Y');
t('quarter alias',d.normalizeTimeframe('quarterly'),'Q');
t('hour alias',d.normalizeTimeframe('1h'),'60');
t('invalid timeframe',d.normalizeTimeframe('7m'),null);
t('ladder order',d.sortTimeframes(['15','Y','D','Q']),['Y','Q','D','15']);
t('bull strict in force',d.isInForce({direction:'BULLISH',trigger:100,currentPrice:100}),false);
t('bull above trigger',d.isInForce({direction:'BULLISH',trigger:100,currentPrice:101}),true);
t('bear strict in force',d.isInForce({direction:'BEARISH',trigger:100,currentPrice:100}),false);
t('bear below trigger',d.isInForce({direction:'BEARISH',trigger:100,currentPrice:99}),true);
const long=d.buildDominoState({selectedTimeframes:d.defaultProfiles().LONG_TERM,thesisTimeframe:'Q',executionTimeframe:'D',states:[
 {timeframe:'D',direction:'BULLISH',trigger:99,currentPrice:101},
 {timeframe:'W',direction:'BULLISH',trigger:98,currentPrice:101},
 {timeframe:'M',direction:'BULLISH',trigger:100,currentPrice:101},
 {timeframe:'Q',direction:'BULLISH',trigger:102,currentPrice:101},
 {timeframe:'Y',direction:'BULLISH',trigger:95,currentPrice:101}
]});
t('long-term ladder',long.ladder,['Y','Q','M','W','D']);
t('quarter not forced active',long.thesisState.inForce,false);
t('long active count excludes quarter',long.chains[0].activeCount,4);
t('long low to high order',long.chains[0].members.map(x=>x.timeframe),['D','W','M','Y']);
t('execution state kept separate',long.executionState.timeframe,'D');
const intra=d.buildDominoState({selectedTimeframes:d.defaultProfiles().INTRADAY,thesisTimeframe:'D',executionTimeframe:'15',states:[
 {timeframe:'15',direction:'BULLISH',trigger:100,currentPrice:101},
 {timeframe:'30',direction:'BULLISH',trigger:100.5,currentPrice:101},
 {timeframe:'60',direction:'BULLISH',trigger:102,currentPrice:101},
 {timeframe:'D',direction:'BULLISH',trigger:103,currentPrice:101}
]});
t('intraday active lower chain',intra.chains[0].members.map(x=>x.timeframe),['15','30']);
t('daily thesis not yet in force',intra.thesisState.inForce,false);
t('execution 15 in force',intra.executionState.inForce,true);
const mixed=d.buildDominoState({selectedTimeframes:['D','60','30'],states:[
 {timeframe:'D',direction:'BEARISH',trigger:100,currentPrice:99},
 {timeframe:'60',direction:'BULLISH',trigger:98,currentPrice:99}
]});
t('mixed direction state',mixed.dominantDirection,'MIXED');
t('mixed has two chains',mixed.chains.length,2);
t('profiles include long term',d.defaultProfiles().LONG_TERM,['Y','Q','M','W','D']);
console.log(JSON.stringify({pass,fail,failures},null,2)); process.exit(fail?1:0);
