"use strict";

const SUPPORTED_MARKET_TIMEZONE="America/New_York";
const INTRADAY_MINUTES={"5":5,"15":15,"30":30};

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

function zonedParts(epoch,timeZone=SUPPORTED_MARKET_TIMEZONE){
  const formatter=new Intl.DateTimeFormat("en-US",{
    timeZone,
    year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",second:"2-digit",
    hourCycle:"h23"
  });
  return Object.fromEntries(formatter.formatToParts(new Date(epoch)).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
}

function parseProviderUtcTimestamp(value){
  if(!nonEmpty(value)) throw new Error("intraday bar requires provider UTC timestamp");
  const raw=String(value).trim();
  let iso=raw;
  if(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(raw)) iso=raw.replace(" ","T")+(raw.length===16?":00Z":"Z");
  else if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(raw)) iso=raw+(raw.length===16?":00Z":"Z");
  const epoch=Date.parse(iso);
  if(!Number.isFinite(epoch)) throw new Error("intraday bar timestamp must be parseable UTC");
  return epoch;
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

function resolveUsEquityIntradayPeriod({bar,symbol,timeframe,marketTimezone=SUPPORTED_MARKET_TIMEZONE,session="REGULAR"}={}){
  if(!bar) throw new Error("bar required");
  const tf=String(timeframe || bar.timeframe || "").trim().toUpperCase();
  const intervalMinutes=INTRADAY_MINUTES[tf];
  if(!intervalMinutes) throw new Error("intraday resolver production-enabled only for 5/15/30; 60 remains unverified");
  if(marketTimezone!==SUPPORTED_MARKET_TIMEZONE) throw new Error("intraday resolver currently supports America/New_York only");
  if(session!=="REGULAR") throw new Error("intraday resolver currently supports REGULAR session only");

  const sym=String(symbol || bar.symbol || "").trim().toUpperCase();
  if(!sym) throw new Error("symbol required");

  const epoch=parseProviderUtcTimestamp(bar.datetime || bar.rawDatetime || bar.time);
  const parts=zonedParts(epoch,marketTimezone);
  const date=`${parts.year}-${parts.month}-${parts.day}`;
  const hh=Number(parts.hour), mm=Number(parts.minute), ss=Number(parts.second);
  if(ss!==0) throw new Error("intraday bar open must be minute-aligned");
  const minuteOfDay=hh*60+mm;
  const rthOpen=9*60+30, rthClose=16*60;
  if(minuteOfDay<rthOpen || minuteOfDay>=rthClose) throw new Error("intraday bar open is outside regular session");
  const offsetFromOpen=minuteOfDay-rthOpen;
  if(offsetFromOpen%intervalMinutes!==0) throw new Error("intraday bar open is not aligned to 09:30 RTH anchor");

  const closeEpoch=epoch+intervalMinutes*60*1000;
  const closeParts=zonedParts(closeEpoch,marketTimezone);
  const closeMinuteOfDay=Number(closeParts.hour)*60+Number(closeParts.minute);
  if(`${closeParts.year}-${closeParts.month}-${closeParts.day}`!==date || closeMinuteOfDay>rthClose) throw new Error("intraday bar extends beyond regular session");

  const hhmm=`${parts.hour}:${parts.minute}`;
  const barOpenTimestamp=new Date(epoch).toISOString();
  return {
    periodOpenId:`${sym}|${tf}|${date}|REGULAR|${hhmm}`,
    periodOpenTimestamp:barOpenTimestamp,
    barOpenTimestamp,
    barCloseTimestamp:new Date(closeEpoch).toISOString(),
    calendarDate:date,
    intervalMinutes,
    anchorLocalTime:"09:30",
    anchorOffsetMinutes:offsetFromOpen,
    resolver:`US_EQUITY_${tf}M_RTH_0930_ANCHORED`
  };
}

function createUsEquityPeriodResolver({timeframe="D"}={}){
  const tf=String(timeframe||"").trim().toUpperCase();
  if(tf==="D") return args=>resolveUsEquityDailyPeriod(args);
  if(INTRADAY_MINUTES[tf]) return args=>resolveUsEquityIntradayPeriod({...args,timeframe:tf});
  if(tf==="60") throw new Error("60-minute resolver is intentionally disabled until provider/session anchoring is empirically verified");
  throw new Error("unsupported production timeframe resolver");
}

module.exports={
  SUPPORTED_MARKET_TIMEZONE,
  INTRADAY_MINUTES,
  normalizeDateOnly,
  localDateTimeToUtcIso,
  parseProviderUtcTimestamp,
  resolveUsEquityDailyPeriod,
  resolveUsEquityIntradayPeriod,
  createUsEquityPeriodResolver
};
