"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, ClipboardList, FlaskConical, Hammer, LayoutGrid } from "lucide-react";
import type { NavCourse } from "@/content/nav-index";
import { CourseProgress, useDone } from "@/components/progress";
import { cn } from "@/lib/utils";

const itemCls = (active: boolean) =>
  cn("relative flex items-start gap-2.5 rounded-md px-2 py-1.5 text-[13px] leading-snug transition",
    active ? "bg-white/[0.07] text-white" : "text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-100");

function ActiveBar({ color }: { color: string }) {
  return <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full" style={{ background: color }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 mt-5 px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600">{children}</p>;
}

/** Number badge that turns into a check once the lesson is done. */
function LessonBadge({ id, n, active, color }: { id: string; n: number; active: boolean; color: string }) {
  const { done } = useDone();
  const isDone = done.has(id);
  return (
    <span
      className={cn("mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full border font-mono text-[9.5px] tabular-nums",
        isDone ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300" : active ? "text-white" : "border-white/10 text-neutral-500")}
      style={!isDone && active ? { borderColor: color, color } : undefined}
    >
      {isDone ? <Check className="size-2.5" strokeWidth={3} /> : n}
    </span>
  );
}

function Group({ label, icon: Icon, items, base, path, color, onPick }: {
  label: string; icon: typeof Hammer; items: { slug: string; title: string }[]; base: string; path: string; color: string; onPick?: () => void;
}) {
  const containsActive = items.some((it) => path === `${base}/${it.slug}`);
  const [open, setOpen] = useState(containsActive);
  useEffect(() => { if (containsActive) setOpen(true); }, [containsActive]);
  if (!items.length) return null;
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-neutral-400 transition hover:bg-white/[0.04] hover:text-neutral-100">
        <Icon className="size-[18px] shrink-0 p-0.5" />
        <span className="flex-1 text-left">{label}</span>
        <span className="font-mono text-[10px] text-neutral-600">{items.length}</span>
        <ChevronRight className={cn("size-3.5 text-neutral-600 transition", open && "rotate-90")} />
      </button>
      {open && (
        <div className="ml-[17px] border-l border-white/[0.06] pl-2">
          {items.map((it) => {
            const href = `${base}/${it.slug}`;
            const active = path === href;
            return (
              <Link key={it.slug} href={href} onClick={onPick} aria-current={active ? "page" : undefined} className={cn(itemCls(active), "py-1")}>
                {active && <ActiveBar color={color} />}
                <span>{it.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CourseNavList({ course, onPick }: { course: NavCourse; onPick?: () => void }) {
  const path = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => { activeRef.current?.scrollIntoView({ block: "nearest" }); }, [path]);
  const base = `/${course.slug}`;
  const overview = path === base;
  const problems = path.startsWith(`${base}/problems`);

  return (
    <nav aria-label={`${course.title} navigation`}>
      <Link href={base} onClick={onPick} aria-current={overview ? "page" : undefined} className={itemCls(overview)}>
        {overview && <ActiveBar color={course.accent} />}
        <LayoutGrid className="size-[18px] shrink-0 p-0.5" /> Overview
      </Link>

      <SectionLabel>Lessons · {course.lessons.length}</SectionLabel>
      <div className="space-y-px">
        {course.lessons.map((l, i) => {
          const href = `${base}/${l.slug}`;
          const active = path === href;
          return (
            <Link key={l.slug} href={href} onClick={onPick} ref={active ? activeRef : undefined}
              aria-current={active ? "page" : undefined} className={itemCls(active)}>
              {active && <ActiveBar color={course.accent} />}
              <LessonBadge id={`${course.slug}/${l.slug}`} n={i + 1} active={active} color={course.accent} />
              <span className="flex-1">{l.title}</span>
              {l.beyond && <span title="Beyond the CHED syllabus" className="mt-0.5 rounded bg-violet-500/10 px-1 text-[9px] font-medium text-violet-300">+</span>}
            </Link>
          );
        })}
      </div>

      <SectionLabel>Practice</SectionLabel>
      <div className="space-y-px">
        {course.hasProblems && (
          <Link href={`${base}/problems`} onClick={onPick} aria-current={problems ? "page" : undefined} className={itemCls(problems)}>
            {problems && <ActiveBar color={course.accent} />}
            <ClipboardList className="size-[18px] shrink-0 p-0.5" /> Practice problems
          </Link>
        )}
        <Group label="Activities" icon={FlaskConical} items={course.activities} base={`${base}/guide`} path={path} color={course.accent} onPick={onPick} />
        <Group label="Projects" icon={Hammer} items={course.projects} base={`${base}/guide`} path={path} color={course.accent} onPick={onPick} />
      </div>
    </nav>
  );
}

export function CourseSidebar({ course }: { course: NavCourse }) {
  return (
    <div className="pb-8">
      <Link href={`/${course.slug}`} className="block px-2">
        <span className="font-mono text-[11px]" style={{ color: course.accent }}>{course.code}</span>
        <p className="mt-0.5 text-sm font-medium leading-snug text-white">{course.title}</p>
      </Link>
      <CourseProgress className="mb-4 mt-3 px-2" ids={course.lessons.map((l) => `${course.slug}/${l.slug}`)} />
      <CourseNavList course={course} />
    </div>
  );
}

export function MobileCourseNav({ course }: { course: NavCourse }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const idx = course.lessons.findIndex((l) => path === `/${course.slug}/${l.slug}`);
  const guide = [...course.activities, ...course.projects].find((g) => path === `/${course.slug}/guide/${g.slug}`);
  const label = idx >= 0 ? `${idx + 1}. ${course.lessons[idx].title}`
    : guide ? guide.title
    : path.startsWith(`/${course.slug}/problems`) ? "Practice problems" : "Overview";

  return (
    <div className="sticky top-12 z-30 -mx-5 mb-6 border-b border-white/5 bg-[#07080a]/90 px-5 py-2 backdrop-blur md:hidden">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-left text-sm">
        <span className="font-mono text-[11px]" style={{ color: course.accent }}>{course.code}</span>
        <span className="truncate text-neutral-200">{label}</span>
        <ChevronDown className={cn("ml-auto size-4 text-neutral-500 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-2 max-h-[65vh] overflow-y-auto rounded-lg border border-white/10 bg-[#0b0c0f] p-2">
          <CourseNavList course={course} onPick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
