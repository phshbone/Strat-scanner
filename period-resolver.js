"use strict";

const SUPPORTED_MARKET_TIMEZONE="America/New_York";

function nonEmpty(v){ return typeof v==="string" && v.trim().length>0; }
function normalizeDateOnly(value){
  if(!nonEmpty(value)) return null;
  const raw=String(value).trim().slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw)?raw:null;
}

function localDateTimeToUtcIso({date,time="09:30",timeZone=SUPPORTED_MARKET_TIMEZONE}={}){
  const d=normalizeDateOnly(date);
  if(!d) throw new Error("valid YYYY-MM-DD date required");
  if(!/^\d{2}:\d{2}$/.test(String(time))) throw new Error("time must be HH:MM");

  const [year,month,day]=d.split("-").map(Number);
  const [hour,minute]=String(time).split(":").map(Number);
  const guess=Date.UTC(year,month-1,day,hour,minute,0,0);

  const formatter=new Intl.DateTimeFormat("en-US",{
    timeZone,
    year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",second:"2-digit",
    hourCycle:"h23"
  });

  function offsetAt(epoch){
    const parts=Object.fromEntries(formatter.formatToParts(new Date(epoch)).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
    const asUtc=Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second));
    return asUtc-epoch;
  }

  let offset=offsetAt(guess);
  let utc=guess-offset;
  const correctedOffset=offsetAt(utc);
  if(correctedOffset!==offset) utc=guess-correctedOffset;
  return new Date(utc).toISOString();
}

function resolveUsEquityDailyPeriod({bar,symbol,marketTimezone=SUPPORTED_MARKET_TIMEZONE,session="REGULAR"}={}){
  if(!bar) throw new Error("bar required");
  const date=normalizeDateOnly(bar.datetime || bar.rawDatetime || bar.time || bar.date);
  if(!date) throw new Error("daily bar requires provider calendar date");
  if(marketTimezone!==SUPPORTED_MARKET_TIMEZONE) throw new Error("daily resolver currently supports America/New_York only");
  if(session!=="REGULAR") throw new Error("daily resolver currently supports REGULAR session only");

  const sym=String(symbol || bar.symbol || "").trim().toUpperCase();
  if(!sym) throw new Error("symbol required");

  const periodOpenTimestamp=localDateTimeToUtcIso({date,time:"09:30",timeZone:marketTimezone});
  return {
    periodOpenId:`${sym}|D|${date}|REGULAR`,
    periodOpenTimestamp,
    barOpenTimestamp:periodOpenTimestamp,
    barCloseTimestamp:null,
    calendarDate:date,
    resolver:"US_EQUITY_DAILY_RTH"
  };
}

function createUsEquityPeriodResolver({timeframe="D"}={}){
  const tf=String(timeframe||"").trim().toUpperCase();
  if(tf!=="D") throw new Error("only Daily period resolution is production-enabled in v0.1");
  return args=>resolveUsEquityDailyPeriod(args);
}

module.exports={
  SUPPORTED_MARKET_TIMEZONE,
  normalizeDateOnly,
  localDateTimeToUtcIso,
  resolveUsEquityDailyPeriod,
  createUsEquityPeriodResolver
};
