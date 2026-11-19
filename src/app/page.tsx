import Link from "next/link";
import Aurora from "@/components/Aurora";
import ShinyText from "@/components/ShinyText";
import SpotlightCard from "@/components/SpotlightCard";
import { CourseProgress } from "@/components/progress";
import { courses } from "@/content";

export default function Home() {
  const totalLessons = courses.reduce((n, c) => n + c.lessons.length, 0);
  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <Aurora colorStops={["#0ea5e9", "#8b5cf6", "#0ea5e9"]} amplitude={0.8} blend={0.6} speed={0.6} />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 py-20">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-400">24 units · 7 courses · {totalLessons} lessons</p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
            <ShinyText text="Get ahead of next semester." speed={3} />
          </h1>
          <p className="mt-4 max-w-xl text-neutral-400">
            The CHED syllabus plus the industry stuff it skips. Every course has lessons, code in your language, demos you can play with, activities and projects.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <Link key={c.slug} href={`/${c.slug}`} className="group">
            <SpotlightCard className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-5" spotlightColor={c.accent} theme="dark">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs" style={{ color: c.accent }}>{c.code}</span>
                <span className="text-[11px] text-neutral-500">{c.units} units</span>
              </div>
              <h2 className="mt-3 text-lg font-medium text-white">{c.title}</h2>
              <p className="mt-1 text-sm text-neutral-400">{c.tagline}</p>
              <CourseProgress className="mt-6" ids={c.lessons.map((l) => `${c.slug}/${l.slug}`)} />
            </SpotlightCard>
          </Link>
        ))}
      </section>
    </main>
  );
}
