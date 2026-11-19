import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Clock, MapPin, Wrench } from "lucide-react";
import { CodeSampleView } from "@/components/code-sample";
import { CommandTable } from "@/components/command-table";
import { KeyNav } from "@/components/nav/key-nav";
import { courses, getGuide, slugify } from "@/content";
import { inlineMd } from "@/lib/inline-md";

export const generateStaticParams = () =>
  courses.flatMap((c) => [...c.activities, ...c.projects].filter((x) => x.guide).map((x) => ({ course: c.slug, slug: slugify(x.title) })));

export default function GuidePage({ params }: PageProps<"/[course]/guide/[slug]">) {
  return <Suspense fallback={null}><Content params={params} /></Suspense>;
}

const P = ({ text, className }: { text: string; className?: string }) => (
  <p className={className} dangerouslySetInnerHTML={{ __html: inlineMd(text) }} />
);

async function Content({ params }: Pick<PageProps<"/[course]/guide/[slug]">, "params">) {
  const { course, slug } = await params;
  const found = getGuide(course, slug);
  if (!found) notFound();
  const { course: c, item, prev, next } = found;
  const g = item.guide!;
  const href = (t: string) => `/${c.slug}/guide/${slugify(t)}`;

  return (
    <article className="space-y-8">
      <KeyNav prev={prev && href(prev.title)} next={next && href(next.title)} />
      <header>
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-neutral-500">
          <Link href={`/${c.slug}`} className="font-mono hover:text-white" style={{ color: c.accent }}>{c.code}</Link>
          <ChevronRight className="size-3" />
          <Link href={`/${c.slug}#${item.kind === "Activity" ? "activities" : "projects"}`} className="hover:text-white">{item.kind === "Activity" ? "Activities" : "Projects"}</Link>
          <ChevronRight className="size-3" />
          <span className="text-neutral-400">Walkthrough</span>
        </nav>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{item.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-neutral-300"><MapPin className="size-3.5" />{g.where}</span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-neutral-300"><Clock className="size-3.5" />{g.time}</span>
          {item.level && <span className="rounded-md bg-white/5 px-2 py-1 text-neutral-300">{item.level}</span>}
        </div>
      </header>

      {g.brief && (
        <section className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-5 text-sm">
          <p className="text-[11px] font-medium uppercase tracking-wider text-amber-300">Case brief</p>
          <p className="mt-2 text-neutral-200"><b className="text-white">Client:</b> {g.brief.client}</p>
          <p className="mt-1 text-neutral-300"><b className="text-white">Problem:</b> {g.brief.problem}</p>
          <p className="mt-3 font-medium text-white">Requirements</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-neutral-300">{g.brief.requirements.map((r) => <li key={r} dangerouslySetInnerHTML={{ __html: inlineMd(r) }} />)}</ul>
        </section>
      )}

      {g.tests?.length ? (
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Test cases (your acceptance checklist)</p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-[11px] text-neutral-500">
                <tr><th className="px-3 py-2 text-left font-medium">ID</th><th className="px-3 py-2 text-left font-medium">Scenario</th><th className="px-3 py-2 text-left font-medium">Steps</th><th className="px-3 py-2 text-left font-medium">Expected</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5 align-top">
                {g.tests.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2 font-mono text-[12px] text-sky-300">{t.id}</td>
                    <td className="px-3 py-2 text-neutral-200">{t.scenario}</td>
                    <td className="px-3 py-2 text-neutral-400" dangerouslySetInnerHTML={{ __html: inlineMd(t.steps) }} />
                    <td className="px-3 py-2 text-emerald-300/90" dangerouslySetInnerHTML={{ __html: inlineMd(t.expected) }} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {g.youNeed?.length ? (
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">You need</p>
          <ul className="grid gap-1 text-sm text-neutral-300 sm:grid-cols-2">
            {g.youNeed.map((x) => <li key={x} className="flex gap-2"><span style={{ color: c.accent }}>•</span><span dangerouslySetInnerHTML={{ __html: inlineMd(x) }} /></li>)}
          </ul>
        </section>
      ) : null}

      {g.tree && (
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Project structure</p>
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#0d1117] p-4 font-mono text-[12.5px] leading-relaxed text-neutral-300">{g.tree}</pre>
        </section>
      )}

      <ol className="space-y-8">
        {g.steps.map((s, i) => (
          <li key={s.title} className="relative pl-10">
            <span className="absolute left-0 top-0 flex size-7 items-center justify-center rounded-full border font-mono text-xs" style={{ borderColor: c.accent, color: c.accent }}>{i + 1}</span>
            <h2 className="pt-0.5 text-base font-medium text-white">{s.title}</h2>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-neutral-300">
              {s.body?.map((b) => <P key={b} text={b} />)}
            </div>
            {s.wiring && (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.03] text-[11px] text-neutral-500"><tr><th className="px-3 py-2 text-left font-medium">From</th><th className="px-3 py-2 text-left font-medium">To</th><th className="px-3 py-2 text-left font-medium">Note</th></tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {s.wiring.map((w) => (
                      <tr key={w.from + w.to}><td className="px-3 py-1.5 font-mono text-[12px] text-sky-300">{w.from}</td><td className="px-3 py-1.5 font-mono text-[12px] text-sky-300">{w.to}</td><td className="px-3 py-1.5 text-xs text-neutral-500">{w.note}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {s.code && <div className="mt-3"><CodeSampleView sample={s.code} /></div>}
            {s.files?.map((f) => <div key={f.title} className="mt-3"><CodeSampleView sample={f} /></div>)}
            {s.commands && <div className="mt-3"><CommandTable commands={s.commands} /></div>}
          </li>
        ))}
      </ol>

      <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-300">You&apos;re done when</p>
        <ul className="space-y-1.5 text-sm text-neutral-200">
          {g.done.map((d) => <li key={d} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" /><span dangerouslySetInnerHTML={{ __html: inlineMd(d) }} /></li>)}
        </ul>
      </section>

      {g.physical?.length ? (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-amber-300"><Wrench className="size-3.5" />Doing it with real hardware</p>
          <ul className="space-y-1.5 text-sm text-neutral-300">{g.physical.map((d) => <li key={d} dangerouslySetInnerHTML={{ __html: "• " + inlineMd(d) }} />)}</ul>
        </section>
      ) : null}

      <footer className="grid gap-3 border-t border-white/5 pt-6 sm:grid-cols-2">
        {prev ? (
          <Link href={href(prev.title)} className="group rounded-xl border border-white/10 p-4 hover:border-white/20">
            <span className="flex items-center gap-1 text-[11px] text-neutral-500"><ArrowLeft className="size-3" />Previous {prev.kind.toLowerCase()}</span>
            <span className="mt-1 block truncate text-sm text-white">{prev.title}</span>
          </Link>
        ) : <span />}
        {next && (
          <Link href={href(next.title)} className="group rounded-xl border border-white/10 p-4 text-right hover:border-white/20">
            <span className="flex items-center justify-end gap-1 text-[11px] text-neutral-500">Next {next.kind.toLowerCase()}<ArrowRight className="size-3" /></span>
            <span className="mt-1 block truncate text-sm text-white">{next.title}</span>
          </Link>
        )}
      </footer>
    </article>
  );
}
