import type { Course } from "./types";

export const accounting: Course = {
  code: "ACCTNG1",
  slug: "accounting",
  title: "Accounting for Non-Accountants",
  units: 3,
  accent: "#34d399",
  tagline: "Journal → ledger → trial balance → worksheet → statements.",
  ched: "Basic accounting for non-business majors: the accounting equation, double-entry recording, the accounting cycle, and reading financial statements. Includes how a ledger maps to a database, which you'll use in any POS, inventory or billing system.",
  lessons: [
    {
      slug: "equation",
      title: "The accounting equation",
      why: "Every transaction keeps A = L + OE balanced. If you understand this, you understand the rest.",
      points: [
        "`Assets = Liabilities + Owner's Equity`. Assets are what the business owns, liabilities are what it owes, and equity is the owner's claim.",
        "Expanded: `A = L + Capital − Drawing + Revenue − Expenses`.",
        "Revenue raises equity and expenses lower it. Drawing (the owner taking money out) lowers equity but is **not** an expense.",
        "Business entity concept: the owner's personal spending is not a business transaction.",
      ],
      demo: "ledger",
    },
    {
      slug: "debit-credit",
      title: "Debits, credits & DEALER",
      why: "Know which side each account increases on and journalizing becomes automatic.",
      points: [
        "Double entry: every transaction touches at least 2 accounts, and total debits = total credits.",
        "**DEALER**: Drawing, Expenses, Assets increase with a **debit**. Liabilities, Equity (Capital), Revenue increase with a **credit**.",
        "Contra-assets (Accumulated Depreciation) are credit-normal and are subtracted from their asset.",
        "Classic mistake: debiting revenue when cash comes in. Cash is debited and revenue is **credited**.",
      ],
      code: [{
        title: "Normal balance rules as code",
        variants: {
          js: `const DEBIT_NORMAL = new Set(["asset", "drawing", "expense"]);

// balance as the account's normal side sees it
function balance(type, debits, credits) {
  return DEBIT_NORMAL.has(type) ? debits - credits : credits - debits;
}

balance("asset", 200000, 63000);   // Cash → 137000
balance("revenue", 0, 64000);      // Service Revenue → 64000`,
          python: `DEBIT_NORMAL = {"asset", "drawing", "expense"}

def balance(type_, debits, credits):
    return debits - credits if type_ in DEBIT_NORMAL else credits - debits

balance("asset", 200_000, 63_000)  # Cash → 137000`,
          java: `static final Set<String> DEBIT_NORMAL = Set.of("asset", "drawing", "expense");

static long balance(String type, long debits, long credits) {
    return DEBIT_NORMAL.contains(type) ? debits - credits : credits - debits;
}`,
        },
      }],
    },
    {
      slug: "journal-ledger",
      title: "Journal, ledger & T-accounts",
      why: "The journal records transactions in date order. The ledger groups them by account.",
      points: [
        "General Journal columns: `Date | Account Titles & Explanation | PR | Debit | Credit`. Debits first, credits indented.",
        "Posting = copying each journal line into its ledger account (T-account: debits left, credits right).",
        "Balance of a T-account = bigger side − smaller side, shown on the bigger side.",
        "Example Cash: Dr 150,000 + 35,000 + 15,000 = 200,000. Cr 63,000. Balance **₱137,000 Dr**.",
      ],
      demo: "ledger",
    },
    {
      slug: "trial-balance",
      title: "Trial balance",
      why: "A quick check that total debits equal total credits before you make statements.",
      points: [
        "List every account balance in a Debit or Credit column. The two totals must match.",
        "Unadjusted TB in the example: **₱250,000 = ₱250,000**.",
        "A TB that balances can still be wrong (wrong account, a missed entry).",
        "Tip: if the difference is divisible by 9, you probably swapped two digits (transposition).",
      ],
      demo: "ledger",
    },
    {
      slug: "adjusting",
      title: "Adjusting entries",
      why: "Records revenue when earned and expenses when used, not just when cash moves (accrual basis).",
      points: [
        "Prepaid used: `Dr Rent Expense / Cr Prepaid Rent` (18,000 ÷ 3 = 6,000).",
        "Supplies used: count what's left. 5,000 − 3,200 on hand = `1,800` used.",
        "Depreciation: `Dr Depreciation Expense / Cr Accumulated Depreciation` (60,000 ÷ 60 months = 1,000).",
        "Accrued expense: `Dr Salaries Expense / Cr Salaries Payable`. Accrued revenue: `Dr Accounts Receivable / Cr Revenue`.",
        "Unearned revenue earned: `Dr Unearned Revenue / Cr Revenue`.",
      ],
    },
    {
      slug: "worksheet",
      title: "The worksheet (6 & 10 column)",
      why: "One sheet that takes the trial balance to the financial statements.",
      points: [
        "10-column: `TB | Adjustments | Adjusted TB | Income Statement | Balance Sheet`, each Dr/Cr.",
        "6-column (no adjustments): `TB | IS | BS`. Some teachers define it differently, so check your handout.",
        "Revenue and expenses go to the IS columns. Assets, liabilities, capital, **Drawing** and **Accumulated Depreciation** go to the BS columns.",
        "Net income = IS Cr − IS Dr = 64,000 − 23,800 = **₱40,200**. The BS columns must give the same figure: 234,200 − 194,000.",
        "Practice: open **Practice problems** in the sidebar. Problem 1 is a 6-column worksheet and the others are full 10-column cycles.",
      ],
      code: [{
        title: "Worksheet column sorting",
        variants: {
          js: `const IS_TYPES = ["revenue", "expense"];
const column = (type) => (IS_TYPES.includes(type) ? "Income Statement" : "Balance Sheet");

column("drawing");  // "Balance Sheet"  (the classic mistake is putting it in IS)
column("contra");   // "Balance Sheet"  (Accumulated Depreciation, credit side)`,
          python: `def column(type_):
    return "Income Statement" if type_ in ("revenue", "expense") else "Balance Sheet"`,
        },
      }],
    },
    {
      slug: "statements",
      title: "Financial statements",
      why: "The outputs everyone reads: profit, equity and financial position.",
      points: [
        "**Income Statement**: Revenue − Expenses = Net Income (₱64,000 − ₱23,800 = ₱40,200).",
        "**Statement of Changes in Owner's Equity**: Beginning + Investment + NI − Drawing = ₱182,200.",
        "**Statement of Financial Position** (the PH/PFRS name for the balance sheet): Assets ₱225,200 = Liabilities ₱43,000 + Equity ₱182,200.",
        "Prepare them in that order. Each one feeds the next.",
      ],
    },
    {
      slug: "closing",
      title: "Closing entries & post-closing TB",
      why: "Resets revenue, expense and drawing to zero for the next period.",
      points: [
        "1. `Dr Revenue / Cr Income Summary`. 2. `Dr Income Summary / Cr each Expense`.",
        "3. `Dr Income Summary / Cr Capital` (net income). 4. `Dr Capital / Cr Drawing`.",
        "Only permanent (real) accounts remain: assets, liabilities, capital.",
        "Post-closing TB: **₱226,200 = ₱226,200**.",
      ],
    },
    {
      slug: "ledger-in-sql",
      title: "Accounting as a database",
      why: "Every POS, billing or inventory capstone needs this design. Get it right once.",
      beyond: true,
      points: [
        "Three tables: `accounts` (chart of accounts), `journal_entries` (header), `journal_lines` (one row per Dr/Cr).",
        "Store money as integer **centavos**, never floats. In JS, `0.1 + 0.2 !== 0.3`.",
        "Balances are computed from the lines. Posted lines are append-only, and you fix mistakes with a reversing entry.",
        "POS sale with VAT: ₱1,120 sale = `Dr Cash 1,120 / Cr Sales 1,000 / Cr Output VAT 120`.",
      ],
      code: [{
        title: "Double-entry schema + trial balance query",
        variants: {
          postgres: `CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE'))
);
CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  entry_date DATE NOT NULL,
  memo TEXT,
  reverses_id INT REFERENCES journal_entries(id)
);
CREATE TABLE journal_lines (
  id SERIAL PRIMARY KEY,
  entry_id INT NOT NULL REFERENCES journal_entries(id),
  account_id INT NOT NULL REFERENCES accounts(id),
  debit_centavos BIGINT NOT NULL DEFAULT 0 CHECK (debit_centavos >= 0),
  credit_centavos BIGINT NOT NULL DEFAULT 0 CHECK (credit_centavos >= 0),
  CHECK ((debit_centavos = 0) <> (credit_centavos = 0))  -- exactly one side
);

-- Trial balance
SELECT a.code, a.name,
       SUM(l.debit_centavos) / 100.0  AS debit,
       SUM(l.credit_centavos) / 100.0 AS credit
FROM journal_lines l JOIN accounts a ON a.id = l.account_id
GROUP BY a.code, a.name ORDER BY a.code;

-- Audit: entries that don't balance (should be 0 rows)
SELECT entry_id FROM journal_lines
GROUP BY entry_id HAVING SUM(debit_centavos) <> SUM(credit_centavos);`,
          mysql: `CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE') NOT NULL
);
CREATE TABLE journal_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entry_id INT NOT NULL,
  account_id INT NOT NULL,
  debit_centavos BIGINT NOT NULL DEFAULT 0,
  credit_centavos BIGINT NOT NULL DEFAULT 0,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  CHECK (debit_centavos >= 0 AND credit_centavos >= 0)  -- enforced since MySQL 8.0.16
);`,
        },
      }, {
        title: "Post an entry atomically (both lines or neither)",
        variants: {
          js: `// node-postgres
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const { rows } = await client.query(
    "INSERT INTO journal_entries (entry_date, memo) VALUES ($1, $2) RETURNING id",
    ["2026-11-10", "Website built, cash collected"]
  );
  const id = rows[0].id;
  await client.query("INSERT INTO journal_lines (entry_id, account_id, debit_centavos) VALUES ($1, $2, $3)", [id, CASH, 3500000]);
  await client.query("INSERT INTO journal_lines (entry_id, account_id, credit_centavos) VALUES ($1, $2, $3)", [id, REVENUE, 3500000]);
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
}`,
          python: `# psycopg 3: the with-block commits on success and rolls back on error
with psycopg.connect(DSN) as conn, conn.cursor() as cur:
    cur.execute("INSERT INTO journal_entries (entry_date, memo) VALUES (%s, %s) RETURNING id",
                ("2026-11-10", "Website built, cash collected"))
    entry_id = cur.fetchone()[0]
    cur.execute("INSERT INTO journal_lines (entry_id, account_id, debit_centavos) VALUES (%s, %s, %s)", (entry_id, CASH, 3_500_000))
    cur.execute("INSERT INTO journal_lines (entry_id, account_id, credit_centavos) VALUES (%s, %s, %s)", (entry_id, REVENUE, 3_500_000))`,
          java: `try (Connection c = DriverManager.getConnection(URL, USER, PASS)) {
    c.setAutoCommit(false);
    try {
        // insert header, then both lines with PreparedStatement ...
        c.commit();
    } catch (SQLException e) {
        c.rollback();
        throw e;
    }
}`,
        },
      }],
    },
  ],
  activities: [
    { title: "Equation drill", steps: ["Drag the demo slider from 0 to 9.", "Before each step, predict how A, L and OE change.", "Check: transactions 3, 4 and 7 only swap one asset for another."] },
    { title: "Worksheet by hand", steps: ["Copy the 10-column worksheet layout into Excel or Sheets.", "Fill it in from the example's unadjusted TB plus adjustments (a)–(e).", "Confirm net income is ₱40,200 in both the IS and BS columns."] },
    { title: "Your own business", steps: ["Invent a 10-transaction month for a milk tea stall or computer shop.", "Post every transaction in the demo with the form.", "Check A = L + OE stays ✓ after each one."] },
    { title: "Spot the error", steps: ["Post Drawing as Salaries Expense. What changes in net income?", "Post a ₱5,400 entry as ₱4,500. Is the TB difference divisible by 9?"] },
  ],
  projects: [
    { title: "Mini general ledger web app", level: "Core", scope: "Record journal entries and auto-generate the TB, income statement and statement of financial position from SQL.", stack: ["Next.js", "PostgreSQL", "centavos"] },
    { title: "Sari-sari POS with ledger", level: "Stretch", scope: "Each checkout posts a balanced journal entry (sales, VAT, COGS, inventory). Daily sales report from the ledger.", stack: ["Node/Express", "MySQL", "transactions"] },
    { title: "Worksheet generator", level: "Starter", scope: "Paste a trial balance as CSV, enter the adjustments, and get a 10-column worksheet with net income checked.", stack: ["JS/Python"] },
  ],
};
