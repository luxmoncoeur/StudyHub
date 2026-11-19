export type Lang =
  | "bash" | "zsh" | "powershell" | "js" | "ts" | "python" | "java"
  | "postgres" | "mysql" | "cpp" | "nginx" | "yaml" | "json" | "http" | "text" | "html" | "dockerfile";

export const LANG_LABEL: Record<Lang, string> = {
  bash: "Linux", zsh: "macOS", powershell: "PowerShell", js: "JavaScript", ts: "TypeScript",
  python: "Python", java: "Java", postgres: "PostgreSQL", mysql: "MySQL", cpp: "Arduino C++",
  nginx: "nginx", yaml: "YAML", json: "JSON", http: "HTTP", text: "Text", html: "HTML", dockerfile: "Dockerfile",
};

export type CodeSample = { title: string; variants: Partial<Record<Lang, string>>; note?: string };
export type Command = { cmd: string; purpose: string; os?: "linux" | "mac" | "windows" | "any" };

export type DemoId =
  | "ledger" | "resistor" | "chmod" | "sql" | "debounce" | "ratelimit" | "loadbalancer" | "likert";

export type Lesson = {
  slug: string;
  title: string;
  /** one-line: why this matters */
  why: string;
  points: string[];
  code?: CodeSample[];
  commands?: Command[];
  demo?: DemoId;
  /** true = not in CHED syllabus, industry extra */
  beyond?: boolean;
};

export type GuideStep = {
  title: string;
  body?: string[];
  code?: CodeSample;
  /** full files for build guides; title = file path */
  files?: CodeSample[];
  commands?: Command[];
  /** wiring table for circuits: from pin → to pin */
  wiring?: { from: string; to: string; note?: string }[];
};
export type Guide = {
  /** where to do it, e.g. "Tinkercad Circuits (browser)" */
  where: string;
  time: string;
  youNeed?: string[];
  /** folder structure for build guides */
  tree?: string;
  steps: GuideStep[];
  /** "you're done when" checklist */
  done: string[];
  /** optional notes for doing it with real hardware */
  physical?: string[];
};

export type Activity = { title: string; steps: string[]; guide?: Guide };
export type Project = { title: string; level: "Starter" | "Core" | "Stretch"; scope: string; stack: string[]; guide?: Guide };

export type Course = {
  code: string;
  slug: string;
  title: string;
  units: number;
  tagline: string;
  ched: string;
  accent: string;
  lessons: Lesson[];
  activities: Activity[];
  projects: Project[];
};
