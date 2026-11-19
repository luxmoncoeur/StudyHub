import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { problems } from "@/content/accounting-problems";

export const generateStaticParams = () => [{ course: "accounting" }];

export default function ProblemsPage({ params }: PageProps<"/[course]/problems">) {
  return <Suspense fallback={null}><Content params={params} /></Suspense>;
}

async function Content({ params }: Pick<PageProps<"/[course]/problems">, "params">) {
  const { course } = await params;
  if (course !== "accounting") notFound();
  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs text-emerald-400">ACCTNG1 · Practice problems</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Accounting cycle problems</h1>
        <p className="mt-2 text-neutral-400">Textbook-style problems. Try each step yourself (journal, TB, worksheet, post-closing TB), check your answers, then compare with the full solution.</p>
      </header>
      <div className="grid gap-3">
        {problems.map((p, i) => (
          <Link key={p.id} href={`/accounting/problems/${p.id}`} className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/20">
            <span className="font-mono text-xs text-neutral-600">P{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">{p.entity}</p>
              <p className="text-xs text-neutral-500">{p.title} · {p.transactions.length} transactions{p.adjustments.length ? ` · ${p.adjustments.length} adjustments` : ""}</p>
            </div>
            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-neutral-400">{p.worksheet}-column</span>
            <ArrowRight className="size-4 text-neutral-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
          </Link>
        ))}
      </div>
    </div>
  );
}
