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

const five=p.resolveUsEquityIntradayPeriod({bar:{datetime:"2026-08-20 13:30:00",symbol:"SPY"},symbol:"SPY",timeframe:"5"});
t("5m first bar id",five.periodOpenId,"SPY|5|2026-08-20|REGULAR|09:30");
t("5m first bar close",five.barCloseTimestamp,"2026-08-20T13:35:00.000Z");
t("5m anchor offset",five.anchorOffsetMinutes,0);

const fifteen=p.resolveUsEquityIntradayPeriod({bar:{datetime:"2026-08-20 14:45:00",symbol:"SPY"},symbol:"SPY",timeframe:"15"});
t("15m local 10:45 id",fifteen.periodOpenId,"SPY|15|2026-08-20|REGULAR|10:45");
t("15m anchor offset",fifteen.anchorOffsetMinutes,75);

const thirtyLast=p.resolveUsEquityIntradayPeriod({bar:{datetime:"2026-08-20 19:30:00",symbol:"SPY"},symbol:"SPY",timeframe:"30"});
t("30m last RTH closes 16",thirtyLast.barCloseTimestamp,"2026-08-20T20:00:00.000Z");

const winter=p.resolveUsEquityIntradayPeriod({bar:{datetime:"2026-01-15 14:30:00",symbol:"SPY"},symbol:"SPY",timeframe:"15"});
t("winter 14:30Z is 09:30",winter.periodOpenId,"SPY|15|2026-01-15|REGULAR|09:30");

threw=false; try{p.resolveUsEquityIntradayPeriod({bar:{datetime:"2026-08-20 13:35:00"},symbol:"SPY",timeframe:"15"});}catch(e){threw=true;} t("misaligned 15 rejected",threw,true);
threw=false; try{p.resolveUsEquityIntradayPeriod({bar:{datetime:"2026-08-20 13:25:00"},symbol:"SPY",timeframe:"5"});}catch(e){threw=true;} t("premarket rejected",threw,true);
threw=false; try{p.createUsEquityPeriodResolver({timeframe:"60"});}catch(e){threw=true;} t("60 remains disabled",threw,true);

const dailyResolver=p.createUsEquityPeriodResolver({timeframe:"D"});
t("daily resolver factory",dailyResolver({bar:{datetime:"2026-08-20",symbol:"SPY"},symbol:"SPY"}).periodOpenId,"SPY|D|2026-08-20|REGULAR");
const intradayResolver=p.createUsEquityPeriodResolver({timeframe:"15"});
t("15m resolver factory",intradayResolver({bar:{datetime:"2026-08-20 13:30:00",symbol:"SPY"},symbol:"SPY"}).periodOpenId,"SPY|15|2026-08-20|REGULAR|09:30");

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
