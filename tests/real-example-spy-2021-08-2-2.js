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

// Adjusted SPY daily OHLC from StatMuse, August 2021.
const bars=[
  {time:"2021-08-17",open:415.19,high:415.86,low:412.02,close:415.00},
  {time:"2021-08-18",open:413.99,high:415.55,low:410.22,close:410.46},
  {time:"2021-08-19",open:407.74,high:412.29,low:407.60,close:411.10},
  {time:"2021-08-20",open:411.44,high:414.69,low:410.96,close:414.37},
  {time:"2021-08-23",open:416.05,high:418.92,low:414.44,close:418.01},
  {time:"2021-08-24",open:418.68,high:419.21,low:418.16,close:418.68},
  {time:"2021-08-25",open:418.86,high:420.07,low:418.49,close:419.55},
  {time:"2021-08-26",open:419.27,high:419.51,low:416.98,close:417.08}
];

// RM-002A: bullish daily 2-2 on 2021-08-20.
t("Aug 18 is 2D",core.classifyBar(bars[1],bars[0]),"2D");
t("Aug 19 is 2D",core.classifyBar(bars[2],bars[1]),"2D");
t("Aug 20 is 2U",core.classifyBar(bars[3],bars[2]),"2U");

const bull=core.detectSetup(bars.slice(0,4));
t("bull setup",{name:bull.name,direction:bull.direction},{name:"2-2",direction:"BULLISH"});
t("bull trigger",bull.trigger,412.29);
t("bull first magnitude",bull.magnitude,415.55);

const bullTrade=core.calculateTrade(bull,bars[3].close);
t("bull midpoint stop",bullTrade.midpointStop,409.945);
t("bull signal bar did not hit magnitude",bars[3].high>=bull.magnitude,false);
t("bull signal bar did not hit midpoint stop",bars[3].low<=bullTrade.midpointStop,false);
t("bull next bar hit magnitude",bars[4].high>=bull.magnitude,true);

const bullOutcome=outcomes.classifyOutcome({
  direction:"BULLISH",
  entry:bull.trigger,
  stop:bullTrade.midpointStop,
  magnitude:bull.magnitude,
  magnitudeHit:true,
  stopHit:false
});
t("bull outcome magnitude before midpoint stop",bullOutcome.status,"WIN");

// RM-002B: bearish daily 2-2 on 2021-08-26.
t("Aug 24 is 2U",core.classifyBar(bars[5],bars[4]),"2U");
t("Aug 25 is 2U",core.classifyBar(bars[6],bars[5]),"2U");
t("Aug 26 is 2D",core.classifyBar(bars[7],bars[6]),"2D");

const bear=core.detectSetup(bars.slice(4,8));
t("bear setup",{name:bear.name,direction:bear.direction},{name:"2-2",direction:"BEARISH"});
t("bear trigger",bear.trigger,418.49);
t("bear first magnitude",bear.magnitude,418.16);

const bearTrade=core.calculateTrade(bear,bars[7].close);
t("bear midpoint stop",bearTrade.midpointStop,419.28);
t("bear signal bar hit magnitude",bars[7].low<=bear.magnitude,true);
t("bear signal bar also hit midpoint stop",bars[7].high>=bearTrade.midpointStop,true);
t("bear signal bar did not hit structure stop",bars[7].high>=bearTrade.structureStop,false);

const bearMidpointOutcome=outcomes.classifyOutcome({
  direction:"BEARISH",
  entry:bear.trigger,
  stop:bearTrade.midpointStop,
  magnitude:bear.magnitude,
  magnitudeHit:true,
  stopHit:true
});
t("bear midpoint-stop outcome remains sequence ambiguous",bearMidpointOutcome.status,"AMBIGUOUS");

const bearStructureOutcome=outcomes.classifyOutcome({
  direction:"BEARISH",
  entry:bear.trigger,
  stop:bearTrade.structureStop,
  magnitude:bear.magnitude,
  magnitudeHit:true,
  stopHit:false
});
t("bear structure-stop scenario is a win",bearStructureOutcome.status,"WIN");

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
