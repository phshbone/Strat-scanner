"use strict";

const SCHEMA_VERSION=1;
const DEFAULT_MIN_RESOLVED=20;
const MAX_WRITE_BATCH=500;
const EVIDENCE_SAMPLE_CONSTRUCTION="LOWER_5M_CHECKPOINT_FIRST_OBSERVABLE";
const EVIDENCE_SUCCESS_DEFINITION="MAGNITUDE_BEFORE_STOP_AFTER_OBSERVATION_CHECKPOINT";

const CONTEXT_FILTERS=Object.freeze({
  ftfc_alignment:"ftfc_alignment",
  market_alignment:"market_alignment",
  sector_alignment:"sector_alignment",
  elder_state:"elder_state",
  minervini_state:"minervini_state",
  exhaustion_state:"exhaustion_state",
  sss50_state:"sss50_state",
  price_bucket:"price_bucket",
  observation_phase:"observation_phase",
  stop_model:"stop_model"
});

const PROFILE_FILTERS=Object.freeze({
  market_timezone:"market_timezone",
  session:"session",
  extended_hours_included:"extended_hours_included",
  bar_anchor:"bar_anchor",
  bar_anchor_offset_minutes:"bar_anchor_offset_minutes",
  provider_aggregation:"provider_aggregation",
  sample_construction:"sample_construction"
});

function present(v){return v!==null&&v!==undefined&&v!=="";}
function upper(v){return present(v)?String(v).trim().toUpperCase():null;}
function num(v){return present(v)&&Number.isFinite(Number(v))?Number(v):null;}
function boolInt(v){return v===true||v===1||v==="1"||String(v).toLowerCase()==="true"?1:0;}
function requireValue(value,label){if(!present(value)) throw new Error(label+" required");return value;}

function normalizeEvent(input={}){
  const eventId=String(requireValue(input.id||input.eventId,"event id"));
  const direction=upper(requireValue(input.direction,"direction"));
  if(!["BULLISH","BEARISH"].includes(direction)) throw new Error("direction must be BULLISH or BEARISH");
  const stopModel=upper(input.stopModel||"MIDPOINT");
  if(!["MIDPOINT","STRUCTURE"].includes(stopModel)) throw new Error("stopModel must be MIDPOINT or STRUCTURE");
  const entry=num(input.entry??input.trigger),stop=num(input.stop),magnitude=num(input.magnitude);
  if(entry===null||stop===null||magnitude===null) throw new Error("entry, stop, and magnitude must be numeric");
  const s=input.dataSemantics||input.semantics||{};
  return {
    event_id:eventId,
    symbol:upper(requireValue(input.ticker||input.symbol,"symbol")),
    signal_timestamp:String(requireValue(input.timestamp||s.barOpenTimestamp,"signal timestamp")),
    setup_id:upper(requireValue(input.setupId||input.setup,"setup id")),
    direction,
    timeframe:upper(requireValue(input.timeframe||input.setupTimeframe,"timeframe")),
    market_type:upper(input.marketType),
    stop_model:stopModel,
    entry,stop,magnitude,
    activation_price:num(input.activationPrice),
    observation_lag_minutes:Number.isInteger(Number(input.observationLagMinutes))?Number(input.observationLagMinutes):null,
    activation_progress_pct:num(input.activationProgressPct),
    observation_phase:upper(input.observationPhase),
    resolution:upper(input.resolution)||"UNRESOLVED",
    magnitude_hit:input.magnitudeHit===true?1:0,
    stop_hit:input.stopHit===true?1:0,
    first_hit:upper(input.firstHit),
    sequence_ambiguous:input.sequenceAmbiguous===true?1:0,
    time_to_magnitude_bars:Number.isInteger(Number(input.timeToMagnitudeBars))?Number(input.timeToMagnitudeBars):null,
    realized_r:num(input.realizedR),
    ftfc_alignment:upper(input.ftfcAlignment||input.ftfc?.alignment||input.context?.ftfcAlignment),
    market_alignment:upper(input.marketAlignment||input.context?.marketAlignment),
    sector_alignment:upper(input.sectorAlignment||input.context?.sectorAlignment),
    elder_state:upper(input.elderState||input.context?.elderState),
    minervini_state:upper(input.minerviniState||input.context?.minerviniState),
    exhaustion_state:upper(input.exhaustionState||input.context?.exhaustionState),
    sss50_state:upper(input.sss50State||input.context?.sss50State),
    price_bucket:upper(input.priceBucket||input.context?.priceBucket),
    market_timezone:s.marketTimezone||null,
    session:upper(s.session),
    extended_hours_included:s.extendedHoursIncluded===true?1:0,
    bar_anchor:s.barAnchor||null,
    bar_anchor_offset_minutes:Number.isInteger(Number(s.barAnchorOffsetMinutes))?Number(s.barAnchorOffsetMinutes):null,
    provider:upper(s.provider),
    provider_aggregation:s.providerAggregation||null,
    semantic_key:input.semanticKey||null,
    evidence_eligible:input.evidenceEligible===true?1:0,
    sample_construction:upper(input.sampleConstruction)||"COMPLETED_PARENT_BAR_SETUP_STATE",
    success_definition:upper(input.successDefinition)||null,
    lookahead_risk:upper(input.lookaheadRisk),
    schema_version:SCHEMA_VERSION,
    import_id:input.importId||null,
    event_json:JSON.stringify(input)
  };
}

