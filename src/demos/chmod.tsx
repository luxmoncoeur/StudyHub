"use client";
import { useState } from "react";

const WHO = ["owner", "group", "others"] as const;
const BITS = [["r", 4], ["w", 2], ["x", 1]] as const;

export function ChmodDemo() {
  const [m, setM] = useState([7, 5, 5]);
  const flip = (w: number, b: number) => setM((s) => s.map((v, i) => (i === w ? v ^ b : v)));
  const octal = m.join("");
  const sym = m.map((v) => BITS.map(([c, b]) => (v & b ? c : "-")).join("")).join("");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2 text-sm">
        <span />
        {BITS.map(([c]) => <span key={c} className="text-center font-mono text-neutral-500">{c}</span>)}
        {WHO.map((w, wi) => (
          <div key={w} className="contents">
            <span className="text-neutral-400">{w}</span>
            {BITS.map(([c, b]) => (
              <button key={c} onClick={() => flip(wi, b)} aria-label={`${w} ${c}`}
                className={`h-9 rounded-md border font-mono transition ${m[wi] & b ? "border-sky-500/40 bg-sky-500/15 text-sky-300" : "border-white/10 text-neutral-600"}`}>
                {m[wi] & b ? c : "-"}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-6 font-mono text-sm">
        <span>octal <b className="text-white">{octal}</b></span>
        <span>ls -l <b className="text-white">-{sym}</b></span>
        <span className="text-sky-300">chmod {octal} file.sh</span>
      </div>
    </div>
  );
}
