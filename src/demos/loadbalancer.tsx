"use client";
import { useRef, useState } from "react";
import { Btn, Field, inputCls } from "./ui";

type Algo = "round-robin" | "least-conn" | "random";
const SERVERS = ["app-1", "app-2", "app-3"];
// app-3 is slower on purpose so least-conn shows its advantage
const SPEED = [1, 1, 3];

export function LoadBalancerDemo() {
  const [algo, setAlgo] = useState<Algo>("round-robin");
  const [active, setActive] = useState([0, 0, 0]);
  const [served, setServed] = useState([0, 0, 0]);
  const rr = useRef(0);
  const live = useRef([0, 0, 0]);

  const pick = (): number => {
    if (algo === "round-robin") return rr.current++ % SERVERS.length;
    if (algo === "random") return Math.floor(Math.random() * SERVERS.length);
    const a = live.current; return a.indexOf(Math.min(...a));
  };

  const send = (n = 1) => {
    for (let i = 0; i < n; i++) {
      const s = pick();
      live.current[s]++; setActive([...live.current]);
      setServed((v) => v.map((x, j) => (j === s ? x + 1 : x)));
      setTimeout(() => { live.current[s]--; setActive([...live.current]); }, (800 + Math.random() * 600) * SPEED[s]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="algorithm">
          <select className={inputCls} value={algo} onChange={(e) => setAlgo(e.target.value as Algo)}>
            <option value="round-robin">round robin</option><option value="least-conn">least connections</option><option value="random">random</option>
          </select>
        </Field>
        <Btn onClick={() => send()}>1 request</Btn>
        <Btn onClick={() => send(12)}>12 requests</Btn>
        <Btn onClick={() => setServed([0, 0, 0])}>reset</Btn>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {SERVERS.map((s, i) => (
          <div key={s} className="rounded-lg border border-white/10 p-3">
            <div className="flex justify-between font-mono text-xs"><span className="text-white">{s}</span><span className="text-neutral-500">{SPEED[i] > 1 ? "slow" : "fast"}</span></div>
            <div className="mt-3 flex h-20 flex-wrap content-end gap-1">
              {Array.from({ length: active[i] }, (_, k) => <span key={k} className="size-3 rounded-sm bg-sky-400" />)}
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">active {active[i]} · served {served[i]}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-500">Burst 12 with round robin, then with least connections — watch the slow server pile up.</p>
    </div>
  );
}
