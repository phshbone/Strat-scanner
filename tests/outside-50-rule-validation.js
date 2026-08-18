function midpoint(bar){ return (bar.high + bar.low) / 2; }

function outside50LiveState(previous, live, firstSideTaken, currentPrice){
  const mid = midpoint(previous);
  if(firstSideTaken === 'HIGH'){
    const qualifies = live.high > previous.high && currentPrice <= mid;
    return {
      direction: qualifies ? 'BEARISH' : 'NONE',
      threshold: mid,
      target: previous.low,
      qualifies
    };
  }
  if(firstSideTaken === 'LOW'){
    const qualifies = live.low < previous.low && currentPrice >= mid;
    return {
      direction: qualifies ? 'BULLISH' : 'NONE',
      threshold: mid,
      target: previous.high,
      qualifies
    };
  }
  return {direction:'UNKNOWN',threshold:mid,target:null,qualifies:false};
}

function outside50ReplayCross(previous, lowerTfBar, firstSideTaken){
  const mid = midpoint(previous);
  if(firstSideTaken === 'HIGH') return lowerTfBar.low <= mid;
  if(firstSideTaken === 'LOW') return lowerTfBar.high >= mid;
  return false;
}

// Explicit operational status model.
// INVALID: no failed-two condition yet.
// STANDBY: one side taken and current price has failed back into the prior range, but 50% not crossed.
// ACTIVE: failed two + 50% threshold crossed; opposite side is the outside-bar target.
// COMPLETE: both sides of the previous candle have been taken.
function outside50Status(previous, live, firstSideTaken, currentPrice){
  const mid = midpoint(previous);
  const tookHigh = live.high > previous.high;
  const tookLow = live.low < previous.low;

  if(tookHigh && tookLow){
    return {status:'COMPLETE', direction:'OUTSIDE', threshold:mid, target:null};
  }

  if(firstSideTaken === 'HIGH' && tookHigh){
    // Failure back into prior range occurs once live price is below prior high.
    if(currentPrice >= previous.high) return {status:'INVALID', direction:'NONE', threshold:mid, target:previous.low};
    if(currentPrice <= mid) return {status:'ACTIVE', direction:'BEARISH', threshold:mid, target:previous.low};
    return {status:'STANDBY', direction:'BEARISH', threshold:mid, target:previous.low};
  }

  if(firstSideTaken === 'LOW' && tookLow){
    // Failure back into prior range occurs once live price is above prior low.
    if(currentPrice <= previous.low) return {status:'INVALID', direction:'NONE', threshold:mid, target:previous.high};
    if(currentPrice >= mid) return {status:'ACTIVE', direction:'BULLISH', threshold:mid, target:previous.high};
    return {status:'STANDBY', direction:'BULLISH', threshold:mid, target:previous.high};
  }

  return {status:'INVALID', direction:'NONE', threshold:mid, target:null};
}

function timeExhaustion(progressPct){
  const p = Math.max(0,Math.min(100,Number(progressPct)||0));
  if(p < 50) return 'LOW';
  if(p <= 80) return 'MEDIUM';
  return 'HIGH';
}

let pass=0, fail=0;
function t(name, actual, expected){
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if(ok) pass++; else fail++;
  console.log(`${ok?'PASS':'FAIL'} ${name}`);
  if(!ok) console.log({actual,expected});
}

const prior={high:110,low:90}; // midpoint 100

t('bearish outside-50 qualifies after high taken then LIVE PRICE retraces',
  outside50LiveState(prior,{high:112,low:97},'HIGH',99),
  {direction:'BEARISH',threshold:100,target:90,qualifies:true});

t('bearish outside-50 does not qualify before live price reaches midpoint',
  outside50LiveState(prior,{high:112,low:101},'HIGH',101),
  {direction:'NONE',threshold:100,target:90,qualifies:false});

t('bullish outside-50 qualifies after low taken then LIVE PRICE retraces',
  outside50LiveState(prior,{high:103,low:88},'LOW',101),
  {direction:'BULLISH',threshold:100,target:110,qualifies:true});

t('bullish outside-50 does not qualify before live price reaches midpoint',
  outside50LiveState(prior,{high:99,low:88},'LOW',99),
  {direction:'NONE',threshold:100,target:110,qualifies:false});

// A candle close is NOT required. Historical lower-timeframe range can prove the level traded.
t('replay detects bearish midpoint touch even when lower-TF close would be back above midpoint',
  outside50ReplayCross(prior,{high:103,low:99,close:102},'HIGH'),
  true);

t('replay detects bullish midpoint touch even when lower-TF close would be back below midpoint',
  outside50ReplayCross(prior,{high:101,low:97,close:98},'LOW'),
  true);

// Explicit status progression: bearish failed 2U -> 50% -> outside.
t('SSS50 bearish invalid while still above prior high',
  outside50Status(prior,{high:112,low:108},'HIGH',111),
  {status:'INVALID',direction:'NONE',threshold:100,target:90});

t('SSS50 bearish standby after failed 2U but before 50%',
  outside50Status(prior,{high:112,low:104},'HIGH',105),
  {status:'STANDBY',direction:'BEARISH',threshold:100,target:90});

t('SSS50 bearish active after midpoint cross',
  outside50Status(prior,{high:112,low:99},'HIGH',99),
  {status:'ACTIVE',direction:'BEARISH',threshold:100,target:90});

t('SSS50 bearish complete after opposite side taken',
  outside50Status(prior,{high:112,low:89},'HIGH',95),
  {status:'COMPLETE',direction:'OUTSIDE',threshold:100,target:null});

// Bullish mirror.
t('SSS50 bullish invalid while still below prior low',
  outside50Status(prior,{high:92,low:88},'LOW',89),
  {status:'INVALID',direction:'NONE',threshold:100,target:110});

t('SSS50 bullish standby after failed 2D but before 50%',
  outside50Status(prior,{high:96,low:88},'LOW',95),
  {status:'STANDBY',direction:'BULLISH',threshold:100,target:110});

t('SSS50 bullish active after midpoint cross',
  outside50Status(prior,{high:101,low:88},'LOW',101),
  {status:'ACTIVE',direction:'BULLISH',threshold:100,target:110});

t('SSS50 bullish complete after opposite side taken',
  outside50Status(prior,{high:111,low:88},'LOW',105),
  {status:'COMPLETE',direction:'OUTSIDE',threshold:100,target:null});

t('time exhaustion still applies to outside-bar objective', timeExhaustion(90), 'HIGH');

// Historical OHLC caveat: if both sides are ultimately taken, higher-timeframe OHLC alone does not reveal which side traded first.
const historicalOutside={high:112,low:88,close:101};
t('sequence is unknown without lower-timeframe/intrabar path',
  outside50LiveState(prior,historicalOutside,null,101).direction,
  'UNKNOWN');

console.log(JSON.stringify({pass,fail},null,2));
process.exit(fail?1:0);
