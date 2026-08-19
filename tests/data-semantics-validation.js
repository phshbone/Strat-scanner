"use strict";

const d=require("../data-semantics.js");
let pass=0,fail=0; const failures=[];
function t(name,actual,expected){
  const ok=JSON.stringify(actual)===JSON.stringify(expected);
  if(ok) pass++; else {fail++; failures.push({name,actual,expected});}
}

const base={
  symbol:"spy",
  timeframe:"60m",
  marketTimezone:"America/New_York",
  session:"RTH",
  extendedHoursIncluded:false,
  barAnchor:"SESSION_OPEN",
  barAnchorOffsetMinutes:0,
  provider:"ExampleFeed",
  providerAggregation:"top-of-hour-from-09:30-session-anchor",
  periodOpenId:"SPY|60|2026-08-19|RTH|09:30",
  periodOpenTimestamp:"2026-08-19T09:30:00-04:00",
  barOpenTimestamp:"2026-08-19T09:30:00-04:00",
  barCloseTimestamp:"2026-08-19T10:30:00-04:00"
};

let n=d.normalizeDataSemantics(base);
t("symbol normalized uppercase",n.symbol,"SPY");
t("timeframe alias normalized",n.timeframe,"60");
t("session alias normalized",n.session,"REGULAR");
t("offset numeric",n.barAnchorOffsetMinutes,0);
t("period timestamp normalized",n.periodOpenTimestamp,"2026-08-19T13:30:00.000Z");

let v=d.validateDataSemantics(base);
t("complete semantics valid",v.valid,true);
t("complete semantics no errors",v.errors,[]);

t("invalid timeframe rejected",d.validateDataSemantics({...base,timeframe:"7m"}).valid,false);
t("missing timezone rejected",d.validateDataSemantics({...base,marketTimezone:null}).valid,false);
t("missing anchor rejected",d.validateDataSemantics({...base,barAnchor:null}).valid,false);
t("missing provider rejected",d.validateDataSemantics({...base,provider:null}).valid,false);
t("missing period identity rejected",d.validateDataSemantics({...base,periodOpenId:null}).valid,false);
t("bad bar chronology rejected",d.validateDataSemantics({...base,barCloseTimestamp:base.barOpenTimestamp}).valid,false);

const key=d.buildSemanticKey(base);
t("semantic key includes normalized timeframe",key.includes("SPY|60|America/New_York|REGULAR"),true);
t("semantic key includes provider aggregation",key.includes("top-of-hour-from-09:30-session-anchor"),true);

let cmp=d.comparableSemantics(base,{...base,provider:"OtherFeed"});
t("different provider name alone remains comparable",cmp.comparable,true);

cmp=d.comparableSemantics(base,{...base,providerAggregation:"clock-hour-bars"});
t("different aggregation not comparable",cmp.comparable,false);
t("aggregation mismatch identified",cmp.mismatches.map(x=>x.field),["providerAggregation"]);

cmp=d.comparableSemantics(base,{...base,barAnchorOffsetMinutes:30});
t("different anchor offset not comparable",cmp.comparable,false);

cmp=d.comparableSemantics(base,{...base,periodOpenId:"different-period"});
t("different period identity not comparable",cmp.comparable,false);

const bar=d.attachSemanticsToBar({open:100,high:102,low:99,close:101,volume:12345},base);
t("bar keeps numeric OHLC",[bar.open,bar.high,bar.low,bar.close],[100,102,99,101]);
t("bar stores semantics",bar.semantics.timeframe,"60");
t("bar stores semantic key",typeof bar.semanticKey,"string");

try{ d.attachSemanticsToBar({open:100,high:102,low:99,close:"bad"},base); t("bad OHLC rejected",false,true); }
catch(e){ t("bad OHLC rejected",true,true); }

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
