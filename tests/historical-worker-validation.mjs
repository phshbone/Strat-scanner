import worker from "../worker/market-data-proxy.mjs";

let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected);if(ok)pass++;else{fail++;failures.push({name,actual,expected});}}

const fakeDb={
  writes:0,
  prepare(sql){
    return {
      bind(){
        return {
          async first(){
            const exact=sql.includes("ftfc_alignment=?");
            return exact
              ?{sample_size:12,resolved_sample_size:10,wins:6,losses:4,ambiguous:2,open_count:0,unresolved:0,first_event_at:"2025-01-01",last_event_at:"2026-01-01"}
              :{sample_size:40,resolved_sample_size:35,wins:21,losses:14,ambiguous:3,open_count:1,unresolved:1,first_event_at:"2024-01-01",last_event_at:"2026-01-01"};
          }
        };
      },
      async first(){return {event_count:123,first_event_at:"2024-01-01",last_event_at:"2026-01-01"};},
      async run(){fakeDb.writes++;return {success:true};}
    };
  },
  async batch(statements){this.writes+=statements.length;return statements.map(()=>({success:true}));}
};

const missingHealth=await worker.fetch(new Request("https://worker.example/historical/health"),{});
const missingHealthJson=await missingHealth.json();
t("historical health works without binding",missingHealth.status,200);
t("historical health reports unconfigured",missingHealthJson.database.configured,false);

const health=await worker.fetch(new Request("https://worker.example/historical/health"),{HISTORICAL_DB:fakeDb});
const healthJson=await health.json();
t("configured historical health 200",health.status,200);
t("configured database is migrated",healthJson.database.migrated,true);
t("health exposes event count",healthJson.database.eventCount,123);

const evidenceUrl="https://worker.example/historical/evidence?setup=2-2&direction=BULLISH&timeframe=15&market_type=US_EQUITY&ftfc_alignment=FULL_BULLISH&stop_model=MIDPOINT&min_resolved=20";
const evidence=await worker.fetch(new Request(evidenceUrl),{HISTORICAL_DB:fakeDb});
const evidenceJson=await evidence.json();
t("historical evidence 200",evidence.status,200);
t("exact evidence remains insufficient",evidenceJson.status,"INSUFFICIENT_SAMPLE");
t("baseline remains separate",evidenceJson.broaderBaseline.sampleSize,40);
t("evidence is explicitly non-forecast",evidenceJson.historicalEvidenceIsNotForecast,true);

const sampleEvent={
  id:"SPY|15|2026-01-02T14:30:00Z|2-2|BULLISH",ticker:"SPY",timestamp:"2026-01-02T14:30:00Z",
  setup:"2-2",direction:"BULLISH",timeframe:"15",marketType:"US_EQUITY",entry:100,stop:95,magnitude:110,
  stopModel:"MIDPOINT",resolution:"WIN",magnitudeHit:true,firstHit:"MAGNITUDE"
};

const unauthorized=await worker.fetch(new Request("https://worker.example/historical/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({events:[sampleEvent]})}),{HISTORICAL_DB:fakeDb,HISTORICAL_DB_WRITE_TOKEN:"SECRET"});
t("historical writes require bearer token",unauthorized.status,401);

const before=fakeDb.writes;
const authorized=await worker.fetch(new Request("https://worker.example/historical/events",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer SECRET"},body:JSON.stringify({events:[sampleEvent],importId:"test-import"})}),{HISTORICAL_DB:fakeDb,HISTORICAL_DB_WRITE_TOKEN:"SECRET"});
const authorizedJson=await authorized.json();
t("authorized historical write 200",authorized.status,200);
t("authorized write reports one event",authorizedJson.written,1);
t("authorized write reaches database",fakeDb.writes-before,1);

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);