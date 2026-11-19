"use client";
import { useState } from "react";
import { Field, inputCls } from "./ui";

const COLORS = [
  ["black", "#111"], ["brown", "#7b3f00"], ["red", "#e11d48"], ["orange", "#f97316"], ["yellow", "#facc15"],
  ["green", "#22c55e"], ["blue", "#3b82f6"], ["violet", "#8b5cf6"], ["grey", "#9ca3af"], ["white", "#f5f5f5"],
] as const;
const TOL = [["gold", "#d4af37", "±5%"], ["silver", "#c0c0c0", "±10%"], ["brown", "#7b3f00", "±1%"]] as const;

const fmt = (o: number) => (o >= 1e6 ? `${+(o / 1e6).toFixed(2)} MΩ` : o >= 1e3 ? `${+(o / 1e3).toFixed(2)} kΩ` : `${o} Ω`);

export function ResistorDemo() {
  const [b, setB] = useState([1, 0, 2]); // brown black red = 1k
  const [t, setT] = useState(0);
  const [vs, setVs] = useState(5);
  const [vf, setVf] = useState(2);
  const [ma, setMa] = useState(20);
  const ohms = (b[0] * 10 + b[1]) * 10 ** b[2];
  const need = ((vs - vf) / (ma / 1000));

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <p className="text-sm font-medium text-white">4-band color code</p>
        <div className="relative mx-auto flex h-14 w-64 items-center justify-center gap-4 rounded-full bg-[#d8c3a5]">
          {b.map((v, i) => <span key={i} className="h-full w-3" style={{ background: COLORS[v][1] }} />)}
          <span className="ml-6 h-full w-3" style={{ background: TOL[t][1] }} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {["1st digit", "2nd digit", "multiplier"].map((label, i) => (
            <Field key={label} label={label}>
              <select className={inputCls} value={b[i]} onChange={(e) => setB((s) => s.map((x, j) => (j === i ? +e.target.value : x)))}>
                {COLORS.map(([n], v) => <option key={n} value={v}>{n}</option>)}
              </select>
            </Field>
          ))}
          <Field label="tolerance">
            <select className={inputCls} value={t} onChange={(e) => setT(+e.target.value)}>
              {TOL.map(([n], v) => <option key={n} value={v}>{n}</option>)}
            </select>
          </Field>
        </div>
        <p className="font-mono text-2xl text-white">{fmt(ohms)} <span className="text-sm text-neutral-400">{TOL[t][2]}</span></p>
      </div>
      <div className="space-y-4">
        <p className="text-sm font-medium text-white">LED resistor (Ohm&apos;s law: R = (Vs − Vf) / I)</p>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Supply V"><input type="number" className={inputCls} value={vs} onChange={(e) => setVs(+e.target.value)} /></Field>
          <Field label="LED forward V"><input type="number" step="0.1" className={inputCls} value={vf} onChange={(e) => setVf(+e.target.value)} /></Field>
          <Field label="Current mA"><input type="number" className={inputCls} value={ma} onChange={(e) => setMa(+e.target.value)} /></Field>
        </div>
        <p className="font-mono text-2xl text-white">{ma > 0 && vs > vf ? fmt(Math.round(need)) : "—"}</p>
        <p className="text-xs text-neutral-500">Pick the next standard value up (e.g. 150 Ω → 220 Ω). Red LED ≈ 2.0 V, blue/white ≈ 3.0 V. ESP32 pins are 3.3 V.</p>
      </div>
    </div>
  );
}
