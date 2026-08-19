const {buildPmgObjectivePipeline}=require('../pmg-objective-pipeline.js');

let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected);if(ok)pass++;else{fail++;failures.push({name,actual,expected});}}

const bearishBars=[
  {high:105,low:90},
  {high:106,low:92},
  {high:107,low:94},
  {high:108,low:96},
  {high:109,low:98}
];

let r=buildPmgObjectivePipeline({
  bars:bearishBars,
  timeframe:'60',
  reversalDirection:'BEARISH',
  reversalInForce:true,
  originPrice:101,
  currentPrice:100,
  setupMagnitude:99
});
t('bearish PMG actionable after matching reversal',r.pmgState.actionable,true);
t('setup magnitude remains first bearish objective',r.nextObjective,{type:'MAGNITUDE',price:99});
t('bearish PMG levels ordered nearest to farthest',r.targetHierarchy.objectives.map(x=>x.price),[98,96,94,92,90]);

r=buildPmgObjectivePipeline({
  bars:bearishBars,
  timeframe:'60',
  reversalDirection:'BEARISH',
  reversalInForce:true,
  originPrice:101,
  currentPrice:97,
  setupMagnitude:99
});
t('after bearish magnitude next PMG level promotes',r.nextObjective.price,96);
t('promoted bearish target keeps PMG source',r.nextObjective.source,'PMG');
t('bearish remaining PMG count updates',r.objectiveState.remainingTargets,4);

r=buildPmgObjectivePipeline({
  bars:bearishBars,
  timeframe:'60',
  reversalDirection:'BEARISH',
  reversalInForce:true,
  originPrice:101,
  currentPrice:89,
  setupMagnitude:99
});
t('cleared bearish PMG structure sets price exhaustion',r.priceExhaustionRisk,true);
t('cleared bearish PMG structure has no next objective',r.nextObjective,null);

r=buildPmgObjectivePipeline({
  bars:bearishBars,
  timeframe:'60',
  reversalDirection:'BULLISH',
  reversalInForce:true,
  originPrice:101,
  currentPrice:100,
  setupMagnitude:99
});
t('opposite reversal does not activate bearish PMG',r.pmgState.actionable,false);
t('non-actionable PMG does not create target hierarchy',r.targetHierarchy,null);

const bullishBars=[
  {high:110,low:90},
  {high:108,low:89},
  {high:106,low:88},
  {high:104,low:87},
  {high:102,low:86}
];

r=buildPmgObjectivePipeline({
  bars:bullishBars,
  timeframe:'15',
  reversalDirection:'BULLISH',
  reversalInForce:true,
  originPrice:99,
  currentPrice:100,
  setupMagnitude:101
});
t('bullish PMG actionable after matching reversal',r.pmgState.actionable,true);
t('setup magnitude remains first bullish objective',r.nextObjective,{type:'MAGNITUDE',price:101});
t('bullish PMG levels ordered nearest to farthest',r.targetHierarchy.objectives.map(x=>x.price),[102,104,106,108,110]);

r=buildPmgObjectivePipeline({
  bars:bullishBars,
  timeframe:'15',
  reversalDirection:'BULLISH',
  reversalInForce:true,
  originPrice:99,
  currentPrice:103,
  setupMagnitude:101
});
t('after first bullish PMG level next level promotes',r.nextObjective.price,104);
t('bullish remaining PMG count updates',r.objectiveState.remainingTargets,4);

r=buildPmgObjectivePipeline({
  bars:bullishBars,
  timeframe:'15',
  reversalDirection:'BULLISH',
  reversalInForce:false,
  originPrice:99,
  currentPrice:103,
  setupMagnitude:101
});
t('PMG geometry without in-force reversal creates no objective state',r.objectiveState,null);

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
