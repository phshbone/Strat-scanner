const {normalizeReclaimLevel,sortReclaimLevels,nearestDefensiveReclaim,reclaimBreach,buildReclaimManagementState}=require('../reclaim-management.js');
let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}

const levels=[
  {id:'w',price:101,timeframe:'W',verified:true,source:'DOC_VISUAL'},
  {id:'d',price:103,timeframe:'D',verified:true,source:'DOC_VISUAL'},
  {id:'raw',price:104,timeframe:'60',verified:false,source:'UNVERIFIED'}
];

t('normalize numeric',normalizeReclaimLevel({price:'99',verified:true}).price,99);
t('bullish sorting descending',sortReclaimLevels(levels,'BULLISH').map(x=>x.id),['raw','d','w']);
t('bearish sorting ascending',sortReclaimLevels(levels,'BEARISH').map(x=>x.id),['w','d','raw']);
t('bullish nearest verified below current',nearestDefensiveReclaim({direction:'BULLISH',currentPrice:105,levels}).id,'d');
t('unverified nearer level ignored',nearestDefensiveReclaim({direction:'BULLISH',currentPrice:105,levels}).price,103);
t('bullish no eligible below',nearestDefensiveReclaim({direction:'BULLISH',currentPrice:100,levels}),null);

const bearLevels=[
  {id:'a',price:49,verified:true},
  {id:'b',price:47,verified:true},
  {id:'u',price:46,verified:false}
];
t('bearish nearest verified above current',nearestDefensiveReclaim({direction:'BEARISH',currentPrice:45,levels:bearLevels}).id,'b');
t('bearish no eligible above',nearestDefensiveReclaim({direction:'BEARISH',currentPrice:50,levels:bearLevels}),null);

t('bullish breach at equality',reclaimBreach({direction:'BULLISH',currentPrice:103,level:{price:103,verified:true}}),true);
t('bullish not breached above',reclaimBreach({direction:'BULLISH',currentPrice:103.01,level:{price:103,verified:true}}),false);
t('bearish breach at equality',reclaimBreach({direction:'BEARISH',currentPrice:47,level:{price:47,verified:true}}),true);
t('bearish not breached below',reclaimBreach({direction:'BEARISH',currentPrice:46.99,level:{price:47,verified:true}}),false);
t('unverified reclaim cannot breach',reclaimBreach({direction:'BULLISH',currentPrice:90,level:{price:100,verified:false}}),false);

let s=buildReclaimManagementState({direction:'BULLISH',currentPrice:105,levels,magnitudeReached:true,higherTimeframeCarrierActive:false});
t('post-magnitude without carrier tightens reclaim',s.guidance,'TIGHTEN_TO_NEAREST_RECLAIM');
t('state preserves defensive level',s.defensiveLevel.id,'d');

s=buildReclaimManagementState({direction:'BULLISH',currentPrice:105,levels,magnitudeReached:true,higherTimeframeCarrierActive:true});
t('higher carrier prevents forced tighten instruction',s.guidance,'RECLAIM_AVAILABLE');

s=buildReclaimManagementState({direction:'BULLISH',currentPrice:100,levels,magnitudeReached:true,higherTimeframeCarrierActive:false});
t('no eligible reclaim means no reclaim guidance',s.guidance,'NO_RECLAIM_GUIDANCE');

let threw=false; try{nearestDefensiveReclaim({direction:'NONE',currentPrice:10,levels:[]});}catch(e){threw=true;}
t('invalid direction rejected',threw,true);
threw=false; try{nearestDefensiveReclaim({direction:'BULLISH',currentPrice:'x',levels:[]});}catch(e){threw=true;}
t('invalid current price rejected',threw,true);

console.log(JSON.stringify({pass,fail,failures},null,2)); process.exit(fail?1:0);
