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

// Adjusted SPY daily OHLC from StatMuse, November 2021.
// Selected dates contain both bearish and bullish 2-1-2 reversals.
const bars=[
  {time:"2021-11-04",open:436.32,high:437.86,low:435.98,close:437.78},
  {time:"2021-11-05",open:440.00,high:441.28,low:437.78,close:439.29},
  {time:"2021-11-08",open:440.39,high:440.89,low:438.99,close:439.67},
  {time:"2021-11-09",open:440.04,high:440.27,low:436.81,close:438.22},
  {time:"2021-11-10",open:436.53,high:438.22,low:433.21,close:434.69},
  {time:"2021-11-11",open:436.18,high:436.26,low:434.81,close:434.83},
  {time:"2021-11-12",open:436.10,high:438.67,low:435.15,close:438.11}
];

// RM-003A: bearish daily 2-1-2 on 2021-11-09.
t("Nov 5 is 2U",core.classifyBar(bars[1],bars[0]),"2U");
t("Nov 8 is inside",core.classifyBar(bars[2],bars[1]),"1");
t("Nov 9 is 2D",core.classifyBar(bars[3],bars[2]),"2D");

const bear=core.detectSetup(bars.slice(0,4));
t("bear setup",{name:bear.name,direction:bear.direction},{name:"2-1-2",direction:"BEARISH"});
t("bear trigger",bear.trigger,438.99);
t("bear first magnitude",bear.magnitude,437.78);

const bearTrade=core.calculateTrade(bear,bars[3].close);
t("bear midpoint stop",bearTrade.midpointStop,439.94);
t("bear signal bar hit magnitude",bars[3].low<=bear.magnitude,true);
t("bear signal bar hit midpoint stop",bars[3].high>=bearTrade.midpointStop,true);
t("bear signal bar did not hit structure stop",bars[3].high>=bearTrade.structureStop,false);

const bearMidpointOutcome=outcomes.classifyOutcome({
  direction:"BEARISH",
  entry:bear.trigger,
  stop:bearTrade.midpointStop,
  magnitude:bear.magnitude,
  magnitudeHit:true,
  stopHit:true
});
t("bear midpoint-stop outcome is ambiguous from daily OHLC",bearMidpointOutcome.status,"AMBIGUOUS");

const bearStructureOutcome=outcomes.classifyOutcome({
  direction:"BEARISH",
  entry:bear.trigger,
  stop:bearTrade.structureStop,
  magnitude:bear.magnitude,
  magnitudeHit:true,
  stopHit:false
});
t("bear structure-stop scenario is a win",bearStructureOutcome.status,"WIN");

// RM-003B: bullish daily 2-1-2 on 2021-11-12.
t("Nov 10 is 2D",core.classifyBar(bars[4],bars[3]),"2D");
t("Nov 11 is inside",core.classifyBar(bars[5],bars[4]),"1");
t("Nov 12 is 2U",core.classifyBar(bars[6],bars[5]),"2U");

const bull=core.detectSetup(bars.slice(3,7));
t("bull setup",{name:bull.name,direction:bull.direction},{name:"2-1-2",direction:"BULLISH"});
t("bull trigger",bull.trigger,436.26);
t("bull first magnitude",bull.magnitude,438.22);

const bullTrade=core.calculateTrade(bull,bars[6].close);
t("bull midpoint stop",bullTrade.midpointStop,435.535);
t("bull signal bar hit magnitude",bars[6].high>=bull.magnitude,true);
t("bull signal bar hit midpoint stop",bars[6].low<=bullTrade.midpointStop,true);
t("bull signal bar did not hit structure stop",bars[6].low<=bullTrade.structureStop,false);

const bullMidpointOutcome=outcomes.classifyOutcome({
  direction:"BULLISH",
  entry:bull.trigger,
  stop:bullTrade.midpointStop,
  magnitude:bull.magnitude,
  magnitudeHit:true,
  stopHit:true
});
t("bull midpoint-stop outcome is ambiguous from daily OHLC",bullMidpointOutcome.status,"AMBIGUOUS");

const bullStructureOutcome=outcomes.classifyOutcome({
  direction:"BULLISH",
  entry:bull.trigger,
  stop:bullTrade.structureStop,
  magnitude:bull.magnitude,
  magnitudeHit:true,
  stopHit:false
});
t("bull structure-stop scenario is a win",bullStructureOutcome.status,"WIN");

console.log(JSON.stringify({pass,fail,failures},null,2));
process.exit(fail?1:0);
