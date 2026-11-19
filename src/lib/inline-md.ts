const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Tiny formatter for lesson bullets: `code`, **bold**, *italic*. Content is escaped first.
export function inlineMd(src: string) {
  return src
    .split(/(`[^`]+`)/g)
    .map((part) =>
      part.startsWith("`") && part.endsWith("`") && part.length > 1
        ? `<code class="rounded bg-white/10 px-1 font-mono text-[12px] text-neutral-100">${esc(part.slice(1, -1))}</code>`
        : esc(part)
            .replace(/\*\*([^*]+)\*\*/g, '<b class="font-medium text-white">$1</b>')
            .replace(/(^|[^\w*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>"),
    )
    .join("");
}

// self-check
if (process.env.NODE_ENV !== "production") {
  console.assert(inlineMd("`<button>`") === '<code class="rounded bg-white/10 px-1 font-mono text-[12px] text-neutral-100">&lt;button&gt;</code>');
  console.assert(inlineMd("a **b** c").includes("<b"));
  console.assert(!inlineMd("COUNT(*) and f × w").includes("<em>"));
}
