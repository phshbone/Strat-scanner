// Real-market validation fixture: SPY September 2021 potential outside month.
// Data basis: StatMuse adjusted historical OHLC, retrieved 2026-08-18.
// This validates rule geometry/sequence, not profitability.

function midpoint(bar){ return (bar.high + bar.low) / 2; }
function assert(name, condition){
  if(!condition) throw new Error(`FAIL: ${name}`);
  console.log(`PASS ${name}`);
}

const august2021 = {
  high: 423.44, // Aug 30 adjusted high
  low: 407.58   // Aug 3 adjusted low
};

const septemberDaily = [
  {date:'2021-09-02', high:424.36, low:422.36, close:423.55},
  {date:'2021-09-13', high:419.56, low:415.07, close:417.38},
  {date:'2021-09-20', high:409.32, low:402.10, close:406.96}
];

const mid = midpoint(august2021); // 415.51
const target = august2021.low;

assert('prior midpoint is 415.51', Math.abs(mid - 415.51) < 1e-9);
assert('September took August high first', septemberDaily[0].high > august2021.high);
assert('September 13 range traded through the 50% midpoint', septemberDaily[1].low <= mid);
assert('September 13 close was back above midpoint (close confirmation is NOT required)', septemberDaily[1].close > mid);
assert('bearish outside target is prior-month low', target === 407.58);
assert('September 20 reached/took prior-month low target', septemberDaily[2].low <= target);

console.log(JSON.stringify({
  symbol:'SPY',
  thesisTimeframe:'MONTH',
  priorMonth:'2021-08',
  liveMonth:'2021-09',
  priorHigh:august2021.high,
  priorLow:august2021.low,
  midpoint:mid,
  firstSideTaken:'HIGH',
  firstSideObserved:'2021-09-02',
  midpointCrossObserved:'2021-09-13',
  direction:'BEARISH',
  target,
  targetHitObserved:'2021-09-20',
  sequenceResolution:'DAILY_BARS',
  note:'Daily bars establish event ordering across dates. Exact intraday timestamps require finer data.'
},null,2));
