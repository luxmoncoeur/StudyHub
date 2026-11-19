"use client";
import { useState } from "react";
import { Btn, Field, inputCls, peso } from "./ui";

type Type = "asset" | "contra" | "liability" | "capital" | "drawing" | "revenue" | "expense";
const ACCOUNTS: Record<string, Type> = {
  Cash: "asset", "Accounts Receivable": "asset", Supplies: "asset", "Prepaid Rent": "asset", "Computer Equipment": "asset",
  "Accumulated Depreciation": "contra", "Accounts Payable": "liability", "Salaries Payable": "liability",
  "Capital": "capital", "Drawing": "drawing", "Service Revenue": "revenue",
  "Salaries Expense": "expense", "Rent Expense": "expense", "Supplies Expense": "expense", "Depreciation Expense": "expense",
};
const DEBIT_NORMAL: Type[] = ["asset", "drawing", "expense"];

type Line = [account: string, dr: number, cr: number];
type Entry = { memo: string; lines: Line[]; adj?: boolean };

// Dela Cruz Web Design Services, Nov 2026 (numbers verified: NI ₱40,200, TA ₱225,200)
const PRESET: Entry[] = [
  { memo: "Owner invests cash", lines: [["Cash", 150000, 0], ["Capital", 0, 150000]] },
  { memo: "Equipment: ₱20k cash, ₱40k on account", lines: [["Computer Equipment", 60000, 0], ["Cash", 0, 20000], ["Accounts Payable", 0, 40000]] },
  { memo: "3 months rent in advance", lines: [["Prepaid Rent", 18000, 0], ["Cash", 0, 18000]] },
  { memo: "Office supplies for cash", lines: [["Supplies", 5000, 0], ["Cash", 0, 5000]] },
  { memo: "Website built, cash collected", lines: [["Cash", 35000, 0], ["Service Revenue", 0, 35000]] },
  { memo: "Services on account", lines: [["Accounts Receivable", 25000, 0], ["Service Revenue", 0, 25000]] },
  { memo: "Collect from client", lines: [["Cash", 15000, 0], ["Accounts Receivable", 0, 15000]] },
  { memo: "Pay assistant salary", lines: [["Salaries Expense", 12000, 0], ["Cash", 0, 12000]] },
  { memo: "Owner withdraws", lines: [["Drawing", 8000, 0], ["Cash", 0, 8000]] },
  { memo: "(a) 1 month rent expired", adj: true, lines: [["Rent Expense", 6000, 0], ["Prepaid Rent", 0, 6000]] },
  { memo: "(b) Supplies used (₱3,200 left)", adj: true, lines: [["Supplies Expense", 1800, 0], ["Supplies", 0, 1800]] },
  { memo: "(c) Depreciation 60,000 ÷ 60 mo", adj: true, lines: [["Depreciation Expense", 1000, 0], ["Accumulated Depreciation", 0, 1000]] },
  { memo: "(d) Accrued salaries", adj: true, lines: [["Salaries Expense", 3000, 0], ["Salaries Payable", 0, 3000]] },
  { memo: "(e) Unbilled services", adj: true, lines: [["Accounts Receivable", 4000, 0], ["Service Revenue", 0, 4000]] },
];

