"use client";

import { useState } from "react";
import type { Account, Entry } from "@/lib/ledger";
import { cn } from "@/lib/utils";
import { AmountInput, fmt, parseAmt, td, tdName } from "./shared";

/** Textbook-style journal: debits flush left, credits indented. */
export function JournalTable({ entries, labels }: { entries: Entry[]; labels: string[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full">
        <thead className="bg-white/[0.03]">
          <tr className="text-[11px] text-neutral-500">
            <th className="w-16 px-3 py-2 text-left font-medium">Ref</th>
            <th className="px-3 py-2 text-left font-medium">Account titles and explanation</th>
            <th className="px-3 py-2 text-right font-medium">Debit</th>
            <th className="px-3 py-2 text-right font-medium">Credit</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <EntryRows key={i} entry={e} label={labels[i]} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EntryRows({ entry, label }: { entry: Entry; label: string }) {
  const lines = [...entry.lines].sort((a, b) => (b.dr ? 1 : 0) - (a.dr ? 1 : 0));
  return (
    <>
      {lines.map((l, j) => (
        <tr key={j} className={j === 0 ? "border-t border-white/5" : ""}>
          <td className="px-3 py-1 align-top font-mono text-[11px] text-neutral-500">{j === 0 ? label : ""}</td>
          <td className={cn(tdName, "py-1", l.cr ? "pl-10 text-neutral-400" : "")}>{l.account}</td>
          <td className={cn(td, "py-1")}>{fmt(l.dr ?? 0)}</td>
          <td className={cn(td, "py-1")}>{fmt(l.cr ?? 0)}</td>
        </tr>
      ))}
      <tr><td /><td className="px-3 pb-2 pl-6 text-[11px] italic text-neutral-500" colSpan={3}>{entry.memo}</td></tr>
    </>
  );
}

type Row = { account: string; dr: string; cr: string };
const key = (a: string, dr: number, cr: number) => `${a}|${dr}|${cr}`;

/** Build each entry yourself, then check it against the answer. */
export function EntryPractice({ entries, prompts, labels, accounts }: { entries: Entry[]; prompts: string[]; labels: string[]; accounts: Account[] }) {
  return (
    <div className="space-y-3">
      {entries.map((e, i) => <OneEntry key={i} entry={e} prompt={prompts[i]} label={labels[i]} accounts={accounts} />)}
    </div>
  );
}

function OneEntry({ entry, prompt, label, accounts }: { entry: Entry; prompt: string; label: string; accounts: Account[] }) {
  const blank = () => entry.lines.map(() => ({ account: "", dr: "", cr: "" }));
  const [rows, setRows] = useState<Row[]>(blank);
  const [result, setResult] = useState<null | boolean>(null);
  const [reveal, setReveal] = useState(false);

  const set = (i: number, patch: Partial<Row>) => { setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x))); setResult(null); };
  const check = () => {
    const want = entry.lines.map((l) => key(l.account, l.dr ?? 0, l.cr ?? 0)).sort();
    const got = rows.map((r) => key(r.account, parseAmt(r.dr), parseAmt(r.cr))).sort();
    setResult(JSON.stringify(want) === JSON.stringify(got));
  };

  return (
    <div className={cn("rounded-xl border p-4", result === true ? "border-emerald-500/40" : result === false ? "border-rose-500/40" : "border-white/10")}>
      <p className="text-sm text-neutral-200"><span className="mr-2 font-mono text-[11px] text-neutral-500">{label}</span>{prompt}</p>
      <div className="mt-3 space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select value={r.account} onChange={(e) => set(i, { account: e.target.value })}
              className="min-w-56 rounded border border-white/10 bg-black/40 px-2 py-1 text-[13px] text-neutral-100">
              <option value="">— account —</option>
              {accounts.map((a) => <option key={a.name}>{a.name}</option>)}
            </select>
            <span className="text-[11px] text-neutral-500">Dr</span><AmountInput value={r.dr} onChange={(v) => set(i, { dr: v })} />
            <span className="text-[11px] text-neutral-500">Cr</span><AmountInput value={r.cr} onChange={(v) => set(i, { cr: v })} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs">
        <button onClick={check} className="rounded-md bg-white/10 px-3 py-1 text-white hover:bg-white/15">Check</button>
        <button onClick={() => setReveal((v) => !v)} className="text-neutral-400 hover:text-white">{reveal ? "Hide answer" : "Show answer"}</button>
        {result !== null && <span className={result ? "text-emerald-400" : "text-rose-400"}>{result ? "Correct!" : "Not quite. Check the accounts and amounts."}</span>}
      </div>
      {reveal && (
        <div className="mt-3 rounded-lg bg-white/[0.03] p-3 font-mono text-[12px]">
          {[...entry.lines].sort((a, b) => (b.dr ? 1 : 0) - (a.dr ? 1 : 0)).map((l, j) => (
            <div key={j} className={cn("flex", l.cr && "pl-8 text-neutral-400")}>
              <span className="flex-1">{l.account}</span><span>{fmt(l.dr ?? l.cr ?? 0)}</span>
            </div>
          ))}
          <p className="mt-1 font-sans text-[11px] italic text-neutral-500">{entry.memo}</p>
        </div>
      )}
    </div>
  );
}
