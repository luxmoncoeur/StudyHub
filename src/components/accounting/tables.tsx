"use client";

import { useState } from "react";
import type { Solution, WsRow } from "@/lib/ledger";
import { cn } from "@/lib/utils";
import { AmountInput, Score, fmt, parseAmt, td, tdName, th } from "./shared";

/* ---------- Ledger (T-accounts) ---------- */
export function Ledger({ sol, includeAdj }: { sol: Solution; includeAdj: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sol.ledger.map(({ account, postings, unadj, adjusted }) => {
        const ps = includeAdj ? postings : postings.filter((p) => !p.adj);
        if (!ps.length) return null;
        const bal = includeAdj ? adjusted : unadj;
        const drs = ps.filter((p) => p.dr), crs = ps.filter((p) => p.cr);
        return (
          <div key={account.name} className="rounded-xl border border-white/10 p-3">
            <p className="border-b border-white/20 pb-1 text-center text-[13px] font-medium text-white">{account.name}</p>
            <div className="grid grid-cols-2 font-mono text-[12px]">
              <div className="border-r border-white/20 pr-2 pt-1">
                {drs.map((p, i) => <div key={i} className="flex justify-between"><span className={cn("text-[10px]", p.adj ? "text-amber-300" : "text-neutral-500")}>{p.ref}</span><span>{fmt(p.dr)}</span></div>)}
              </div>
              <div className="pl-2 pt-1">
                {crs.map((p, i) => <div key={i} className="flex justify-between"><span className={cn("text-[10px]", p.adj ? "text-amber-300" : "text-neutral-500")}>{p.ref}</span><span>{fmt(p.cr)}</span></div>)}
              </div>
              <div className="mt-1 border-r border-t border-white/10 pr-2 text-right text-emerald-300">{bal.dr ? `bal ${fmt(bal.dr)}` : ""}</div>
              <div className="mt-1 border-t border-white/10 text-right text-emerald-300">{bal.cr ? `bal ${fmt(bal.cr)}` : ""}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Generic two-column balance table with practice ---------- */
type Cell = { key: string; want: number };

function usePractice() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const set = (k: string, v: string) => { setVals((s) => ({ ...s, [k]: v })); setChecked(false); };
  const state = (c: Cell) => (checked ? (parseAmt(vals[c.key] ?? "") === c.want ? "ok" : "bad") : undefined);
  const score = (cells: Cell[]) => cells.filter((c) => parseAmt(vals[c.key] ?? "") === c.want).length;
  return { vals, set, checked, setChecked, state, score, reset: () => { setVals({}); setChecked(false); } };
}

function PracticeBar({ onCheck, onReset, checked, ok, total }: { onCheck: () => void; onReset: () => void; checked: boolean; ok: number; total: number }) {
  return (
    <div className="mt-3 flex items-center gap-3 text-xs">
      <button onClick={onCheck} className="rounded-md bg-white/10 px-3 py-1 text-white hover:bg-white/15">Check answers</button>
      <button onClick={onReset} className="text-neutral-400 hover:text-white">Clear</button>
      {checked && <Score ok={ok} total={total} />}
      <span className="ml-auto text-neutral-600">Leave a cell blank if it has no amount.</span>
    </div>
  );
}

export function TrialBalance({ title, rows, practice }: { title: string; rows: { name: string; dr: number; cr: number }[]; practice: boolean }) {
  const p = usePractice();
  const cells: Cell[] = rows.flatMap((r, i) => [{ key: `${i}dr`, want: r.dr }, { key: `${i}cr`, want: r.cr }]);
  const tdr = rows.reduce((a, r) => a + r.dr, 0), tcr = rows.reduce((a, r) => a + r.cr, 0);
  cells.push({ key: "tdr", want: tdr }, { key: "tcr", want: tcr });
  const cell = (k: string, want: number) => practice
    ? <AmountInput value={p.vals[k] ?? ""} onChange={(v) => p.set(k, v)} state={p.state({ key: k, want })} />
    : fmt(want);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full">
          <thead className="bg-white/[0.03]">
            <tr><th className="px-3 py-2 text-left text-[11px] font-medium text-neutral-500">{title}</th><th className={th}>Debit</th><th className={th}>Credit</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r, i) => (
              <tr key={r.name}><td className={tdName}>{r.name}</td><td className={td}>{cell(`${i}dr`, r.dr)}</td><td className={td}>{cell(`${i}cr`, r.cr)}</td></tr>
            ))}
            <tr className="border-t-2 border-white/20 font-medium"><td className={cn(tdName, "text-white")}>Total</td><td className={cn(td, "text-white")}>{cell("tdr", tdr)}</td><td className={cn(td, "text-white")}>{cell("tcr", tcr)}</td></tr>
          </tbody>
        </table>
      </div>
      {practice && <PracticeBar onCheck={() => p.setChecked(true)} onReset={p.reset} checked={p.checked} ok={p.score(cells)} total={cells.length} />}
    </div>
  );
}

