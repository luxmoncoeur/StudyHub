import type { LessonCase, Project } from "../types";

export const cases: Record<string, LessonCase[]> = {
  setup: [{
    title: "\"Authentication plugin cannot be loaded\"",
    scenario: "An old PHP/XAMPP tutorial connects to MySQL 8.4 and fails with an `mysql_native_password` error.",
    steps: ["MySQL 8.4 disables the old auth plugin by default and uses `caching_sha2_password`.", "Update the driver (mysql2, mysqli on PHP 8+ and Connector/J 8+ support it).", "Don't re-enable the old plugin just to make a tutorial work.", "Check your server: `SELECT VERSION();`. XAMPP actually ships MariaDB, which behaves differently."],
    takeaway: "Match tutorials to your engine and version. Upgrade drivers instead of downgrading security.",
  }],
  "erd-keys": [{
    title: "Employee assigned to position 99",
    scenario: "In the BSIT2A `db_company`, someone inserted an employee with `position_id = 99`. Reports now silently drop him from every JOIN.",
    steps: ["The dump has no FOREIGN KEY, so the DB accepted a reference to nothing.", "Find orphans: `SELECT e.* FROM tbl_employees e LEFT JOIN tbl_positions p ON p.id = e.position_id WHERE p.id IS NULL;`", "Fix the data, then `ALTER TABLE tbl_employees ADD FOREIGN KEY (position_id) REFERENCES tbl_positions(id);`", "Retry the bad insert: it now fails with a FK violation (SQLSTATE 23503)."],
    takeaway: "Constraints are free data-quality checks. Declare every FK.",
  }],
  normalization: [{
    title: "Program head changed, 300 rows wrong",
    scenario: "An enrollment spreadsheet repeats `program_head` on every student row. The new BSIT head was updated on only half the rows.",
    steps: ["`program_head` depends on `program`, not on the student: a **transitive dependency** (violates 3NF).", "Move it to `programs(code, program_head)` and keep only `program_code` in students.", "Now changing the head is **one** UPDATE on one row.", "Name the anomaly for your exam: an *update anomaly*."],
    takeaway: "If one fact is stored in many rows, normalize it into its own table.",
  }],
  joins: [{
    title: "The department that vanished from the report",
    scenario: "A headcount report shows Dev Ops and QA, but the new *Marketing* department (no employees yet) is missing.",
    steps: ["INNER JOIN drops departments with no matching employees.", "Use `departments LEFT JOIN positions LEFT JOIN employees`, so every department stays.", "Count with `COUNT(e.id)`, not `COUNT(*)`, otherwise empty departments show 1.", "Expected: Marketing | 0."],
    takeaway: "\"Show all X, even with no Y\" means LEFT JOIN + COUNT(column).",
  }],
  "grouping-subqueries": [{
    title: "Who earns above their department's average?",
    scenario: "HR wants employees paid more than the average of **their own** department, not the company average.",
    steps: ["The company average is a single number, so a scalar subquery works.", "The per-department average depends on each row, so use a **correlated** subquery (or a window function).", "Window version: `salary > AVG(salary) OVER (PARTITION BY department_id)`, wrapped in a CTE.", "Check by hand for one department."],
    takeaway: "\"Compared to its own group\" means a correlated subquery or PARTITION BY.",
  }],
  "cte-window": [{
    title: "Top 3 sellers per branch",
    scenario: "A milk tea chain wants the top 3 cashiers by sales in **each** branch for the monthly incentive.",
    steps: ["`ROW_NUMBER() OVER (PARTITION BY branch_id ORDER BY total DESC)` ranks within each branch.", "Wrap it in a CTE and filter `WHERE rn <= 3`. You can't filter on a window function directly in WHERE.", "Ties? Use `RANK()` if two cashiers with equal sales should both get the incentive.", "Add `SUM(total) OVER (PARTITION BY branch_id)` to show each person's share of the branch."],
    takeaway: "Top-N per group = window function in a CTE, then filter.",
  }],
  "views-indexes": [{
    title: "Login takes 3 seconds with 200k users",
    scenario: "`SELECT * FROM users WHERE email = $1` got slow as the alumni portal grew.",
    steps: ["`EXPLAIN ANALYZE` shows **Seq Scan** on users: it reads every row.", "`CREATE UNIQUE INDEX ON users (lower(email));` and query with `lower(email) = lower($1)`.", "Re-run EXPLAIN: **Index Scan**, under 1 ms.", "UNIQUE also stops duplicate accounts with different capitalization."],
    takeaway: "Index the columns you filter on, and confirm with EXPLAIN ANALYZE.",
  }],
  transactions: [{
    title: "Two cashiers sold the last laptop",
    scenario: "A computer shop's stock went to −1: two cashiers checked out the last unit at the same time.",
    steps: ["Both read `stock = 1`, both decided \"OK\", and both wrote `stock = 0`: a **lost update**.", "Fix: inside a transaction, `SELECT stock FROM products WHERE id = $1 FOR UPDATE` locks the row.", "The second cashier waits, then reads 0 and gets \"out of stock\".", "Also add `CHECK (stock >= 0)` as a last line of defense."],
    takeaway: "Read-check-write on shared data needs a row lock (or an atomic UPDATE … WHERE stock > 0).",
  }],
  "procedures-triggers": [{
    title: "Who changed Tony's salary?",
    scenario: "Payroll found Tony Stark's salary raised by ₱30,000 with no record of who or when.",
    steps: ["Add an AFTER UPDATE trigger that writes old and new values plus a timestamp to `tbl_salary_audit`.", "Pass the app user into the DB: `SET LOCAL app.user = 'hr_admin1'` and read it in the trigger with `current_setting('app.user', true)`.", "Revoke direct UPDATE from regular users, so changes go through the app.", "Test: update a salary, then SELECT from the audit table."],
    takeaway: "Audit trails belong in the database, where no code path can skip them.",
  }],
  "from-code": [{
    title: "Login bypass with ' OR '1'='1",
    scenario: "A capstone's login builds SQL by string concatenation. Typing `' OR '1'='1` as the password logs in as the first user (admin).",
    steps: ["The input became part of the SQL. The WHERE clause is now always true.", "Fix: placeholders (`$1` / `?`), so the driver sends values separately.", "Also store bcrypt hashes and compare in code; never `WHERE password = …`.", "Retest: the same input now just fails to log in."],
    takeaway: "Never concatenate user input into SQL, not even once.",
  }],
  "security-backup": [{
    title: "The intern ran DROP TABLE",
    scenario: "An intern connected with the `root` credentials from the `.env` and accidentally dropped `tbl_employees` in production.",
    steps: ["The app should use a **least-privilege** user: SELECT/INSERT/UPDATE only, no DROP.", "Restore from the nightly `pg_dump -Fc` with `pg_restore -t tbl_employees`.", "Data lost since last night's backup is your RPO, so decide whether nightly is enough.", "Practice the restore **before** you need it."],
    takeaway: "Least-privilege users plus tested backups turn disasters into inconveniences.",
  }],
  "pg-vs-mysql": [{
    title: "The query that worked yesterday",
    scenario: "A report query written for Postgres (`ILIKE`, `||`, `RETURNING`) fails after the team switched to MySQL for hosting.",
    steps: ["`ILIKE` → `LIKE` (MySQL's default collation is already case-insensitive).", "`a || b` → `CONCAT(a, b)`. In MySQL `||` is OR, so it returns 0/1 silently.", "`RETURNING id` → `LAST_INSERT_ID()` / `insertId` from the driver.", "Keep engine-specific SQL in one repository layer (see the dual-engine project)."],
    takeaway: "SQL is a standard with dialects. Isolate the differences in one place.",
  }],
};

