"use strict";

const p=require("../period-resolver.js");
let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}

t("date-only normalized",p.normalizeDateOnly("2026-08-20 00:00:00"),"2026-08-20");
t("invalid date rejected to null",p.normalizeDateOnly("08/20/2026"),null);

t("summer NY 09:30 -> 13:30Z",p.localDateTimeToUtcIso({date:"2026-08-20",time:"09:30"}),"2026-08-20T13:30:00.000Z");
t("winter NY 09:30 -> 14:30Z",p.localDateTimeToUtcIso({date:"2026-01-15",time:"09:30"}),"2026-01-15T14:30:00.000Z");

const daily=p.resolveUsEquityDailyPeriod({bar:{datetime:"2026-08-20",symbol:"SPY"},symbol:"SPY"});
t("daily period id",daily.periodOpenId,"SPY|D|2026-08-20|REGULAR");
t("daily open timestamp",daily.periodOpenTimestamp,"2026-08-20T13:30:00.000Z");
t("bar open follows period open",daily.barOpenTimestamp,daily.periodOpenTimestamp);
t("daily close intentionally not guessed",daily.barCloseTimestamp,null);
t("resolver provenance",daily.resolver,"US_EQUITY_DAILY_RTH");

let threw=false; try{p.resolveUsEquityDailyPeriod({bar:{datetime:"2026-08-20"},symbol:"SPY",session:"EXTENDED"});}catch(e){threw=true;} t("non-regular session rejected",threw,true);
threw=false; try{p.createUsEquityPeriodResolver({timeframe:"60"});}catch(e){threw=true;} t("intraday resolver not silently invented",threw,true);

const resolver=p.createUsEquityPeriodResolver({timeframe:"D"});
t("resolver factory works",resolver({bar:{datetime:"2026-08-20",symbol:"SPY"},symbol:"SPY"}).periodOpenId,"SPY|D|2026-08-20|REGULAR");

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
