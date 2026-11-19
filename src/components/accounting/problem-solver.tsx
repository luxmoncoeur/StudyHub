"use client";

import { useMemo, useState } from "react";
import { solve, type Problem } from "@/lib/ledger";
import { cn } from "@/lib/utils";
import { EntryPractice, JournalTable } from "./entries";
import { ModeToggle } from "./shared";
import { Ledger, Statements, TrialBalance, Worksheet } from "./tables";

type Step = { id: string; label: string; practice: boolean };

export function ProblemSolver({ problem }: { problem: Problem }) {
  const sol = useMemo(() => solve(problem), [problem]);
  const hasAdj = problem.adjustments.length > 0;
  const steps: Step[] = [
    { id: "journal", label: "Journal entries", practice: true },
    { id: "ledger", label: "Ledger", practice: false },
    { id: "tb", label: hasAdj ? "Unadjusted TB" : "Trial balance", practice: true },
    ...(hasAdj ? [{ id: "adj", label: "Adjusting entries", practice: true }] : []),
    { id: "ws", label: "Worksheet", practice: true },
    { id: "closing", label: "Closing entries", practice: false },
    { id: "pctb", label: "Post-closing TB", practice: true },
    { id: "fs", label: "Financial statements", practice: false },
  ];
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"practice" | "solution">("practice");
  const [wsCols, setWsCols] = useState<"6" | "10">(problem.worksheet);
  const cur = steps[step];
  const practice = cur.practice && mode === "practice";
  const letters = "abcdefghij";

  const tbRows = sol.rows.filter((r) => r.tbDr || r.tbCr).map((r) => ({ name: r.account.name, dr: r.tbDr, cr: r.tbCr }));
  const journalLabels = problem.journal.map((e, i) => e.date ?? String(i + 1));
  const adjLabels = problem.adjustments.map((_, i) => `(${letters[i]})`);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {steps.map((s, i) => (
          <button key={s.id} onClick={() => setStep(i)}
            className={cn("rounded-lg border px-3 py-1.5 text-xs transition",
              i === step ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-white/10 text-neutral-400 hover:text-white")}>
            <span className="mr-1 font-mono text-[10px] opacity-60">{letters[i]}.</span>{s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-base font-medium text-white">{letters[step]}. {cur.label}</h3>
        {cur.id === "ws" && (
          <div className="inline-flex rounded-lg border border-white/10 p-0.5 text-xs">
            {(["6", "10"] as const).map((c) => (
              <button key={c} onClick={() => setWsCols(c)} className={cn("rounded-md px-3 py-1", wsCols === c ? "bg-white/10 text-white" : "text-neutral-500")}>{c}-column</button>
            ))}
          </div>
        )}
        <div className="ml-auto"><ModeToggle mode={cur.practice ? mode : "solution"} setMode={setMode} practice={cur.practice} /></div>
      </div>

      {cur.id === "journal" && (practice
        ? <EntryPractice entries={problem.journal} prompts={problem.transactions} labels={journalLabels} accounts={problem.accounts} />
        : <JournalTable entries={problem.journal} labels={journalLabels} />)}

      {cur.id === "ledger" && (
        <>
          <p className="text-xs text-neutral-500">Posted from the journal{hasAdj ? ". Toggle below to include adjusting entries (amber refs)." : "."}</p>
          <LedgerWithToggle sol={sol} hasAdj={hasAdj} />
        </>
      )}

      {cur.id === "tb" && <TrialBalance key={`tb-${practice}`} title={`${problem.entity} · ${hasAdj ? "Unadjusted Trial Balance" : "Trial Balance"}`} rows={tbRows} practice={practice} />}

      {cur.id === "adj" && (
        <>
          <ul className="list-disc space-y-1 rounded-xl border border-white/10 bg-white/[0.02] p-4 pl-8 text-sm text-neutral-300">
            {problem.additional.map((a) => <li key={a}>{a}</li>)}
            <li className="text-neutral-500">Also check the transactions for accruals (e.g. interest on loans).</li>
          </ul>
          {practice
            ? <EntryPractice entries={problem.adjustments} prompts={problem.adjustments.map(() => "Prepare the adjusting entry.")} labels={adjLabels} accounts={problem.accounts} />
            : <JournalTable entries={problem.adjustments} labels={adjLabels} />}
        </>
      )}

      {cur.id === "ws" && (
        <>
          <p className="text-xs text-neutral-500">
            {practice ? (wsCols === "10" ? "Fill in the Adjusted TB, Income Statement and Balance Sheet columns." : "Extend each balance to the Income Statement or Balance Sheet columns.") : "Revenue and expenses go to the IS columns. Everything else, including Drawing and contra-assets, goes to the BS columns."}
          </p>
          <Worksheet key={`ws-${wsCols}-${practice}`} sol={sol} columns={wsCols} practice={practice} />
        </>
      )}

      {cur.id === "closing" && <JournalTable entries={sol.closing} labels={sol.closing.map((_, i) => `(${i + 1})`)} />}

      {cur.id === "pctb" && <TrialBalance key={`pc-${practice}`} title={`${problem.entity} · Post-closing Trial Balance`} rows={sol.postClosing} practice={practice} />}

      {cur.id === "fs" && <Statements sol={sol} entity={problem.entity} period={problem.period} />}

      <div className="flex justify-between border-t border-white/5 pt-4 text-sm">
        <button disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="text-neutral-400 hover:text-white disabled:opacity-30">← {steps[step - 1]?.label ?? ""}</button>
        <button disabled={step === steps.length - 1} onClick={() => setStep((s) => s + 1)} className="text-neutral-400 hover:text-white disabled:opacity-30">{steps[step + 1]?.label ?? ""} →</button>
      </div>
    </div>
  );
}

function LedgerWithToggle({ sol, hasAdj }: { sol: ReturnType<typeof solve>; hasAdj: boolean }) {
  const [adj, setAdj] = useState(false);
  return (
    <div className="space-y-3">
      {hasAdj && (
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          <input type="checkbox" checked={adj} onChange={(e) => setAdj(e.target.checked)} /> Include adjusting entries
        </label>
      )}
      <Ledger sol={sol} includeAdj={adj} />
    </div>
  );
}
