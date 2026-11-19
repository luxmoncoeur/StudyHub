import type { Guide } from "../types";

export const guides: Record<string, Guide> = {
  "Equation drill": {
    where: "This app: Lesson 1 ledger demo",
    time: "20 min",
    steps: [
      { title: "Reset to zero", body: ["Open **The accounting equation** lesson. Drag the **Posted** slider all the way left (0 entries)."] },
      { title: "Predict, then reveal", body: ["For each transaction, write on paper how **Assets, Liabilities and Owner's Equity** change *before* moving the slider one step.", "Then move the slider one notch and compare against the three boxes."] },
      { title: "Spot the asset swaps", body: ["Transactions 3 (prepaid rent), 4 (supplies) and 7 (collection) only swap one asset for another, so the totals don't change.", "Transaction 9 (withdrawal) lowers assets **and** equity, but it is not an expense."] },
      { title: "Check the final numbers", body: ["After all 14 entries: A ₱225,200 = L ₱43,000 + OE ₱182,200."] },
    ],
    done: ["You predicted 12 of 14 steps correctly.", "You can explain why buying supplies for cash doesn't change total assets."],
  },
  "Worksheet by hand": {
    where: "Paper or Google Sheets + Practice problems in this app",
    time: "1–1.5 hours",
    youNeed: ["Columnar paper or a blank Google Sheet"],
    steps: [
      { title: "Set up the 10 columns", body: ["Columns: Account Titles | TB Dr | TB Cr | Adjustments Dr | Adj Cr | Adjusted TB Dr | ATB Cr | IS Dr | IS Cr | BS Dr | BS Cr."] },
      { title: "Copy the unadjusted trial balance", body: ["Use **Practice problems → Entity A** (your textbook problem). Copy step **c. Unadjusted TB** into the first two columns, and total them. Both should be ₱1,100,000."] },
      { title: "Enter the adjustments", body: ["Interest 300,000 × 12% × 3/12 = **9,000**. Depreciation 360,000 ÷ 5 × 2/12 = **12,000**. Bad debts 50,000 × 6% = **3,000**. Supplies used 80,000 − 5,000 = **75,000**.", "Add new accounts (Interest Payable, Accumulated Depreciation, the expenses…) **below** the TB totals, as textbooks do."] },
      { title: "Extend to IS and BS", body: ["Revenue and expenses go to the IS columns. Everything else goes to the BS columns, **including Drawing (BS Dr) and contra-assets (BS Cr)**.", "Net income = IS Cr − IS Dr. Put it in **IS Dr** and **BS Cr** so both pairs balance."] },
      { title: "Check yourself", body: ["Open the app's worksheet step in **Try it** mode and type your numbers. Hit **Check answers** to see which cells are wrong."] },
    ],
    done: ["Net income of ₱345,000 appears in both the IS and BS sections.", "Grand totals balance: IS 600,000 / 600,000 and BS 869,000 / 869,000."],
  },
  "Your own business": {
    where: "This app: ledger demo form",
    time: "45 min",
    steps: [
      { title: "Pick a business", body: ["A milk tea stall, computer shop, printing service or online seller. Write 10 realistic transactions for one month in pesos."] },
      { title: "Analyze before posting", body: ["For each one, write: which 2+ accounts, which side (DEALER), and the amount."] },
      { title: "Post them in the demo", body: ["In the ledger demo, click **Reset example**, drag the slider to 0, then use the **Post entry** form for each transaction."] },
      { title: "Read your results", body: ["Check A = L + OE stays ✓ after every entry. Read the trial balance and net income at the end."] },
    ],
    done: ["10 entries posted with A = L + OE balanced throughout.", "You can explain your net income figure in one sentence."],
  },
  "Spot the error": {
    where: "This app: ledger demo",
    time: "20 min",
    steps: [
      { title: "Misclassify Drawing", body: ["Post ₱8,000 as `Salaries Expense / Cash` instead of `Drawing / Cash`. Compare net income before and after: it drops by 8,000, but A = L + OE still balances.", "Lesson: a balanced TB doesn't prove the entries are right."] },
      { title: "Transposition", body: ["Post a ₱5,400 entry with the debit as 5,400 but think of it as 4,500. The difference is 900, and 900 ÷ 9 = 100. A difference divisible by 9 is the classic hint of swapped digits."] },
      { title: "Wrong side", body: ["Post cash received as `Service Revenue / Cash` (backwards). Watch revenue go **negative** in the TB."] },
    ],
    done: ["You can name 3 errors that the trial balance can't catch."],
  },
  "Mini general ledger web app": {
    where: "Your Mac: Next.js + PostgreSQL",
    time: "2–3 weekends",
    youNeed: ["Postgres running (Database course, setup lesson)", "The schema from the *Accounting as a database* lesson"],
    steps: [
      { title: "Create the project and schema", commands: [{ cmd: "npx create-next-app@latest mini-gl && cd mini-gl && npm i pg", purpose: "New app + Postgres driver" }, { cmd: "createdb mini_gl && psql mini_gl -f schema.sql", purpose: "Create DB and run the schema from the lesson" }] },
      { title: "Seed the chart of accounts", code: { title: "seed.sql", variants: { postgres: `INSERT INTO accounts (code, name, type) VALUES
('101','Cash','ASSET'), ('102','Accounts Receivable','ASSET'), ('103','Supplies','ASSET'),
('201','Accounts Payable','LIABILITY'),
('301','Owner''s Capital','EQUITY'), ('302','Owner''s Drawing','EQUITY'),
('401','Service Revenue','REVENUE'),
('501','Salaries Expense','EXPENSE'), ('502','Rent Expense','EXPENSE');` } } },
      { title: "Journal entry form", body: ["A page with date, memo, and N lines (account select, debit, credit). **Disable Save until the debit total equals the credit total.**", "Save in **one transaction** (BEGIN → header → lines → COMMIT) using the code from the lesson. Store centavos: `Math.round(amount * 100)`."] },
      { title: "Reports from SQL", body: ["Trial balance = the GROUP BY query from the lesson. Income statement = sum of REVENUE minus EXPENSE lines. Show both totals and a ✓ when they match."] },
      { title: "Test with a real problem", body: ["Enter **Entity A** from Practice problems. Your app's TB must equal ₱1,100,000 and net income ₱345,000 after the adjustments."] },
    ],
    done: ["You can't save an unbalanced entry.", "The TB and income statement match the Entity A solution.", "Mistakes are fixed with reversing entries, never UPDATE/DELETE."],
  },
  "Sari-sari POS with ledger": {
    where: "Your Mac: Node/Express + MySQL",
    time: "3–4 weekends",
    steps: [
      { title: "Tables", body: ["`products(id, name, price_centavos, cost_centavos, stock)`, `sales`, `sale_items`, plus the ledger tables (accounts, journal_entries, journal_lines)."] },
      { title: "Checkout = one transaction", body: ["In a single DB transaction: lock each product row with `SELECT … FOR UPDATE`, check stock, decrement stock, insert the sale, and post the journal entry.", "Entry for a ₱1,120 VAT-inclusive sale costing ₱600: `Dr Cash 1,120 / Cr Sales 1,000 / Cr Output VAT 120` and `Dr COGS 600 / Cr Inventory 600`."] },
      { title: "Daily report", body: ["Sales, COGS, gross profit and VAT payable for a date range, all computed from journal_lines."] },
      { title: "Prove it's safe", body: ["Open 2 browser tabs and buy the last item at the same time. Only one should succeed (thanks to the FOR UPDATE row lock)."] },
    ],
    done: ["Every sale creates balanced journal lines.", "Stock never goes negative under concurrent checkouts.", "The daily report matches the sum of the receipts."],
  },
  "Worksheet generator": {
    where: "Python or JavaScript on your Mac",
    time: "1 weekend",
    steps: [
      { title: "Input format", body: ["CSV with columns `account,type,debit,credit` (type = asset / contra-asset / liability / capital / drawing / revenue / expense), plus a second CSV of adjustments."] },
      { title: "Core logic", code: { title: "Extend to IS/BS", variants: { python: `import csv

def extend(rows):
    out = []
    for r in rows:
        net = float(r["debit"] or 0) - float(r["credit"] or 0)
        on_is = r["type"] in ("revenue", "expense")
        dr, cr = (net, 0) if net > 0 else (0, -net)
        out.append({**r, "is_dr": dr if on_is else 0, "is_cr": cr if on_is else 0,
                    "bs_dr": 0 if on_is else dr, "bs_cr": 0 if on_is else cr})
    ni = sum(r["is_cr"] for r in out) - sum(r["is_dr"] for r in out)
    assert round(sum(r["bs_dr"] for r in out) - sum(r["bs_cr"] for r in out), 2) == round(ni, 2)
    return out, ni

rows = list(csv.DictReader(open("tb.csv")))
ws, ni = extend(rows)
print("Net income:", ni)` } } },
      { title: "Output", body: ["Write a CSV/Excel file with all 10 columns plus the NI and grand total rows. Bonus: an HTML table styled like the app's worksheet."] },
      { title: "Test", body: ["Feed it the Reyes problem (6-column, NI ₱23,500) and Entity A (NI ₱345,000)."] },
    ],
    done: ["Both test problems produce the right net income.", "The built-in assert catches a TB that doesn't balance."],
  },
};
