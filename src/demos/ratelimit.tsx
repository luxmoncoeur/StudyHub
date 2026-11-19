"use client";
import { useEffect, useRef, useState } from "react";
import { Btn, Field } from "./ui";

type Log = { id: number; ok: boolean };

export function RateLimitDemo() {
  const [cap, setCap] = useState(5);
  const [rate, setRate] = useState(1); // tokens per second
  const [tokens, setTokens] = useState(5);
  const [log, setLog] = useState<Log[]>([]);
  const ref = useRef({ tokens: 5, last: 0, id: 0 });

  // refill continuously: tokens = min(cap, tokens + elapsed * rate)
  useEffect(() => {
    ref.current.last = performance.now();
    const id = setInterval(() => {
      const r = ref.current; const t = performance.now();
      r.tokens = Math.min(cap, r.tokens + ((t - r.last) / 1000) * rate); r.last = t;
      setTokens(r.tokens);
    }, 50);
    return () => clearInterval(id);
  }, [cap, rate]);

  const hit = (n = 1) => {
    const out: Log[] = [];
    for (let i = 0; i < n; i++) {
      const r = ref.current; const ok = r.tokens >= 1;
      if (ok) r.tokens -= 1;
      out.push({ id: ++r.id, ok });
    }
    setLog((l) => [...out.reverse(), ...l].slice(0, 30));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-6">
        <Field label={`bucket capacity: ${cap}`}><input type="range" min={1} max={20} value={cap} onChange={(e) => setCap(+e.target.value)} /></Field>
        <Field label={`refill: ${rate} token/s`}><input type="range" min={0.5} max={10} step={0.5} value={rate} onChange={(e) => setRate(+e.target.value)} /></Field>
        <Btn onClick={() => hit()}>Send 1 request</Btn>
        <Btn onClick={() => hit(10)}>Burst 10</Btn>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: cap }, (_, i) => (
          <span key={i} className={`h-6 w-4 rounded-sm transition ${i < Math.floor(tokens) ? "bg-emerald-400" : "bg-white/10"}`} />
        ))}
        <span className="ml-3 font-mono text-xs text-neutral-400">{tokens.toFixed(1)} tokens</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {log.map((l) => (
          <span key={l.id} className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${l.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
            #{l.id} {l.ok ? "200" : "429"}
          </span>
        ))}
      </div>
    </div>
  );
}
