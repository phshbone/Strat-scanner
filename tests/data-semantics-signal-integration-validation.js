"use strict";

const d=require("../data-semantics.js");
const {setupToSignal}=require("../setup-signal-adapter.js");

let pass=0,fail=0; const failures=[];
function t(name,actual,expected){
  const ok=JSON.stringify(actual)===JSON.stringify(expected);
  if(ok) pass++; else {fail++; failures.push({name,actual,expected});}
}

const meta={
  symbol:"SPY",
  timeframe:"60",
  marketTimezone:"America/New_York",
  session:"REGULAR",
  extendedHoursIncluded:false,
  barAnchor:"SESSION_OPEN",
  barAnchorOffsetMinutes:0,
  provider:"TestFeed",
  providerAggregation:"60m-from-09:30-session-anchor",
  periodOpenId:"SPY|60|2026-08-19|RTH|09:30",
  periodOpenTimestamp:"2026-08-19T09:30:00-04:00"
};

const semantics=d.validateDataSemantics(meta).semantics;
const semanticKey=d.buildSemanticKey(meta);

const signal=setupToSignal({
  name:"2-2 BULLISH",
  direction:"BULLISH",
  trigger:101,
  magnitude:104
},{
  timeframe:"60",
  signalStartsAt:"2026-08-19T09:30:00-04:00",
  signalExpiresAt:"2026-08-19T10:30:00-04:00",
  dataSemantics:semantics,
  semanticKey
});

t("signal created",!!signal,true);
t("signal preserves normalized timeframe",signal.timeframe,"60");
t("signal preserves semantic key",signal.semanticKey,semanticKey);
t("signal preserves market timezone",signal.dataSemantics.marketTimezone,"America/New_York");
t("signal preserves session",signal.dataSemantics.session,"REGULAR");
t("signal preserves anchor",signal.dataSemantics.barAnchor,"SESSION_OPEN");
t("signal preserves provider aggregation",signal.dataSemantics.providerAggregation,"60m-from-09:30-session-anchor");
t("signal preserves period identity",signal.dataSemantics.periodOpenId,"SPY|60|2026-08-19|RTH|09:30");
t("setup magnitude unchanged",signal.magnitude,104);
t("setup trigger unchanged",signal.trigger,101);

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
