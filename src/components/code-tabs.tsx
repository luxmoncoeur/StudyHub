"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { LANG_LABEL, type Lang } from "@/content/types";
import { useLangPref } from "./lang-pref";
import { cn } from "@/lib/utils";

type Variant = { lang: Lang; code: string; html: string };

export function CodeTabs({ title, note, variants }: { title: string; note?: string; variants: Variant[] }) {
  const { pref, setPref } = useLangPref();
  const [local, setLocal] = useState<Lang | null>(null);
  const [copied, setCopied] = useState(false);
  // global preference wins when this sample has it; otherwise last local pick, else first
  const active = variants.find((v) => v.lang === pref) ?? variants.find((v) => v.lang === local) ?? variants[0];

  const copy = async () => {
    await navigator.clipboard.writeText(active.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
        <span className="mr-auto text-xs font-medium text-neutral-300">{title}</span>
        {variants.length > 1 &&
          variants.map((v) => (
            <button
              key={v.lang}
              onClick={() => { setLocal(v.lang); setPref(v.lang); }}
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] transition",
                v.lang === active.lang ? "bg-white/10 text-white" : "text-neutral-500 hover:text-neutral-200",
              )}
            >
              {LANG_LABEL[v.lang]}
            </button>
          ))}
        {variants.length === 1 && <span className="text-[11px] text-neutral-500">{LANG_LABEL[active.lang]}</span>}
        <button onClick={copy} aria-label="Copy code" className="text-neutral-500 hover:text-white">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <div
        className="overflow-x-auto text-[13px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:p-4"
        dangerouslySetInnerHTML={{ __html: active.html }}
      />
      {note && <p className="border-t border-white/10 px-4 py-2 text-xs text-neutral-400">{note}</p>}
    </div>
  );
}
