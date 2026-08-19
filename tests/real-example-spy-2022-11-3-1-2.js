"use strict";

const core=require("../core-engine-v0.3.js");
const outcomes=require("../research-outcomes.js");

let pass=0,fail=0;
const failures=[];
function t(name,actual,expected){
  const ok=JSON.stringify(actual)===JSON.stringify(expected);
  if(ok) pass++;
  else { fail++; failures.push({name,actual,expected}); }
}

// Adjusted SPY daily OHLC from StatMuse, November 2022.
// Sequence: Nov 15 = 3, Nov 16 = 1, Nov 17 = 2D => bearish 3-1-2.
const bars=[
  {time:"2022-11-14",open:377.54,high:380.89,low:375.80,close:376.07},
  {time:"2022-11-15",open:381.81,high:382.92,low:375.47,close:379.28},
  {time:"2022-11-16",open:377.65,high:378.61,low:375.76,close:376.39},
  {time:"2022-11-17",open:371.64,high:375.91,low:371.33,close:375.24}
];

t("Nov 15 is outside 3",core.classifyBar(bars[1],bars[0]),"3");
t("Nov 16 is inside 1",core.classifyBar(bars[2],bars[1]),"1");
t("Nov 17 is 2D",core.classifyBar(bars[3],bars[2]),"2D");

const setup=core.detectSetup(bars);
t("setup family",setup.name,"3-1-2");
t("setup direction",setup.direction,"BEARISH");
t("trigger",setup.trigger,375.76);
t("first magnitude",setup.magnitude,375.47);
t("source current type",setup.currentType,"2D");
t("path resolved",setup.pathResolved,true);

const trade=core.calculateTrade(setup,bars[3].close);
t("midpoint stop",trade.midpointStop,377.185);
t("structure stop",trade.structureStop,378.61);
t("signal bar magnitude hit",bars[3].low<=setup.magnitude,true);
t("signal bar midpoint stop not hit",bars[3].high>=trade.midpointStop,false);
t("signal bar structure stop not hit",bars[3].high>=trade.structureStop,false);

const midpointOutcome=outcomes.classifyOutcome({
  direction:"BEARISH",
  entry:setup.trigger,
  stop:trade.midpointStop,
  magnitude:setup.magnitude,
  magnitudeHit:true,
  stopHit:false
});
t("midpoint-stop outcome",midpointOutcome.status,"WIN");

const structureOutcome=outcomes.classifyOutcome({
  direction:"BEARISH",
  entry:setup.trigger,
  stop:trade.structureStop,
  magnitude:setup.magnitude,
  magnitudeHit:true,
  stopHit:false
});
t("structure-stop outcome",structureOutcome.status,"WIN");

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
