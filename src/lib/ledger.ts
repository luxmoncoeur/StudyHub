// Accounting cycle solver: journal + adjustments in, every later step computed.
export type AcctType = "asset" | "contra-asset" | "liability" | "capital" | "drawing" | "revenue" | "expense";
export type Account = { name: string; type: AcctType; current?: boolean; contraOf?: string };
export type Line = { account: string; dr?: number; cr?: number };
export type Entry = { date?: string; memo: string; lines: Line[] };

export type Problem = {
  id: string;
  title: string;
  entity: string;
  period: string;            // "For the month ended June 30, 20x1"
  intro: string;
  transactions: string[];    // narrative, same order as journal
  additional: string[];
  requirements: string[];
  worksheet: "6" | "10";
  accounts: Account[];       // chart of accounts, in TB order
  journal: Entry[];
  adjustments: Entry[];      // memo explains the computation
};

const DEBIT_NORMAL: AcctType[] = ["asset", "drawing", "expense"];
export const isDebitNormal = (t: AcctType) => DEBIT_NORMAL.includes(t);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export type Posting = { ref: string; dr: number; cr: number; adj: boolean };
export type WsRow = {
  account: Account;
  tbDr: number; tbCr: number; adjDr: number; adjCr: number;
  atbDr: number; atbCr: number; isDr: number; isCr: number; bsDr: number; bsCr: number;
};

