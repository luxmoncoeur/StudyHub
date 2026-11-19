"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavCourse } from "@/content/nav-index";
import { cn } from "@/lib/utils";

export function HeaderCourses({ courses }: { courses: NavCourse[] }) {
  const seg = usePathname().split("/")[1];
  return (
    <nav aria-label="Courses" className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
      {courses.map((c) => {
        const active = seg === c.slug;
        return (
          <Link key={c.slug} href={`/${c.slug}`} title={c.title} aria-current={active ? "page" : undefined}
            className={cn("shrink-0 rounded-md px-2 py-1 font-mono text-[11px] transition",
              active ? "bg-white/[0.07] text-white" : "text-neutral-500 hover:text-neutral-200")}
            style={active ? { color: c.accent } : undefined}>
            {c.code}
          </Link>
        );
      })}
      <span className="mx-1 h-4 w-px shrink-0 bg-white/10" />
      <Link href="/commands" aria-current={seg === "commands" ? "page" : undefined}
        className={cn("shrink-0 rounded-md px-2 py-1 text-xs transition", seg === "commands" ? "bg-white/[0.07] text-white" : "text-neutral-400 hover:text-white")}>
        Commands
      </Link>
    </nav>
  );
}
