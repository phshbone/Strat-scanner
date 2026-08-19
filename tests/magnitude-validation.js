const {
  directionalStack,
  markTargetsConsumed,
  selectNextMagnitudeTarget,
  buildMagnitudeState,
  structurallyRelevantTargets,
  buildObjectiveState
}=require('../magnitude.js');

let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}

const pivots=[
  {id:'p1',price:95,timeframe:'15m'},
  {id:'p2',price:100,timeframe:'15m'},
  {id:'p3',price:105,timeframe:'D'},
  {id:'p4',price:112,timeframe:'W'}
];

t('bullish raw stack includes only pivots above origin',directionalStack({originPrice:101,direction:'BULLISH',pivots}).map(p=>p.id),['p3','p4']);
t('bearish raw stack includes only pivots below origin',directionalStack({originPrice:101,direction:'BEARISH',pivots}).map(p=>p.id),['p2','p1']);
t('legacy bullish next target nearest remaining',selectNextMagnitudeTarget({originPrice:101,currentPrice:102,direction:'BULLISH',pivots}).target.id,'p3');
t('legacy bearish next target nearest remaining',selectNextMagnitudeTarget({originPrice:101,currentPrice:101,direction:'BEARISH',pivots}).target.id,'p2');
t('legacy bullish consumes reached target',markTargetsConsumed({originPrice:101,currentPrice:106,direction:'BULLISH',pivots}).map(p=>[p.id,p.consumed]),[['p3',true],['p4',false]]);
t('legacy bearish consumes reached target',markTargetsConsumed({originPrice:101,currentPrice:99,direction:'BEARISH',pivots}).map(p=>[p.id,p.consumed]),[['p2',true],['p1',false]]);
t('legacy bullish promotes next target after T1',selectNextMagnitudeTarget({originPrice:101,currentPrice:106,direction:'BULLISH',pivots}).target.id,'p4');
t('legacy bearish promotes next target after T1',selectNextMagnitudeTarget({originPrice:101,currentPrice:99,direction:'BEARISH',pivots}).target.id,'p1');
t('legacy bullish exhaustion when stack cleared',selectNextMagnitudeTarget({originPrice:101,currentPrice:115,direction:'BULLISH',pivots}).exhaustionRisk,true);
t('legacy bearish exhaustion when stack cleared',selectNextMagnitudeTarget({originPrice:101,currentPrice:90,direction:'BEARISH',pivots}).exhaustionRisk,true);
t('legacy empty directional stack is exhaustion',buildMagnitudeState({originPrice:120,currentPrice:121,direction:'BULLISH',pivots}).exhaustionRisk,true);
t('legacy helper exposes explicit price exhaustion',selectNextMagnitudeTarget({originPrice:101,currentPrice:115,direction:'BULLISH',pivots}).priceExhaustionRisk,true);

// Production objective-state behavior: first magnitude is explicit and raw pivots
// are not promoted unless upstream structure logic marks them relevant.
const qualifiedBull=[
  {id:'raw-near',price:106,structurallyRelevant:false},
  {id:'valid-1',price:109,structurallyRelevant:true},
  {id:'valid-2',price:115,eligibleTarget:true},
  {id:'wrong-side',price:98,structurallyRelevant:true}
];

t('structural filter excludes raw unqualified and wrong-side pivots',
  structurallyRelevantTargets({originPrice:100,direction:'BULLISH',magnitude:105,pivots:qualifiedBull}).map(p=>p.id),
  ['valid-1','valid-2']);

let s=buildObjectiveState({originPrice:100,currentPrice:103,direction:'BULLISH',magnitude:105,pivots:qualifiedBull});
t('before magnitude next objective is magnitude',s.nextObjective,{type:'MAGNITUDE',price:105});
t('before magnitude exhaustion is false even without considering extra targets',s.exhaustionRisk,false);
t('before magnitude explicit price exhaustion false',s.priceExhaustionRisk,false);

s=buildObjectiveState({originPrice:100,currentPrice:106,direction:'BULLISH',magnitude:105,pivots:qualifiedBull});
t('after magnitude first qualified target is promoted',s.nextObjective.id,'valid-1');
t('after magnitude with targets remaining exhaustion false',s.exhaustionRisk,false);

s=buildObjectiveState({originPrice:100,currentPrice:110,direction:'BULLISH',magnitude:105,pivots:qualifiedBull});
t('consumed first target promotes second qualified target',s.nextObjective.id,'valid-2');

s=buildObjectiveState({originPrice:100,currentPrice:116,direction:'BULLISH',magnitude:105,pivots:qualifiedBull});
t('cleared active qualified target structure sets exhaustion',s.exhaustionRisk,true);
t('cleared active qualified target structure sets explicit price exhaustion',s.priceExhaustionRisk,true);
t('cleared active qualified target structure has no next objective',s.nextObjective,null);

const qualifiedBear=[
  {id:'raw-near',price:94,structurallyRelevant:false},
  {id:'valid-1',price:91,structurallyRelevant:true},
  {id:'valid-2',price:85,eligibleTarget:true},
  {id:'wrong-side',price:102,structurallyRelevant:true}
];
s=buildObjectiveState({originPrice:100,currentPrice:96,direction:'BEARISH',magnitude:95,pivots:qualifiedBear});
t('bearish before magnitude points to explicit magnitude',s.nextObjective,{type:'MAGNITUDE',price:95});
s=buildObjectiveState({originPrice:100,currentPrice:94,direction:'BEARISH',magnitude:95,pivots:qualifiedBear});
t('bearish post-magnitude promotes only qualified target',s.nextObjective.id,'valid-1');
s=buildObjectiveState({originPrice:100,currentPrice:84,direction:'BEARISH',magnitude:95,pivots:qualifiedBear});
t('bearish cleared qualified structure sets exhaustion',s.exhaustionRisk,true);

// Important edge: magnitude reached with no structurally qualified extra targets.
s=buildObjectiveState({originPrice:100,currentPrice:106,direction:'BULLISH',magnitude:105,pivots:[{id:'raw',price:110}]});
t('magnitude reached with no qualified further structure is exhaustion context',s.exhaustionRisk,true);
t('unqualified raw pivot is not auto-promoted after magnitude',s.nextObjective,null);

console.log(JSON.stringify({pass,fail,failures},null,2)); process.exit(fail?1:0);
