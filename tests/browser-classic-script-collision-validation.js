"use strict";

const fs=require("fs");
const path=require("path");
const vm=require("vm");

let pass=0,fail=0;
function check(name,condition){
  if(condition){pass++;console.log(`PASS ${pass}: ${name}`);}
  else{fail++;console.error(`FAIL: ${name}`);}
}

const context=vm.createContext({console,setTimeout,clearTimeout,queueMicrotask});
context.globalThis=context;

const files=[
  "advisory-state.js",
  "setup-context.js",
  "scanner-card.js",
  "trade-coach.js",
  "trade-coach-ui.js"
];

for(const file of files){
  try{
    const source=fs.readFileSync(path.join(__dirname,"..",file),"utf8");
    vm.runInContext(source,context,{filename:file});
    check(`${file} loads in shared classic-script global scope`,true);
  }catch(error){
    console.error(error);
    check(`${file} loads in shared classic-script global scope`,false);
    break;
  }
}

check("setup context global exported",typeof context.StratSetupContext?.buildSetupContext==="function");
check("scanner card global exported",typeof context.StratScannerCard?.buildScannerCard==="function");
check("trade coach global exported",typeof context.StratTradeCoach?.deriveTradeCoachGuidance==="function");
check("trade coach UI global exported",typeof context.StratTradeCoachUI?.buildTradeCoachViewModel==="function");

console.log(JSON.stringify({pass,fail,failures:fail}));
if(fail) process.exit(1);
