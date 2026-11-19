import type { DemoId } from "@/content/types";
import { LedgerDemo } from "./ledger";
import { ResistorDemo } from "./resistor";
import { ChmodDemo } from "./chmod";
import { SqlDemo } from "./sql";
import { DebounceDemo } from "./debounce";
import { RateLimitDemo } from "./ratelimit";
import { LoadBalancerDemo } from "./loadbalancer";
import { LikertDemo } from "./likert";

const DEMOS: Record<DemoId, React.ComponentType> = {
  ledger: LedgerDemo, resistor: ResistorDemo, chmod: ChmodDemo, sql: SqlDemo,
  debounce: DebounceDemo, ratelimit: RateLimitDemo, loadbalancer: LoadBalancerDemo, likert: LikertDemo,
};

export function Demo({ id }: { id: DemoId }) {
  const C = DEMOS[id];
  return <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">{<C />}</div>;
}
