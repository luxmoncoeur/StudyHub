"use client";
import { useState } from "react";
import { inputCls } from "./ui";

const SCALE = [5, 4, 3, 2, 1];
const verbal = (m: number) =>
  m >= 4.21 ? "Strongly Agree / Excellent" : m >= 3.41 ? "Agree / Very Good" : m >= 2.61 ? "Neutral / Good" : m >= 1.81 ? "Disagree / Fair" : "Strongly Disagree / Poor";

const CRITERIA = ["Functional Suitability", "Performance Efficiency", "Usability", "Reliability", "Security"];

export function LikertDemo() {
  const [rows, setRows] = useState(CRITERIA.map(() => [12, 10, 5, 2, 1]));
  const set = (r: number, c: number, v: number) => setRows((s) => s.map((row, i) => (i === r ? row.map((x, j) => (j === c ? Math.max(0, v) : x)) : row)));
  const mean = (row: number[]) => { const n = row.reduce((a, b) => a + b, 0); return n ? row.reduce((a, f, i) => a + f * SCALE[i], 0) / n : 0; };
  const overall = rows.reduce((a, r) => a + mean(r), 0) / rows.length;

  return (
    <div className="space-y-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-neutral-500">
          <tr><th className="py-2 text-left font-normal">ISO/IEC 25010 criterion</th>{SCALE.map((s) => <th key={s} className="font-normal">f({s})</th>)}<th className="font-normal">WM</th><th className="text-left font-normal">Interpretation</th></tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={CRITERIA[r]} className="border-t border-white/5">
              <td className="py-1.5 text-neutral-300">{CRITERIA[r]}</td>
              {row.map((f, c) => (
                <td key={c} className="px-1"><input type="number" min={0} className={`${inputCls} w-14 text-center`} value={f} onChange={(e) => set(r, c, +e.target.value)} /></td>
              ))}
              <td className="px-2 font-mono text-white">{mean(row).toFixed(2)}</td>
              <td className="text-xs text-neutral-400">{verbal(mean(row))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm">Overall weighted mean <b className="font-mono text-white">{overall.toFixed(2)}</b> — <span className="text-sky-300">{verbal(overall)}</span></p>
      <p className="text-xs text-neutral-500">WM = Σ(f × w) / N. Ranges: 4.21–5.00, 3.41–4.20, 2.61–3.40, 1.81–2.60, 1.00–1.80.</p>
    </div>
  );
}
