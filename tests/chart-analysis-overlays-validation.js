"use strict";

const assert=require("assert");
const overlays=require("../chart-analysis-overlays.js");

let pass=0;
function test(name,fn){try{fn();pass++;console.log(`PASS ${name}`);}catch(error){console.error(`FAIL ${name}: ${error.message}`);process.exitCode=1;}}

test("classifies all four Strat bar types",()=>{
  const prior={high:10,low:5};
  assert.equal(overlays.classifyBar({high:9,low:6},prior),"1");
  assert.equal(overlays.classifyBar({high:11,low:6},prior),"2U");
  assert.equal(overlays.classifyBar({high:9,low:4},prior),"2D");
  assert.equal(overlays.classifyBar({high:11,low:4},prior),"3");
});

test("builds sorted volume data only from valid volume bars",()=>{
  const series={bars:[
    {datetime:"2026-09-03T10:05:00Z",open:2,close:1,volume:20},
    {datetime:"2026-09-03T10:00:00Z",open:1,close:2,volume:10},
    {datetime:"2026-09-03T10:10:00Z",open:1,close:2,volume:null}
  ]};
  const data=overlays.volumeData(series);
  assert.equal(data.length,2);
  assert.ok(data[0].time<data[1].time);
  assert.equal(data[0].value,10);
});

test("Strat markers match bar chronology and labels",()=>{
  const series={bars:[
    {datetime:"2026-09-03T10:00:00Z",high:10,low:5},
    {datetime:"2026-09-03T10:05:00Z",high:9,low:6},
    {datetime:"2026-09-03T10:10:00Z",high:11,low:6},
    {datetime:"2026-09-03T10:15:00Z",high:10,low:4},
    {datetime:"2026-09-03T10:20:00Z",high:12,low:3}
  ]};
  assert.deepEqual(overlays.stratMarkers(series).map(x=>x.text),["1","2U","2D","3"]);
});

test("setup levels expose only directional deterministic trigger and magnitude",()=>{
  const series={bars:[{},{},{}]};
  const directional=overlays.setupLevels(series,()=>({name:"2-1-2",direction:"BULLISH",trigger:100,magnitude:105}));
  assert.deepEqual(directional,{trigger:100,target:105,direction:"BULLISH",setup:"2-1-2"});
  const ambiguous=overlays.setupLevels(series,()=>({name:"OUTSIDE PATH AMBIGUOUS",direction:"UNKNOWN",trigger:100,magnitude:105}));
  assert.equal(ambiguous.trigger,null);
  assert.equal(ambiguous.target,null);
});

test("overlay preferences default on but preserve explicit off",()=>{
  assert.deepEqual(overlays.normalize({}),{volume:true,stratLabels:true,setupLevels:true});
  assert.deepEqual(overlays.normalize({volume:false,stratLabels:false,setupLevels:false}),{volume:false,stratLabels:false,setupLevels:false});
});

if(!process.exitCode) console.log(`Chart analysis overlays validation: ${pass}/${pass} PASS`);
