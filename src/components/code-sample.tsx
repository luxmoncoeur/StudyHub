import { codeToHtml } from "shiki";
import type { CodeSample, Lang } from "@/content/types";
import { CodeTabs } from "./code-tabs";

const SHIKI: Record<Lang, string> = {
  bash: "bash", zsh: "bash", powershell: "powershell", js: "javascript", ts: "typescript",
  python: "python", java: "java", postgres: "sql", mysql: "sql", cpp: "cpp",
  nginx: "nginx", yaml: "yaml", json: "json", http: "http", text: "text", html: "html", dockerfile: "dockerfile",
};

async function highlight(code: string, lang: string) {
  "use cache";
  return codeToHtml(code, { lang, theme: "github-dark-default" });
}

export async function CodeSampleView({ sample }: { sample: CodeSample }) {
  const entries = Object.entries(sample.variants) as [Lang, string][];
  const html = await Promise.all(
    entries.map(async ([lang, code]) => ({
      lang,
      code: code.trim(),
      html: await highlight(code.trim(), SHIKI[lang]),
    })),
  );
  return <CodeTabs title={sample.title} note={sample.note} variants={html} />;
}
