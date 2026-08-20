"use strict";

const TIMEFRAME_ORDER=Object.freeze(["5","15","30","60","D","W","M","Q","Y"]);
const DEFAULTS=Object.freeze({
  1:["15"],
  2:["15","D"],
  3:["15","60","D"],
  4:["60","D","W","M"]
});

function normalizeTimeframe(value){
  const v=String(value||"").trim().toUpperCase();
  const aliases={"5M":"5","15M":"15","30M":"30","1H":"60","60M":"60","DAY":"D","DAILY":"D","WEEK":"W","WEEKLY":"W","MONTH":"M","MONTHLY":"M","QUARTER":"Q","QUARTERLY":"Q","YEAR":"Y","YEARLY":"Y"};
  const normalized=aliases[v]||v;
  return TIMEFRAME_ORDER.includes(normalized)?normalized:null;
}

function sortTimeframes(values=[]){
  const seen=new Set();
  return (Array.isArray(values)?values:[]).map(normalizeTimeframe).filter(v=>v&&!seen.has(v)&&seen.add(v)).sort((a,b)=>TIMEFRAME_ORDER.indexOf(a)-TIMEFRAME_ORDER.indexOf(b));
}

function validateCount(count){
  const n=Number(count);
  if(!Number.isInteger(n)||n<1||n>4) throw new Error("chart count must be an integer from 1 to 4");
  return n;
}

function buildChartWorkspace({count=4,timeframes=null}={}){
  const n=validateCount(count);
  let selected=sortTimeframes(timeframes==null?DEFAULTS[n]:timeframes);
  if(selected.length>n) selected=selected.slice(0,n);
  if(selected.length<n){
    for(const tf of DEFAULTS[n]){
      if(!selected.includes(tf)) selected.push(tf);
      if(selected.length===n) break;
    }
    for(const tf of TIMEFRAME_ORDER){
      if(!selected.includes(tf)) selected.push(tf);
      if(selected.length===n) break;
    }
    selected=sortTimeframes(selected).slice(0,n);
  }
  return {count:n,timeframes:selected,order:"LOWEST_TO_HIGHEST",maxCharts:4};
}

function setChartCount(workspace,count){
  return buildChartWorkspace({count,timeframes:workspace?.timeframes||null});
}

function setTimeframes(workspace,timeframes){
  const count=validateCount(workspace?.count||1);
  const selected=sortTimeframes(timeframes);
  if(selected.length!==count) throw new Error(`select exactly ${count} unique timeframe${count===1?"":"s"}`);
  return buildChartWorkspace({count,timeframes:selected});
}

function toggleTimeframe(workspace,timeframe,enabled){
  const count=validateCount(workspace?.count||1);
  const tf=normalizeTimeframe(timeframe);
  if(!tf) throw new Error("unsupported timeframe");
  const selected=sortTimeframes(workspace?.timeframes||[]);
  const has=selected.includes(tf);
  if(enabled===false && has){
    if(selected.length<=1) throw new Error("at least one timeframe must remain selected");
    return {...workspace,timeframes:sortTimeframes(selected.filter(x=>x!==tf))};
  }
  if(enabled!==false && !has){
    if(selected.length>=count) throw new Error(`chart layout is limited to ${count} selected timeframe${count===1?"":"s"}`);
    return {...workspace,timeframes:sortTimeframes([...selected,tf])};
  }
  return {...workspace,timeframes:selected};
}

const api={TIMEFRAME_ORDER,DEFAULTS,normalizeTimeframe,sortTimeframes,buildChartWorkspace,setChartCount,setTimeframes,toggleTimeframe};
if(typeof module!=="undefined"&&module.exports) module.exports=api;
if(typeof globalThis!=="undefined") globalThis.StratChartWorkspace=api;
