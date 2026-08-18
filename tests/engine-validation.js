function classifyBar(current, prior){
  const H=current.high, L=current.low, PH=prior.high, PL=prior.low;
  if(H <= PH && L >= PL) return '1';
  if(H > PH && L >= PL) return '2U';
  if(L < PL && H <= PH) return '2D';
  if(H > PH && L < PL) return '3';
  return '?';
}
function timeframeState(price, open){
  if(price > open) return 'BULLISH';
  if(price < open) return 'BEARISH';
  return 'NEUTRAL';
}
function calcFTFC(timeframes){
  let bull=0,bear=0,neutral=0;
  timeframes.forEach(tf=>{const s=timeframeState(tf.price,tf.open); if(s==='BULLISH') bull++; else if(s==='BEARISH') bear++; else neutral++;});
  const total=timeframes.length; const dir=bull>bear?'BULLISH':bear>bull?'BEARISH':'MIXED'; const aligned=Math.max(bull,bear);
  return {bull,bear,neutral,total,dir,aligned,label:`${aligned}/${total} ${dir}`};
}
function detectSetup(bars){
  if(bars.length < 3) return {name:'NONE',direction:'NONE'};
  const a=bars[bars.length-3], b=bars[bars.length-2], c=bars[bars.length-1];
  const at=classifyBar(a,bars[bars.length-4] || a); const bt=classifyBar(b,a); const ct=classifyBar(c,b);
  if(at==='2D' && bt==='1' && (ct==='2U' || ct==='3')) return {name:'2-1-2',direction:'BULLISH',trigger:b.high,target:a.high,reference:b};
  if(at==='2U' && bt==='1' && (ct==='2D' || ct==='3')) return {name:'2-1-2',direction:'BEARISH',trigger:b.low,target:a.low,reference:b};
  if(at==='3' && bt==='1' && ct==='2U') return {name:'3-1-2',direction:'BULLISH',trigger:b.high,target:a.high,reference:b};
  if(at==='3' && bt==='1' && ct==='2D') return {name:'3-1-2',direction:'BEARISH',trigger:b.low,target:a.low,reference:b};
  if(bt==='2D' && (ct==='2U' || ct==='3')) return {name:'2-2',direction:'BULLISH',trigger:b.high,target:a.high,reference:b};
  if(bt==='2U' && (ct==='2D' || ct==='3')) return {name:'2-2',direction:'BEARISH',trigger:b.low,target:a.low,reference:b};
  if(bt==='1') return {name:'INSIDE BREAK PENDING',direction:'BOTH',triggerUp:b.high,triggerDown:b.low,reference:b};
  return {name:'NONE',direction:'NONE'};
}
function calculateTrade(setup,currentPrice){
  if(!setup || !['BULLISH','BEARISH'].includes(setup.direction)) return null;
  const r=setup.reference; const midpoint=(r.high+r.low)/2;
  const inForce=setup.direction==='BULLISH' ? currentPrice>setup.trigger : currentPrice<setup.trigger;
  const structureStop=setup.direction==='BULLISH' ? r.low : r.high;
  const entry=setup.trigger; const risk=setup.direction==='BULLISH' ? entry-midpoint : midpoint-entry;
  const reward=setup.direction==='BULLISH' ? setup.target-entry : entry-setup.target;
  const rr=(risk>0 && reward>0)?reward/risk:null;
  const targetHit=setup.direction==='BULLISH' ? currentPrice>=setup.target : currentPrice<=setup.target;
  return {midpoint,structureStop,inForce,entry,risk,reward,rr,targetHit};
}
function timeExhaustion(progressPct){ const p=Math.max(0,Math.min(100,Number(progressPct)||0)); if(p<50) return 'LOW'; if(p<=80) return 'MEDIUM'; return 'HIGH'; }

let pass=0, fail=0; const results=[];
function t(name, actual, expected){ const ok=JSON.stringify(actual)===JSON.stringify(expected); results.push({name,ok,actual,expected}); ok?pass++:fail++; }

