"use strict";

const td=require("../providers/twelve-data.js");
const adapter=require("../market-data-adapter.js");
const period=require("../period-resolver.js");
const core=require("../core-engine-v0.3.js");

const ENDPOINT="https://thestrat.phshbone.workers.dev/time-series?symbol=SPY&interval=1day&outputsize=120";

async function main(){
  const response=await fetch(ENDPOINT,{headers:{Accept:"application/json"}});
  if(!response.ok) throw new Error(`Worker HTTP ${response.status}`);
  const payload=await response.json();
  if(payload?.status==="error") throw new Error(`Worker/Twelve Data: ${payload.message || "provider error"}`);

  const bars=td.normalizeValues(payload,{symbol:"SPY",timeframe:"D"});
  if(bars.length<20) throw new Error(`expected at least 20 daily bars, received ${bars.length}`);

  const semanticBars=adapter.normalizeProviderBars({
    bars,
    symbol:"SPY",
    timeframe:"D",
    marketTimezone:"America/New_York",
    session:"REGULAR",
    provider:"TWELVE_DATA",
    providerAggregation:"TWELVE_DATA_NATIVE_1DAY_EXCHANGE_CALENDAR",
    barAnchor:"EXCHANGE_SESSION_OPEN",
    barAnchorOffsetMinutes:0,
    periodResolver:period.createUsEquityPeriodResolver({timeframe:"D"})
  });

  if(semanticBars.length!==bars.length) throw new Error("semantic bar count mismatch");
  if(!semanticBars.every(b=>b.semanticKey && b.semantics?.periodOpenId)) throw new Error("semantic provenance missing");

  const scenarioCounts={"1":0,"2U":0,"2D":0,"3":0,"?":0};
  for(let i=1;i<bars.length;i++){
    const type=core.classifyBar(bars[i],bars[i-1]);
    scenarioCounts[type]=(scenarioCounts[type]||0)+1;
  }

  const setupCounts={};
  const samples=[];
  for(let i=3;i<bars.length;i++){
    const setup=core.detectSetup(bars.slice(0,i+1));
    if(setup.name && setup.name!=="NONE" && setup.name!=="INSIDE BREAK PENDING"){
      setupCounts[setup.name]=(setupCounts[setup.name]||0)+1;
      if(samples.length<8) samples.push({date:bars[i].datetime,name:setup.name,direction:setup.direction,pathResolved:setup.pathResolved});
    }
  }

  const summary={
    ok:true,
    source:"CLOUDFLARE_WORKER->TWELVE_DATA",
    symbol:"SPY",
    timeframe:"D",
    bars:bars.length,
    first:bars[0].datetime,
    last:bars[bars.length-1].datetime,
    scenarioCounts,
    setupCounts,
    samples,
    semanticProfile:{
      marketTimezone:semanticBars[0].semantics.marketTimezone,
      session:semanticBars[0].semantics.session,
      providerAggregation:semanticBars[0].semantics.providerAggregation,
      barAnchor:semanticBars[0].semantics.barAnchor
    }
  };

  console.log(JSON.stringify(summary,null,2));
}

main().catch(error=>{
  console.error(error?.stack || String(error));
  process.exit(1);
});
