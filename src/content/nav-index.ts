import { courses, slugify } from ".";

// Slim, serializable copies for client nav (no code samples sent to the browser)
type NavItem = { slug: string; title: string };
export type NavCourse = {
  slug: string; code: string; title: string; accent: string;
  lessons: { slug: string; title: string; beyond?: boolean; demo: boolean }[];
  activities: NavItem[];
  projects: NavItem[];
  hasProblems: boolean;
};

export const navCourses: NavCourse[] = courses.map((c) => ({
  slug: c.slug, code: c.code, title: c.title, accent: c.accent,
  lessons: c.lessons.map((l) => ({ slug: l.slug, title: l.title, beyond: l.beyond, demo: !!l.demo })),
  activities: c.activities.filter((a) => a.guide).map((a) => ({ slug: slugify(a.title), title: a.title })),
  projects: c.projects.filter((p) => p.guide).map((p) => ({ slug: slugify(p.title), title: p.title })),
  hasProblems: c.slug === "accounting",
}));