const prior={high:10,low:5};
t('1 classification', classifyBar({high:9,low:6},prior), '1');
t('2U classification', classifyBar({high:11,low:6},prior), '2U');
t('2D classification', classifyBar({high:9,low:4},prior), '2D');
t('3 classification', classifyBar({high:11,low:4},prior), '3');

t('FTFC 4/4 bullish', calcFTFC([{open:1,price:2},{open:2,price:3},{open:3,price:4},{open:4,price:5}]).label, '4/4 BULLISH');
t('FTFC 3/4 bearish', calcFTFC([{open:2,price:1},{open:3,price:2},{open:4,price:3},{open:1,price:2}]).label, '3/4 BEARISH');

const bullish22=[
 {high:12,low:8,open:9,close:11},
 {high:11,low:7,open:10,close:8},
 {high:12,low:7.5,open:8,close:11.5}
];
let s=detectSetup(bullish22); t('bullish 2-2 detection', {name:s.name,direction:s.direction,trigger:s.trigger}, {name:'2-2',direction:'BULLISH',trigger:11});
let tr=calculateTrade(s,11.5); t('bullish 2-2 in force', tr.inForce, true); t('bullish 2-2 50% stop', tr.midpoint, 9); t('bullish 2-2 structure stop', tr.structureStop, 7);

const bearish22=[
 {high:12,low:8,open:9,close:11},
 {high:13,low:9,open:10,close:12},
 {high:12.5,low:8.5,open:12,close:9}
];
s=detectSetup(bearish22); t('bearish 2-2 detection', {name:s.name,direction:s.direction,trigger:s.trigger}, {name:'2-2',direction:'BEARISH',trigger:9});
tr=calculateTrade(s,8.8); t('bearish 2-2 in force', tr.inForce, true); t('bearish 2-2 structure stop', tr.structureStop, 13);

const bullish212=[
 {high:13,low:9,open:10,close:12},
 {high:12,low:8,open:11,close:9},
 {high:11.5,low:8.5,open:9,close:10.5},
 {high:12,low:9,open:10.5,close:11.8}
];
s=detectSetup(bullish212); t('bullish 2-1-2 detection', {name:s.name,direction:s.direction,trigger:s.trigger,target:s.target}, {name:'2-1-2',direction:'BULLISH',trigger:11.5,target:12});

const bearish212=[
 {high:12,low:8,open:9,close:10},
 {high:13,low:9,open:10,close:12},
 {high:12.5,low:9.5,open:12,close:10.5},
 {high:12,low:9,open:10.5,close:9.2}
];
s=detectSetup(bearish212); t('bearish 2-1-2 detection', {name:s.name,direction:s.direction,trigger:s.trigger,target:s.target}, {name:'2-1-2',direction:'BEARISH',trigger:9.5,target:9});

const bullish312=[
 {high:10,low:6,open:7,close:9},
 {high:11,low:5,open:9,close:6},
 {high:10.5,low:5.5,open:6,close:9},
 {high:10.8,low:6,open:9,close:10.7}
];
s=detectSetup(bullish312); t('bullish 3-1-2 detection', {name:s.name,direction:s.direction}, {name:'3-1-2',direction:'BULLISH'});

const pending=[
 {high:10,low:6,open:7,close:9},
 {high:9.5,low:6.5,open:9,close:8},
 {high:9.4,low:6.6,open:8,close:8.5}
];
s=detectSetup(pending); t('pending inside break', {name:s.name,direction:s.direction}, {name:'INSIDE BREAK PENDING',direction:'BOTH'});

t('time exhaustion low', timeExhaustion(42), 'LOW');
t('time exhaustion medium', timeExhaustion(65), 'MEDIUM');
t('time exhaustion high', timeExhaustion(90), 'HIGH');

console.log(JSON.stringify({pass,fail,results},null,2));
process.exit(fail?1:0);
