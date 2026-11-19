// Run: npx tsx src/lib/ledger.test.ts
import assert from "node:assert/strict";
import { solve } from "./ledger";
import { problems } from "../content/accounting-problems";

for (const p of problems) {
  const s = solve(p);
  assert.equal(s.totals.tbDr, s.totals.tbCr, `${p.id} TB`);
  assert.equal(s.totals.atbDr, s.totals.atbCr, `${p.id} ATB`);
  assert.equal(s.totals.isCr - s.totals.isDr, s.totals.bsDr - s.totals.bsCr, `${p.id} NI both sides`);
  assert.equal(s.postClosingTotal.dr, s.postClosingTotal.cr, `${p.id} post-closing`);
  assert.equal(s.statements.totalAssets, s.statements.totalLiabEquity, `${p.id} A = L + OE`);
  console.log(p.id.padEnd(16), "TB", s.totals.tbDr, "| NI", s.netIncome, "| TA", s.statements.totalAssets, "| PCTB", s.postClosingTotal.dr);
}
const dc = solve(problems.find((p) => p.id === "dela-cruz")!);
assert.equal(dc.netIncome, 40200);           // matches the hand-verified research example
assert.equal(dc.statements.totalAssets, 225200);
const ea = solve(problems.find((p) => p.id === "entity-a")!);
assert.equal(ea.netIncome, 345000);          // 600,000 − 255,000
console.log("all checks passed");
