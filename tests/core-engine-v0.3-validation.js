const {classifyBar,detectSetup,calculateTrade}=require('../core-engine-v0.3.js');
let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}

const prior={high:10,low:5};
t('outside classifies as 3',classifyBar({high:11,low:4},prior),'3');

let bars=[{high:12,low:8},{high:11,low:7},{high:12,low:7.5}];
let s=detectSetup(bars);
t('plain bullish 2-2 remains valid',{name:s.name,direction:s.direction,trigger:s.trigger,magnitude:s.magnitude},{name:'2-2',direction:'BULLISH',trigger:11,magnitude:12});

bars=[{high:12,low:8},{high:11,low:7},{high:12.5,low:6.5}];
s=detectSetup(bars);
t('completed 3 is not auto-bullish',{name:s.name,direction:s.direction,pathResolved:s.pathResolved},{name:'OUTSIDE PATH AMBIGUOUS',direction:'UNKNOWN',pathResolved:false});

s=detectSetup(bars,{currentBarPathDirection:'BULLISH'});
t('known down-first then up path can resolve bullish 2-2',{name:s.name,direction:s.direction,currentType:s.currentType,pathResolved:s.pathResolved},{name:'2-2',direction:'BULLISH',currentType:'3',pathResolved:true});

bars=[{high:12,low:8},{high:13,low:9},{high:13.5,low:8.5}];
s=detectSetup(bars);
t('completed 3 is not auto-bearish',{name:s.name,direction:s.direction,pathResolved:s.pathResolved},{name:'OUTSIDE PATH AMBIGUOUS',direction:'UNKNOWN',pathResolved:false});

s=detectSetup(bars,{currentBarPathDirection:'BEARISH'});
t('known up-first then down path can resolve bearish 2-2',{name:s.name,direction:s.direction,currentType:s.currentType,pathResolved:s.pathResolved},{name:'2-2',direction:'BEARISH',currentType:'3',pathResolved:true});

bars=[{high:13,low:9},{high:12,low:8},{high:11.5,low:8.5},{high:12,low:9}];
s=detectSetup(bars);
t('bullish 2-1-2 remains valid',{name:s.name,direction:s.direction,trigger:s.trigger,magnitude:s.magnitude},{name:'2-1-2',direction:'BULLISH',trigger:11.5,magnitude:12});

bars=[{high:13,low:9},{high:12,low:8},{high:11.5,low:8.5},{high:12.5,low:8.0}];
s=detectSetup(bars);
t('2-1-2 completed 3 remains ambiguous without path',{name:s.name,direction:s.direction},{name:'OUTSIDE PATH AMBIGUOUS',direction:'UNKNOWN'});

s=detectSetup(bars,{currentBarPathDirection:'BULLISH'});
t('2-1-2 can resolve from known path',{name:s.name,direction:s.direction},{name:'2-1-2',direction:'BULLISH'});

bars=[{high:10,low:6},{high:11,low:5},{high:10.5,low:5.5},{high:10.8,low:6}];
s=detectSetup(bars);
t('3-1-2 bullish remains valid',{name:s.name,direction:s.direction},{name:'3-1-2',direction:'BULLISH'});

bars=[{high:12,low:8},{high:11,low:7},{high:12,low:7.5}];
s=detectSetup(bars);
let tr=calculateTrade(s,11.5);
t('midpoint management name/value',tr.midpointStop,9);
t('in-force strict break',tr.inForce,true);
t('out of force at exact trigger',calculateTrade(s,11).inForce,false);
t('magnitude terminology/value',tr.magnitude,12);
t('magnitude hit equality',calculateTrade(s,12).magnitudeHit,true);

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