/* ---------- Worksheet (6 or 10 column) ---------- */
type Col = { label: string; dr: keyof WsRow; cr: keyof WsRow; practice: boolean };

export function Worksheet({ sol, columns, practice }: { sol: Solution; columns: "6" | "10"; practice: boolean }) {
  const p = usePractice();
  const hasAdj = sol.totals.adjDr > 0;
  const cols: Col[] = columns === "10"
    ? [
        { label: "Unadjusted Trial Balance", dr: "tbDr", cr: "tbCr", practice: false },
        { label: "Adjustments", dr: "adjDr", cr: "adjCr", practice: false },
        { label: "Adjusted Trial Balance", dr: "atbDr", cr: "atbCr", practice: true },
        { label: "Income Statement", dr: "isDr", cr: "isCr", practice: true },
        { label: "Balance Sheet", dr: "bsDr", cr: "bsCr", practice: true },
      ]
    : [
        { label: hasAdj ? "Adjusted Trial Balance" : "Trial Balance", dr: "atbDr", cr: "atbCr", practice: false },
        { label: "Income Statement", dr: "isDr", cr: "isCr", practice: true },
        { label: "Balance Sheet", dr: "bsDr", cr: "bsCr", practice: true },
      ];

  const ni = sol.netIncome;
  const niRow: Partial<Record<keyof WsRow, number>> = { isDr: ni > 0 ? ni : 0, isCr: ni < 0 ? -ni : 0, bsCr: ni > 0 ? ni : 0, bsDr: ni < 0 ? -ni : 0 };
  const T = sol.totals as unknown as Record<string, number>;
  const grand = (k: keyof WsRow) => T[k] + (niRow[k] ?? 0);

  const cells: Cell[] = [];
  const cell = (k: string, want: number, editable: boolean) => {
    if (practice && editable) { cells.push({ key: k, want }); return <AmountInput value={p.vals[k] ?? ""} onChange={(v) => p.set(k, v)} state={p.state({ key: k, want })} />; }
    return fmt(want);
  };
  const showNi = (k: keyof WsRow) => k in niRow;

  const body = (
    <table className="w-full">
      <thead className="bg-white/[0.03]">
        <tr>
          <th rowSpan={2} className="sticky left-0 bg-[#0d0e11] px-3 py-2 text-left text-[11px] font-medium text-neutral-500">Account titles</th>
          {cols.map((c) => <th key={c.label} colSpan={2} className="border-l border-white/10 px-3 pt-2 text-center text-[11px] font-medium text-neutral-300">{c.label}</th>)}
        </tr>
        <tr>{cols.map((c) => [<th key={c.dr} className={cn(th, "border-l border-white/10 pt-0")}>Dr</th>, <th key={c.cr} className={cn(th, "pt-0")}>Cr</th>])}</tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {sol.rows.map((r, i) => (
          <tr key={r.account.name}>
            <td className={cn(tdName, "sticky left-0 bg-[#07080a]")}>{r.account.name}</td>
            {cols.map((c) => [
              <td key={c.dr} className={cn(td, "border-l border-white/10")}>{cell(`${i}${c.dr}`, r[c.dr] as number, c.practice)}</td>,
              <td key={c.cr} className={td}>{cell(`${i}${c.cr}`, r[c.cr] as number, c.practice)}</td>,
            ])}
          </tr>
        ))}
        <tr className="border-t-2 border-white/20">
          <td className={cn(tdName, "sticky left-0 bg-[#07080a] font-medium text-white")}>Totals</td>
          {cols.map((c) => [
            <td key={c.dr} className={cn(td, "border-l border-white/10 text-white")}>{cell(`t${c.dr}`, T[c.dr], c.practice)}</td>,
            <td key={c.cr} className={cn(td, "text-white")}>{cell(`t${c.cr}`, T[c.cr], c.practice)}</td>,
          ])}
        </tr>
        <tr>
          <td className={cn(tdName, "sticky left-0 bg-[#07080a] text-emerald-300")}>{ni >= 0 ? "Net income" : "Net loss"}</td>
          {cols.map((c) => [
            <td key={c.dr} className={cn(td, "border-l border-white/10 text-emerald-300")}>{showNi(c.dr) ? cell(`ni${c.dr}`, niRow[c.dr] ?? 0, c.practice) : ""}</td>,
            <td key={c.cr} className={cn(td, "text-emerald-300")}>{showNi(c.cr) ? cell(`ni${c.cr}`, niRow[c.cr] ?? 0, c.practice) : ""}</td>,
          ])}
        </tr>
        <tr className="border-t-2 border-double border-white/30">
          <td className={cn(tdName, "sticky left-0 bg-[#07080a] font-medium text-white")}>Grand totals</td>
          {cols.map((c) => [
            <td key={c.dr} className={cn(td, "border-l border-white/10 font-medium text-white")}>{showNi(c.dr) && !(practice && c.practice) ? fmt(grand(c.dr)) : ""}</td>,
            <td key={c.cr} className={cn(td, "font-medium text-white")}>{showNi(c.cr) && !(practice && c.practice) ? fmt(grand(c.cr)) : ""}</td>,
          ])}
        </tr>
      </tbody>
    </table>
  );

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-white/10">{body}</div>
      {practice && <PracticeBar onCheck={() => p.setChecked(true)} onReset={p.reset} checked={p.checked} ok={p.score(cells)} total={cells.length} />}
    </div>
  );
}

