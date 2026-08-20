import worker,{buildProviderUrl,getApiKey,normalizeSymbol,normalizeInterval,normalizeOutputsize,safeDate,corsHeaders} from "../worker/market-data-proxy.mjs";

let pass=0,fail=0; const failures=[];
function t(name,actual,expected){const ok=JSON.stringify(actual)===JSON.stringify(expected); if(ok) pass++; else {fail++; failures.push({name,actual,expected});}}

function throws(name,fn){let did=false; try{fn();}catch{did=true;} t(name,did,true);}

t("symbol normalized",normalizeSymbol(" spy "),"SPY");
throws("bad symbol rejected",()=>normalizeSymbol("SPY&apikey=x"));
t("1h accepted",normalizeInterval("1h"),"1h");
throws("unsupported interval rejected",()=>normalizeInterval("2h"));
t("outputsize normalized",normalizeOutputsize("5000"),5000);
throws("outputsize 5001 rejected",()=>normalizeOutputsize(5001));
t("date accepted",safeDate("2026-08-19 09:30:00"),"2026-08-19 09:30:00");
throws("bad date rejected",()=>safeDate("yesterday"));

t("preferred secret name",await getApiKey({TWELVE_DATA_API_KEY:"A",A12_DATA_KEY:"B"}),"A");
t("alternate secret name supported",await getApiKey({A12_DATA_KEY:"B"}),"B");
t("missing secret null",await getApiKey({}),null);
t("secret-store binding supported",await getApiKey({TWELVE_DATA_API_KEY:{get:async()=>"C"}}),"C");

let url=buildProviderUrl("https://worker.example/time-series?symbol=spy&interval=1h&outputsize=250&start_date=2026-08-01&end_date=2026-08-02","SECRET");
t("provider host",url.origin,"https://api.twelvedata.com");
t("provider path",url.pathname,"/time_series");
t("secret inserted server-side",url.searchParams.get("apikey"),"SECRET");
t("intraday UTC",url.searchParams.get("timezone"),"UTC");
t("ascending order",url.searchParams.get("order"),"ASC");
t("outputsize preserved",url.searchParams.get("outputsize"),"250");

url=buildProviderUrl("https://worker.example/time-series?symbol=SPY&interval=1day","SECRET");
t("daily no forced UTC",url.searchParams.has("timezone"),false);

t("GitHub Pages CORS allowed",corsHeaders("https://phshbone.github.io")["Access-Control-Allow-Origin"],"https://phshbone.github.io");
t("unknown origin not reflected",corsHeaders("https://evil.example")["Access-Control-Allow-Origin"],"https://phshbone.github.io");

const health=await worker.fetch(new Request("https://worker.example/health"),{TWELVE_DATA_API_KEY:"SECRET"});
const healthJson=await health.json();
t("health 200",health.status,200);
t("health reports configured secret",healthJson.secretConfigured,true);
t("health never returns secret",JSON.stringify(healthJson).includes("SECRET"),false);

const missing=await worker.fetch(new Request("https://worker.example/time-series?symbol=SPY&interval=1day"),{});
t("missing secret rejected",missing.status,400);
const missingJson=await missing.json();
t("missing secret message",missingJson.message,"Twelve Data secret missing");

const post=await worker.fetch(new Request("https://worker.example/time-series",{method:"POST"}),{TWELVE_DATA_API_KEY:"SECRET"});
t("POST rejected",post.status,405);

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);