export const caseProject: Project = {
  title: "Case: RHU medicine inventory & dispensing",
  level: "Core",
  scope: "From scratch: a PostgreSQL design for medicine stock by batch and expiry, with FEFO dispensing in one transaction. Verified with SQL test cases.",
  stack: ["PostgreSQL", "PL/pgSQL", "psql"],
  guide: {
    where: "PostgreSQL (psql) on your Mac",
    time: "1–2 weekends",
    brief: {
      client: "Rural Health Unit, Municipality of San Isidro",
      problem: "Medicines expire on the shelf because staff dispense from whichever box is in front. Stock counts in the logbook never match the shelf.",
      requirements: [
        "Track medicines and **batches** (batch no., expiry date, quantity).",
        "Dispensing takes from the batch that **expires first** (FEFO), possibly across several batches.",
        "Never dispense expired stock. Never let quantity go negative.",
        "Every dispense is recorded (patient ref, medicine, batch, qty, who, when).",
        "Report: stock per medicine, and batches expiring within 30 days.",
      ],
    },
    tests: [
      { id: "TC-01", scenario: "Dispense from one batch", steps: "`SELECT dispense('Paracetamol 500mg', 10, 'PT-001', 'nurse_ana');`", expected: "Takes 10 from the earliest-expiring batch" },
      { id: "TC-02", scenario: "Dispense across batches", steps: "Request more than the first batch holds", expected: "Empties batch 1, takes the rest from batch 2" },
      { id: "TC-03", scenario: "Skip expired batch", steps: "A batch with expiry < today has stock", expected: "It is never used" },
      { id: "TC-04", scenario: "Not enough stock", steps: "Request more than all valid batches", expected: "ERROR *Insufficient stock*; **nothing** changes (rollback)" },
      { id: "TC-05", scenario: "Audit trail", steps: "After TC-02, `SELECT * FROM dispense_log`", expected: "One row per batch touched" },
      { id: "TC-06", scenario: "Expiring soon report", steps: "`SELECT * FROM v_expiring_soon;`", expected: "Only batches expiring within 30 days, with stock > 0" },
      { id: "TC-07", scenario: "Concurrent dispense", steps: "Two sessions dispense the last 5 units at once", expected: "One succeeds, one gets *Insufficient stock*" },
    ],
    steps: [
      { title: "Understand the brief", body: ["Underline the nouns (medicine, batch, dispense, patient, staff) → tables. Underline the rules (FEFO, no expired, no negative) → constraints and function logic."] },
      { title: "Design the ERD", body: ["`medicines 1—N batches 1—N dispense_log`. Put the quantity on the **batch**, not the medicine; the medicine's stock is a SUM."] },
      { title: "Starter schema + seed", code: { title: "schema.sql", variants: { postgres: `CREATE TABLE medicines (
  id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);
CREATE TABLE batches (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  medicine_id INT NOT NULL REFERENCES medicines(id),
  batch_no    VARCHAR(30) NOT NULL,
  expiry      DATE NOT NULL,
  qty         INT NOT NULL CHECK (qty >= 0),     -- can never go negative
  UNIQUE (medicine_id, batch_no)
);
CREATE TABLE dispense_log (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id    INT NOT NULL REFERENCES batches(id),
  qty         INT NOT NULL CHECK (qty > 0),
  patient_ref VARCHAR(20) NOT NULL,
  staff       VARCHAR(50) NOT NULL,
  at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO medicines (name) VALUES ('Paracetamol 500mg'), ('Amoxicillin 500mg');
INSERT INTO batches (medicine_id, batch_no, expiry, qty) VALUES
  (1, 'PCM-A', CURRENT_DATE - 5,  50),   -- expired: must never be used
  (1, 'PCM-B', CURRENT_DATE + 20, 30),   -- expires first among valid
  (1, 'PCM-C', CURRENT_DATE + 200, 100),
  (2, 'AMX-A', CURRENT_DATE + 90, 5);

CREATE VIEW v_expiring_soon AS
SELECT m.name, b.batch_no, b.expiry, b.qty
FROM batches b JOIN medicines m ON m.id = b.medicine_id
WHERE b.qty > 0 AND b.expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + 30;` } },
        commands: [{ cmd: "createdb rhu && psql rhu -f schema.sql", purpose: "Create and load" }] },
      { title: "Build the dispense function", body: ["Your turn. Skeleton: lock the medicine's valid batches `ORDER BY expiry FOR UPDATE`; check `SUM(qty) >= p_qty`, else `RAISE EXCEPTION 'Insufficient stock'`; loop through batches taking `LEAST(remaining, qty)`; UPDATE each batch and INSERT a log row. A RAISE inside a function rolls back everything (TC-04)."],
        code: { title: "dispense.sql (skeleton, fill in the TODOs)", variants: { postgres: `CREATE OR REPLACE FUNCTION dispense(p_medicine TEXT, p_qty INT, p_patient TEXT, p_staff TEXT)
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
  b RECORD;
  remaining INT := p_qty;
  available INT;
BEGIN
  -- TODO 1: lock this medicine's non-expired batches with stock (ORDER BY expiry, FOR UPDATE)
  -- TODO 2: SELECT SUM(qty) INTO available ...; IF available < p_qty THEN RAISE EXCEPTION ... END IF;
  FOR b IN
    SELECT bt.id, bt.qty FROM batches bt JOIN medicines m ON m.id = bt.medicine_id
    WHERE m.name = p_medicine AND bt.expiry >= CURRENT_DATE AND bt.qty > 0
    ORDER BY bt.expiry
  LOOP
    EXIT WHEN remaining = 0;
    -- TODO 3: take LEAST(remaining, b.qty), UPDATE batches, INSERT INTO dispense_log, reduce remaining
  END LOOP;
  RETURN p_qty;
END $$;` } } },
      { title: "Run the test cases", body: ["Run TC-01 to TC-06 in psql, writing the expected result **before** each run. For TC-07, adapt `race-test.sh` from the Enrollment schema project."] },
    ],
    done: ["7/7 test cases pass.", "ERD + schema + function + test log in one folder."],
  },
};
