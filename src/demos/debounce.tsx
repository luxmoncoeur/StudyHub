"use client";
import { useEffect, useRef, useState } from "react";
import { Field, inputCls } from "./ui";

type Ev = { t: number; kind: "raw" | "debounce" | "throttle" };
const WINDOW = 6000;

export function DebounceDemo() {
  const [wait, setWait] = useState(400);
  const [events, setEvents] = useState<Ev[]>([]);
  const [now, setNow] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const last = useRef(0);

  useEffect(() => {
    let id = 0;
    const tick = () => { setNow(performance.now()); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const push = (kind: Ev["kind"]) => setEvents((e) => [...e.filter((x) => performance.now() - x.t < WINDOW), { t: performance.now(), kind }]);

  const onInput = () => {
    push("raw");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => push("debounce"), wait);
    if (performance.now() - last.current >= wait) { last.current = performance.now(); push("throttle"); }
  };

  const rows: Ev["kind"][] = ["raw", "throttle", "debounce"];
  const color = { raw: "bg-neutral-400", throttle: "bg-amber-400", debounce: "bg-sky-400" };
  const count = (k: Ev["kind"]) => events.filter((e) => e.kind === k).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Type fast here (like a search box)">
          <input className={`${inputCls} w-72`} onInput={onInput} placeholder="search products…" />
        </Field>
        <Field label={`wait: ${wait} ms`}>
          <input type="range" min={100} max={1500} step={50} value={wait} onChange={(e) => setWait(+e.target.value)} />
        </Field>
      </div>
      <div className="space-y-2">
        {rows.map((k) => (
          <div key={k} className="flex items-center gap-3">
            <span className="w-24 text-xs text-neutral-400">{k} <span className="font-mono text-neutral-600">({count(k)})</span></span>
            <div className="relative h-6 flex-1 rounded bg-white/[0.03]">
              {events.filter((e) => e.kind === k).map((e) => (
                <span key={e.t} className={`absolute top-1 size-4 rounded-full ${color[k]}`}
                  style={{ right: `${((now - e.t) / WINDOW) * 100}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-500">Raw = every keystroke (an API call each!). Throttle = at most once per {wait} ms. Debounce = once after you stop typing for {wait} ms.</p>
    </div>
  );
}
