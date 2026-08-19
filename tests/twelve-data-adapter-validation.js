"use strict";

const td=require("../providers/twelve-data.js");
const adapter=require("../market-data-adapter.js");

let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok)pass++; else {fail++; failures.push({name,actual,expected});}}

const url=new URL(td.buildTimeSeriesUrl({apiKey:"KEY",symbol:"spy",timeframe:"60",startDate:"2026-08-01",endDate:"2026-08-02",outputsize:250}));
t("symbol normalized",url.searchParams.get("symbol"),"SPY");
t("60 maps to 1h",url.searchParams.get("interval"),"1h");
t("intraday explicitly UTC",url.searchParams.get("timezone"),"UTC");
t("ascending provider order requested",url.searchParams.get("order"),"ASC");
t("outputsize retained",url.searchParams.get("outputsize"),"250");

const dailyUrl=new URL(td.buildTimeSeriesUrl({apiKey:"KEY",symbol:"SPY",timeframe:"D",outputsize:100}));
t("daily maps to 1day",dailyUrl.searchParams.get("interval"),"1day");
t("daily does not force timezone",dailyUrl.searchParams.has("timezone"),false);

let threw=false; try{td.buildTimeSeriesUrl({apiKey:"KEY",symbol:"SPY",timeframe:"2"});}catch(e){threw=true;} t("unsupported timeframe rejected",threw,true);
threw=false; try{td.buildTimeSeriesUrl({apiKey:"KEY",symbol:"SPY",timeframe:"D",outputsize:5001});}catch(e){threw=true;} t("outputsize above provider limit rejected",threw,true);

const payload={
  meta:{symbol:"SPY",interval:"1h",exchange:"NYSE",timezone:"UTC"},
  values:[
    {datetime:"2026-08-19 14:30:00",open:"101",high:"103",low:"100",close:"102",volume:"1200"},
    {datetime:"2026-08-19 13:30:00",open:"100",high:"102",low:"99",close:"101",volume:"1000"}
  ]
};
const bars=td.normalizeValues(payload,{timeframe:"60"});
t("provider rows sorted ascending",bars.map(x=>x.datetime),["2026-08-19 13:30:00","2026-08-19 14:30:00"]);
t("OHLC normalized numeric",[bars[0].open,bars[0].high,bars[0].low,bars[0].close],[100,102,99,101]);
t("volume normalized numeric",bars[0].volume,1000);
t("provider provenance retained",bars[0].provider,"TWELVE_DATA");

const semanticBars=adapter.normalizeProviderBars({
  bars,
  symbol:"SPY",
  timeframe:"60",
  marketTimezone:"America/New_York",
  session:"REGULAR",
  provider:"TWELVE_DATA",
  providerAggregation:"TWELVE_DATA_NATIVE_1H_UTC_OUTPUT",
  barAnchor:"PROVIDER_NATIVE",
  barAnchorOffsetMinutes:0,
  periodResolver:({bar})=>({
    periodOpenId:`SPY|60|${bar.datetime.slice(0,10)}|RTH`,
    periodOpenTimestamp:`${bar.datetime.slice(0,10)}T09:30:00-04:00`,
    barOpenTimestamp:bar.datetime.replace(" ","T")+"Z",
    barCloseTimestamp:null
  })
});
t("semantic bars created",semanticBars.length,2);
t("semantic provider retained",semanticBars[0].semantics.provider,"TWELVE_DATA");
t("semantic timeframe retained",semanticBars[0].semantics.timeframe,"60");
t("semantic key generated",typeof semanticBars[0].semanticKey,"string");

const incompatible=semanticBars.map(x=>({...x,semantics:{...x.semantics,barAnchor:"DIFFERENT"}}));
t("series semantic mismatch detected",adapter.compareSeriesSemantics(semanticBars,incompatible).comparable,false);

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
