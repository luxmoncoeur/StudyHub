import { CommandTable } from "@/components/command-table";
import { courses } from "@/content";

export default function CommandsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-10 px-5 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-white">Command cheatsheet</h1>
      {courses.map((c) => {
        const cmds = c.lessons.flatMap((l) => l.commands ?? []);
        if (!cmds.length) return null;
        return (
          <section key={c.slug}>
            <h2 className="mb-3 font-mono text-xs" style={{ color: c.accent }}>{c.code} — {c.title}</h2>
            <CommandTable commands={cmds} />
          </section>
        );
      })}
    </main>
  );
}
