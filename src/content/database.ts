import type { Course } from "./types";

export const database: Course = {
  code: "DATSYS+",
  slug: "database",
  title: "Database Systems",
  units: 3,
  accent: "#38bdf8",
  tagline: "Picks up after SELECT … ORDER BY DESC: joins, CTEs, windows, transactions, design.",
  ched: "Information Management continuation (CMO 25 s.2015): data modeling (ERD), normalization, advanced SQL, transactions and concurrency, database programming (views, procedures, triggers), security and backups. PostgreSQL is the main engine here, with MySQL side by side.",
  lessons: [
    {
      slug: "setup",
      title: "Postgres & MySQL on your Mac",
      why: "Install both so you can run every example yourself.",
      points: [
        "The **SQL playground** on the next lessons runs real Postgres in your browser with your BSIT2A `db_company` tables, so you don't need to install anything to start.",
        "Homebrew's Postgres is keg-only, so add it to your PATH. The default superuser is your macOS username.",
        "MySQL 8.4 LTS turned off `mysql_native_password`, so old XAMPP/PHP tutorials fail to log in. Update the driver instead of turning it back on.",
        "XAMPP ships **MariaDB**, not MySQL, and some MySQL 8 features differ.",
      ],
      commands: [
        { cmd: "brew install postgresql@17 && brew services start postgresql@17", purpose: "Install + run Postgres", os: "mac" },
        { cmd: "echo 'export PATH=\"/opt/homebrew/opt/postgresql@17/bin:$PATH\"' >> ~/.zshrc", purpose: "Put psql on your PATH", os: "mac" },
        { cmd: "createdb company && psql company", purpose: "Create a database and open it" },
        { cmd: "brew install mysql@8.4 && brew services start mysql@8.4", purpose: "Install + run MySQL LTS", os: "mac" },
        { cmd: "mysql_secure_installation", purpose: "Set the root password and remove anonymous users" },
        { cmd: "\\l · \\c db · \\dt · \\d table", purpose: "psql: list DBs, connect, list tables, describe (MySQL: SHOW DATABASES / USE / SHOW TABLES / DESCRIBE)" },
        { cmd: "\\x · \\timing · \\i file.sql · \\q", purpose: "psql: expanded rows, query time, run a file, quit" },
      ],
    },
    {
      slug: "erd-keys",
      title: "ERD, keys & constraints",
      why: "Design first. A bad schema makes every later query painful.",
      points: [
        "Entity = table, attribute = column, relationship = foreign key. Many-to-many (M:N) always becomes a **junction table**.",
        "Your dataset: `tbl_departments 1—N tbl_positions 1—N tbl_employees`.",
        "Keys: candidate → primary (the chosen one) · alternate (enforce with UNIQUE) · foreign · surrogate (IDENTITY) vs natural (TIN) · composite.",
        "Constraints: `PRIMARY KEY`, `FOREIGN KEY … ON DELETE RESTRICT|CASCADE|SET NULL`, `UNIQUE`, `NOT NULL`, `CHECK`, `DEFAULT`. MySQL only enforces CHECK since 8.0.16.",
        "Your BSIT2A dump has **no foreign keys**, so nothing stops `position_id = 99`. Add them.",
      ],
      code: [{
        title: "db_company, done properly",
        variants: {
          postgres: `CREATE TABLE tbl_departments (
  id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE,
  status          VARCHAR(10) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE','INACTIVE'))
);
CREATE TABLE tbl_positions (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  position_name VARCHAR(50) NOT NULL,
  department_id INT NOT NULL REFERENCES tbl_departments(id) ON DELETE RESTRICT,
  status        VARCHAR(10) NOT NULL DEFAULT 'ACTIVE'
);
CREATE TABLE tbl_employees (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  firstname   VARCHAR(100) NOT NULL,
  lastname    VARCHAR(100) NOT NULL,
  position_id INT NOT NULL REFERENCES tbl_positions(id),
  gender      CHAR(1) CHECK (gender IN ('M','F')),
  salary      NUMERIC(10,2) CHECK (salary >= 0),
  date_hired  DATE NOT NULL,
  status      VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
  manager_id  INT REFERENCES tbl_employees(id)   -- self-reference for org charts
);`,
          mysql: `CREATE TABLE tbl_departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB;
CREATE TABLE tbl_positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  position_name VARCHAR(50) NOT NULL,
  department_id INT NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT fk_pos_dept FOREIGN KEY (department_id) REFERENCES tbl_departments(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE tbl_employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstname VARCHAR(100) NOT NULL,
  lastname  VARCHAR(100) NOT NULL,
  position_id INT NOT NULL,
  gender CHAR(1) CHECK (gender IN ('M','F')),
  salary DECIMAL(10,2) CHECK (salary >= 0),
  date_hired DATE NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  manager_id INT NULL,
  FOREIGN KEY (position_id) REFERENCES tbl_positions(id),
  FOREIGN KEY (manager_id)  REFERENCES tbl_employees(id)
) ENGINE=InnoDB;`,
        },
      }],
    },
    {
      slug: "normalization",
      title: "Normalization (1NF → BCNF)",
      why: "Removes duplicate data so updates can't leave it inconsistent.",
      points: [
        "**1NF**: atomic values, no repeating groups (one row per student and course, not `IT201, IT202` in one cell).",
        "**2NF**: no partial dependency. `student_name` depends only on `student_id`, not on (student_id, course_code), so move it to `students`.",
        "**3NF**: no transitive dependency. `program_head` depends on `program`, not on the student, so move it to `programs`.",
        "**BCNF**: every determinant must be a candidate key. Example: instructor → course, but instructor isn't a key, so split the table.",
        "Mnemonic: \"the key (1NF), the whole key (2NF), and nothing but the key (3NF)\".",
      ],
    },
    {
      slug: "joins",
      title: "JOINs",
      why: "Combining tables is most of real-world SQL.",
      points: [
        "**INNER**: only rows that match on both sides. **LEFT**: every row from the left table, with NULLs where there's no match.",
        "**FULL OUTER**: unmatched rows from both sides. MySQL doesn't have it, so use LEFT + RIGHT + UNION.",
        "**SELF**: a table joined to itself (employee → manager). **CROSS**: every combination.",
        "Gotcha: with LEFT JOIN, `COUNT(e.id)` gives 0 for empty groups but `COUNT(*)` gives 1.",
      ],
      demo: "sql",
      code: [{
        title: "LEFT JOIN headcount incl. empty departments",
        variants: {
          postgres: `SELECT d.department_name, COUNT(e.id) AS headcount, ROUND(AVG(e.salary), 2) AS avg_salary
FROM tbl_departments d
LEFT JOIN tbl_positions p ON p.department_id = d.id
LEFT JOIN tbl_employees e ON e.position_id = p.id
GROUP BY d.department_name
ORDER BY headcount DESC;`,
        },
      }, {
        title: "FULL OUTER JOIN: unassigned employees and unfilled positions",
        variants: {
          postgres: `SELECT e.firstname, p.position_name
FROM tbl_employees e
FULL OUTER JOIN tbl_positions p ON e.position_id = p.id
WHERE e.id IS NULL OR p.id IS NULL;`,
          mysql: `-- MySQL has no FULL OUTER JOIN
SELECT e.firstname, p.position_name
FROM tbl_employees e LEFT JOIN tbl_positions p ON e.position_id = p.id WHERE p.id IS NULL
UNION ALL
SELECT e.firstname, p.position_name
FROM tbl_employees e RIGHT JOIN tbl_positions p ON e.position_id = p.id WHERE e.id IS NULL;`,
        },
      }],
    },
    {
      slug: "grouping-subqueries",
      title: "GROUP BY, HAVING & subqueries",
      why: "Reports: totals per group, and filters that depend on other queries.",
      points: [
        "`WHERE` filters rows **before** grouping and `HAVING` filters groups **after**.",
        "Scalar subquery: compare against one value (`> (SELECT AVG(salary) …)`).",
        "Correlated subquery: runs once per outer row, e.g. above your **own** department's average.",
        "Prefer `NOT EXISTS` over `NOT IN`, because NOT IN returns nothing if the subquery yields any NULL.",
      ],
      demo: "sql",
      code: [{
        title: "Earns above own department's average (correlated)",
        variants: {
          postgres: `SELECT e.firstname, e.salary
FROM tbl_employees e
JOIN tbl_positions p ON p.id = e.position_id
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM tbl_employees e2 JOIN tbl_positions p2 ON p2.id = e2.position_id
  WHERE p2.department_id = p.department_id
);`,
        },
      }],
    },
    {
      slug: "cte-window",
      title: "CTEs & window functions",
      why: "The biggest step up from basic SQL: rankings, running totals, hierarchies.",
      points: [
        "A **CTE** (`WITH x AS (…)`) is a named subquery that makes long queries readable.",
        "Window functions compute across rows without collapsing them: `ROW_NUMBER` (1,2,3) · `RANK` (1,1,3) · `DENSE_RANK` (1,1,2).",
        "`PARTITION BY` = per group. `ORDER BY` inside OVER = running/ordered calculations. `LAG`/`LEAD` = the previous or next row.",
        "`WITH RECURSIVE` walks hierarchies like an org chart. The syntax is the same in Postgres and MySQL 8.",
      ],
      demo: "sql",
      code: [{
        title: "Top 2 earners per department",
        variants: {
          postgres: `WITH ranked AS (
  SELECT e.firstname, d.department_name, e.salary,
         RANK() OVER (PARTITION BY d.id ORDER BY e.salary DESC) AS rnk
  FROM tbl_employees e
  JOIN tbl_positions p   ON p.id = e.position_id
  JOIN tbl_departments d ON d.id = p.department_id
)
SELECT * FROM ranked WHERE rnk <= 2;`,
        },
      }, {
        title: "Recursive org chart (needs manager_id)",
        variants: {
          postgres: `ALTER TABLE tbl_employees ADD COLUMN manager_id INT REFERENCES tbl_employees(id);
UPDATE tbl_employees SET manager_id = 7 WHERE id IN (2, 3);   -- Strange manages the seniors
UPDATE tbl_employees SET manager_id = 3 WHERE id IN (1, 6);   -- Stark manages the juniors

WITH RECURSIVE chain AS (
  SELECT id, firstname, manager_id, 1 AS lvl, firstname::text AS path
  FROM tbl_employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.firstname, e.manager_id, c.lvl + 1, c.path || ' > ' || e.firstname
  FROM tbl_employees e JOIN chain c ON e.manager_id = c.id
)
SELECT * FROM chain ORDER BY path;`,
          mysql: `WITH RECURSIVE chain AS (
  SELECT id, firstname, manager_id, 1 AS lvl, CAST(firstname AS CHAR(200)) AS path
  FROM tbl_employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.firstname, e.manager_id, c.lvl + 1, CONCAT(c.path, ' > ', e.firstname)
  FROM tbl_employees e JOIN chain c ON e.manager_id = c.id
)
SELECT * FROM chain ORDER BY path;`,
        },
        note: "Try this in the playground: run the ALTER and UPDATEs first.",
      }],
    },
    {
      slug: "views-indexes",
      title: "Views, indexes & EXPLAIN",
      why: "Views simplify reporting and indexes make queries fast.",
      points: [
        "A view stores the **query**, not the data. Postgres also has `MATERIALIZED VIEW` (stored data, refreshed manually).",
        "B-tree is the default index type. It helps `=`, `<`, `BETWEEN`, `ORDER BY` and `LIKE 'abc%'`.",
        "Composite `(a, b)` follows the leftmost-prefix rule: it helps `WHERE a=?` but not `WHERE b=?` alone.",
        "`EXPLAIN` shows the plan and `EXPLAIN ANALYZE` actually **runs** the query. `Seq Scan` = full table read. On tiny tables that's correct.",
        "Index foreign keys and columns you filter on often. Each index slows down writes a little.",
      ],
      demo: "sql",
      code: [{
        title: "Index race",
        variants: {
          postgres: `-- 1M fake rows
CREATE TABLE big AS
SELECT g AS id, md5(g::text) AS name, (random() * 100000)::int AS salary
FROM generate_series(1, 1000000) g;

EXPLAIN ANALYZE SELECT * FROM big WHERE name = 'c4ca4238a0b923820dcc509a6f75849b';
CREATE INDEX idx_big_name ON big(name);
EXPLAIN ANALYZE SELECT * FROM big WHERE name = 'c4ca4238a0b923820dcc509a6f75849b';
-- compare: Seq Scan (~100 ms) vs Index Scan (<1 ms)`,
        },
      }],
    },
    {
      slug: "transactions",
      title: "Transactions & ACID",
      why: "Money, stock and enrollment counts must never be half-updated.",
      points: [
        "**A**tomicity (all or nothing) · **C**onsistency (constraints hold) · **I**solation (concurrent transactions don't interfere) · **D**urability (committed data survives a crash).",
        "Default isolation: Postgres = READ COMMITTED, MySQL = REPEATABLE READ.",
        "`SELECT … FOR UPDATE` locks the rows so two cashiers can't both sell the last item.",
        "`SAVEPOINT` lets you undo part of a transaction. Under SERIALIZABLE, retry on SQLSTATE 40001.",
      ],
      demo: "sql",
      code: [{
        title: "Lock, update, partial rollback",
        variants: {
          postgres: `BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT salary FROM tbl_employees WHERE id = 2 FOR UPDATE;
UPDATE tbl_employees SET salary = salary + 5000 WHERE id = 2;
SAVEPOINT before_bonus;
UPDATE tbl_employees SET salary = salary + 999999 WHERE id = 3;
ROLLBACK TO SAVEPOINT before_bonus;
COMMIT;`,
          mysql: `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;   -- before START
START TRANSACTION;
SELECT salary FROM tbl_employees WHERE id = 2 FOR UPDATE;
UPDATE tbl_employees SET salary = salary + 5000 WHERE id = 2;
COMMIT;`,
        },
        note: "Demo: open 2 psql windows. Run FOR UPDATE in one and watch the other wait until you COMMIT.",
      }],
    },
    {
      slug: "procedures-triggers",
      title: "Functions, procedures & triggers",
      why: "Logic that lives in the database, like audit trails and payroll.",
      points: [
        "Function = returns a value and works in SELECT. Procedure = run with `CALL`, can manage transactions.",
        "Trigger = runs automatically on INSERT, UPDATE or DELETE. Use it for audit logs, not for business logic you'll forget about.",
        "Postgres triggers call a separate trigger function. MySQL writes the body inline and needs `DELIMITER //`.",
      ],
      code: [{
        title: "Salary audit trigger",
        variants: {
          postgres: `CREATE TABLE tbl_salary_audit (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id INT, old_salary NUMERIC(10,2), new_salary NUMERIC(10,2),
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE FUNCTION trg_salary_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.salary IS DISTINCT FROM OLD.salary THEN
    INSERT INTO tbl_salary_audit(employee_id, old_salary, new_salary)
    VALUES (OLD.id, OLD.salary, NEW.salary);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER salary_audit AFTER UPDATE OF salary ON tbl_employees
FOR EACH ROW EXECUTE FUNCTION trg_salary_audit();

UPDATE tbl_employees SET salary = salary + 1000 WHERE id = 4 RETURNING id, salary;
SELECT * FROM tbl_salary_audit;`,
          mysql: `DELIMITER //
CREATE TRIGGER salary_audit AFTER UPDATE ON tbl_employees
FOR EACH ROW
BEGIN
  IF NOT (NEW.salary <=> OLD.salary) THEN
    INSERT INTO tbl_salary_audit(employee_id, old_salary, new_salary)
    VALUES (OLD.id, OLD.salary, NEW.salary);
  END IF;
END //
DELIMITER ;`,
        },
      }, {
        title: "Department payroll function",
        variants: {
          postgres: `CREATE FUNCTION dept_payroll(p_dept INT) RETURNS NUMERIC LANGUAGE sql AS $$
  SELECT COALESCE(SUM(e.salary), 0)
  FROM tbl_employees e JOIN tbl_positions p ON p.id = e.position_id
  WHERE p.department_id = p_dept
$$;
SELECT dept_payroll(1);`,
          mysql: `DELIMITER //
CREATE FUNCTION dept_payroll(p_dept INT) RETURNS DECIMAL(12,2)
READS SQL DATA
BEGIN
  RETURN (SELECT COALESCE(SUM(e.salary), 0)
          FROM tbl_employees e JOIN tbl_positions p ON p.id = e.position_id
          WHERE p.department_id = p_dept);
END //
DELIMITER ;`,
        },
      }],
    },
    {
      slug: "from-code",
      title: "Connecting from code + SQL injection",
      why: "Every app you build talks to a database. Do it safely.",
      points: [
        "**Never** concatenate input into SQL. With input `' OR '1'='1`, the query returns every row.",
        "Use placeholders: `$1` (node-pg), `?` (mysql2, JDBC), `%s` (Python drivers). The driver sends the values separately from the SQL.",
        "Table and column names can't be placeholders, so check them against an allow-list in code.",
        "Use a least-privilege DB user for the app, never root.",
      ],
      code: [{
        title: "Parameterized query",
        variants: {
          js: `// npm i pg
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const { rows } = await pool.query(
  "SELECT id, firstname, salary FROM tbl_employees WHERE salary > $1 AND status = $2",
  [50000, "ACTIVE"]
);

// MySQL: npm i mysql2
import mysql from "mysql2/promise";
const db = mysql.createPool({ host: "localhost", user: "app", password: process.env.DB_PASS, database: "company" });
const [list] = await db.execute("SELECT id, firstname FROM tbl_employees WHERE salary > ?", [50000]);`,
          python: `# pip install "psycopg[binary]"
import psycopg
with psycopg.connect("dbname=company") as conn:
    rows = conn.execute(
        "SELECT id, firstname FROM tbl_employees WHERE salary > %s", (50000,)
    ).fetchall()

# pip install mysql-connector-python
import mysql.connector
conn = mysql.connector.connect(host="localhost", user="app", password="...", database="company")
cur = conn.cursor(dictionary=True)
cur.execute("SELECT id, firstname FROM tbl_employees WHERE salary > %s", (50000,))`,
          java: `String url = "jdbc:postgresql://localhost:5432/company";   // MySQL: jdbc:mysql://localhost:3306/company
String sql = "SELECT id, firstname, salary FROM tbl_employees WHERE salary > ?";
try (Connection c = DriverManager.getConnection(url, "app", System.getenv("DB_PASS"));
     PreparedStatement ps = c.prepareStatement(sql)) {
    ps.setBigDecimal(1, new BigDecimal("50000"));
    try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) System.out.println(rs.getInt("id") + " " + rs.getString("firstname"));
    }
}`,
        },
      }],
    },
    {
      slug: "security-backup",
      title: "Users, privileges & backups",
      why: "Least privilege plus tested backups keep a small mistake from becoming a disaster.",
      points: [
        "Give the app user only `SELECT, INSERT, UPDATE` on its tables. No `DROP`, no superuser.",
        "Postgres 15+ no longer lets ordinary users CREATE in `public` by default.",
        "`pg_dump` doesn't include roles, so run `pg_dumpall --globals-only` too.",
        "`mysqldump --single-transaction` takes a consistent snapshot without locking tables.",
      ],
      code: [{
        title: "Least-privilege app user",
        variants: {
          postgres: `CREATE ROLE company_app LOGIN PASSWORD 'change-me';
GRANT CONNECT ON DATABASE company TO company_app;
GRANT USAGE ON SCHEMA public TO company_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO company_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO company_app;`,
          mysql: `CREATE USER 'company_app'@'localhost' IDENTIFIED BY 'change-me';
GRANT SELECT, INSERT, UPDATE ON company.* TO 'company_app'@'localhost';
SHOW GRANTS FOR 'company_app'@'localhost';`,
        },
      }],
      commands: [
        { cmd: "pg_dump -Fc company > company.dump", purpose: "Compressed Postgres backup" },
        { cmd: "pg_restore -d company_copy --clean company.dump", purpose: "Restore into another DB" },
        { cmd: "pg_dumpall --globals-only > roles.sql", purpose: "Back up roles (pg_dump skips them)" },
        { cmd: "mysqldump -u root -p --single-transaction --routines --triggers company > company.sql", purpose: "Consistent MySQL backup incl. procedures and triggers" },
        { cmd: "mysql -u root -p company_copy < company.sql", purpose: "Restore MySQL" },
      ],
    },
    {
      slug: "pg-vs-mysql",
      title: "Postgres vs MySQL cheatsheet",
      why: "You'll switch between them, and the differences cause most of the errors.",
      beyond: true,
      points: [
        "Auto ID: `GENERATED ALWAYS AS IDENTITY` (or `SERIAL`) vs `AUTO_INCREMENT`.",
        "Concat: `a || b` vs `CONCAT()` (in MySQL `||` means OR!). Case-insensitive search: `ILIKE` vs `LIKE` (MySQL's default collation already ignores case).",
        "Postgres has `RETURNING`, FULL OUTER JOIN, real BOOLEAN, arrays, `JSONB` with GIN indexes and materialized views. MySQL uses `LAST_INSERT_ID()` instead of RETURNING.",
        "Upsert: `ON CONFLICT (col) DO UPDATE SET x = EXCLUDED.x` vs `INSERT … AS new ON DUPLICATE KEY UPDATE x = new.x`.",
        "Quoting: `\"Name\"` vs backtick-quoted names in MySQL. UPDATE with a join: `UPDATE … FROM …` vs `UPDATE t JOIN … SET …`.",
      ],
      code: [{
        title: "Postgres-only goodies",
        variants: {
          postgres: `INSERT INTO tbl_departments (department_name, status) VALUES ('Legal', 'ACTIVE') RETURNING id;
SELECT * FROM tbl_employees WHERE firstname ILIKE 's%';

CREATE TABLE tbl_profiles (employee_id INT PRIMARY KEY REFERENCES tbl_employees(id), data JSONB);
CREATE INDEX ON tbl_profiles USING GIN (data);
INSERT INTO tbl_profiles VALUES (3, '{"city": "Manila", "skills": ["sql", "js"]}');
SELECT data->>'city' FROM tbl_profiles WHERE data @> '{"skills": ["sql"]}';`,
        },
      }],
    },
  ],
  activities: [
    { title: "Query ladder", steps: ["In the playground: JOIN all 3 tables.", "Headcount per department (GROUP BY).", "Above-average earners (subquery).", "Payroll per department (CTE).", "Rank by salary (window).", "Org chart (recursive)."] },
    { title: "Normalize a spreadsheet", steps: ["Take a flat enrollment sheet (student, program, head, courses in one cell).", "Take it to 1NF, 2NF and 3NF, writing down each dependency you remove.", "Draw the final ERD on dbdiagram.io."] },
    { title: "Index race", steps: ["Run the 1M-row script in local Postgres.", "Compare EXPLAIN ANALYZE with and without the index.", "Try a composite index and test the leftmost-prefix rule."] },
    { title: "Two-terminal lock", steps: ["Open 2 psql sessions.", "Run FOR UPDATE in session A.", "Try to update the same row in B, watch it wait, then COMMIT in A."] },
  ],
  projects: [
    { title: "HR REST API", level: "Core", scope: "Express/Flask/Spring API over db_company: CRUD, parameterized SQL, a payroll stored procedure, a report view, and an audit trigger.", stack: ["Node or Python or Java", "PostgreSQL"] },
    { title: "Enrollment system schema", level: "Core", scope: "Design students, courses, sections, enrollments and prerequisites in 3NF, with a seat-count transaction using FOR UPDATE.", stack: ["PostgreSQL", "ERD"] },
    { title: "Dual-engine port", level: "Stretch", scope: "Run the same app against Postgres and MySQL behind one repository layer, and document every syntax difference you hit.", stack: ["PostgreSQL", "MySQL"] },
  ],
};
