"use client";

import { cn } from "@/lib/utils";

export const fmt = (n: number) => (n ? n.toLocaleString("en-PH") : "");
export const parseAmt = (s: string) => Number(s.replace(/[₱,\s]/g, "")) || 0;

export const th = "px-3 py-2 text-right text-[11px] font-medium text-neutral-500";
export const td = "px-3 py-1.5 text-right font-mono text-[12.5px] tabular-nums text-neutral-200";
export const tdName = "px-3 py-1.5 text-left text-[13px] text-neutral-300 whitespace-nowrap";

export function AmountInput({ value, onChange, state }: { value: string; onChange: (v: string) => void; state?: "ok" | "bad" }) {
  return (
    <input inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)}
      className={cn("w-24 rounded border bg-black/40 px-1.5 py-1 text-right font-mono text-[12px] text-neutral-100 outline-none focus:border-sky-500/60",
        state === "ok" ? "border-emerald-500/60 bg-emerald-500/10" : state === "bad" ? "border-rose-500/60 bg-rose-500/10" : "border-white/10")} />
  );
}

export function ModeToggle({ mode, setMode, practice = true }: { mode: "practice" | "solution"; setMode: (m: "practice" | "solution") => void; practice?: boolean }) {
  return (
    <div className="inline-flex rounded-lg border border-white/10 p-0.5 text-xs">
      {(["practice", "solution"] as const).filter((m) => practice || m === "solution").map((m) => (
        <button key={m} onClick={() => setMode(m)}
          className={cn("rounded-md px-3 py-1 capitalize transition", mode === m ? "bg-white/10 text-white" : "text-neutral-500 hover:text-neutral-200")}>
          {m === "practice" ? "Try it" : "Solution"}
        </button>
      ))}
    </div>
  );
}

export function Score({ ok, total }: { ok: number; total: number }) {
  return (
    <span className={cn("text-xs", ok === total ? "text-emerald-400" : "text-amber-300")}>
      {ok}/{total} correct{ok === total ? " 🎉" : ""}
    </span>
  );
}
