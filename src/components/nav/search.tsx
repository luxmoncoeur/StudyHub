"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search as SearchIcon } from "lucide-react";
import type { NavCourse } from "@/content/nav-index";
import { cn } from "@/lib/utils";

type Item = { href: string; title: string; course: NavCourse; tag?: string };

export function Search({ courses }: { courses: NavCourse[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => courses.flatMap((c) => [
    { href: `/${c.slug}`, title: c.title, course: c, tag: "course" },
    ...c.lessons.map((l) => ({ href: `/${c.slug}/${l.slug}`, title: l.title, course: c, tag: l.demo ? "demo" : undefined })),
  ]), [courses]);

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = words.length
      ? items.filter((it) => { const hay = `${it.title} ${it.course.code} ${it.course.title}`.toLowerCase(); return words.every((w) => hay.includes(w)); })
      : items.filter((it) => it.tag === "course");
    return hits.slice(0, 12);
  }, [q, items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { if (open) { setQ(""); setSel(0); setTimeout(() => inputRef.current?.focus()); } }, [open]);

  const go = (it?: Item) => { if (!it) return; setOpen(false); router.push(it.href); };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-neutral-400 transition hover:border-white/20 hover:text-white">
        <SearchIcon className="size-3.5" /><span className="hidden sm:inline">Search lessons</span>
        <kbd className="hidden rounded bg-white/10 px-1 font-mono text-[10px] sm:inline">⌘K</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Search lessons" onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-[#0b0c0f] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4">
              <SearchIcon className="size-4 text-neutral-500" />
              <input ref={inputRef} value={q} placeholder="Search lessons, e.g. cors, joins, mqtt…"
                onChange={(e) => { setQ(e.target.value); setSel(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
                  if (e.key === "Enter") go(results[sel]);
                  if (e.key === "Escape") setOpen(false);
                }}
                className="h-12 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600" />
              <kbd className="rounded bg-white/10 px-1.5 font-mono text-[10px] text-neutral-400">esc</kbd>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-neutral-500">No lessons match “{q}”.</li>}
              {results.map((it, i) => (
                <li key={it.href}>
                  <button onMouseEnter={() => setSel(i)} onClick={() => go(it)}
                    className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm", i === sel ? "bg-white/[0.07] text-white" : "text-neutral-300")}>
                    <span className="w-16 shrink-0 font-mono text-[10px]" style={{ color: it.course.accent }}>{it.course.code}</span>
                    <span className="truncate">{it.title}</span>
                    {it.tag && <span className="ml-auto text-[10px] text-neutral-500">{it.tag}</span>}
                    {i === sel && <CornerDownLeft className={cn("size-3.5 text-neutral-500", !it.tag && "ml-auto")} />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
