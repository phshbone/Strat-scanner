"use strict";

(async()=>{
  const assert=(await import("node:assert")).default;
  const dbmod=await import("../worker/historical-db.mjs");
  let pass=0;
  const t=(name,fn)=>{fn();pass++;console.log("PASS "+pass+": "+name);};

  const event={
    id:"SPY|15|checkpoint|2-2|BULLISH|MIDPOINT",
    ticker:"SPY",
    timestamp:"2026-01-02T14:35:00Z",
    setup:"2-2",
    direction:"BULLISH",
    timeframe:"15",
    marketType:"US_EQUITY",
    entry:100,
    stop:95,
    magnitude:110,
    stopModel:"MIDPOINT",
    activationPrice:101,
    observationLagMinutes:5,
    activationProgressPct:10,
    observationPhase:"FIRST_5M",
    resolution:"WIN",
    magnitudeHit:true,
    stopHit:false,
    firstHit:"MAGNITUDE",
    ftfcAlignment:"FULL_BULLISH",
    priceBucket:"EARLY",
    evidenceEligible:true,
    sampleConstruction:"LOWER_5M_CHECKPOINT_FIRST_OBSERVABLE",
    successDefinition:"MAGNITUDE_BEFORE_STOP_AFTER_OBSERVATION_CHECKPOINT",
    dataSemantics:{
      marketTimezone:"America/New_York",
      session:"REGULAR",
      extendedHoursIncluded:false,
      barAnchor:"US_EQUITY_RTH_0930",
      barAnchorOffsetMinutes:0,
      provider:"TWELVE_DATA",
      providerAggregation:"15min"
    }
  };

  const n=dbmod.normalizeEvent(event);
  t("normalizes core event fields",()=>{assert.equal(n.setup_id,"2-2");assert.equal(n.direction,"BULLISH");assert.equal(n.stop_model,"MIDPOINT");});
  t("preserves semantic comparison fields",()=>{assert.equal(n.market_timezone,"America/New_York");assert.equal(n.provider_aggregation,"15min");});
  t("stores full audit JSON",()=>assert.equal(JSON.parse(n.event_json).id,event.id));
  t("eligible checkpoint metadata is normalized",()=>{assert.equal(n.evidence_eligible,1);assert.equal(n.sample_construction,dbmod.EVIDENCE_SAMPLE_CONSTRUCTION);assert.equal(n.observation_phase,"FIRST_5M");assert.equal(n.activation_price,101);});

  const q=dbmod.normalizeEvidenceQuery(new URLSearchParams("setup=2-2&direction=bullish&timeframe=15&market_type=us_equity&ftfc_alignment=full_bullish&price_bucket=early&observation_phase=first_5m&stop_model=midpoint&min_resolved=30"));
  t("normalizes evidence query",()=>{assert.equal(q.direction,"BULLISH");assert.equal(q.min_resolved,30);assert.equal(q.ftfc_alignment,"FULL_BULLISH");assert.equal(q.sample_construction,dbmod.EVIDENCE_SAMPLE_CONSTRUCTION);assert.equal(q.min_resolved_period,10);assert.equal(q.min_populated_periods,3);});

  const exact=dbmod.whereFor(q,{includeContext:true});
  const baseline=dbmod.whereFor(q,{includeContext:false});
  t("exact cohort enforces eligibility and sample construction",()=>{assert.match(exact.sql,/evidence_eligible=1/);assert.match(exact.sql,/sample_construction=\?/);});
  t("exact cohort includes known context filters",()=>{assert.match(exact.sql,/ftfc_alignment=\?/);assert.match(exact.sql,/price_bucket=\?/);assert.match(exact.sql,/observation_phase=\?/);assert.match(exact.sql,/stop_model=\?/);});
  t("baseline deliberately omits optional context filters",()=>{assert.doesNotMatch(baseline.sql,/ftfc_alignment=\?/);assert.doesNotMatch(baseline.sql,/price_bucket=\?/);assert.doesNotMatch(baseline.sql,/observation_phase=\?/);assert.doesNotMatch(baseline.sql,/stop_model=\?/);});

  const small=dbmod.summary({sample_size:8,resolved_sample_size:7,wins:5,losses:2,ambiguous:1},20);
  t("small cohort is insufficient",()=>{assert.equal(small.status,"INSUFFICIENT_SAMPLE");assert.equal(small.successRatePct,71.4);assert.equal(small.successDefinition,dbmod.EVIDENCE_SUCCESS_DEFINITION);});

  const large=dbmod.summary({sample_size:25,resolved_sample_size:20,wins:13,losses:7,ambiguous:2},20);
  t("sufficient cohort becomes available",()=>{assert.equal(large.status,"AVAILABLE");assert.equal(large.successRatePct,65);});

  t("unsupported sample construction is rejected",()=>{
    assert.throws(()=>dbmod.normalizeEvidenceQuery(new URLSearchParams("setup=2-2&direction=BULLISH&timeframe=15&sample_construction=COMPLETED_PARENT_BAR_SETUP_STATE")),/unsupported historical sample construction/);
  });

  const fakeDb={
    prepare(sql){
      return {
        bind(){
          return {
            async first(){
              const exact=sql.includes("ftfc_alignment=?");
              return exact?{sample_size:12,resolved_sample_size:10,wins:6,losses:4,ambiguous:2}:{sample_size:40,resolved_sample_size:35,wins:21,losses:14,ambiguous:3};
            },
            async all(){
              const exact=sql.includes("ftfc_alignment=?");
              return {results:exact?[
                {period:"2026-04",sample_size:12,resolved_sample_size:10,wins:6,losses:4,ambiguous:2,unresolved:0},
                {period:"2026-05",sample_size:11,resolved_sample_size:10,wins:5,losses:5,ambiguous:1,unresolved:0},
                {period:"2026-06",sample_size:10,resolved_sample_size:10,wins:7,losses:3,ambiguous:0,unresolved:0}
              ]:[
                {period:"2026-04",sample_size:15,resolved_sample_size:12,wins:7,losses:5,ambiguous:2,unresolved:1},
                {period:"2026-05",sample_size:15,resolved_sample_size:12,wins:8,losses:4,ambiguous:2,unresolved:1},
                {period:"2026-06",sample_size:15,resolved_sample_size:11,wins:6,losses:5,ambiguous:2,unresolved:2}
              ]};
            }
          };
        },
        async first(){return {event_count:123,eligible_event_count:80,first_event_at:"2025-01-01",last_event_at:"2026-01-01"};}
      };
    }
  };

  const evidence=await dbmod.queryHistoricalEvidence(fakeDb,q);
  t("query keeps exact and baseline separate",()=>{assert.equal(evidence.sampleSize,12);assert.equal(evidence.broaderBaseline.sampleSize,40);assert.equal(evidence.status,"INSUFFICIENT_SAMPLE");assert.equal(evidence.sampleConstruction,dbmod.EVIDENCE_SAMPLE_CONSTRUCTION);});\n  t("query carries temporal coverage without confidence scoring",()=>{assert.equal(evidence.temporalCoverage.coverageStatus,"TEMPORAL_COVERAGE");assert.equal(evidence.temporalCoverage.populatedPeriods,3);assert.equal(evidence.temporalCoverage.populatedRateMinPct,50);assert.equal(evidence.temporalCoverage.populatedRateMaxPct,70);assert.ok(!("confidence" in evidence.temporalCoverage));});
  const temporal=dbmod.temporalSummary([{period:"2026-04",sample_size:12,resolved_sample_size:10,wins:6,losses:4},{period:"2026-05",sample_size:9,resolved_sample_size:9,wins:5,losses:4}],{minResolvedPerPeriod:10,minPopulatedPeriods:2});\n  t("temporal summary keeps weak monthly coverage explicit",()=>{assert.equal(temporal.coverageStatus,"LIMITED_PERIOD_COVERAGE");assert.equal(temporal.populatedPeriods,1);});\n\n  const health=await dbmod.historicalDbHealth(fakeDb);
  t("health reports eligible database population",()=>{assert.equal(health.configured,true);assert.equal(health.migrated,true);assert.equal(health.eventCount,123);assert.equal(health.eligibleEventCount,80);});

  console.log("\n"+pass+"/"+pass+" PASS historical database validation");
})().catch(error=>{console.error(error);process.exit(1);});