/* ---------- Financial statements ---------- */
function Stmt({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <p className="text-center text-sm font-medium text-white">{title}</p>
      <p className="mb-3 text-center text-[11px] text-neutral-500">{sub}</p>
      <table className="w-full text-[13px]"><tbody>{children}</tbody></table>
    </div>
  );
}
const L = ({ name, a, b, indent, bold, line }: { name: string; a?: number | string; b?: number | string; indent?: number; bold?: boolean; line?: boolean }) => (
  <tr className={cn(bold && "font-medium text-white", line && "border-t border-white/20")}>
    <td className="py-0.5 text-neutral-300" style={{ paddingLeft: (indent ?? 0) * 16 }}>{name}</td>
    <td className="w-28 py-0.5 text-right font-mono tabular-nums">{typeof a === "number" ? fmt(a) : a}</td>
    <td className="w-28 py-0.5 text-right font-mono tabular-nums">{typeof b === "number" ? (b === 0 ? "0" : fmt(b)) : b}</td>
  </tr>
);

export function Statements({ sol, entity, period }: { sol: Solution; entity: string; period: string }) {
  const s = sol.statements;
  const asOf = period.replace(/^For the (month|year) ended /, "As of ");
  const netOf = (n: string) => s.netOf.find((x) => x.name === n)!.net;
  const assetLines = (list: typeof s.current) => list.flatMap((x) => x.contra.length
    ? [<L key={x.account.name} name={x.account.name} a={x.amount} indent={1} />,
       ...x.contra.map((c) => <L key={c.account.name} name={`Less: ${c.account.name}`} a={`(${fmt(c.amount)})`} b={netOf(x.account.name)} indent={2} />)]
    : [<L key={x.account.name} name={x.account.name} b={x.amount} indent={1} />]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <Stmt title={`${entity}`} sub={`Income Statement · ${period}`}>
          <L name="Revenue" bold />
          {s.revenues.map((r) => <L key={r.account.name} name={r.account.name} b={r.amount} indent={1} />)}
          <L name="Less: Expenses" bold />
          {s.expenses.map((r) => <L key={r.account.name} name={r.account.name} a={r.amount} indent={1} />)}
          <L name="Total expenses" b={`(${fmt(s.totalExpenses)})`} indent={1} line />
          <L name={sol.netIncome >= 0 ? "Net income" : "Net loss"} b={sol.netIncome} bold line />
        </Stmt>
        <Stmt title={`${entity}`} sub={`Statement of Changes in Owner's Equity · ${period}`}>
          <L name={`${s.capitalName}, beginning (incl. investments)`} b={s.capitalBeg} />
          <L name={sol.netIncome >= 0 ? "Add: Net income" : "Less: Net loss"} b={Math.abs(sol.netIncome)} />
          {s.drawingName && <L name={`Less: ${s.drawingName}`} b={`(${fmt(s.drawing)})`} />}
          <L name={`${s.capitalName}, ending`} b={s.capitalEnd} bold line />
        </Stmt>
      </div>
      <Stmt title={`${entity}`} sub={`Statement of Financial Position (Balance Sheet) · ${asOf}`}>
        <L name="ASSETS" bold />
        <L name="Current assets" bold />
        {assetLines(s.current)}
        <L name="Total current assets" b={s.totalCurrent} indent={1} line />
        {s.noncurrent.length > 0 && <><L name="Non-current assets" bold />{assetLines(s.noncurrent)}<L name="Total non-current assets" b={s.totalNoncurrent} indent={1} line /></>}
        <L name="TOTAL ASSETS" b={s.totalAssets} bold line />
        <tr><td className="py-2" /></tr>
        <L name="LIABILITIES AND OWNER'S EQUITY" bold />
        <L name="Current liabilities" bold />
        {s.currentLiab.map((l) => <L key={l.account.name} name={l.account.name} b={l.amount} indent={1} />)}
        {s.noncurrentLiab.length > 0 && <><L name="Non-current liabilities" bold />{s.noncurrentLiab.map((l) => <L key={l.account.name} name={l.account.name} b={l.amount} indent={1} />)}</>}
        <L name="Total liabilities" b={s.totalLiab} indent={1} line />
        <L name={s.capitalName} b={s.capitalEnd} indent={1} />
        <L name="TOTAL LIABILITIES AND OWNER'S EQUITY" b={s.totalLiabEquity} bold line />
      </Stmt>
    </div>
  );
}
