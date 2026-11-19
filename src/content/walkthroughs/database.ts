type W = Record<string, { title: string; body: string[] }[]>;

export const walk: W = {
  setup: [
    { title: "Server, client, database", body: [
      "A database **server** (Postgres or MySQL) is a program running in the background that stores data and answers queries. A **client** (psql, the mysql CLI, your Node app, TablePlus) connects to it and sends SQL. One server holds many **databases**, and each database holds tables.",
      "On your Mac, Homebrew installs the server and `brew services start` keeps it running. Then `psql company` opens a client connected to the `company` database."] },
    { title: "Why we use Postgres first", body: [
      "Postgres follows the SQL standard closely and has features you'll want later (FULL JOIN, RETURNING, JSONB). MySQL is everywhere in PH hosting and school labs, so you'll learn both and compare. The concepts are 95% the same; the differences are mostly syntax."] },
  ],
  "erd-keys": [
    { title: "From real things to tables", body: [
      "Start with **entities**, the things you store: department, position, employee. Each becomes a table. Their properties (name, salary) become **columns**. How they relate becomes **foreign keys**: an employee *has* a position, so `tbl_employees.position_id` points to `tbl_positions.id`.",
      "Draw it first (an ERD). Crow's feet show how many: one department → many positions → many employees."] },
    { title: "Keys: how rows are identified and linked", body: [
      "A **primary key** uniquely identifies each row (usually an auto-generated `id`). A **foreign key** stores another table's primary key to link the two, and the database refuses links to rows that don't exist. A **natural key** is a real-world unique value (student number, TIN); enforce those with `UNIQUE`.",
      "Many-to-many relationships (students ↔ subjects) can't be stored with one FK. You add a **junction table** (`enrollments(student_id, subject_id)`) with an FK to each side."] },
    { title: "Constraints: rules the database enforces for you", body: [
      "`NOT NULL` (must have a value), `UNIQUE` (no duplicates), `CHECK (salary >= 0)` (custom rule), `DEFAULT 'ACTIVE'`, and FKs. They protect your data even when the app has a bug or someone types SQL by hand. Your BSIT2A dump had none of these, so bad data could get in silently."] },
  ],
  normalization: [
    { title: "The problem normalization solves", body: [
      "If the same fact is stored in many places, sooner or later the copies disagree. Store the program head's name on every student row, change it on only some rows, and now you have two \"truths\". These **anomalies** (update, insert, delete) are what normalization prevents.",
      "The idea: **each fact lives in exactly one place**, and everything else refers to it by key."] },
    { title: "1NF, 2NF, 3NF step by step", body: [
      "**1NF:** one value per cell. No `IT201, IT202` in one column; split into rows. **2NF:** with a composite key like (student, course), every column must depend on the *whole* key. The student's name depends only on the student, so it moves to a `students` table.",
      "**3NF:** no column depends on another non-key column. The program head depends on the program, not the student, so it moves to `programs`. Memory aid: every column depends on *the key, the whole key, and nothing but the key*."] },
    { title: "When to stop", body: [
      "3NF is the target for most systems. BCNF fixes rarer cases where a non-key column determines part of the key. Sometimes you deliberately keep a copy (denormalize) for speed, like a cached total. Do that consciously, never by accident."] },
  ],
  joins: [
    { title: "Why we need JOINs", body: [
      "Normalization split data into tables, and JOINs put it back together for reading. `FROM employees e JOIN positions p ON p.id = e.position_id` pairs each employee row with its position row wherever the ON condition matches."] },
    { title: "INNER vs LEFT, the most important difference", body: [
      "**INNER JOIN** keeps only matching pairs, so an employee without a position disappears from the result. **LEFT JOIN** keeps every row from the left table and fills the right side with NULL when there's no match.",
      "Rule of thumb: if the question says *\"all departments, even those with no employees\"*, use LEFT JOIN from departments. With LEFT JOIN, count the right side's column (`COUNT(e.id)`): `COUNT(*)` counts the NULL row as 1."] },
    { title: "The other joins", body: [
      "**RIGHT JOIN** is a mirrored LEFT (rarely used). **FULL OUTER** keeps unmatched rows from both sides, which is useful for finding mismatches (MySQL lacks it, so use LEFT + RIGHT + UNION). **SELF JOIN** joins a table to itself (employee → manager). **CROSS JOIN** gives every combination, useful for report grids."] },
  ],
  "grouping-subqueries": [
    { title: "GROUP BY: from rows to summaries", body: [
      "`GROUP BY department` collapses rows into one row per department, and aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) summarize each group. Every selected column must either be grouped or aggregated, because the database can't show \"one employee name\" for a whole department."] },
    { title: "WHERE vs HAVING", body: [
      "The query runs in this order: FROM/JOIN → **WHERE** (filter rows) → GROUP BY → **HAVING** (filter groups) → SELECT → ORDER BY. So `WHERE salary > 50000` removes individual employees before grouping, and `HAVING COUNT(*) >= 2` removes small departments after grouping. You can't use an aggregate in WHERE because the groups don't exist yet."] },
    { title: "Subqueries", body: [
      "A query inside a query. **Scalar** subqueries return one value: `WHERE salary > (SELECT AVG(salary) FROM employees)`. **Correlated** subqueries reference the outer row and run once per row: *above the average of their own department*. `EXISTS` / `NOT EXISTS` check whether related rows exist. Prefer `NOT EXISTS` over `NOT IN`, which breaks when the subquery contains a NULL."] },
  ],
  "cte-window": [
    { title: "CTEs: name your steps", body: [
      "`WITH dept_pay AS (SELECT … GROUP BY …) SELECT … FROM dept_pay …` lets you build a query in readable steps, like variables. Complex reports become a chain of small named queries instead of nested subqueries you can't read."] },
    { title: "Window functions: calculate across rows without collapsing them", body: [
      "GROUP BY gives one row per group. A window function keeps **every** row and adds a calculated column. `AVG(salary) OVER (PARTITION BY department_id)` puts each employee's department average beside their own salary.",
      "`PARTITION BY` = which group, `ORDER BY` inside OVER = the order within the group. Ranking: `ROW_NUMBER()` (1,2,3), `RANK()` (1,1,3 on ties), `DENSE_RANK()` (1,1,2). Running totals: `SUM(x) OVER (ORDER BY date)`. Neighbors: `LAG()` / `LEAD()`."] },
    { title: "Top-N per group and recursion", body: [
      "You can't filter a window function in WHERE, so compute the rank in a CTE, then `WHERE rnk <= 3` outside. That's the standard \"top 3 per branch\" pattern.",
      "`WITH RECURSIVE` handles hierarchies (org charts, prerequisite chains): start from the top rows, then repeatedly join to find the next level until there are none left."] },
  ],
  "views-indexes": [
    { title: "Views: saved queries", body: [
      "A view is a named SELECT. `CREATE VIEW v_directory AS SELECT … JOIN …` lets everyone query `v_directory` without rewriting the joins. It stores **no data**; it runs the query each time. Views also help security, since you can grant access to a view that hides the salary column."] },
    { title: "Indexes: the table of contents", body: [
      "Without an index, finding `email = 'ana@…'` means reading every row (**Seq Scan**). An index is a sorted structure (a B-tree) that jumps straight to the match, like a book's index. On a million rows that's ~100 ms vs under 1 ms.",
      "Indexes cost disk space and slow down writes slightly, so index columns you **filter, join or sort** on often (FKs, emails, dates). A composite index (a, b) helps queries filtering on a, or on a and b, but not on b alone."] },
    { title: "EXPLAIN: ask the database what it's doing", body: [
      "`EXPLAIN` shows the plan; `EXPLAIN ANALYZE` runs it and shows real times. Look for Seq Scan vs Index Scan, and estimated vs actual rows. On tiny tables Postgres correctly ignores indexes, because reading 7 rows is faster than using an index."] },
  ],
  transactions: [
    { title: "All or nothing", body: [
      "A transfer is two updates: subtract from A, add to B. If the server crashes between them, money vanishes. A **transaction** (`BEGIN … COMMIT`) makes the steps one unit: either all succeed, or `ROLLBACK` undoes everything. That's **Atomicity**, the A in ACID."] },
    { title: "ACID", body: [
      "**Atomicity:** all or nothing. **Consistency:** constraints still hold after the transaction. **Isolation:** concurrent transactions don't see each other's half-done work. **Durability:** once committed, the data survives a crash (written to the log first)."] },
    { title: "Concurrency and locks", body: [
      "Two cashiers read stock = 1 at the same time, both sell, and stock becomes −1: a **lost update**. The fix is to lock what you read: `SELECT … FOR UPDATE` inside the transaction. The second cashier waits until the first commits, then sees 0.",
      "Isolation levels set how strict this is. Postgres defaults to READ COMMITTED and MySQL to REPEATABLE READ. SERIALIZABLE is the strictest, and your app must retry when it gets a serialization error."] },
  ],
  "procedures-triggers": [
    { title: "Code inside the database", body: [
      "A **function** computes and returns a value, usable inside SELECT (`SELECT dept_payroll(1)`). A **procedure** performs actions and is run with `CALL`. They keep important logic next to the data, so every app that uses the database gets the same rules."] },
    { title: "Triggers: automatic reactions", body: [
      "A trigger runs automatically when rows are inserted, updated or deleted. The classic use is an **audit trail**: after any salary update, insert old and new values plus a timestamp into an audit table. No app code can forget to do it.",
      "Use triggers for logging and integrity. Don't hide business logic in them: a trigger silently changing data surprises everyone later."] },
    { title: "Postgres vs MySQL syntax", body: [
      "Postgres: the body goes between `$$ … $$`, and a trigger calls a separate trigger function. MySQL: the body is inline in `CREATE TRIGGER`, and the CLI needs `DELIMITER //` so the semicolons inside the body don't end the statement early."] },
  ],
  "from-code": [
    { title: "How an app talks to the database", body: [
      "Your app opens a **connection pool** (a few reusable connections), sends SQL with values, and gets rows back as objects. Every language has a driver: `pg` / `mysql2` for Node, `psycopg` / `mysql-connector` for Python, JDBC for Java."] },
    { title: "SQL injection: the #1 database attack", body: [
      "If you build SQL by gluing strings, `\"… WHERE name = '\" + input + \"'\"`, the user's input becomes **code**. Input like `' OR '1'='1` rewrites the WHERE clause, and attackers can dump or delete tables.",
      "The fix is **parameterized queries**: `WHERE name = $1` with the value passed separately. The driver sends SQL and data on different channels, so input can never become code. Table and column names can't be parameters, so check them against an allow-list."] },
    { title: "Transactions from code", body: [
      "Get one connection from the pool, run `BEGIN`, do the queries, then `COMMIT`. In a catch block, `ROLLBACK`. In finally, release the connection. Every language follows this exact shape."] },
  ],
  "security-backup": [
    { title: "Least privilege", body: [
      "Your app shouldn't connect as `root` / `postgres`. Create a role that can only SELECT, INSERT and UPDATE the tables it needs, with no DROP and no access to other databases. Then a bug, or a stolen password, can only do limited damage."] },
    { title: "Backups and restores", body: [
      "`pg_dump` / `mysqldump` export a database to a file (SQL text, or Postgres's compressed custom format). Schedule them nightly with cron and keep several days. `--single-transaction` in MySQL gives a consistent snapshot without locking tables.",
      "The backup itself isn't the goal; the **restore** is. Regularly restore into a test database and check it works. How much data you can afford to lose (RPO) decides how often you back up."] },
  ],
  "pg-vs-mysql": [
    { title: "Same ideas, different dialects", body: [
      "Both are relational, use SQL and support transactions, indexes, views and triggers. Where they differ: auto IDs (`IDENTITY` vs `AUTO_INCREMENT`), string concatenation (`||` vs `CONCAT`), getting the new ID (`RETURNING` vs `LAST_INSERT_ID`), case-insensitive search (`ILIKE` vs a collation-based `LIKE`), and FULL JOIN (Postgres only)."] },
    { title: "How to live with both", body: [
      "Write standard SQL where you can. Keep engine-specific queries in one module (a repository layer), so switching databases means changing one file, not hunting through the whole app. Keep a personal cheatsheet of every difference you hit; you'll reuse it every project."] },
  ],
};
