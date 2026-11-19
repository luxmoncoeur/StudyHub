import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { courses, getCourse, slugify } from "@/content";

export const generateStaticParams = () => courses.map((c) => ({ course: c.slug }));

export default function CoursePage({ params }: PageProps<"/[course]">) {
  return (
    <Suspense fallback={null}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/[course]">, "params">) {
  const { course: slug } = await params;
  const c = getCourse(slug);
  if (!c) notFound();
  return (
    <div className="space-y-12">
      <header>
        <span className="font-mono text-xs" style={{ color: c.accent }}>{c.code} · {c.units} units</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{c.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400">{c.ched}</p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">Lessons</h2>
        <div className="divide-y divide-white/5 rounded-xl border border-white/10">
          {c.lessons.map((l, i) => (
            <Link key={l.slug} href={`/${c.slug}/${l.slug}`} className="group flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03]">
              <span className="font-mono text-xs text-neutral-600">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white">{l.title}</p>
                <p className="truncate text-xs text-neutral-500">{l.why}</p>
              </div>
              {l.demo && <Badge variant="outline" className="border-sky-500/30 text-sky-300">demo</Badge>}
              {l.beyond && <Badge variant="outline" className="border-violet-500/30 text-violet-300">beyond CHED</Badge>}
              <ArrowRight className="size-4 text-neutral-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
            </Link>
          ))}
        </div>
      </section>

      {c.slug === "accounting" && (
        <Link href="/accounting/problems" className="group block rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5 hover:border-emerald-500/50">
          <p className="text-sm font-medium text-white">Practice problems: full accounting cycle →</p>
          <p className="mt-1 text-xs text-neutral-400">Textbook-style problems (Entity A, a 6-column worksheet and more). Journalize, post, build the TB and worksheet, then check your answers against the solution.</p>
        </Link>
      )}

      <section id="activities" className="scroll-mt-20">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">Activities</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {c.activities.map((a) => (
            <div key={a.title} className="flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-white">{a.title}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-neutral-400">
                {a.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
              {a.guide && (
                <Link href={`/${c.slug}/guide/${slugify(a.title)}`} className="mt-3 inline-flex items-center gap-1 self-start text-xs hover:underline" style={{ color: c.accent }}>
                  Step-by-step walkthrough <ArrowRight className="size-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="projects" className="scroll-mt-20">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">Projects</h2>
        <div className="grid gap-3">
          {c.projects.map((p) => (
            <div key={p.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white">{p.title}</p>
                <Badge variant="secondary" className="ml-auto">{p.level}</Badge>
              </div>
              <p className="mt-1 text-xs text-neutral-400">{p.scope}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.stack.map((s) => <span key={s} className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">{s}</span>)}
                {p.guide && (
                  <Link href={`/${c.slug}/guide/${slugify(p.title)}`} className="ml-auto inline-flex items-center gap-1 text-xs hover:underline" style={{ color: c.accent }}>
                    Walkthrough <ArrowRight className="size-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