export function LedgerDemo() {
  const [entries, setEntries] = useState(PRESET);
  const [upto, setUpto] = useState(PRESET.length);
  const [form, setForm] = useState({ memo: "", dr: "Cash", cr: "Service Revenue", amt: "" });
  const posted = entries.slice(0, upto);

  const bal: Record<string, number> = {};
  for (const e of posted) for (const [a, dr, cr] of e.lines) bal[a] = (bal[a] ?? 0) + dr - cr; // + = debit balance
  const sum = (t: Type) => Object.entries(bal).filter(([a]) => ACCOUNTS[a] === t).reduce((s, [, v]) => s + v, 0);
  const assets = sum("asset") + sum("contra");
  const liab = -sum("liability");
  const revenue = -sum("revenue"), expenses = sum("expense");
  const ni = revenue - expenses;
  const equity = -sum("capital") - sum("drawing") + ni;
  const tb = Object.entries(bal).filter(([, v]) => v !== 0);
  const tdr = tb.reduce((s, [, v]) => s + Math.max(v, 0), 0), tcr = tb.reduce((s, [, v]) => s + Math.max(-v, 0), 0);

  const add = () => {
    const amt = Number(form.amt);
    if (!(amt > 0) || form.dr === form.cr) return;
    const next = [...entries.slice(0, upto), { memo: form.memo || `${form.dr} / ${form.cr}`, lines: [[form.dr, amt, 0], [form.cr, 0, amt]] as Line[] }];
    setEntries(next); setUpto(next.length); setForm({ ...form, memo: "", amt: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <Field label={`Posted: ${upto}/${entries.length} entries (drag to replay)`}>
          <input type="range" min={0} max={entries.length} value={upto} onChange={(e) => setUpto(+e.target.value)} className="w-64" />
        </Field>
        <Btn onClick={() => { setEntries(PRESET); setUpto(PRESET.length); }}>Reset example</Btn>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[["Assets", assets], ["Liabilities", liab], ["Owner's Equity", equity]].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-white/10 p-3">
            <p className="text-[11px] text-neutral-500">{k}</p>
            <p className="font-mono text-lg text-white">{peso(v as number)}</p>
          </div>
        ))}
      </div>
      <p className={`text-center text-xs ${assets === liab + equity ? "text-emerald-400" : "text-rose-400"}`}>
        A = L + OE {assets === liab + equity ? "✓ balanced" : "✗ not balanced"}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-white">Journal</p>
          <ol className="max-h-72 space-y-1 overflow-y-auto pr-2 text-xs">
            {posted.map((e, i) => (
              <li key={i} className="rounded-md bg-white/[0.03] px-3 py-2">
                <span className="text-neutral-500">{i + 1}. </span><span className={e.adj ? "text-amber-300" : "text-neutral-200"}>{e.memo}</span>
                {e.lines.map(([a, dr, cr]) => (
                  <div key={a} className={`flex font-mono ${cr ? "pl-6 text-neutral-400" : "text-neutral-300"}`}>
                    <span className="flex-1">{a}</span><span>{dr ? peso(dr) : peso(cr)}</span>
                  </div>
                ))}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-white">Trial balance</p>
          <table className="w-full font-mono text-xs">
            <tbody>
              {tb.map(([a, v]) => (
                <tr key={a} className="border-b border-white/5">
                  <td className="py-1 font-sans text-neutral-300">{a}</td>
                  <td className="text-right text-neutral-200">{v > 0 ? peso(v) : ""}</td>
                  <td className="text-right text-neutral-200">{v < 0 ? peso(-v) : ""}</td>
                </tr>
              ))}
              <tr className="text-white"><td className="py-1.5 font-sans">Total</td><td className="text-right">{peso(tdr)}</td><td className="text-right">{peso(tcr)}</td></tr>
            </tbody>
          </table>
          <div className="mt-4 rounded-lg border border-white/10 p-3 text-xs">
            <p className="mb-1 font-medium text-white">Income statement</p>
            <div className="flex justify-between"><span>Revenue</span><span className="font-mono">{peso(revenue)}</span></div>
            <div className="flex justify-between"><span>Expenses</span><span className="font-mono">({peso(expenses)})</span></div>
            <div className="mt-1 flex justify-between border-t border-white/10 pt-1 text-white"><span>Net income</span><span className="font-mono">{peso(ni)}</span></div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 border-t border-white/5 pt-4">
        <Field label="Memo"><input className={inputCls} value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="e.g. Paid electricity" /></Field>
        <Field label="Debit"><select className={inputCls} value={form.dr} onChange={(e) => setForm({ ...form, dr: e.target.value })}>{Object.keys(ACCOUNTS).map((a) => <option key={a}>{a}</option>)}</select></Field>
        <Field label="Credit"><select className={inputCls} value={form.cr} onChange={(e) => setForm({ ...form, cr: e.target.value })}>{Object.keys(ACCOUNTS).map((a) => <option key={a}>{a}</option>)}</select></Field>
        <Field label="Amount ₱"><input type="number" min={0} className={`${inputCls} w-28`} value={form.amt} onChange={(e) => setForm({ ...form, amt: e.target.value })} /></Field>
        <Btn onClick={add}>Post entry</Btn>
      </div>
      <p className="text-xs text-neutral-500">Normal balance: {DEBIT_NORMAL.join(", ")} → debit. Liabilities, capital, revenue → credit (DEALER).</p>
    </div>
  );
}
