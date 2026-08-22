"use strict";

const watch=require("../chart-live-watch.js");
let pass=0,fail=0;
function check(name,condition){if(condition){pass++;console.log(`PASS ${pass}: ${name}`);}else{fail++;console.error(`FAIL: ${name}`);}}

check("watch cadence is controlled at 15 seconds",watch.WATCH_INTERVAL_MS===15000);
check("watch live is limited to validated intraday timeframes",JSON.stringify(watch.SUPPORTED_TFS)===JSON.stringify(["5","15","30"]));

const target=watch.normalizeWatchTarget({candidate:{symbol:"spy",timeframe:"15"}});
check("watch target normalizes symbol",target.symbol==="SPY");
check("watch target retains timeframe",target.timeframe==="15");
check("same target comparison is case-insensitive",watch.sameTarget(target,{symbol:"spy",timeframe:"15"})===true);
check("different timeframe is a different watch target",watch.sameTarget(target,{symbol:"SPY",timeframe:"30"})===false);
check("budget copy states one symbol",/One symbol/.test(watch.watchBudgetText()));
check("budget copy states polling cadence",/15s polling request/.test(watch.watchBudgetText()));
check("budget copy states higher panels are local",/local aggregation/.test(watch.watchBudgetText()));

let badTf=false;
try{watch.normalizeWatchTarget({candidate:{symbol:"SPY",timeframe:"60"}});}catch(error){badTf=/5m, 15m, or 30m/.test(error.message);}
check("60m watch remains blocked",badTf);

let missingSymbol=false;
try{watch.normalizeWatchTarget({candidate:{timeframe:"15"}});}catch(error){missingSymbol=/symbol required/.test(error.message);}
check("missing watch symbol is rejected",missingSymbol);

console.log(JSON.stringify({pass,fail,failures:fail}));
if(fail) process.exit(1);
