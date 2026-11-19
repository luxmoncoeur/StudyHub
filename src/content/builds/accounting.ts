// Generated from tested project files. Do not edit by hand.
import type { Guide } from "../types";

export const builds: Record<string, Guide> = {
 "Mini general ledger web app": {
  "where": "Your Mac: Next.js + PostgreSQL",
  "time": "1–2 weekends",
  "youNeed": [
   "PostgreSQL running (`brew services start postgresql@17`)",
   "Node.js 20+",
   "The *Accounting as a database* lesson"
  ],
  "tree": "mini-gl/\n  db/\n    schema.sql\n  src/\n    app/\n      api/\n        accounts/\n          route.ts\n        entries/\n          route.ts\n        reports/\n          route.ts\n      page.tsx\n      reports/\n        page.tsx\n    lib/\n      db.ts",
  "steps": [
   {
    "title": "Create the Next.js project",
    "body": [
     "This makes a fresh Next.js 16 app with TypeScript, Tailwind and the App Router. Accept the defaults."
    ],
    "commands": [
     {
      "cmd": "cd ~/Developments && npx create-next-app@latest mini-gl --yes",
      "purpose": "New Next.js app"
     },
     {
      "cmd": "cd mini-gl && code .",
      "purpose": "Open it in VS Code"
     }
    ]
   },
   {
    "title": "Create the database",
    "body": [
     "Three tables: chart of accounts, journal entry headers, journal lines. Money is stored in **centavos** (integers) so there are no rounding errors. The `CHECK` makes every line exactly one side."
    ],
    "files": [
     {
      "title": "db/schema.sql",
      "variants": {
       "postgres": "-- Chart of accounts\nCREATE TABLE accounts (\n  id   SERIAL PRIMARY KEY,\n  code TEXT UNIQUE NOT NULL,\n  name TEXT NOT NULL,\n  type TEXT NOT NULL CHECK (type IN ('ASSET','LIABILITY','EQUITY','DRAWING','REVENUE','EXPENSE'))\n);\n\n-- One row per journal entry (the header)\nCREATE TABLE journal_entries (\n  id         SERIAL PRIMARY KEY,\n  entry_date DATE NOT NULL,\n  memo       TEXT NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\n-- One row per debit or credit line. Money is stored in centavos (integers).\nCREATE TABLE journal_lines (\n  id              SERIAL PRIMARY KEY,\n  entry_id        INT NOT NULL REFERENCES journal_entries(id),\n  account_id      INT NOT NULL REFERENCES accounts(id),\n  debit_centavos  BIGINT NOT NULL DEFAULT 0 CHECK (debit_centavos >= 0),\n  credit_centavos BIGINT NOT NULL DEFAULT 0 CHECK (credit_centavos >= 0),\n  CHECK ((debit_centavos = 0) <> (credit_centavos = 0))   -- exactly one side per line\n);\n\nINSERT INTO accounts (code, name, type) VALUES\n  ('101', 'Cash', 'ASSET'),\n  ('102', 'Accounts Receivable', 'ASSET'),\n  ('103', 'Office Supplies', 'ASSET'),\n  ('151', 'Equipment', 'ASSET'),\n  ('201', 'Accounts Payable', 'LIABILITY'),\n  ('202', 'Loans Payable', 'LIABILITY'),\n  ('301', 'Owner''s Capital', 'EQUITY'),\n  ('302', 'Owner''s Drawing', 'DRAWING'),\n  ('401', 'Service Revenue', 'REVENUE'),\n  ('501', 'Salaries Expense', 'EXPENSE'),\n  ('502', 'Utilities Expense', 'EXPENSE');\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "createdb mini_gl && psql mini_gl -f db/schema.sql",
      "purpose": "Create the DB and run the schema"
     },
     {
      "cmd": "echo 'DATABASE_URL=postgres://localhost/mini_gl' > .env.local",
      "purpose": "Tell Next.js where the DB is"
     },
     {
      "cmd": "npm i pg && npm i -D @types/pg",
      "purpose": "Postgres driver"
     }
    ]
   },
   {
    "title": "Database helper",
    "body": [
     "One shared connection pool, plus peso ⇄ centavo helpers."
    ],
    "files": [
     {
      "title": "src/lib/db.ts",
      "variants": {
       "ts": "import { Pool } from \"pg\";\n\n// One shared pool for the whole app. Set DATABASE_URL in .env.local\nexport const pool = new Pool({ connectionString: process.env.DATABASE_URL });\n\nexport const toCentavos = (pesos: string | number) => Math.round(Number(pesos) * 100);\nexport const toPesos = (centavos: string | number) => Number(centavos) / 100;\n"
      }
     }
    ]
   },
   {
    "title": "API: accounts and journal entries",
    "body": [
     "`POST /api/entries` validates on the **server** (at least 2 lines, one side each, debits = credits) and saves the header + lines in **one transaction**: either everything saves or nothing does.",
     "Dates are formatted in SQL with `to_char`, because the pg driver otherwise shifts a DATE by your timezone and shows the previous day."
    ],
    "files": [
     {
      "title": "src/app/api/accounts/route.ts",
      "variants": {
       "ts": "import { pool } from \"@/lib/db\";\n\nexport async function GET() {\n  const { rows } = await pool.query(\"SELECT id, code, name, type FROM accounts ORDER BY code\");\n  return Response.json(rows);\n}\n"
      }
     },
     {
      "title": "src/app/api/entries/route.ts",
      "variants": {
       "ts": "import { pool, toCentavos, toPesos } from \"@/lib/db\";\n\ntype LineInput = { accountId: number; debit: string; credit: string };\n\n// List entries with their lines, newest first\nexport async function GET() {\n  const { rows } = await pool.query(`\n    SELECT e.id, to_char(e.entry_date, 'YYYY-MM-DD') AS entry_date, e.memo,  -- format in SQL: avoids the timezone shift\n           a.name AS account, l.debit_centavos, l.credit_centavos\n    FROM journal_entries e\n    JOIN journal_lines l ON l.entry_id = e.id\n    JOIN accounts a ON a.id = l.account_id\n    ORDER BY e.id DESC, l.debit_centavos DESC, l.id`);\n  const entries = new Map<number, { id: number; date: string; memo: string; lines: { account: string; debit: number; credit: number }[] }>();\n  for (const r of rows) {\n    if (!entries.has(r.id)) entries.set(r.id, { id: r.id, date: r.entry_date, memo: r.memo, lines: [] });\n    entries.get(r.id)!.lines.push({ account: r.account, debit: toPesos(r.debit_centavos), credit: toPesos(r.credit_centavos) });\n  }\n  return Response.json([...entries.values()]);\n}\n\n// Create one balanced entry inside a transaction\nexport async function POST(req: Request) {\n  const body = await req.json();\n  const lines: LineInput[] = body.lines ?? [];\n  const parsed = lines\n    .map((l) => ({ accountId: Number(l.accountId), dr: toCentavos(l.debit || 0), cr: toCentavos(l.credit || 0) }))\n    .filter((l) => l.dr > 0 || l.cr > 0);\n\n  // Validate on the server, never trust the form\n  if (!body.date || !body.memo) return Response.json({ error: \"Date and memo are required\" }, { status: 422 });\n  if (parsed.length < 2) return Response.json({ error: \"An entry needs at least 2 lines\" }, { status: 422 });\n  if (parsed.some((l) => !l.accountId || (l.dr > 0 && l.cr > 0) || l.dr < 0 || l.cr < 0))\n    return Response.json({ error: \"Each line needs an account and exactly one positive side\" }, { status: 422 });\n  const totalDr = parsed.reduce((s, l) => s + l.dr, 0);\n  const totalCr = parsed.reduce((s, l) => s + l.cr, 0);\n  if (totalDr !== totalCr) return Response.json({ error: `Not balanced: Dr ${totalDr / 100} vs Cr ${totalCr / 100}` }, { status: 422 });\n\n  const client = await pool.connect();\n  try {\n    await client.query(\"BEGIN\");\n    const { rows } = await client.query(\n      \"INSERT INTO journal_entries (entry_date, memo) VALUES ($1, $2) RETURNING id\", [body.date, body.memo]);\n    for (const l of parsed) {\n      await client.query(\n        \"INSERT INTO journal_lines (entry_id, account_id, debit_centavos, credit_centavos) VALUES ($1, $2, $3, $4)\",\n        [rows[0].id, l.accountId, l.dr, l.cr]);\n    }\n    await client.query(\"COMMIT\");\n    return Response.json({ id: rows[0].id }, { status: 201 });\n  } catch (e) {\n    await client.query(\"ROLLBACK\");\n    return Response.json({ error: (e as Error).message }, { status: 400 });\n  } finally {\n    client.release();\n  }\n}\n"
      }
     }
    ]
   },
   {
    "title": "API: trial balance + income statement",
    "body": [
     "Balances are **computed from the lines** every time, never stored, so they can't drift out of sync."
    ],
    "files": [
     {
      "title": "src/app/api/reports/route.ts",
      "variants": {
       "ts": "import { pool, toPesos } from \"@/lib/db\";\n\n// Trial balance + income statement, computed from the lines (never stored)\nexport async function GET() {\n  const { rows } = await pool.query(`\n    SELECT a.code, a.name, a.type,\n           COALESCE(SUM(l.debit_centavos), 0) - COALESCE(SUM(l.credit_centavos), 0) AS net\n    FROM accounts a\n    LEFT JOIN journal_lines l ON l.account_id = a.id\n    GROUP BY a.id\n    HAVING COALESCE(SUM(l.debit_centavos), 0) - COALESCE(SUM(l.credit_centavos), 0) <> 0\n    ORDER BY a.code`);\n\n  const trialBalance = rows.map((r) => {\n    const net = Number(r.net);\n    return { code: r.code, name: r.name, type: r.type, debit: net > 0 ? toPesos(net) : 0, credit: net < 0 ? toPesos(-net) : 0 };\n  });\n  const sum = (k: \"debit\" | \"credit\", types?: string[]) =>\n    trialBalance.filter((r) => !types || types.includes(r.type)).reduce((s, r) => s + r[k], 0);\n\n  const revenue = sum(\"credit\", [\"REVENUE\"]) - sum(\"debit\", [\"REVENUE\"]);\n  const expenses = sum(\"debit\", [\"EXPENSE\"]) - sum(\"credit\", [\"EXPENSE\"]);\n  return Response.json({\n    trialBalance,\n    totals: { debit: sum(\"debit\"), credit: sum(\"credit\") },\n    incomeStatement: { revenue, expenses, netIncome: revenue - expenses },\n  });\n}\n"
      }
     }
    ]
   },
   {
    "title": "Journal page (the form)",
    "body": [
     "The Post button stays disabled until debits equal credits. Today's date is set inside `useEffect`, because Next 16 refuses `new Date()` during prerendering."
    ],
    "files": [
     {
      "title": "src/app/page.tsx",
      "variants": {
       "ts": "\"use client\";\n\nimport Link from \"next/link\";\nimport { useEffect, useState } from \"react\";\n\ntype Account = { id: number; code: string; name: string };\ntype Line = { accountId: string; debit: string; credit: string };\ntype Entry = { id: number; date: string; memo: string; lines: { account: string; debit: number; credit: number }[] };\n\nconst blank = (): Line => ({ accountId: \"\", debit: \"\", credit: \"\" });\nconst peso = (n: number) => (n ? n.toLocaleString(\"en-PH\", { minimumFractionDigits: 2 }) : \"\");\n\nexport default function JournalPage() {\n  const [accounts, setAccounts] = useState<Account[]>([]);\n  const [entries, setEntries] = useState<Entry[]>([]);\n  const [date, setDate] = useState(\"\");\n  const [memo, setMemo] = useState(\"\");\n  const [lines, setLines] = useState<Line[]>([blank(), blank()]);\n  const [error, setError] = useState(\"\");\n\n  const load = () => fetch(\"/api/entries\").then((r) => r.json()).then(setEntries);\n  useEffect(() => {\n    setDate(new Date().toISOString().slice(0, 10)); // today, set in the browser (not at build time)\n    fetch(\"/api/accounts\").then((r) => r.json()).then(setAccounts);\n    load();\n  }, []);\n\n  const totalDr = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);\n  const totalCr = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);\n  const balanced = totalDr > 0 && Math.round(totalDr * 100) === Math.round(totalCr * 100);\n\n  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));\n\n  async function save(e: React.FormEvent) {\n    e.preventDefault();\n    setError(\"\");\n    const res = await fetch(\"/api/entries\", {\n      method: \"POST\",\n      headers: { \"Content-Type\": \"application/json\" },\n      body: JSON.stringify({ date, memo, lines }),\n    });\n    if (!res.ok) return setError((await res.json()).error);\n    setMemo(\"\");\n    setLines([blank(), blank()]);\n    load();\n  }\n\n  return (\n    <main className=\"mx-auto max-w-4xl space-y-8 p-8\">\n      <header className=\"flex items-center justify-between\">\n        <h1 className=\"text-2xl font-bold\">Mini General Ledger</h1>\n        <Link href=\"/reports\" className=\"text-blue-600 underline\">Reports →</Link>\n      </header>\n\n      <form onSubmit={save} className=\"space-y-3 rounded-lg border p-4\">\n        <div className=\"flex gap-2\">\n          <input type=\"date\" value={date} onChange={(e) => setDate(e.target.value)} className=\"rounded border px-2 py-1\" />\n          <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder=\"Memo, e.g. Owner invested cash\" className=\"flex-1 rounded border px-2 py-1\" />\n        </div>\n        {lines.map((l, i) => (\n          <div key={i} className=\"flex gap-2\">\n            <select value={l.accountId} onChange={(e) => setLine(i, { accountId: e.target.value })} className=\"flex-1 rounded border px-2 py-1\">\n              <option value=\"\">— account —</option>\n              {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} {a.name}</option>)}\n            </select>\n            <input inputMode=\"decimal\" placeholder=\"Debit\" value={l.debit} onChange={(e) => setLine(i, { debit: e.target.value, credit: \"\" })} className=\"w-32 rounded border px-2 py-1 text-right\" />\n            <input inputMode=\"decimal\" placeholder=\"Credit\" value={l.credit} onChange={(e) => setLine(i, { credit: e.target.value, debit: \"\" })} className=\"w-32 rounded border px-2 py-1 text-right\" />\n          </div>\n        ))}\n        <div className=\"flex items-center gap-3 text-sm\">\n          <button type=\"button\" onClick={() => setLines([...lines, blank()])} className=\"underline\">+ line</button>\n          <span className=\"ml-auto\">Dr {peso(totalDr) || \"0.00\"} · Cr {peso(totalCr) || \"0.00\"}</span>\n          <button disabled={!balanced} className=\"rounded bg-black px-4 py-1.5 text-white disabled:opacity-30\">Post entry</button>\n        </div>\n        {error && <p className=\"text-sm text-red-600\">{error}</p>}\n      </form>\n\n      <section className=\"space-y-2\">\n        <h2 className=\"font-semibold\">Journal</h2>\n        {entries.map((e) => (\n          <div key={e.id} className=\"rounded border p-3 text-sm\">\n            <p className=\"text-gray-500\">{e.date} · {e.memo}</p>\n            {e.lines.map((l, i) => (\n              <div key={i} className={`flex font-mono ${l.credit ? \"pl-8\" : \"\"}`}>\n                <span className=\"flex-1\">{l.account}</span>\n                <span className=\"w-28 text-right\">{peso(l.debit)}</span>\n                <span className=\"w-28 text-right\">{peso(l.credit)}</span>\n              </div>\n            ))}\n          </div>\n        ))}\n      </section>\n    </main>\n  );\n}\n"
      }
     }
    ]
   },
   {
    "title": "Reports page",
    "files": [
     {
      "title": "src/app/reports/page.tsx",
      "variants": {
       "ts": "\"use client\";\n\nimport Link from \"next/link\";\nimport { useEffect, useState } from \"react\";\n\ntype Report = {\n  trialBalance: { code: string; name: string; debit: number; credit: number }[];\n  totals: { debit: number; credit: number };\n  incomeStatement: { revenue: number; expenses: number; netIncome: number };\n};\nconst peso = (n: number) => n.toLocaleString(\"en-PH\", { minimumFractionDigits: 2 });\n\nexport default function ReportsPage() {\n  const [r, setR] = useState<Report | null>(null);\n  useEffect(() => { fetch(\"/api/reports\").then((res) => res.json()).then(setR); }, []);\n  if (!r) return <p className=\"p-8\">Loading…</p>;\n  const ok = r.totals.debit === r.totals.credit;\n\n  return (\n    <main className=\"mx-auto max-w-3xl space-y-8 p-8\">\n      <Link href=\"/\" className=\"text-blue-600 underline\">← Journal</Link>\n      <section>\n        <h1 className=\"mb-2 text-2xl font-bold\">Trial Balance</h1>\n        <table className=\"w-full text-sm\">\n          <tbody>\n            {r.trialBalance.map((row) => (\n              <tr key={row.code} className=\"border-b\">\n                <td className=\"py-1\">{row.code} {row.name}</td>\n                <td className=\"text-right font-mono\">{row.debit ? peso(row.debit) : \"\"}</td>\n                <td className=\"text-right font-mono\">{row.credit ? peso(row.credit) : \"\"}</td>\n              </tr>\n            ))}\n            <tr className=\"font-bold\">\n              <td className=\"py-1\">Total {ok ? \"✓\" : \"✗ NOT BALANCED\"}</td>\n              <td className=\"text-right font-mono\">{peso(r.totals.debit)}</td>\n              <td className=\"text-right font-mono\">{peso(r.totals.credit)}</td>\n            </tr>\n          </tbody>\n        </table>\n      </section>\n      <section>\n        <h2 className=\"mb-2 text-xl font-bold\">Income Statement</h2>\n        <p>Revenue: <b className=\"font-mono\">{peso(r.incomeStatement.revenue)}</b></p>\n        <p>Expenses: <b className=\"font-mono\">({peso(r.incomeStatement.expenses)})</b></p>\n        <p className=\"border-t pt-1\">Net income: <b className=\"font-mono\">{peso(r.incomeStatement.netIncome)}</b></p>\n      </section>\n    </main>\n  );\n}\n"
      }
     }
    ]
   },
   {
    "title": "Run it and enter Entity A",
    "commands": [
     {
      "cmd": "npm run dev",
      "purpose": "Start at http://localhost:3000"
     }
    ],
    "body": [
     "Post the 10 transactions of **Practice problems → Entity A**. Open **Reports**: the trial balance must be **₱1,100,000 = ₱1,100,000**, revenue ₱600,000, expenses ₱156,000 (before adjustments).",
     "Try posting Dr 100 / Cr 90. The server answers `Not balanced: Dr 100 vs Cr 90` (HTTP 422)."
    ]
   }
  ],
  "done": [
   "Entity A's unadjusted TB shows ₱1,100,000 on both sides.",
   "An unbalanced entry is rejected by the server, not just the form.",
   "Stretch: add an Adjusting Entries page and a 10-column worksheet view."
  ]
 },
 "Sari-sari POS with ledger": {
  "where": "Your Mac: Node/Express + MySQL 8.4 (Homebrew or Docker)",
  "time": "2 weekends",
  "youNeed": [
   "MySQL 8.4: `brew install mysql@8.4 && brew services start mysql@8.4` (or Docker: `docker run -d --name pos-mysql -e MYSQL_ROOT_PASSWORD=secret -p 3306:3306 mysql:8.4`)",
   "Node.js 20+"
  ],
  "tree": "sari-sari-pos/\n  db.js\n  db/\n    schema.sql\n  ledger.js\n  public/\n    index.html\n  server.js\n  test-ledger.js",
  "steps": [
   {
    "title": "Create the project",
    "commands": [
     {
      "cmd": "mkdir -p ~/Developments/sari-sari-pos/{db,public} && cd ~/Developments/sari-sari-pos",
      "purpose": "Folders"
     },
     {
      "cmd": "npm init -y && npm i express mysql2",
      "purpose": "Express + MySQL driver"
     }
    ]
   },
   {
    "title": "Database: products, sales and the ledger",
    "body": [
     "Prices are VAT-inclusive centavos. The ledger tables are the same idea as the Mini GL."
    ],
    "files": [
     {
      "title": "db/schema.sql",
      "variants": {
       "mysql": "-- Sari-sari POS + double-entry ledger (MySQL 8.4). Money in centavos.\nCREATE TABLE products (\n  id              INT AUTO_INCREMENT PRIMARY KEY,\n  name            VARCHAR(100) NOT NULL UNIQUE,\n  price_centavos  INT NOT NULL CHECK (price_centavos > 0),   -- VAT-inclusive selling price\n  cost_centavos   INT NOT NULL CHECK (cost_centavos >= 0),\n  stock           INT NOT NULL CHECK (stock >= 0)\n) ENGINE=InnoDB;\n\nCREATE TABLE sales (\n  id             INT AUTO_INCREMENT PRIMARY KEY,\n  total_centavos INT NOT NULL,\n  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP\n) ENGINE=InnoDB;\n\nCREATE TABLE sale_items (\n  id             INT AUTO_INCREMENT PRIMARY KEY,\n  sale_id        INT NOT NULL,\n  product_id     INT NOT NULL,\n  qty            INT NOT NULL CHECK (qty > 0),\n  price_centavos INT NOT NULL,\n  FOREIGN KEY (sale_id) REFERENCES sales(id),\n  FOREIGN KEY (product_id) REFERENCES products(id)\n) ENGINE=InnoDB;\n\nCREATE TABLE accounts (\n  id   INT AUTO_INCREMENT PRIMARY KEY,\n  name VARCHAR(100) NOT NULL UNIQUE,\n  type ENUM('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE') NOT NULL\n) ENGINE=InnoDB;\n\nCREATE TABLE journal_entries (\n  id         INT AUTO_INCREMENT PRIMARY KEY,\n  sale_id    INT NULL,\n  memo       VARCHAR(200) NOT NULL,\n  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (sale_id) REFERENCES sales(id)\n) ENGINE=InnoDB;\n\nCREATE TABLE journal_lines (\n  id              INT AUTO_INCREMENT PRIMARY KEY,\n  entry_id        INT NOT NULL,\n  account_id      INT NOT NULL,\n  debit_centavos  BIGINT NOT NULL DEFAULT 0,\n  credit_centavos BIGINT NOT NULL DEFAULT 0,\n  FOREIGN KEY (entry_id) REFERENCES journal_entries(id),\n  FOREIGN KEY (account_id) REFERENCES accounts(id),\n  CHECK (debit_centavos >= 0 AND credit_centavos >= 0)\n) ENGINE=InnoDB;\n\nINSERT INTO accounts (name, type) VALUES\n  ('Cash', 'ASSET'), ('Merchandise Inventory', 'ASSET'), ('Output VAT Payable', 'LIABILITY'),\n  ('Owner''s Capital', 'EQUITY'), ('Sales', 'REVENUE'), ('Cost of Goods Sold', 'EXPENSE');\n\nINSERT INTO products (name, price_centavos, cost_centavos, stock) VALUES\n  ('Lucky Me Pancit Canton', 1800, 1300, 50),\n  ('Coke 290ml', 2500, 1800, 24),\n  ('Bear Brand 33g', 1400, 1000, 40),\n  ('Skyflakes 10s', 6500, 5000, 10),\n  ('Kopiko Blanca (twin)', 1200, 850, 1);\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "mysql -u root -p -e 'CREATE DATABASE pos'",
      "purpose": "Create the DB"
     },
     {
      "cmd": "mysql -u root -p pos < db/schema.sql",
      "purpose": "Run the schema + seed products"
     }
    ]
   },
   {
    "title": "Connection pool",
    "files": [
     {
      "title": "db.js",
      "variants": {
       "js": "const mysql = require(\"mysql2/promise\");\n\nmodule.exports = mysql.createPool({\n  host: process.env.DB_HOST || \"localhost\",\n  port: Number(process.env.DB_PORT || 3306),\n  user: process.env.DB_USER || \"root\",\n  password: process.env.DB_PASSWORD || \"\",\n  database: process.env.DB_NAME || \"pos\",\n  connectionLimit: 10,\n});\n"
      }
     }
    ]
   },
   {
    "title": "The accounting rule (pure function + test)",
    "body": [
     "Each sale becomes 5 journal lines: Cash / Sales / Output VAT and COGS / Inventory. VAT = gross − gross ÷ 1.12, with the remainder going to VAT so the entry **always** balances."
    ],
    "files": [
     {
      "title": "ledger.js",
      "variants": {
       "js": "// Turns one sale into balanced journal lines (pure function = easy to test)\n// VAT-registered seller: price includes 12% VAT, so net = gross / 1.12\nfunction saleEntry(grossCentavos, costCentavos) {\n  const net = Math.round(grossCentavos / 1.12);\n  const vat = grossCentavos - net;   // remainder goes to VAT so the entry always balances\n  return [\n    { account: \"Cash\", debit: grossCentavos, credit: 0 },\n    { account: \"Sales\", debit: 0, credit: net },\n    { account: \"Output VAT Payable\", debit: 0, credit: vat },\n    { account: \"Cost of Goods Sold\", debit: costCentavos, credit: 0 },\n    { account: \"Merchandise Inventory\", debit: 0, credit: costCentavos },\n  ];\n}\n\nmodule.exports = { saleEntry };\n"
      }
     },
     {
      "title": "test-ledger.js",
      "variants": {
       "js": "// Run: node test-ledger.js\nconst assert = require(\"node:assert/strict\");\nconst { saleEntry } = require(\"./ledger\");\n\nfor (const [gross, cost] of [[112000, 60000], [1800, 1300], [9999, 1]]) {\n  const lines = saleEntry(gross, cost);\n  const dr = lines.reduce((s, l) => s + l.debit, 0), cr = lines.reduce((s, l) => s + l.credit, 0);\n  assert.equal(dr, cr, `unbalanced for ${gross}`);\n}\nconst l = saleEntry(112000, 60000);                     // ₱1,120 sale, cost ₱600\nassert.equal(l.find((x) => x.account === \"Sales\").credit, 100000);              // ₱1,000\nassert.equal(l.find((x) => x.account === \"Output VAT Payable\").credit, 12000);  // ₱120\nconsole.log(\"ledger tests passed\");\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "node test-ledger.js",
      "purpose": "Must print: ledger tests passed"
     }
    ]
   },
   {
    "title": "The server: checkout in one transaction",
    "body": [
     "`SELECT … FOR UPDATE` locks each product row, so two cashiers can't sell the same last item. If anything fails, `rollback()` undoes the stock change, the sale and the journal entry together."
    ],
    "files": [
     {
      "title": "server.js",
      "variants": {
       "js": "const express = require(\"express\");\nconst pool = require(\"./db\");\nconst { saleEntry } = require(\"./ledger\");\n\nconst app = express();\napp.use(express.json());\napp.use(express.static(\"public\"));\n\napp.get(\"/products\", async (req, res, next) => {\n  try {\n    const [rows] = await pool.query(\"SELECT id, name, price_centavos, stock FROM products ORDER BY name\");\n    res.json(rows);\n  } catch (e) { next(e); }\n});\n\n// POST /checkout  { items: [{ productId, qty }] }\napp.post(\"/checkout\", async (req, res, next) => {\n  const items = (req.body.items || []).filter((i) => Number(i.qty) > 0);\n  if (!items.length) return res.status(422).json({ error: \"Cart is empty\" });\n\n  const conn = await pool.getConnection();\n  try {\n    await conn.beginTransaction();\n    let gross = 0, cost = 0;\n    const lines = [];\n    for (const { productId, qty } of items) {\n      // FOR UPDATE locks the row: two cashiers can't sell the same last item\n      const [[p]] = await conn.query(\"SELECT * FROM products WHERE id = ? FOR UPDATE\", [productId]);\n      if (!p) throw Object.assign(new Error(`Product ${productId} not found`), { status: 404 });\n      if (p.stock < qty) throw Object.assign(new Error(`Not enough stock for ${p.name} (left: ${p.stock})`), { status: 409 });\n      await conn.query(\"UPDATE products SET stock = stock - ? WHERE id = ?\", [qty, productId]);\n      gross += p.price_centavos * qty;\n      cost += p.cost_centavos * qty;\n      lines.push([productId, qty, p.price_centavos]);\n    }\n\n    const [sale] = await conn.query(\"INSERT INTO sales (total_centavos) VALUES (?)\", [gross]);\n    for (const [productId, qty, price] of lines) {\n      await conn.query(\"INSERT INTO sale_items (sale_id, product_id, qty, price_centavos) VALUES (?, ?, ?, ?)\", [sale.insertId, productId, qty, price]);\n    }\n\n    const [entry] = await conn.query(\"INSERT INTO journal_entries (sale_id, memo) VALUES (?, ?)\", [sale.insertId, `POS sale #${sale.insertId}`]);\n    for (const l of saleEntry(gross, cost)) {\n      await conn.query(\n        \"INSERT INTO journal_lines (entry_id, account_id, debit_centavos, credit_centavos) SELECT ?, id, ?, ? FROM accounts WHERE name = ?\",\n        [entry.insertId, l.debit, l.credit, l.account]);\n    }\n\n    await conn.commit();\n    res.status(201).json({ saleId: sale.insertId, total: gross / 100 });\n  } catch (e) {\n    await conn.rollback();   // nothing is saved if any step fails\n    if (e.status) return res.status(e.status).json({ error: e.message });\n    next(e);\n  } finally {\n    conn.release();\n  }\n});\n\n// GET /reports/daily?date=2026-11-19  (computed from the ledger, not from sales)\napp.get(\"/reports/daily\", async (req, res, next) => {\n  try {\n    const date = req.query.date || new Date().toISOString().slice(0, 10);\n    const [rows] = await pool.query(\n      `SELECT a.name, SUM(l.debit_centavos) AS dr, SUM(l.credit_centavos) AS cr\n       FROM journal_lines l\n       JOIN journal_entries e ON e.id = l.entry_id\n       JOIN accounts a ON a.id = l.account_id\n       WHERE DATE(e.created_at) = ?\n       GROUP BY a.name`, [date]);\n    const get = (name, side) => Number(rows.find((r) => r.name === name)?.[side] ?? 0) / 100;\n    const sales = get(\"Sales\", \"cr\"), cogs = get(\"Cost of Goods Sold\", \"dr\");\n    res.json({ date, cash: get(\"Cash\", \"dr\"), sales, vat: get(\"Output VAT Payable\", \"cr\"), cogs, grossProfit: +(sales - cogs).toFixed(2) });\n  } catch (e) { next(e); }\n});\n\napp.use((err, req, res, next) => {\n  console.error(err);\n  res.status(500).json({ error: \"Internal server error\" });\n});\n\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => console.log(`POS on http://localhost:${PORT}`));\n"
      }
     }
    ]
   },
   {
    "title": "The cashier screen",
    "body": [
     "Plain HTML + JS served from `public/`. It uses `textContent`, never `innerHTML`, for data from the server."
    ],
    "files": [
     {
      "title": "public/index.html",
      "variants": {
       "html": "<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <title>Sari-sari POS</title>\n  <style>\n    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; display: grid; grid-template-columns: 1fr 300px; gap: 1.5rem; }\n    h1 { grid-column: 1 / -1; margin: 0; }\n    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: .6rem; }\n    button.product { text-align: left; padding: .8rem; border: 1px solid #ddd; border-radius: 8px; background: #fff; cursor: pointer; }\n    button.product:disabled { opacity: .4; }\n    aside { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; height: fit-content; }\n    .row { display: flex; justify-content: space-between; margin: .2rem 0; }\n    #pay { width: 100%; padding: .7rem; margin-top: .8rem; background: #111; color: #fff; border: 0; border-radius: 6px; }\n  </style>\n</head>\n<body>\n  <h1>Aling Nena's Sari-sari POS</h1>\n  <main class=\"grid\" id=\"products\"></main>\n  <aside>\n    <h2>Cart</h2>\n    <div id=\"cart\"></div>\n    <div class=\"row\"><b>Total</b><b id=\"total\">₱0.00</b></div>\n    <button id=\"pay\">Checkout</button>\n    <p id=\"msg\" role=\"status\"></p>\n    <hr />\n    <button id=\"report\">Today's report</button>\n    <pre id=\"out\"></pre>\n  </aside>\n  <script>\n    const peso = (c) => \"₱\" + (c / 100).toFixed(2);\n    let products = [], cart = new Map();\n\n    async function loadProducts() {\n      products = await (await fetch(\"/products\")).json();\n      const el = document.getElementById(\"products\");\n      el.replaceChildren(...products.map((p) => {\n        const b = document.createElement(\"button\");\n        b.className = \"product\";\n        b.disabled = p.stock === 0;\n        b.textContent = `${p.name}\\n${peso(p.price_centavos)} · ${p.stock} left`;\n        b.style.whiteSpace = \"pre-line\";\n        b.onclick = () => { cart.set(p.id, (cart.get(p.id) || 0) + 1); renderCart(); };\n        return b;\n      }));\n    }\n\n    function renderCart() {\n      let total = 0;\n      const rows = [...cart].map(([id, qty]) => {\n        const p = products.find((x) => x.id === id);\n        total += p.price_centavos * qty;\n        const div = document.createElement(\"div\");\n        div.className = \"row\";\n        div.textContent = `${qty} × ${p.name}  ${peso(p.price_centavos * qty)}`;\n        return div;\n      });\n      document.getElementById(\"cart\").replaceChildren(...rows);\n      document.getElementById(\"total\").textContent = peso(total);\n    }\n\n    document.getElementById(\"pay\").onclick = async () => {\n      const items = [...cart].map(([productId, qty]) => ({ productId, qty }));\n      const res = await fetch(\"/checkout\", { method: \"POST\", headers: { \"Content-Type\": \"application/json\" }, body: JSON.stringify({ items }) });\n      const data = await res.json();\n      document.getElementById(\"msg\").textContent = res.ok ? `Sale #${data.saleId} saved: ₱${data.total.toFixed(2)}` : data.error;\n      if (res.ok) { cart.clear(); renderCart(); }\n      loadProducts();\n    };\n\n    document.getElementById(\"report\").onclick = async () => {\n      document.getElementById(\"out\").textContent = JSON.stringify(await (await fetch(\"/reports/daily\")).json(), null, 2);\n    };\n\n    loadProducts();\n  </script>\n</body>\n</html>\n"
      }
     }
    ]
   },
   {
    "title": "Run and prove it",
    "commands": [
     {
      "cmd": "DB_PASSWORD=yourpass node server.js",
      "purpose": "Start at http://localhost:3000"
     },
     {
      "cmd": "for i in 1 2; do curl -s -X POST localhost:3000/checkout -H 'Content-Type: application/json' -d '{\"items\":[{\"productId\":5,\"qty\":1}]}' & done; wait",
      "purpose": "2 cashiers race for the LAST Kopiko: one wins, one gets 'Not enough stock'"
     },
     {
      "cmd": "mysql -u root -p pos -e 'SELECT entry_id FROM journal_lines GROUP BY entry_id HAVING SUM(debit_centavos)<>SUM(credit_centavos)'",
      "purpose": "Audit: must return 0 rows"
     }
    ],
    "body": [
     "Click **Today's report**: cash = sales + VAT, and gross profit = sales − COGS."
    ]
   }
  ],
  "done": [
   "The concurrent checkout leaves stock at 0, never −1.",
   "The unbalanced-entry audit returns 0 rows.",
   "The daily report matches the receipts."
  ]
 },
 "Worksheet generator": {
  "where": "Python 3 on your Mac (no extra packages)",
  "time": "1 evening",
  "youNeed": [
   "Python 3 (`python3 --version`)"
  ],
  "tree": "worksheet-generator/\n  adjustments.csv\n  tb.csv\n  test_worksheet.py\n  worksheet.py",
  "steps": [
   {
    "title": "Create the folder",
    "commands": [
     {
      "cmd": "mkdir ~/Developments/worksheet-generator && cd $_",
      "purpose": "Project folder"
     }
    ]
   },
   {
    "title": "Input files: Entity A's trial balance + adjustments",
    "body": [
     "The TB lists **every** account, including the ones that only appear after adjusting (blank amounts). The adjustments file groups lines by `ref`, and each ref must balance."
    ],
    "files": [
     {
      "title": "tb.csv",
      "variants": {
       "text": "account,type,debit,credit\nCash,asset,354000,\nAccounts Receivable,asset,50000,\nAllowance for Doubtful Accounts,contra-asset,,\nOffice Supplies,asset,80000,\nEquipment,asset,360000,\nAccumulated Depreciation,contra-asset,,\nInterest Payable,liability,,\nLoans Payable,liability,,300000\nOwner's Capital,capital,,200000\nOwner's Drawing,drawing,100000,\nService Revenue,revenue,,600000\nUtilities Expense,expense,16000,\nSalaries Expense,expense,140000,\nInterest Expense,expense,,\nDepreciation Expense,expense,,\nDoubtful Accounts Expense,expense,,\nOffice Supplies Expense,expense,,\n"
      }
     },
     {
      "title": "adjustments.csv",
      "variants": {
       "text": "ref,account,debit,credit\na,Interest Expense,9000,\na,Interest Payable,,9000\nb,Depreciation Expense,12000,\nb,Accumulated Depreciation,,12000\nc,Doubtful Accounts Expense,3000,\nc,Allowance for Doubtful Accounts,,3000\nd,Office Supplies Expense,75000,\nd,Office Supplies,,75000\n"
      }
     }
    ]
   },
   {
    "title": "The generator",
    "body": [
     "It validates that every adjusting entry balances, builds all 10 columns, checks that the TB and ATB balance, and **asserts** that the IS and BS columns give the same net income."
    ],
    "files": [
     {
      "title": "worksheet.py",
      "variants": {
       "python": "\"\"\"10-column worksheet generator.\n\nUsage: python3 worksheet.py tb.csv adjustments.csv\nWrites worksheet.csv and prints the worksheet with net income.\n\"\"\"\nimport csv\nimport sys\nfrom collections import defaultdict\n\nIS_TYPES = {\"revenue\", \"expense\"}\nCOLS = [\"tb_dr\", \"tb_cr\", \"adj_dr\", \"adj_cr\", \"atb_dr\", \"atb_cr\", \"is_dr\", \"is_cr\", \"bs_dr\", \"bs_cr\"]\n\n\ndef num(s):\n    return float(s.replace(\",\", \"\")) if s and s.strip() else 0.0\n\n\ndef split(net):\n    \"\"\"Positive net = debit balance, negative = credit balance.\"\"\"\n    return (net, 0.0) if net > 0 else (0.0, -net)\n\n\ndef build(tb_rows, adj_rows):\n    # adjustments must balance per entry\n    per_ref = defaultdict(float)\n    for a in adj_rows:\n        per_ref[a[\"ref\"]] += num(a[\"debit\"]) - num(a[\"credit\"])\n    unbalanced = [r for r, v in per_ref.items() if round(v, 2) != 0]\n    if unbalanced:\n        raise ValueError(f\"Unbalanced adjusting entries: {unbalanced}\")\n\n    adj = defaultdict(lambda: [0.0, 0.0])\n    for a in adj_rows:\n        adj[a[\"account\"]][0] += num(a[\"debit\"])\n        adj[a[\"account\"]][1] += num(a[\"credit\"])\n\n    rows = []\n    for r in tb_rows:\n        tb_dr, tb_cr = num(r[\"debit\"]), num(r[\"credit\"])\n        adj_dr, adj_cr = adj.pop(r[\"account\"], [0.0, 0.0])\n        atb_dr, atb_cr = split(tb_dr - tb_cr + adj_dr - adj_cr)\n        on_is = r[\"type\"] in IS_TYPES\n        rows.append({\n            \"account\": r[\"account\"], \"type\": r[\"type\"],\n            \"tb_dr\": tb_dr, \"tb_cr\": tb_cr, \"adj_dr\": adj_dr, \"adj_cr\": adj_cr,\n            \"atb_dr\": atb_dr, \"atb_cr\": atb_cr,\n            \"is_dr\": atb_dr if on_is else 0.0, \"is_cr\": atb_cr if on_is else 0.0,\n            \"bs_dr\": 0.0 if on_is else atb_dr, \"bs_cr\": 0.0 if on_is else atb_cr,\n        })\n    if adj:\n        raise ValueError(f\"Adjustments use accounts missing from the TB: {list(adj)}\")\n\n    totals = {c: sum(r[c] for r in rows) for c in COLS}\n    for left, right in [(\"tb_dr\", \"tb_cr\"), (\"adj_dr\", \"adj_cr\"), (\"atb_dr\", \"atb_cr\")]:\n        if round(totals[left], 2) != round(totals[right], 2):\n            raise ValueError(f\"{left[:-3].upper()} does not balance: {totals[left]} vs {totals[right]}\")\n\n    net_income = totals[\"is_cr\"] - totals[\"is_dr\"]\n    # the balance sheet columns must give the same figure\n    assert round(totals[\"bs_dr\"] - totals[\"bs_cr\"], 2) == round(net_income, 2), \"IS and BS disagree\"\n    return rows, totals, net_income\n\n\ndef fmt(n):\n    return f\"{n:>12,.0f}\" if n else \" \" * 12\n\n\ndef main(tb_path, adj_path, out_path=\"worksheet.csv\"):\n    with open(tb_path, newline=\"\") as f:\n        tb_rows = list(csv.DictReader(f))\n    with open(adj_path, newline=\"\") as f:\n        adj_rows = list(csv.DictReader(f))\n    rows, totals, ni = build(tb_rows, adj_rows)\n\n    print(f\"{'Account':32}\" + \"\".join(f\"{c:>12}\" for c in COLS))\n    for r in rows:\n        print(f\"{r['account'][:32]:32}\" + \"\".join(fmt(r[c]) for c in COLS))\n    print(f\"{'Totals':32}\" + \"\".join(fmt(totals[c]) for c in COLS))\n    label = \"Net income\" if ni >= 0 else \"Net loss\"\n    ni_row = {\"is_dr\": max(ni, 0), \"is_cr\": max(-ni, 0), \"bs_dr\": max(-ni, 0), \"bs_cr\": max(ni, 0)}\n    print(f\"{label:32}\" + \" \" * 72 + \"\".join(fmt(ni_row[c]) for c in COLS[6:]))\n\n    with open(out_path, \"w\", newline=\"\") as f:\n        w = csv.writer(f)\n        w.writerow([\"account\"] + COLS)\n        for r in rows:\n            w.writerow([r[\"account\"]] + [r[c] for c in COLS])\n        w.writerow([\"Totals\"] + [totals[c] for c in COLS])\n        w.writerow([label, \"\", \"\", \"\", \"\", \"\", \"\"] + [ni_row[c] for c in COLS[6:]])\n    print(f\"\\n{label}: {abs(ni):,.2f}  (saved {out_path})\")\n    return ni\n\n\nif __name__ == \"__main__\":\n    if len(sys.argv) != 3:\n        sys.exit(\"usage: python3 worksheet.py tb.csv adjustments.csv\")\n    main(sys.argv[1], sys.argv[2])\n"
      }
     }
    ]
   },
   {
    "title": "Tests",
    "files": [
     {
      "title": "test_worksheet.py",
      "variants": {
       "python": "# Run: python3 test_worksheet.py\nimport csv\nfrom worksheet import build\n\ntb = list(csv.DictReader(open(\"tb.csv\")))\nadj = list(csv.DictReader(open(\"adjustments.csv\")))\nrows, totals, ni = build(tb, adj)\nassert totals[\"tb_dr\"] == totals[\"tb_cr\"] == 1_100_000\nassert totals[\"atb_dr\"] == 1_124_000\nassert ni == 345_000, ni                      # Entity A answer\n\n# an unbalanced adjustment must be rejected\nbad = adj + [{\"ref\": \"z\", \"account\": \"Cash\", \"debit\": \"1\", \"credit\": \"\"}]\ntry:\n    build(tb, bad)\n    raise AssertionError(\"should have failed\")\nexcept ValueError as e:\n    assert \"Unbalanced\" in str(e)\nprint(\"all tests passed\")\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "python3 test_worksheet.py",
      "purpose": "Must print: all tests passed"
     },
     {
      "cmd": "python3 worksheet.py tb.csv adjustments.csv",
      "purpose": "Prints the worksheet and saves worksheet.csv (open it in Excel)"
     }
    ]
   }
  ],
  "done": [
   "Net income: 345,000.00 for Entity A.",
   "BS grand totals 869,000 / 869,000.",
   "Bonus: make CSVs for the Reyes problem (6-column, NI ₱23,500)."
  ]
 }
};
