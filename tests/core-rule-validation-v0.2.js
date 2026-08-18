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
function midpoint(bar){ return (bar.high + bar.low) / 2; }
function outside50State(previous, live, firstSideTaken){
  const mid = midpoint(previous);
  if(firstSideTaken === 'HIGH'){
    const qualifies = live.high > previous.high && live.close <= mid;
    return {direction: qualifies ? 'BEARISH' : 'NONE', threshold: mid, target: previous.low, qualifies};
  }
  if(firstSideTaken === 'LOW'){
    const qualifies = live.low < previous.low && live.close >= mid;
    return {direction: qualifies ? 'BULLISH' : 'NONE', threshold: mid, target: previous.high, qualifies};
  }
  return {direction:'UNKNOWN',threshold:mid,target:null,qualifies:false};
}
function exhaustionSequence({targetsRemaining, opposingReversal, outside50Confirmed, outsideTargetHit}){
  if(outsideTargetHit) return 'OUTSIDE_TARGET_HIT';
  if(outside50Confirmed) return 'OUTSIDE_TARGET_ACTIVE';
  if(targetsRemaining===0 && opposingReversal) return 'EXHAUSTION_REVERSAL';
  if(targetsRemaining===0) return 'EXHAUSTION_ACTIVE';
  return 'TARGETS_REMAIN';
}

let pass=0, fail=0; const failures=[];
function t(name, actual, expected){ const ok=JSON.stringify(actual)===JSON.stringify(expected); ok?pass++:fail++; if(!ok) failures.push({name,actual,expected}); }

const prior={high:10,low:5};
[
  ['inside normal',{high:9,low:6},'1'],
  ['inside equal high',{high:10,low:6},'1'],
  ['inside equal low',{high:9,low:5},'1'],
  ['inside exact same range',{high:10,low:5},'1'],
  ['2U normal',{high:11,low:6},'2U'],
  ['2U equal prior low',{high:11,low:5},'2U'],
  ['2D normal',{high:9,low:4},'2D'],
  ['2D equal prior high',{high:10,low:4},'2D'],
  ['outside 3',{high:11,low:4},'3']
].forEach(([name,curr,exp])=>t(name,classifyBar(curr,prior),exp));

t('FTFC 4/4 bull', calcFTFC([{open:1,price:2},{open:2,price:3},{open:3,price:4},{open:4,price:5}]).label, '4/4 BULLISH');
t('FTFC 3/5 bear', calcFTFC([{open:2,price:1},{open:3,price:2},{open:4,price:3},{open:1,price:2},{open:5,price:5}]).label, '3/5 BEARISH');
t('FTFC tie is mixed', calcFTFC([{open:1,price:2},{open:2,price:1},{open:3,price:3},{open:4,price:4}]).dir, 'MIXED');

let bars=[{high:12,low:8},{high:11,low:7},{high:12,low:7.5}];
let s=detectSetup(bars); t('bullish 2-2',{name:s.name,direction:s.direction,trigger:s.trigger},{name:'2-2',direction:'BULLISH',trigger:11});
let tr=calculateTrade(s,11.5); t('bullish 2-2 in force',tr.inForce,true); t('bullish midpoint stop',tr.midpoint,9); t('bullish structure stop',tr.structureStop,7); t('bullish out of force at trigger',calculateTrade(s,11).inForce,false);

bars=[{high:12,low:8},{high:13,low:9},{high:12.5,low:8.5}];
s=detectSetup(bars); t('bearish 2-2',{name:s.name,direction:s.direction,trigger:s.trigger},{name:'2-2',direction:'BEARISH',trigger:9});
t('bearish out of force at trigger',calculateTrade(s,9).inForce,false);

