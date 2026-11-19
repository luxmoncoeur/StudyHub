import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { ProblemSolver } from "@/components/accounting/problem-solver";
import { getProblem, problems } from "@/content/accounting-problems";

export const generateStaticParams = () => problems.map((p) => ({ course: "accounting", id: p.id }));

export default function ProblemPage({ params }: PageProps<"/[course]/problems/[id]">) {
  return <Suspense fallback={null}><Content params={params} /></Suspense>;
}

async function Content({ params }: Pick<PageProps<"/[course]/problems/[id]">, "params">) {
  const { course, id } = await params;
  const p = getProblem(id);
  if (course !== "accounting" || !p) notFound();
  const n = problems.indexOf(p) + 1;
  return (
    <article className="space-y-8">
      <header>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-neutral-500">
          <Link href="/accounting" className="font-mono text-emerald-400 hover:text-white">ACCTNG1</Link>
          <ChevronRight className="size-3" />
          <Link href="/accounting/problems" className="hover:text-white">Problems</Link>
          <ChevronRight className="size-3" />
          <span className="text-neutral-400">Problem {n}</span>
        </nav>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{p.entity}</h1>
        <p className="mt-1 text-neutral-400">{p.title}</p>
      </header>

      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-relaxed text-neutral-300">
        <p>{p.intro}</p>
        <ol className="mt-3 list-decimal space-y-1 pl-6">{p.transactions.map((t) => <li key={t}>{t}</li>)}</ol>
        {p.additional.length > 0 && (
          <>
            <p className="mt-4 italic text-neutral-400">Additional information:</p>
            <ul className="mt-1 list-disc space-y-1 pl-6">{p.additional.map((a) => <li key={a}>{a}</li>)}</ul>
          </>
        )}
        <p className="mt-4 italic text-neutral-400">Requirements:</p>
        <ol className="mt-1 list-[lower-alpha] space-y-1 pl-6">{p.requirements.map((r) => <li key={r}>{r}</li>)}</ol>
      </section>

      <ProblemSolver problem={p} />
    </article>
  );
}