const ROW_FIELDS=[
 "event_id","symbol","signal_timestamp","setup_id","direction","timeframe","market_type","stop_model",
 "entry","stop","magnitude","activation_price","observation_lag_minutes","activation_progress_pct","observation_phase",
 "resolution","magnitude_hit","stop_hit","first_hit","sequence_ambiguous","time_to_magnitude_bars","realized_r",
 "ftfc_alignment","market_alignment","sector_alignment","elder_state","minervini_state","exhaustion_state","sss50_state","price_bucket",
 "market_timezone","session","extended_hours_included","bar_anchor","bar_anchor_offset_minutes","provider","provider_aggregation","semantic_key",
 "evidence_eligible","sample_construction","success_definition","lookahead_risk","schema_version","import_id","event_json"
];

const UPDATE_FIELDS=ROW_FIELDS.filter(field=>field!=="event_id"&&field!=="event_json");
const INSERT_SQL="INSERT INTO historical_events ("+ROW_FIELDS.concat(["updated_at"]).join(",")+") VALUES ("+ROW_FIELDS.map(()=>"?").join(",")+",CURRENT_TIMESTAMP) "+
  "ON CONFLICT(event_id) DO UPDATE SET "+UPDATE_FIELDS.map(field=>field+"=excluded."+field).concat(["event_json=excluded.event_json","updated_at=CURRENT_TIMESTAMP"]).join(",");

async function upsertHistoricalEvents(db,events,{importId=null}={}){
  if(!db||typeof db.prepare!=="function") throw new Error("historical database binding unavailable");
  const list=Array.isArray(events)?events:[];
  if(!list.length) return {received:0,written:0};
  if(list.length>MAX_WRITE_BATCH) throw new Error("historical write batch limited to "+MAX_WRITE_BATCH+" events");
  const rows=list.map(event=>normalizeEvent({...event,importId:event.importId||importId}));
  const statements=rows.map(row=>db.prepare(INSERT_SQL).bind(...ROW_FIELDS.map(field=>row[field])));
  if(typeof db.batch==="function") await db.batch(statements);
  else for(const statement of statements) await statement.run();
  return {received:list.length,written:rows.length};
}

function normalizeEvidenceQuery(source){
  const get=name=>typeof source?.get==="function"?source.get(name):source?.[name];
  const setupId=upper(get("setup")||get("setup_id"));
  const direction=upper(get("direction"));
  const timeframe=upper(get("timeframe"));
  if(!setupId||!["BULLISH","BEARISH"].includes(direction)||!timeframe) throw new Error("setup, direction, and timeframe are required");
  const minRaw=Number(get("min_resolved")||DEFAULT_MIN_RESOLVED);
  const minResolved=Number.isInteger(minRaw)&&minRaw>0&&minRaw<=10000?minRaw:DEFAULT_MIN_RESOLVED;
  const requestedConstruction=upper(get("sample_construction")||EVIDENCE_SAMPLE_CONSTRUCTION);
  if(requestedConstruction!==EVIDENCE_SAMPLE_CONSTRUCTION) throw new Error("unsupported historical sample construction");
  const out={setup_id:setupId,direction,timeframe,market_type:upper(get("market_type")),min_resolved:minResolved,sample_construction:requestedConstruction};
  for(const key of Object.keys(PROFILE_FILTERS)){
    if(key==="sample_construction") continue;
    const v=get(key);
    if(!present(v)) continue;
    out[key]=key==="extended_hours_included"?boolInt(v):key==="bar_anchor_offset_minutes"?Number(v):String(v);
  }
  for(const key of Object.keys(CONTEXT_FILTERS)){const v=get(key);if(present(v)) out[key]=upper(v);}
  return out;
}

function whereFor(query,{includeContext}={}){
  const clauses=["evidence_eligible=1","sample_construction=?","setup_id=?","direction=?","timeframe=?"];
  const params=[query.sample_construction||EVIDENCE_SAMPLE_CONSTRUCTION,query.setup_id,query.direction,query.timeframe];
  if(query.market_type){clauses.push("market_type=?");params.push(query.market_type);}
  for(const [key,column] of Object.entries(PROFILE_FILTERS)){
    if(key==="sample_construction"||!present(query[key])) continue;
    clauses.push(column+"=?");params.push(query[key]);
  }
  if(includeContext){
    for(const [key,column] of Object.entries(CONTEXT_FILTERS)){
      if(!present(query[key])) continue;
      clauses.push(column+"=?");params.push(query[key]);
    }
  }
  return {sql:clauses.join(" AND "),params};
}