bars=[{high:13,low:9},{high:12,low:8},{high:11.5,low:8.5},{high:12,low:9}];
s=detectSetup(bars); t('bullish 2-1-2',{name:s.name,direction:s.direction,trigger:s.trigger,target:s.target},{name:'2-1-2',direction:'BULLISH',trigger:11.5,target:12});
bars=[{high:12,low:8},{high:13,low:9},{high:12.5,low:9.5},{high:12,low:9}];
s=detectSetup(bars); t('bearish 2-1-2',{name:s.name,direction:s.direction,trigger:s.trigger,target:s.target},{name:'2-1-2',direction:'BEARISH',trigger:9.5,target:9});
bars=[{high:10,low:6},{high:11,low:5},{high:10.5,low:5.5},{high:10.8,low:6}];
s=detectSetup(bars); t('bullish 3-1-2',{name:s.name,direction:s.direction},{name:'3-1-2',direction:'BULLISH'});
bars=[{high:10,low:6},{high:11,low:5},{high:10.5,low:5.5},{high:10,low:5.2}];
s=detectSetup(bars); t('bearish 3-1-2',{name:s.name,direction:s.direction},{name:'3-1-2',direction:'BEARISH'});

bars=[{high:10,low:6},{high:9.5,low:6.5},{high:9.4,low:6.6}];
s=detectSetup(bars); t('inside pending',{name:s.name,direction:s.direction,triggerUp:s.triggerUp,triggerDown:s.triggerDown},{name:'INSIDE BREAK PENDING',direction:'BOTH',triggerUp:9.5,triggerDown:6.5});

bars=[{high:12,low:8},{high:11,low:7},{high:12,low:7.5}]; s=detectSetup(bars);
t('bullish target hit at equality',calculateTrade(s,12).targetHit,true);
bars=[{high:12,low:8},{high:13,low:9},{high:12.5,low:8.5}]; s=detectSetup(bars);
t('bearish target hit at equality',calculateTrade(s,8).targetHit,true);

[[0,'LOW'],[49.99,'LOW'],[50,'MEDIUM'],[80,'MEDIUM'],[80.01,'HIGH'],[100,'HIGH'],[130,'HIGH'],[-5,'LOW']].forEach(([p,e])=>t(`time ${p}`,timeExhaustion(p),e));

const p50={high:110,low:90};
t('outside50 bearish confirm',outside50State(p50,{high:112,low:97,close:100},'HIGH'),{direction:'BEARISH',threshold:100,target:90,qualifies:true});
t('outside50 bearish not yet',outside50State(p50,{high:112,low:101,close:101},'HIGH'),{direction:'NONE',threshold:100,target:90,qualifies:false});
t('outside50 bullish confirm',outside50State(p50,{high:103,low:88,close:100},'LOW'),{direction:'BULLISH',threshold:100,target:110,qualifies:true});
t('outside50 bullish not yet',outside50State(p50,{high:99,low:88,close:99},'LOW'),{direction:'NONE',threshold:100,target:110,qualifies:false});
t('outside50 sequence unknown from OHLC',outside50State(p50,{high:112,low:88,close:101},null).direction,'UNKNOWN');

t('targets remain',exhaustionSequence({targetsRemaining:2,opposingReversal:false,outside50Confirmed:false,outsideTargetHit:false}),'TARGETS_REMAIN');
t('exhaustion active',exhaustionSequence({targetsRemaining:0,opposingReversal:false,outside50Confirmed:false,outsideTargetHit:false}),'EXHAUSTION_ACTIVE');
t('exhaustion reversal',exhaustionSequence({targetsRemaining:0,opposingReversal:true,outside50Confirmed:false,outsideTargetHit:false}),'EXHAUSTION_REVERSAL');
t('outside target active',exhaustionSequence({targetsRemaining:0,opposingReversal:true,outside50Confirmed:true,outsideTargetHit:false}),'OUTSIDE_TARGET_ACTIVE');
t('outside target hit',exhaustionSequence({targetsRemaining:0,opposingReversal:true,outside50Confirmed:true,outsideTargetHit:true}),'OUTSIDE_TARGET_HIT');

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
