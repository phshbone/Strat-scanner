"use strict";

const fs=require("fs");
const path=require("path");
const job=require("../historical-dataset-job.js");

function parseArgs(argv){
  const out={symbol:null,timeframe:"15",outputsize:5000,startDate:null,endDate:null,stopModel:"MIDPOINT",horizonBars:20,proxyBase:"https://thestrat.phshbone.workers.dev",outFile:null,write:false};
  for(let i=0;i<argv.length;i++){
    const a=argv[i];
    if(a==="--symbol") out.symbol=argv[++i];
    else if(a==="--timeframe") out.timeframe=argv[++i];
    else if(a==="--outputsize") out.outputsize=Number(argv[++i]);
    else if(a==="--start") out.startDate=argv[++i];
    else if(a==="--end") out.endDate=argv[++i];
    else if(a==="--stop-model") out.stopModel=argv[++i];
    else if(a==="--horizon-bars") out.horizonBars=Number(argv[++i]);
    else if(a==="--proxy") out.proxyBase=argv[++i];
    else if(a==="--out") out.outFile=argv[++i];
    else if(a==="--write") out.write=true;
    else if(a==="--help") out.help=true;
    else throw new Error("unknown argument: "+a);
  }
  return out;
}

function usage(){
  return [
    "Usage: node scripts/build-historical-dataset.js --symbol SPY [options]",
    "",
    "Options:",
    "  --timeframe 5|15|30       validated intraday source timeframe (default 15)",
    "  --outputsize N             provider bars, max 5000 (default 5000)",
    "  --start YYYY-MM-DD         optional provider start date",
    "  --end YYYY-MM-DD           optional provider end date",
    "  --stop-model MIDPOINT|STRUCTURE",
    "  --horizon-bars N           outcome look-forward window (default 20)",
    "  --out FILE                 save audit dataset JSON",
    "  --write                    write events to configured D1 Worker endpoint",
    "",
    "Writing requires HISTORICAL_DB_WRITE_TOKEN in the environment."
  ].join("\n");
}

async function main(){
  const args=parseArgs(process.argv.slice(2));
  if(args.help){console.log(usage());return;}
  if(!args.symbol) throw new Error("--symbol required");
  const series=await job.fetchHistoricalSeries({
    proxyBase:args.proxyBase,symbol:args.symbol,timeframe:args.timeframe,outputsize:args.outputsize,startDate:args.startDate,endDate:args.endDate
  });
  const dataset=job.buildHistoricalDataset(series,{stopModel:args.stopModel,horizonBars:args.horizonBars});
  const importId=[dataset.symbol,dataset.timeframe,dataset.stopModel,new Date().toISOString()].join("|");
  if(args.outFile){
    const target=path.resolve(args.outFile);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,JSON.stringify({...dataset,importId},null,2));
    console.log("saved "+target);
  }
  let writeResult=null;
  if(args.write){
    writeResult=await job.writeHistoricalDataset({proxyBase:args.proxyBase,dataset,token:process.env.HISTORICAL_DB_WRITE_TOKEN,importId});
  }
  console.log(JSON.stringify({importId,symbol:dataset.symbol,timeframe:dataset.timeframe,stopModel:dataset.stopModel,barsReceived:dataset.barsReceived,summary:dataset.summary,writeResult},null,2));
}

main().catch(error=>{console.error(error.stack||error.message||String(error));process.exit(1);});