const AGGREGATE_SELECT=[
 "SELECT COUNT(*) AS sample_size,",
 " SUM(CASE WHEN resolution IN ('WIN','LOSS') THEN 1 ELSE 0 END) AS resolved_sample_size,",
 " SUM(CASE WHEN resolution='WIN' THEN 1 ELSE 0 END) AS wins,",
 " SUM(CASE WHEN resolution='LOSS' THEN 1 ELSE 0 END) AS losses,",
 " SUM(CASE WHEN sequence_ambiguous=1 OR resolution='AMBIGUOUS' THEN 1 ELSE 0 END) AS ambiguous,",
 " SUM(CASE WHEN resolution='OPEN' THEN 1 ELSE 0 END) AS open_count,",
 " SUM(CASE WHEN resolution NOT IN ('WIN','LOSS','AMBIGUOUS','OPEN') THEN 1 ELSE 0 END) AS unresolved,",
 " AVG(realized_r) AS average_realized_r,",
 " MIN(signal_timestamp) AS first_event_at, MAX(signal_timestamp) AS last_event_at",
 " FROM historical_events WHERE "
].join("");

function summary(row={},minResolved){
  const sample=Number(row.sample_size)||0,resolved=Number(row.resolved_sample_size)||0,wins=Number(row.wins)||0;
  const status=sample===0?"NOT_AVAILABLE":resolved>=minResolved?"AVAILABLE":"INSUFFICIENT_SAMPLE";
  return {
    status,sufficient:status==="AVAILABLE",sampleSize:sample,resolvedSampleSize:resolved,wins,
    losses:Number(row.losses)||0,successRate:resolved?wins/resolved:null,
    successRatePct:resolved?Number(((wins/resolved)*100).toFixed(1)):null,
    ambiguous:Number(row.ambiguous)||0,open:Number(row.open_count)||0,unresolved:Number(row.unresolved)||0,
    averageRealizedR:num(row.average_realized_r),firstEventAt:row.first_event_at||null,lastEventAt:row.last_event_at||null,
    minResolvedSampleSize:minResolved,successDefinition:EVIDENCE_SUCCESS_DEFINITION,sampleConstruction:EVIDENCE_SAMPLE_CONSTRUCTION
  };
}

async function aggregate(db,where,minResolved){
  const row=await db.prepare(AGGREGATE_SELECT+where.sql).bind(...where.params).first();
  return summary(row||{},minResolved);
}

async function queryHistoricalEvidence(db,source){
  if(!db||typeof db.prepare!=="function") throw new Error("historical database binding unavailable");
  const query=normalizeEvidenceQuery(source);
  const exact=await aggregate(db,whereFor(query,{includeContext:true}),query.min_resolved);
  const baseline=await aggregate(db,whereFor(query,{includeContext:false}),query.min_resolved);
  return {
    ...exact,comparisonTier:"EXACT_CONTEXT",conditions:query,
    broaderBaseline:{...baseline,comparisonTier:"SETUP_BASELINE"},
    source:"CLOUDFLARE_D1_HISTORICAL_EVENTS",historicalEvidenceIsNotForecast:true,
    note:exact.status==="AVAILABLE"?"Descriptive historical evidence for first-observable 5m checkpoint states. It is not a forecast.":exact.status==="INSUFFICIENT_SAMPLE"?"Comparable events exist, but the resolved sample is below the minimum. Keep guidance rule-based.":"No comparable evidence-eligible historical events are available for the exact defined cohort."
  };
}

async function historicalDbHealth(db){
  if(!db||typeof db.prepare!=="function") return {configured:false,migrated:false,eventCount:0,eligibleEventCount:0};
  try{
    const row=await db.prepare("SELECT COUNT(*) AS event_count, SUM(CASE WHEN evidence_eligible=1 THEN 1 ELSE 0 END) AS eligible_event_count, MIN(signal_timestamp) AS first_event_at, MAX(signal_timestamp) AS last_event_at FROM historical_events").first();
    return {configured:true,migrated:true,eventCount:Number(row?.event_count)||0,eligibleEventCount:Number(row?.eligible_event_count)||0,firstEventAt:row?.first_event_at||null,lastEventAt:row?.last_event_at||null,schemaVersion:SCHEMA_VERSION,evidenceSampleConstruction:EVIDENCE_SAMPLE_CONSTRUCTION};
  }catch(error){
    return {configured:true,migrated:false,eventCount:0,eligibleEventCount:0,error:error?.message||String(error),schemaVersion:SCHEMA_VERSION,evidenceSampleConstruction:EVIDENCE_SAMPLE_CONSTRUCTION};
  }
}

export {SCHEMA_VERSION,DEFAULT_MIN_RESOLVED,MAX_WRITE_BATCH,EVIDENCE_SAMPLE_CONSTRUCTION,EVIDENCE_SUCCESS_DEFINITION,CONTEXT_FILTERS,PROFILE_FILTERS,ROW_FIELDS,INSERT_SQL,normalizeEvent,normalizeEvidenceQuery,whereFor,summary,upsertHistoricalEvents,queryHistoricalEvidence,historicalDbHealth};
