const {interpretRelativeToCarrier,summarizeCarrierStack}=require('../carrier-interpretation.js');
let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}

function state(args){ return interpretRelativeToCarrier({carrierDirection:'BULLISH',carrierTimeframe:'W',lowerTimeframe:'D',...args}).state; }

t('same-direction in-force confirms',state({lowerDirection:'BULLISH',lowerInForce:true}),'CONFIRMING');
t('inside bar is neutral',state({insideBar:true}),'NEUTRAL_INSIDE');
t('type 1 is neutral',state({lowerType:'1'}),'NEUTRAL_INSIDE');
t('opposing lower in-force is conflict',state({lowerDirection:'BEARISH',lowerInForce:true}),'CONFLICT');
t('forming reversal is caution state',state({opposingReversalForming:true}),'OPPOSING_REVERSAL_FORMING');
t('in-force opposing reversal dominates',state({opposingReversalInForce:true}),'OPPOSING_REVERSAL_IN_FORCE');
t('mother bar confinement detected',state({motherBarConfined:true}),'MOTHER_BAR_CONFINED');
t('range exit with carrier confirms',state({rangeExitDirection:'BULLISH'}),'RANGE_EXIT_CONFIRMING');
t('range exit against carrier is reversal',state({rangeExitDirection:'BEARISH'}),'OPPOSING_REVERSAL_IN_FORCE');
t('higher timeframe change dominates',state({higherTfChanged:true}),'HIGHER_TF_CHANGE');

const carrier={timeframe:'W',direction:'BULLISH',inForce:true};
let summary=summarizeCarrierStack({carrier,lowerStates:[
  {timeframe:'D',direction:'BULLISH',inForce:true},
  {timeframe:'60',direction:'BULLISH',inForce:true}
]});
t('all lower timeframes confirming => confirmed',summary.overall,'CONFIRMED');

summary=summarizeCarrierStack({carrier,lowerStates:[
  {timeframe:'D',insideBar:true},
  {timeframe:'60',direction:'BULLISH',inForce:true}
]});
t('inside plus confirming remains stable',summary.overall,'STABLE');

summary=summarizeCarrierStack({carrier,lowerStates:[
  {timeframe:'D',direction:'BEARISH',inForce:true},
  {timeframe:'60',direction:'BULLISH',inForce:true}
]});
t('conflict => caution',summary.overall,'CAUTION');

summary=summarizeCarrierStack({carrier,lowerStates:[
  {timeframe:'D',opposingReversalInForce:true}
]});
t('opposing reversal => reversal against',summary.overall,'REVERSAL_AGAINST');

summary=summarizeCarrierStack({carrier,lowerStates:[
  {timeframe:'D',higherTfChanged:true}
]});
t('higher tf change => changed',summary.overall,'CHANGED');

summary=summarizeCarrierStack({carrier:null,lowerStates:[]});
t('no carrier explicit',summary.overall,'NO_ACTIVE_CARRIER');

let threw=false; try{interpretRelativeToCarrier({carrierDirection:'BULLISH',carrierTimeframe:'D',lowerTimeframe:'W'});}catch(e){threw=true;}
t('reject non-lower timeframe',threw,true);

console.log(JSON.stringify({pass,fail,failures},null,2)); process.exit(fail?1:0);
