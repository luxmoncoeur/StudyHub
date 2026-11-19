import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { KeyNav } from "@/components/nav/key-nav";
import { CodeSampleView } from "@/components/code-sample";
import { CommandTable } from "@/components/command-table";
import { DoneButton } from "@/components/progress";
import { Demo } from "@/demos";
import { inlineMd } from "@/lib/inline-md";
import { courses, getCourse } from "@/content";

export const generateStaticParams = () =>
  courses.flatMap((c) => c.lessons.map((l) => ({ course: c.slug, lesson: l.slug })));

export default function LessonPage({ params }: PageProps<"/[course]/[lesson]">) {
  return (
    <Suspense fallback={null}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/[course]/[lesson]">, "params">) {
  const { course: cs, lesson: ls } = await params;
  const c = getCourse(cs);
  const i = c?.lessons.findIndex((l) => l.slug === ls) ?? -1;
  if (!c || i < 0) notFound();
  const l = c.lessons[i];
  const prev = c.lessons[i - 1];
  const next = c.lessons[i + 1];

  return (
    <article className="space-y-8">
      <KeyNav prev={prev && `/${c.slug}/${prev.slug}`} next={next && `/${c.slug}/${next.slug}`} />
      <header>
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-neutral-500">
          <Link href="/" className="hover:text-white">Courses</Link>
          <ChevronRight className="size-3" />
          <Link href={`/${c.slug}`} className="font-mono hover:text-white" style={{ color: c.accent }}>{c.code}</Link>
          <ChevronRight className="size-3" />
          <span className="text-neutral-400">Lesson {i + 1} of {c.lessons.length}</span>
          {l.beyond && <span className="ml-2 rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-300">beyond CHED</span>}
        </nav>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{l.title}</h1>
        <p className="mt-2 text-neutral-400">{l.why}</p>
      </header>

      <ul className="space-y-2">
        {l.points.map((p) => (
          <li key={p} className="flex gap-3 text-sm leading-relaxed text-neutral-300">
            <span className="mt-2 size-1 shrink-0 rounded-full" style={{ background: c.accent }} />
            <span dangerouslySetInnerHTML={{ __html: inlineMd(p) }} />
          </li>
        ))}
      </ul>

      {l.cases?.map((cs) => (
        <section key={cs.title} className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-amber-300">Case</p>
          <h2 className="mt-1 text-base font-medium text-white">{cs.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-300" dangerouslySetInnerHTML={{ __html: inlineMd(cs.scenario) }} />
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-neutral-300">
            {cs.steps.map((st) => <li key={st} dangerouslySetInnerHTML={{ __html: inlineMd(st) }} />)}
          </ol>
          <p className="mt-3 border-t border-white/5 pt-3 text-sm text-amber-100/90" dangerouslySetInnerHTML={{ __html: "<b>Takeaway:</b> " + inlineMd(cs.takeaway) }} />
        </section>
      ))}

      {l.demo && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">Try it</h2>
          <Demo id={l.demo} />
        </section>
      )}

      {l.code?.length ? (
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">Code</h2>
          {l.code.map((s) => <CodeSampleView key={s.title} sample={s} />)}
        </section>
      ) : null}

      {l.commands?.length ? (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">Commands</h2>
          <CommandTable commands={l.commands} />
        </section>
      ) : null}

      <footer className="space-y-4 border-t border-white/5 pt-6">
        <div className="flex items-center gap-3">
          <DoneButton id={`${c.slug}/${l.slug}`} />
          <span className="ml-auto hidden text-[11px] text-neutral-600 sm:inline">
            <kbd className="rounded bg-white/5 px-1 font-mono">←</kbd> <kbd className="rounded bg-white/5 px-1 font-mono">→</kbd> to move between lessons
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link href={`/${c.slug}/${prev.slug}`} className="group rounded-xl border border-white/10 p-4 transition hover:border-white/20 hover:bg-white/[0.03]">
              <span className="flex items-center gap-1 text-[11px] text-neutral-500"><ArrowLeft className="size-3 transition group-hover:-translate-x-0.5" />Previous · {i}</span>
              <span className="mt-1 block truncate text-sm text-white">{prev.title}</span>
            </Link>
          ) : (
            <Link href={`/${c.slug}`} className="group rounded-xl border border-white/10 p-4 transition hover:border-white/20 hover:bg-white/[0.03]">
              <span className="flex items-center gap-1 text-[11px] text-neutral-500"><ArrowLeft className="size-3" />Back to</span>
              <span className="mt-1 block truncate text-sm text-white">{c.title} overview</span>
            </Link>
          )}
          {next ? (
            <Link href={`/${c.slug}/${next.slug}`} className="group rounded-xl border border-white/10 p-4 text-right transition hover:border-white/20 hover:bg-white/[0.03]">
              <span className="flex items-center justify-end gap-1 text-[11px] text-neutral-500">Next · {i + 2}<ArrowRight className="size-3 transition group-hover:translate-x-0.5" /></span>
              <span className="mt-1 block truncate text-sm text-white">{next.title}</span>
            </Link>
          ) : (
            <Link href={`/${c.slug}#activities`} className="group rounded-xl border border-white/10 p-4 text-right transition hover:border-white/20 hover:bg-white/[0.03]">
              <span className="flex items-center justify-end gap-1 text-[11px] text-neutral-500">Done with lessons<ArrowRight className="size-3" /></span>
              <span className="mt-1 block truncate text-sm text-white">Activities & projects</span>
            </Link>
          )}
        </div>
      </footer>
    </article>
  );
}
