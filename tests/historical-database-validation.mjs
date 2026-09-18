"use strict";

(async()=>{
  const assert=require("assert");
  const dbmod=await import("../worker/historical-db.mjs");
  let pass=0;
  const t=(name,fn)=>{fn();pass++;console.log("PASS "+pass+": "+name);};

  const event={
    id:"SPY|15|2026-01-02T14:30:00Z|2-2|BULLISH",
    ticker:"SPY",timestamp:"2026-01-02T14:30:00Z",setup:"2-2",direction:"BULLISH",timeframe:"15",
    marketType:"US_EQUITY",entry:100,stop:95,magnitude:110,stopModel:"MIDPOINT",
    resolution:"WIN",magnitudeHit:true,stopHit:false,firstHit:"MAGNITUDE",
    ftfcAlignment:"FULL_BULLISH",
    dataSemantics:{marketTimezone:"America/New_York",session:"REGULAR",extendedHoursIncluded:false,barAnchor:"US_EQUITY_RTH_0930",barAnchorOffsetMinutes:0,provider:"TWELVE_DATA",providerAggregation:"15min"}
  };

  const n=dbmod.normalizeEvent(event);
  t("normalizes core event fields",()=>{assert.equal(n.setup_id,"2-2");assert.equal(n.direction,"BULLISH");assert.equal(n.stop_model,"MIDPOINT");});
  t("preserves semantic comparison fields",()=>{assert.equal(n.market_timezone,"America/New_York");assert.equal(n.provider_aggregation,"15min");});
  t("stores full audit JSON",()=>assert.equal(JSON.parse(n.event_json).id,event.id));

  const q=dbmod.normalizeEvidenceQuery(new URLSearchParams("setup=2-2&direction=bullish&timeframe=15&market_type=us_equity&ftfc_alignment=full_bullish&stop_model=midpoint&min_resolved=30"));
  t("normalizes evidence query",()=>{assert.equal(q.direction,"BULLISH");assert.equal(q.min_resolved,30);assert.equal(q.ftfc_alignment,"FULL_BULLISH");});

  const exact=dbmod.whereFor(q,{includeContext:true});
  const baseline=dbmod.whereFor(q,{includeContext:false});
  t("exact cohort includes context filters",()=>{assert.match(exact.sql,/ftfc_alignment=\?/);assert.match(exact.sql,/stop_model=\?/);});
  t("baseline deliberately omits context filters",()=>{assert.doesNotMatch(baseline.sql,/ftfc_alignment=\?/);assert.doesNotMatch(baseline.sql,/stop_model=\?/);});

  const small=dbmod.summary({sample_size:8,resolved_sample_size:7,wins:5,losses:2,ambiguous:1},20);
  t("small cohort is insufficient",()=>{assert.equal(small.status,"INSUFFICIENT_SAMPLE");assert.equal(small.successRatePct,71.4);});

  const large=dbmod.summary({sample_size:25,resolved_sample_size:20,wins:13,losses:7,ambiguous:2},20);
  t("sufficient cohort becomes available",()=>{assert.equal(large.status,"AVAILABLE");assert.equal(large.successRatePct,65);});

  const fakeDb={
    prepare(sql){
      return {
        bind(){
          return {
            async first(){
              const exact=sql.includes("ftfc_alignment=?");
              return exact?{sample_size:12,resolved_sample_size:10,wins:6,losses:4,ambiguous:2}:{sample_size:40,resolved_sample_size:35,wins:21,losses:14,ambiguous:3};
            }
          };
        },
        async first(){return {event_count:123,first_event_at:"2025-01-01",last_event_at:"2026-01-01"};}
      };
    }
  };

  const evidence=await dbmod.queryHistoricalEvidence(fakeDb,q);
  t("query keeps exact and baseline separate",()=>{assert.equal(evidence.sampleSize,12);assert.equal(evidence.broaderBaseline.sampleSize,40);assert.equal(evidence.status,"INSUFFICIENT_SAMPLE");});
  const health=await dbmod.historicalDbHealth(fakeDb);
  t("health reports migrated database",()=>{assert.equal(health.configured,true);assert.equal(health.migrated,true);assert.equal(health.eventCount,123);});

  console.log("\n"+pass+"/"+pass+" PASS historical database validation");
})().catch(error=>{console.error(error);process.exit(1);});