export function solve(p: Problem) {
  const byName = new Map(p.accounts.map((a) => [a.name, a]));
  const all = [...p.journal, ...p.adjustments];
  for (const [i, e] of all.entries()) {
    for (const l of e.lines) if (!byName.has(l.account)) throw new Error(`${p.id}: unknown account "${l.account}" in entry ${i + 1}`);
    const dr = sum(e.lines.map((l) => l.dr ?? 0)), cr = sum(e.lines.map((l) => l.cr ?? 0));
    if (dr !== cr) throw new Error(`${p.id}: entry ${i + 1} (${e.memo}) unbalanced ${dr} vs ${cr}`);
  }

  // ledger postings
  const ledger = new Map<string, Posting[]>();
  const post = (entries: Entry[], adj: boolean) => entries.forEach((e, i) => e.lines.forEach((l) => {
    const list = ledger.get(l.account) ?? [];
    list.push({ ref: adj ? `Adj ${String.fromCharCode(97 + i)}` : e.date ?? String(i + 1), dr: l.dr ?? 0, cr: l.cr ?? 0, adj });
    ledger.set(l.account, list);
  }));
  post(p.journal, false);
  post(p.adjustments, true);

  const net = (entries: Entry[], name: string) => sum(entries.flatMap((e) => e.lines.filter((l) => l.account === name).map((l) => (l.dr ?? 0) - (l.cr ?? 0))));
  const side = (n: number) => ({ dr: n > 0 ? n : 0, cr: n < 0 ? -n : 0 });

  const rows: WsRow[] = p.accounts.filter((a) => ledger.has(a.name)).map((a) => {
    const tb = side(net(p.journal, a.name));
    const adjDr = sum(p.adjustments.flatMap((e) => e.lines.filter((l) => l.account === a.name).map((l) => l.dr ?? 0)));
    const adjCr = sum(p.adjustments.flatMap((e) => e.lines.filter((l) => l.account === a.name).map((l) => l.cr ?? 0)));
    const atb = side(net(all, a.name));
    const onIS = a.type === "revenue" || a.type === "expense";
    return {
      account: a, tbDr: tb.dr, tbCr: tb.cr, adjDr, adjCr, atbDr: atb.dr, atbCr: atb.cr,
      isDr: onIS ? atb.dr : 0, isCr: onIS ? atb.cr : 0, bsDr: onIS ? 0 : atb.dr, bsCr: onIS ? 0 : atb.cr,
    };
  });
  const total = (k: keyof Omit<WsRow, "account">) => sum(rows.map((r) => r[k]));
  const totals = Object.fromEntries((["tbDr", "tbCr", "adjDr", "adjCr", "atbDr", "atbCr", "isDr", "isCr", "bsDr", "bsCr"] as const).map((k) => [k, total(k)])) as Record<keyof Omit<WsRow, "account">, number>;
  const netIncome = totals.isCr - totals.isDr;

  const bal = (a: Account) => { const r = rows.find((x) => x.account.name === a.name)!; return r.atbDr + r.atbCr; };
  const of = (t: AcctType) => rows.filter((r) => r.account.type === t).map((r) => r.account);
  const capital = of("capital")[0], drawing = of("drawing")[0];
  const capitalBeg = capital ? bal(capital) : 0;
  const drawingAmt = drawing ? bal(drawing) : 0;
  const capitalEnd = capitalBeg + netIncome - drawingAmt;

  // closing entries
  const revenues = of("revenue"), expenses = of("expense");
  const closing: Entry[] = [
    { memo: "To close revenue accounts", lines: [...revenues.map((a) => ({ account: a.name, dr: bal(a) })), { account: "Income Summary", cr: sum(revenues.map(bal)) }] },
    { memo: "To close expense accounts", lines: [{ account: "Income Summary", dr: sum(expenses.map(bal)) }, ...expenses.map((a) => ({ account: a.name, cr: bal(a) }))] },
    netIncome >= 0
      ? { memo: "To close Income Summary (net income) to capital", lines: [{ account: "Income Summary", dr: netIncome }, { account: capital.name, cr: netIncome }] }
      : { memo: "To close Income Summary (net loss) to capital", lines: [{ account: capital.name, dr: -netIncome }, { account: "Income Summary", cr: -netIncome }] },
    ...(drawing ? [{ memo: "To close drawing to capital", lines: [{ account: capital.name, dr: drawingAmt }, { account: drawing.name, cr: drawingAmt }] }] : []),
  ];

  const postClosing = rows
    .filter((r) => !["revenue", "expense", "drawing"].includes(r.account.type))
    .map((r) => r.account.type === "capital" ? { name: r.account.name, dr: 0, cr: capitalEnd } : { name: r.account.name, dr: r.atbDr, cr: r.atbCr });

  // statements
  const assets = of("asset").map((a) => ({
    account: a, amount: bal(a),
    contra: of("contra-asset").filter((c) => c.contraOf === a.name).map((c) => ({ account: c, amount: bal(c) })),
  }));
  const netOf = (x: (typeof assets)[number]) => x.amount - sum(x.contra.map((c) => c.amount));
  const current = assets.filter((x) => x.account.current !== false);
  const noncurrent = assets.filter((x) => x.account.current === false);
  const liabilities = of("liability").map((a) => ({ account: a, amount: bal(a) }));
  const totalAssets = sum(assets.map(netOf));
  const totalLiab = sum(liabilities.map((l) => l.amount));

  return {
    ledger: p.accounts.filter((a) => ledger.has(a.name)).map((a) => {
      const ps = ledger.get(a.name)!;
      const unadj = net(p.journal, a.name), adjusted = net(all, a.name);
      return { account: a, postings: ps, unadj: side(unadj), adjusted: side(adjusted) };
    }),
    rows, totals, netIncome, closing, postClosing,
    postClosingTotal: { dr: sum(postClosing.map((r) => r.dr)), cr: sum(postClosing.map((r) => r.cr)) },
    statements: {
      revenues: revenues.map((a) => ({ account: a, amount: bal(a) })),
      expenses: expenses.map((a) => ({ account: a, amount: bal(a) })),
      totalRevenue: sum(revenues.map(bal)), totalExpenses: sum(expenses.map(bal)),
      capitalName: capital?.name ?? "Capital", drawingName: drawing?.name, capitalBeg, drawing: drawingAmt, capitalEnd,
      current, noncurrent, netOf: assets.map((x) => ({ name: x.account.name, net: netOf(x) })),
      totalCurrent: sum(current.map(netOf)), totalNoncurrent: sum(noncurrent.map(netOf)), totalAssets,
      currentLiab: liabilities.filter((l) => l.account.current !== false), noncurrentLiab: liabilities.filter((l) => l.account.current === false),
      totalLiab, totalLiabEquity: totalLiab + capitalEnd,
    },
  };
}

export type Solution = ReturnType<typeof solve>;
export const peso = (n: number) => (n === 0 ? "" : n.toLocaleString("en-PH"));
