"use strict";

const TERMS=Object.freeze([
  {id:"scenario-1",term:"Scenario 1",aliases:["1","Inside Bar"],category:"Core Strat",definition:"A candle whose high is lower than or equal to the prior candle's high and whose low is higher than or equal to the prior candle's low. It represents consolidation/equilibrium."},
  {id:"scenario-2-up",term:"Scenario 2 Up",aliases:["2U","2 Up"],category:"Core Strat",definition:"A directional candle that takes out the prior candle's high without also taking out its low."},
  {id:"scenario-2-down",term:"Scenario 2 Down",aliases:["2D","2 Down"],category:"Core Strat",definition:"A directional candle that takes out the prior candle's low without also taking out its high."},
  {id:"scenario-3",term:"Scenario 3",aliases:["3","Outside Bar"],category:"Core Strat",definition:"A candle that takes out both the prior candle's high and low. Completed OHLC alone may not reveal which side broke first."},
  {id:"actionable-signal",term:"Actionable Signal",aliases:["Actionable Setup"],category:"Signals",definition:"A deterministic Strat setup with a defined direction and trigger that can become in force. Supporting evidence does not create an actionable signal by itself."},
  {id:"in-force",term:"In Force",aliases:["Triggered"],category:"Signals",definition:"A setup whose trigger has been exceeded in the required direction under the engine's strict trigger semantics."},
  {id:"212",term:"2-1-2 Reversal",aliases:["2-1-2","212"],category:"Setups",definition:"A reversal sequence consisting of a directional Scenario 2, followed by a Scenario 1 inside bar, then a Scenario 2 in the opposite direction."},
  {id:"312",term:"3-1-2 Reversal",aliases:["3-1-2","312"],category:"Setups",definition:"A reversal sequence consisting of a Scenario 3 outside bar, followed by a Scenario 1 inside bar, then a directional Scenario 2 trigger."},
  {id:"rev-strat",term:"Rev Strat",aliases:["Reversal Strat"],category:"Setups",definition:"A failed directional move that reverses through the opposite trigger, commonly discussed as a momentum reversal pattern. Exact sequence should be displayed from the detected setup."},
  {id:"magnitude",term:"Magnitude",aliases:["First Magnitude"],category:"Targets",definition:"The setup-specific structural objective derived from the relevant prior range or setup geometry. It is a target reference, not a guaranteed destination."},
  {id:"mother-bar",term:"Mother Bar",aliases:["Mother Candle"],category:"Structure",definition:"The larger candle whose range contains one or more subsequent inside bars."},
  {id:"broadening-formation",term:"Broadening Formation",aliases:["BF"],category:"Structure",definition:"Price structure characterized by expanding highs and lows. It supplies structural context and potential objectives but does not predict direction by itself."},
  {id:"pmg",term:"Pivot Machine Gun",aliases:["PMG"],category:"Structure",definition:"A sequence of closely spaced prior highs or lows that can act as successive structural objectives when price moves through them."},
  {id:"reclaim",term:"Reclaim",aliases:["Level of Reclaim"],category:"Structure",definition:"Price re-enters or regains a previously lost, explicitly defined structural range or boundary. Reclaim is not inferred from an arbitrary midpoint."},
  {id:"exhaustion",term:"Exhaustion",aliases:["Price Exhaustion","Time Exhaustion"],category:"Management",definition:"A condition where a structural price objective has completed or a setup has consumed an unusually large amount of time without expected progress. It is not an automatic reversal prediction."},
  {id:"ftfc",term:"Full Time Frame Continuity",aliases:["FTFC","Timeframe Continuity"],category:"Context",definition:"Alignment of multiple timeframes in the same direction, typically determined by current price relative to each timeframe's open. It is context, not a standalone trade probability."},
  {id:"carrier",term:"Carrier",aliases:["Higher-Timeframe Carrier"],category:"Multi-Timeframe",definition:"An already-active higher-timeframe setup or directional thesis that lower timeframes may confirm, conflict with, or execute against."},
  {id:"domino",term:"Domino",aliases:["Timeframe Domino"],category:"Multi-Timeframe",definition:"An observable chain in which lower- and higher-timeframe setups become active in the same directional thesis. It describes sequence/alignment, not causality."},
  {id:"breadth",term:"Market Participation",aliases:["Breadth","Participation"],category:"Context",definition:"The percentage distribution of a defined market, index, or sector universe across bullish, bearish, sideways, and unresolved states. It describes current participation and is not a win probability."},
  {id:"structural-rr",term:"Structural Reward-to-Risk",aliases:["R:R","Reward/Risk"],category:"Risk",definition:"The distance from entry to a validated structural target compared with the distance from entry to the selected stop/invalidation level."},
  {id:"mfe",term:"Maximum Favorable Excursion",aliases:["MFE"],category:"Statistics",definition:"The largest favorable price movement reached while a trade was open, measured from the entry reference."},
  {id:"mae",term:"Maximum Adverse Excursion",aliases:["MAE"],category:"Statistics",definition:"The largest adverse price movement experienced while a trade was open, measured from the entry reference."},
  {id:"practice-mode",term:"Practice Mode",aliases:["Paper Trading"],category:"Practice",definition:"The deterministic paper-trading layer used to test entries, management rules, scale-ins, stops, targets, and outcomes without broker execution authority."},
  {id:"scale-in",term:"Scale-In",aliases:["Add Shares","Pyramiding"],category:"Practice",definition:"Adding quantity to an already open practice trade under a separately identified management rule. A scale-in rule does not alter the validity of the original Strat entry."},
  {id:"ambiguous",term:"Ambiguous",aliases:["Intrabar Ambiguity"],category:"Data",definition:"A state used when completed OHLC shows multiple execution levels were crossed but cannot establish the order of events. The engine does not invent the missing path."},
  {id:"wait-no-setup",term:"Wait / No Actionable Setup",aliases:["WAIT_NO_ACTIONABLE_SETUP","Wait"],category:"Guidance",definition:"A first-class advisory state indicating that no deterministic actionable setup currently exists. Breadth, FTFC, or other context cannot override this state to manufacture a trade."}
]);

function normalizeQuery(value){return String(value||"").trim().toLowerCase();}

function getGlossaryTerm(idOrTerm){
  const q=normalizeQuery(idOrTerm);
  if(!q) return null;
  return TERMS.find(row=>row.id.toLowerCase()===q || row.term.toLowerCase()===q || row.aliases.some(a=>a.toLowerCase()===q))||null;
}

function searchGlossary(query){
  const q=normalizeQuery(query);
  if(!q) return TERMS.slice();
  return TERMS.filter(row=>{
    const hay=[row.term,row.category,row.definition,...row.aliases].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

function listGlossaryCategories(){return Array.from(new Set(TERMS.map(row=>row.category))).sort();}

if(typeof module!=="undefined") module.exports={TERMS,getGlossaryTerm,searchGlossary,listGlossaryCategories};
