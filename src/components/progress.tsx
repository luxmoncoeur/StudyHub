"use client";

import { useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "done-lessons";
const listeners = new Set<() => void>();
const read = () => (typeof window === "undefined" ? "[]" : localStorage.getItem(KEY) ?? "[]");
const subscribe = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };

export function useDone() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const done = new Set<string>(JSON.parse(raw));
  const toggle = (id: string) => {
    done.has(id) ? done.delete(id) : done.add(id);
    localStorage.setItem(KEY, JSON.stringify([...done]));
    listeners.forEach((l) => l());
  };
  return { done, toggle };
}

export function DoneButton({ id }: { id: string }) {
  const { done, toggle } = useDone();
  const on = done.has(id);
  return (
    <button
      onClick={() => toggle(id)}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition",
        on ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-white/10 text-neutral-300 hover:bg-white/5",
      )}
    >
      <Check className="size-4" /> {on ? "Completed" : "Mark as done"}
    </button>
  );
}

export function CourseProgress({ ids, className }: { ids: string[]; className?: string }) {
  const { done } = useDone();
  const n = ids.filter((i) => done.has(i)).length;
  const pct = ids.length ? Math.round((n / ids.length) * 100) : 0;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between text-[11px] text-neutral-400">
        <span>{n}/{ids.length} lessons</span><span>{pct}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

