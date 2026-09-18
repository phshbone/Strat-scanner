"use strict";

const assert=require("assert");
const job=require("../historical-dataset-job.js");

let pass=0;
function t(name,fn){fn();pass++;console.log("PASS "+pass+": "+name);}

const raw=[
  {open:415.19,high:415.86,low:412.02,close:415.00},
  {open:413.99,high:415.55,low:410.22,close:410.46},
  {open:407.74,high:412.29,low:407.60,close:411.10},
  {open:411.44,high:414.69,low:410.96,close:414.37},
  {open:416.05,high:418.92,low:414.44,close:418.01},
  {open:418.68,high:419.21,low:418.16,close:418.68},
  {open:418.86,high:420.07,low:418.49,close:419.55},
  {open:419.27,high:419.51,low:416.98,close:417.08}
];

const bars=raw.map((bar,index)=>{
  const minutes=570+index*15;
  const hh=String(Math.floor(minutes/60)).padStart(2,"0"),mm=String(minutes%60).padStart(2,"0");
  const iso="2026-01-02T"+hh+":"+mm+":00.000Z";
  return {...bar,datetime:iso,timeframe:"15",symbol:"SPY",semantics:{
    marketType:"US_EQUITY",timeframe:"15",marketTimezone:"America/New_York",session:"REGULAR",extendedHoursIncluded:false,
    barAnchor:"US_EQUITY_RTH_0930",barAnchorOffsetMinutes:index*15,provider:"TWELVE_DATA",providerAggregation:"15min",
    periodOpenId:"SPY|15|2026-01-02|REGULAR|"+hh+":"+mm,barOpenTimestamp:iso,barCloseTimestamp:iso
  }};
});

const series={symbol:"SPY",timeframe:"15",marketType:"US_EQUITY",interval:"15min",bars};
const dataset=job.buildHistoricalDataset(series,{stopModel:"MIDPOINT",horizonBars:5});

t("dataset preserves source metadata",()=>{assert.equal(dataset.symbol,"SPY");assert.equal(dataset.stopModel,"MIDPOINT");assert.equal(dataset.barsReceived,8);});
t("dataset extracts deterministic events",()=>assert.ok(dataset.events.length>=2));
t("event IDs include stop model",()=>assert.ok(dataset.events.every(e=>e.id.endsWith("|MIDPOINT"))));
t("historical events carry FTFC comparison field",()=>assert.ok(dataset.events.every(e=>typeof e.ftfcAlignment==="string")));
t("summary counts all extracted events",()=>assert.equal(dataset.summary.events,dataset.events.length));

const structure=job.buildHistoricalDataset(series,{stopModel:"STRUCTURE",horizonBars:5});
t("stop models produce distinct stable IDs",()=>{
  const a=dataset.events.find(e=>e.timestamp===structure.events[0]?.timestamp&&e.setup===structure.events[0]?.setup&&e.direction===structure.events[0]?.direction);
  if(a) assert.notEqual(a.id,structure.events[0].id);
});

const url=new URL(job.buildHistoricalProxyUrl({symbol:"SPY",timeframe:"15",outputsize:5000,startDate:"2025-01-01",endDate:"2025-12-31"}));
t("historical proxy URL includes bounded dates",()=>{assert.equal(url.searchParams.get("start_date"),"2025-01-01");assert.equal(url.searchParams.get("end_date"),"2025-12-31");});

const chunks=job.dateChunks("2026-07-01","2026-07-05",{chunkDays:2});
t("date chunks are contiguous and bounded",()=>assert.deepEqual(chunks,[
  {startDate:"2026-07-01",endDate:"2026-07-02"},
  {startDate:"2026-07-03",endDate:"2026-07-04"},
  {startDate:"2026-07-05",endDate:"2026-07-05"}
]));

const merged=job.mergeHistoricalSeries([
  {symbol:"SPY",timeframe:"15",marketType:"US_EQUITY",bars:[{datetime:"2026-07-01T13:30:00Z"},{datetime:"2026-07-01T13:45:00Z"}]},
  {symbol:"SPY",timeframe:"15",marketType:"US_EQUITY",bars:[{datetime:"2026-07-01T13:45:00Z"},{datetime:"2026-07-01T14:00:00Z"}]}
]);
t("range merge deduplicates overlapping bar timestamps",()=>assert.deepEqual(merged.bars.map(b=>b.datetime),[
  "2026-07-01T13:30:00Z","2026-07-01T13:45:00Z","2026-07-01T14:00:00Z"
]));

(async()=>{
  const calls=[];
  const fakeWriteFetch=async(url,options)=>{calls.push({url,options});return {ok:true,status:200,json:async()=>({written:JSON.parse(options.body).events.length})};};
  const result=await job.writeHistoricalDataset({proxyBase:"https://worker.example",dataset,token:"SECRET",importId:"fixture",fetchImpl:fakeWriteFetch,batchSize:1});
  t("writer batches through protected Worker endpoint",()=>{assert.equal(result.written,dataset.events.length);assert.equal(calls.length,dataset.events.length);});
  t("writer sends bearer token",()=>assert.equal(calls[0].options.headers.Authorization,"Bearer SECRET"));

  const rangeCalls=[];
  const fakeRangeFetch=async(requestUrl)=>{
    const u=new URL(requestUrl);
    rangeCalls.push(u);
    const date=u.searchParams.get("start_date");
    return {
      ok:true,
      status:200,
      json:async()=>({
        meta:{interval:"15min"},
        values:[
          {datetime:date+" 13:30:00",open:"100",high:"101",low:"99",close:"100.5"},
          {datetime:date+" 13:45:00",open:"100.5",high:"102",low:"100",close:"101"}
        ]
      })
    };
  };
  const ranged=await job.fetchHistoricalSeriesRange({
    proxyBase:"https://worker.example",
    symbol:"SPY",
    timeframe:"15",
    startDate:"2026-07-01",
    endDate:"2026-07-02",
    chunkDays:1,
    delayMs:0,
    fetchImpl:fakeRangeFetch
  });
  t("range fetch requests each bounded chunk",()=>assert.equal(rangeCalls.length,2));
  t("range fetch merges normalized bars",()=>{assert.equal(ranged.bars.length,4);assert.equal(ranged.range.chunksRequested,2);assert.equal(ranged.range.retryCount,0);});

  let retryAttempts=0;
  const fakeThrottleFetch=async(requestUrl)=>{
    retryAttempts+=1;
    if(retryAttempts===1) return {ok:false,status:429,json:async()=>({status:"error",message:"rate limit"})};
    const u=new URL(requestUrl);
    const date=u.searchParams.get("start_date");
    return {ok:true,status:200,json:async()=>({meta:{interval:"15min"},values:[
      {datetime:date+" 13:30:00",open:"100",high:"101",low:"99",close:"100.5"},
      {datetime:date+" 13:45:00",open:"100.5",high:"102",low:"100",close:"101"}
    ]})};
  };
  const retried=await job.fetchHistoricalSeriesRange({
    proxyBase:"https://worker.example",symbol:"SPY",timeframe:"15",
    startDate:"2026-07-01",endDate:"2026-07-01",
    chunkDays:1,delayMs:0,maxAttempts:2,retryBaseMs:0,fetchImpl:fakeThrottleFetch
  });
  t("range fetch retries provider 429",()=>{assert.equal(retryAttempts,2);assert.equal(retried.range.retryCount,1);assert.equal(retried.bars.length,2);});

  console.log("\n"+pass+"/"+pass+" PASS historical dataset job validation");
})().catch(error=>{console.error(error);process.exit(1);});
