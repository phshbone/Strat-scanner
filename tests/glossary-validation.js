"use strict";

const assert=require("assert");
const {TERMS,getGlossaryTerm,searchGlossary,listGlossaryCategories}=require("../glossary.js");

let passed=0;
function test(name,fn){fn();passed+=1;console.log(`PASS ${passed}: ${name}`);}

test("glossary has substantial starter coverage",()=>assert(TERMS.length>=20));
test("ids are unique",()=>assert.equal(new Set(TERMS.map(t=>t.id)).size,TERMS.length));
test("terms are unique",()=>assert.equal(new Set(TERMS.map(t=>t.term.toLowerCase())).size,TERMS.length));
test("all terms have category",()=>assert(TERMS.every(t=>t.category)));
test("all terms have definition",()=>assert(TERMS.every(t=>t.definition && t.definition.length>20)));
test("FTFC resolves by alias",()=>assert.equal(getGlossaryTerm("FTFC").id,"ftfc"));
test("Scenario 3 resolves by exact term",()=>assert.equal(getGlossaryTerm("Scenario 3").id,"scenario-3"));
test("2U resolves by alias",()=>assert.equal(getGlossaryTerm("2U").id,"scenario-2-up"));
test("unknown term returns null",()=>assert.equal(getGlossaryTerm("not-a-real-term"),null));
test("search finds definitions",()=>assert(searchGlossary("probability").some(t=>t.id==="breadth" || t.id==="ftfc")));
test("search finds aliases",()=>assert(searchGlossary("PMG").some(t=>t.id==="pmg")));
test("empty search returns all terms",()=>assert.equal(searchGlossary("").length,TERMS.length));
test("categories are unique",()=>{
  const cats=listGlossaryCategories();
  assert.equal(new Set(cats).size,cats.length);
});
test("Scenario 3 warns against invented path",()=>assert(getGlossaryTerm("Scenario 3").definition.includes("may not reveal which side broke first")));
test("breadth explicitly is not win probability",()=>assert(getGlossaryTerm("Breadth").definition.includes("not a win probability")));
test("wait state prevents context manufacturing a trade",()=>assert(getGlossaryTerm("Wait").definition.includes("cannot override")));

console.log(`\n${passed}/${passed} PASS glossary validation`);
