function midpoint(bar){ return (bar.high + bar.low) / 2; }

function outside50State(previous, live, firstSideTaken){
  const mid = midpoint(previous);
  if(firstSideTaken === 'HIGH'){
    return {
      direction: live.close <= mid ? 'BEARISH' : 'NONE',
      threshold: mid,
      target: previous.low,
      qualifies: live.high > previous.high && live.close <= mid
    };
  }
  if(firstSideTaken === 'LOW'){
    return {
      direction: live.close >= mid ? 'BULLISH' : 'NONE',
      threshold: mid,
      target: previous.high,
      qualifies: live.low < previous.low && live.close >= mid
    };
  }
  return {direction:'UNKNOWN',threshold:mid,target:null,qualifies:false};
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

t('bearish outside-50 qualifies after high taken then retrace',
  outside50State(prior,{high:112,low:97,close:99},'HIGH'),
  {direction:'BEARISH',threshold:100,target:90,qualifies:true});

t('bearish outside-50 does not qualify before midpoint retrace',
  outside50State(prior,{high:112,low:101,close:101},'HIGH'),
  {direction:'NONE',threshold:100,target:90,qualifies:false});

t('bullish outside-50 qualifies after low taken then retrace',
  outside50State(prior,{high:103,low:88,close:101},'LOW'),
  {direction:'BULLISH',threshold:100,target:110,qualifies:true});

t('bullish outside-50 does not qualify before midpoint retrace',
  outside50State(prior,{high:99,low:88,close:99},'LOW'),
  {direction:'NONE',threshold:100,target:110,qualifies:false});

t('time exhaustion still applies to outside-bar objective', timeExhaustion(90), 'HIGH');

// Historical OHLC caveat: if both sides are ultimately taken, OHLC alone does not reveal which side traded first.
const historicalOutside={high:112,low:88,close:101};
t('sequence is unknown without lower-timeframe/intrabar path',
  outside50State(prior,historicalOutside,null).direction,
  'UNKNOWN');

console.log(JSON.stringify({pass,fail},null,2));
process.exit(fail?1:0);
