import { cn } from "@/lib/utils";

export const Btn = ({ className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} className={cn("rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-neutral-200 transition hover:bg-white/10 disabled:opacity-40", className)} />
);

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex flex-col gap-1 text-xs text-neutral-400">{label}{children}</label>
);

export const inputCls = "rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-neutral-100 outline-none focus:border-sky-500/50";

export const peso = (n: number) => "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
