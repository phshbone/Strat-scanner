const {createPaperPosition, markPaperPosition, paperPositionMetrics, closePaperPosition} = require('../paper-position.js');

let pass=0, fail=0;
function t(name, actual, expected){
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if(ok) pass++; else { fail++; console.log('FAIL',name,{actual,expected}); }
}

let p = createPaperPosition({symbol:'SPY',direction:'LONG',quantity:1,entryPrice:100,stop:95,target:110,entryTime:'2026-01-01T10:00:00Z'});
p = markPaperPosition(p,103,'2026-01-01T10:05:00Z');
p = markPaperPosition(p,98,'2026-01-01T10:10:00Z');
t('long open metrics', paperPositionMetrics(p), {markPrice:98,perShare:-2,pnl:-2,returnPct:-2,rMultiple:-0.4,mfePerShare:3,maePerShare:-2,mfe:3,mae:-2});
p = closePaperPosition(p,108,'2026-01-01T11:00:00Z');
t('long close status', p.status, 'CLOSED');
t('long close metrics', paperPositionMetrics(p), {markPrice:108,perShare:8,pnl:8,returnPct:8,rMultiple:1.6,mfePerShare:8,maePerShare:-2,mfe:8,mae:-2});

let s = createPaperPosition({symbol:'QQQ',direction:'BEARISH',quantity:2,entryPrice:200,stop:205,entryTime:'2026-01-01T10:00:00Z'});
s = markPaperPosition(s,196,'2026-01-01T10:03:00Z');
s = markPaperPosition(s,202,'2026-01-01T10:06:00Z');
t('short open metrics', paperPositionMetrics(s), {markPrice:202,perShare:-2,pnl:-4,returnPct:-1,rMultiple:-0.4,mfePerShare:4,maePerShare:-2,mfe:8,mae:-4});
s = closePaperPosition(s,190,'2026-01-01T10:20:00Z');
t('short close metrics', paperPositionMetrics(s), {markPrice:190,perShare:10,pnl:20,returnPct:5,rMultiple:2,mfePerShare:10,maePerShare:-2,mfe:20,mae:-4});

console.log(JSON.stringify({pass,fail},null,2));
process.exit(fail?1:0);
