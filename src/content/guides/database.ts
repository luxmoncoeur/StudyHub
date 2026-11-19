import type { Guide } from "../types";

export const guides: Record<string, Guide> = {
  "Query ladder": {
    where: "This app's SQL playground (no install needed) or psql",
    time: "1.5 hours",
    steps: [
      { title: "Open the playground", body: ["Go to the **JOINs** lesson. The playground has your `db_company` tables loaded in a real Postgres running in the browser."] },
      { title: "Rung 1–2: JOIN + GROUP BY", body: ["Write it yourself first, then compare with the preset buttons.", "1) Every employee with position and department. 2) Headcount and average salary per department."] },
      { title: "Rung 3: subquery", body: ["Employees earning above the company average. Then: above **their own department's** average (correlated subquery)."] },
      { title: "Rung 4: CTE", body: ["Payroll per department using `WITH dept_pay AS (…)`, sorted by highest payroll."] },
      { title: "Rung 5: window functions", body: ["Rank everyone by salary with `RANK()`, then rank **within each department** with `PARTITION BY`. Add a running payroll total by hire date."] },
      { title: "Rung 6: recursive", body: ["Run the ALTER + UPDATE from the *CTEs & window functions* lesson to add managers, then build the org chart with `WITH RECURSIVE`."] },
    ],
    done: ["You wrote all 6 rungs without peeking at the presets first.", "You can explain the difference between `RANK` and `DENSE_RANK` with an example."],
  },
  "Normalize a spreadsheet": {
    where: "Google Sheets + dbdiagram.io",
    time: "1 hour",
    steps: [
      { title: "Start from 0NF", body: ["Make a sheet: `student_id | name | program | program_head | courses` where courses holds `IT201:DB:Lim:1.5, IT202:Web:Go:1.25` in **one cell**."] },
      { title: "1NF", body: ["One row per student + course. Split the courses cell into `course_code, title, instructor, grade`. PK = (student_id, course_code)."] },
      { title: "2NF", body: ["Name and program depend only on student_id, so move them to `students`. Title and instructor depend only on course_code, so move them to `courses`. Keep `enrollments(student_id, course_code, grade)`."] },
      { title: "3NF", body: ["program_head depends on program, not on the student, so move it to `programs(program, program_head)`."] },
      { title: "Draw it", body: ["dbdiagram.io: 4 tables with their relationships. Then write the CREATE TABLEs (with FKs) and run them in the playground."] },
    ],
    done: ["4 tables with no repeated facts.", "You can name the dependency you removed at each step."],
  },
  "Index race": {
    where: "Local PostgreSQL on your Mac (psql)",
    time: "30 min",
    youNeed: ["Postgres installed (setup lesson)"],
    steps: [
      { title: "Make 1M rows", commands: [{ cmd: "createdb race && psql race", purpose: "Fresh DB" }, { cmd: "\\timing on", purpose: "psql: show how long each query takes" }], code: { title: "1M rows", variants: { postgres: `CREATE TABLE big AS
SELECT g AS id, md5(g::text) AS name, (random() * 100000)::int AS salary
FROM generate_series(1, 1000000) g;
ANALYZE big;` } } },
      { title: "Time it without an index", code: { title: "Before", variants: { postgres: `EXPLAIN ANALYZE SELECT * FROM big WHERE name = 'c4ca4238a0b923820dcc509a6f75849b';
-- look for: Seq Scan ... Execution Time: ~60-150 ms` } } },
      { title: "Add the index and time again", code: { title: "After", variants: { postgres: `CREATE INDEX idx_big_name ON big(name);
EXPLAIN ANALYZE SELECT * FROM big WHERE name = 'c4ca4238a0b923820dcc509a6f75849b';
-- look for: Index Scan using idx_big_name ... Execution Time: < 1 ms` } } },
      { title: "Test the leftmost-prefix rule", code: { title: "Composite index", variants: { postgres: `CREATE INDEX idx_sal_name ON big(salary, name);
EXPLAIN SELECT * FROM big WHERE salary = 500;                   -- uses the index
EXPLAIN SELECT * FROM big WHERE name LIKE 'abc%' AND salary = 500; -- uses it
EXPLAIN SELECT * FROM big WHERE name = 'x';                      -- uses idx_big_name, not idx_sal_name` } } },
    ],
    done: ["A screenshot of both plans with the speedup.", "You can explain why the index didn't help on the 7-row db_company table."],
  },
  "Two-terminal lock": {
    where: "Two Terminal windows, psql",
    time: "20 min",
    steps: [
      { title: "Set up", body: ["Load db_company into a local DB (your `db_company.sql` from BSIT2A works in MySQL, or use the Postgres DDL from the ERD lesson). Open **two** psql windows side by side: A and B."] },
      { title: "Lock in A", code: { title: "Window A", variants: { postgres: `BEGIN;
SELECT salary FROM tbl_employees WHERE id = 2 FOR UPDATE;
-- don't commit yet` } } },
      { title: "Try to update in B", code: { title: "Window B", variants: { postgres: `UPDATE tbl_employees SET salary = salary + 1000 WHERE id = 2;
-- this HANGS: it's waiting for A's lock` } } },
      { title: "Release", body: ["In A, run `UPDATE tbl_employees SET salary = salary + 5000 WHERE id = 2; COMMIT;`. B finishes instantly. Check the result: both raises applied, nothing lost."] },
      { title: "Bonus: deadlock", body: ["A locks id 1 and then tries id 2, while B locks id 2 and then tries id 1. Postgres detects the deadlock and kills one transaction with an error."] },
    ],
    done: ["You saw B wait, then continue after A committed.", "You can explain the lost-update problem that FOR UPDATE prevents."],
  },
  "HR REST API": {
    where: "Your Mac: Express (or Flask / Spring) + PostgreSQL",
    time: "2 weekends",
    steps: [
      { title: "Project + DB", commands: [{ cmd: "mkdir hr-api && cd hr-api && npm init -y && npm i express pg", purpose: "Express + Postgres driver" }, { cmd: "createdb company && psql company -f schema.sql", purpose: "Run the db_company DDL from the ERD lesson" }] },
      { title: "CRUD with parameterized SQL", code: { title: "server.js", variants: { js: `import express from "express";
import pg from "pg";
const pool = new pg.Pool({ connectionString: "postgres://localhost/company" });
const app = express();
app.use(express.json());

app.get("/employees", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT e.id, e.firstname, e.lastname, p.position_name, d.department_name, e.salary " +
    "FROM tbl_employees e JOIN tbl_positions p ON p.id = e.position_id " +
    "JOIN tbl_departments d ON d.id = p.department_id ORDER BY e.id"
  );
  res.json(rows);
});

app.post("/employees", async (req, res) => {
  const { firstname, lastname, position_id, gender, salary, date_hired } = req.body;
  if (!firstname || !lastname || !position_id) return res.status(422).json({ error: "missing fields" });
  const { rows } = await pool.query(
    "INSERT INTO tbl_employees (firstname, lastname, position_id, gender, salary, date_hired) " +
    "VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [firstname, lastname, position_id, gender, salary, date_hired]
  );
  res.status(201).json(rows[0]);
});

app.get("/reports/payroll/:dept", async (req, res) => {
  const { rows } = await pool.query("SELECT dept_payroll($1) AS payroll", [req.params.dept]);
  res.json(rows[0]);
});

app.listen(4000, () => console.log("http://localhost:4000"));` } } },
      { title: "Add the DB-side pieces", body: ["Create the `dept_payroll` function, the `v_employee_directory` view and the salary audit trigger from the lessons. Add PUT /employees/:id and DELETE /employees/:id."] },
      { title: "Test with curl", commands: [{ cmd: "curl localhost:4000/employees", purpose: "List" }, { cmd: "curl -X POST localhost:4000/employees -H 'Content-Type: application/json' -d '{\"firstname\":\"Ana\",\"lastname\":\"Cruz\",\"position_id\":1,\"gender\":\"F\",\"salary\":50000,\"date_hired\":\"2026-06-01\"}'", purpose: "Create (expect 201)" }, { cmd: "curl localhost:4000/reports/payroll/1", purpose: "Stored function result" }] },
      { title: "Try to break it", body: ["Send `lastname: \"x' OR '1'='1\"`. It's stored as text, not executed, because of the placeholders. Update a salary and check that `tbl_salary_audit` got a row."] },
    ],
    done: ["Full CRUD works and returns proper status codes (201, 404, 422).", "The audit trigger logs every salary change.", "There is no string concatenation of user input anywhere in the SQL."],
  },
  "Enrollment system schema": {
    where: "dbdiagram.io + PostgreSQL",
    time: "1 weekend",
    steps: [
      { title: "Model it", body: ["Tables: students, courses, prerequisites (course_id, prereq_id), sections (course_id, term, capacity), enrollments (student_id, section_id, grade). M:N → junction tables."] },
      { title: "Constraints", body: ["UNIQUE(student_id, section_id) so no one enrolls twice. CHECK (capacity > 0). FKs with ON DELETE RESTRICT."] },
      { title: "Seat-safe enrollment", code: { title: "Enroll with a lock", variants: { postgres: `BEGIN;
SELECT capacity, (SELECT count(*) FROM enrollments WHERE section_id = 10) AS taken
FROM sections WHERE id = 10 FOR UPDATE;          -- lock the section row
-- app: if taken >= capacity -> ROLLBACK and show "section full"
INSERT INTO enrollments (student_id, section_id) VALUES (2024001, 10);
COMMIT;` } } },
      { title: "Prerequisite check", body: ["Write a query that returns the prerequisites a student has **not** passed for a course (NOT EXISTS + grade ≤ 3.0)."] },
    ],
    done: ["ERD in 3NF.", "Two concurrent enrollments for the last seat: only one succeeds."],
  },
  "Dual-engine port": {
    where: "Your Mac: Postgres + MySQL 8.4",
    time: "1–2 weekends",
    steps: [
      { title: "Install both", commands: [{ cmd: "brew install postgresql@17 mysql@8.4", purpose: "Both engines" }, { cmd: "brew services start postgresql@17 && brew services start mysql@8.4", purpose: "Run both" }] },
      { title: "One repository layer", body: ["Write `db.js` exporting `listEmployees()`, `createEmployee()` and so on, with two implementations: `pg` ($1 placeholders, RETURNING) and `mysql2` (? placeholders, `insertId`). Pick one with an env var: `DB=pg` or `DB=mysql`."] },
      { title: "Port the schema", body: ["IDENTITY → AUTO_INCREMENT, `||` → CONCAT, FULL JOIN → UNION, trigger function → inline trigger with DELIMITER."] },
      { title: "Log every difference", body: ["Keep a DIFFERENCES.md and add each error you hit, with its fix. It becomes your own cheatsheet."] },
    ],
    done: ["The same API passes the same curl tests on both engines.", "DIFFERENCES.md has 8+ entries."],
  },
};
