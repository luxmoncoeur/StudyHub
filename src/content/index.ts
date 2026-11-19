import type { Course, Guide, LessonCase, Project } from "./types";
import * as iotCases from "./cases/iot";
import * as webCases from "./cases/web";
import * as databaseCases from "./cases/database";
import * as sysadmaCases from "./cases/sysadma";
import * as sysintaCases from "./cases/sysinta";
import { accounting } from "./accounting";
import { iot } from "./iot";
import { database } from "./database";
import { sysadma } from "./sysadma";
import { web } from "./web";
import { sysinta } from "./sysinta";
import { capstone } from "./capstone";
import { guides as accountingGuides } from "./guides/accounting";
import { guides as iotGuides } from "./guides/iot";
import { guides as databaseGuides } from "./guides/database";
import { guides as sysadmaGuides } from "./guides/sysadma";
import { guides as webGuides } from "./guides/web";
import { guides as sysintaGuides } from "./guides/sysinta";
import { guides as capstoneGuides } from "./guides/capstone";
import { builds as accountingBuilds } from "./builds/accounting";
import { builds as databaseBuilds } from "./builds/database";
import { builds as webBuilds } from "./builds/web";
import { builds as sysintaBuilds } from "./builds/sysinta";
import { builds as capstoneBuilds } from "./builds/capstone";

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Walkthroughs live in content/guides/<course>.ts; tested project build guides in content/builds/<course>.ts (they override).
function withGuides(c: Course, g: Record<string, Guide>): Course {
  const titles = [...c.activities, ...c.projects].map((x) => x.title);
  for (const k of Object.keys(g)) if (!titles.includes(k)) throw new Error(`guide "${k}" matches no activity/project in ${c.slug}`);
  return {
    ...c,
    activities: c.activities.map((a) => ({ ...a, guide: g[a.title] ?? a.guide })),
    projects: c.projects.map((p) => ({ ...p, guide: g[p.title] ?? p.guide })),
  };
}

// Lesson cases (keyed by lesson slug) + one from-scratch case project per course
function withCases(c: Course, x: { cases: Record<string, LessonCase[]>; caseProject: Project }): Course {
  for (const k of Object.keys(x.cases)) if (!c.lessons.some((l) => l.slug === k)) throw new Error(`case "${k}" matches no lesson in ${c.slug}`);
  return {
    ...c,
    lessons: c.lessons.map((l) => ({ ...l, cases: x.cases[l.slug] ?? l.cases })),
    projects: [x.caseProject, ...c.projects],
  };
}

// order matches the enrollment form
export const courses = [
  withGuides(accounting, { ...accountingGuides, ...accountingBuilds }),
  withGuides(withCases(iot, iotCases), iotGuides),
  withGuides(withCases(database, databaseCases), { ...databaseGuides, ...databaseBuilds }),
  withGuides(withCases(sysadma, sysadmaCases), sysadmaGuides),
  withGuides(withCases(web, webCases), { ...webGuides, ...webBuilds }),
  withGuides(withCases(sysinta, sysintaCases), { ...sysintaGuides, ...sysintaBuilds }),
  withGuides(capstone, { ...capstoneGuides, ...capstoneBuilds }),
];
export const getCourse = (slug: string) => courses.find((c) => c.slug === slug);

export function getGuide(courseSlug: string, slug: string) {
  const c = getCourse(courseSlug);
  if (!c) return null;
  const items = [
    ...c.activities.map((a) => ({ kind: "Activity" as const, title: a.title, guide: a.guide, level: undefined as string | undefined, stack: [] as string[] })),
    ...c.projects.map((p) => ({ kind: "Project" as const, title: p.title, guide: p.guide, level: p.level as string | undefined, stack: p.stack })),
  ].filter((x) => x.guide);
  const i = items.findIndex((x) => slugify(x.title) === slug);
  return i < 0 ? null : { course: c, item: items[i], prev: items[i - 1], next: items[i + 1] };
}
