// Generated from tested project files. Do not edit by hand.
import type { Guide } from "../types";

export const builds: Record<string, Guide> = {
 "HR REST API": {
  "where": "Your Mac: Express + PostgreSQL",
  "time": "1 weekend",
  "youNeed": [
   "PostgreSQL running",
   "Node.js 20+",
   "curl (built into macOS)"
  ],
  "tree": "hr-api/\n  db.js\n  db/\n    programmability.sql\n    schema.sql\n  package.json\n  server.js",
  "steps": [
   {
    "title": "Create the project",
    "commands": [
     {
      "cmd": "mkdir -p ~/Developments/hr-api/db && cd ~/Developments/hr-api",
      "purpose": "Folders"
     },
     {
      "cmd": "npm init -y && npm i express pg",
      "purpose": "Express + Postgres driver"
     }
    ]
   },
   {
    "title": "Schema: your db_company, done properly",
    "body": [
     "The BSIT2A tables, now with foreign keys and CHECK constraints."
    ],
    "files": [
     {
      "title": "db/schema.sql",
      "variants": {
       "postgres": "-- db_company (from BSIT2A), upgraded with foreign keys and constraints\nCREATE TABLE tbl_departments (\n  id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  department_name VARCHAR(100) NOT NULL UNIQUE,\n  status          VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE'))\n);\nCREATE TABLE tbl_positions (\n  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  position_name VARCHAR(50) NOT NULL,\n  department_id INT NOT NULL REFERENCES tbl_departments(id) ON DELETE RESTRICT,\n  status        VARCHAR(10) NOT NULL DEFAULT 'ACTIVE'\n);\nCREATE TABLE tbl_employees (\n  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  firstname   VARCHAR(100) NOT NULL,\n  lastname    VARCHAR(100) NOT NULL,\n  position_id INT NOT NULL REFERENCES tbl_positions(id),\n  gender      CHAR(1) CHECK (gender IN ('M','F')),\n  salary      NUMERIC(10,2) NOT NULL CHECK (salary >= 0),\n  date_hired  DATE NOT NULL,\n  status      VARCHAR(10) NOT NULL DEFAULT 'ACTIVE'\n);\n\nINSERT INTO tbl_departments (department_name) VALUES ('Dev Ops'), ('QA'), ('Managerial');\nINSERT INTO tbl_positions (position_name, department_id) VALUES\n  ('Junior Developer', 1), ('Senior Developer', 1), ('Junior QA', 2), ('Senior QA', 2), ('Technical Manager', 3);\nINSERT INTO tbl_employees (firstname, lastname, position_id, gender, salary, date_hired) VALUES\n  ('Jerwin', 'Cruz', 1, 'M', 60000, '2018-06-30'),\n  ('Peter', 'Parker', 2, 'M', 65000, '2011-12-02'),\n  ('Tony', 'Stark', 2, 'M', 102000, '2002-02-01'),\n  ('Natasha', 'Romanoff', 4, 'F', 70000, '2015-10-24'),\n  ('Wanda', 'Maximoff', 3, 'F', 48000, '2016-09-25'),\n  ('Steve', 'Rogers', 1, 'M', 58000, '2017-07-25'),\n  ('Stephen', 'Strange', 5, 'M', 52000, '2013-08-25');\n"
      }
     }
    ]
   },
   {
    "title": "View, function and audit trigger",
    "files": [
     {
      "title": "db/programmability.sql",
      "variants": {
       "postgres": "-- View: the directory the API reads from\nCREATE OR REPLACE VIEW v_employee_directory AS\nSELECT e.id, e.firstname, e.lastname, e.gender, e.salary, to_char(e.date_hired, 'YYYY-MM-DD') AS date_hired, e.status,\n       p.id AS position_id, p.position_name, d.id AS department_id, d.department_name\nFROM tbl_employees e\nJOIN tbl_positions p   ON p.id = e.position_id\nJOIN tbl_departments d ON d.id = p.department_id;\n\n-- Function: total payroll of one department\nCREATE OR REPLACE FUNCTION dept_payroll(p_dept INT) RETURNS NUMERIC LANGUAGE sql AS $$\n  SELECT COALESCE(SUM(e.salary), 0)\n  FROM tbl_employees e JOIN tbl_positions p ON p.id = e.position_id\n  WHERE p.department_id = p_dept AND e.status = 'ACTIVE'\n$$;\n\n-- Trigger: log every salary change\nCREATE TABLE IF NOT EXISTS tbl_salary_audit (\n  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  employee_id INT NOT NULL,\n  old_salary  NUMERIC(10,2),\n  new_salary  NUMERIC(10,2),\n  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()\n);\nCREATE OR REPLACE FUNCTION trg_salary_audit() RETURNS trigger LANGUAGE plpgsql AS $$\nBEGIN\n  IF NEW.salary IS DISTINCT FROM OLD.salary THEN\n    INSERT INTO tbl_salary_audit (employee_id, old_salary, new_salary) VALUES (OLD.id, OLD.salary, NEW.salary);\n  END IF;\n  RETURN NEW;\nEND $$;\nDROP TRIGGER IF EXISTS salary_audit ON tbl_employees;\nCREATE TRIGGER salary_audit AFTER UPDATE OF salary ON tbl_employees\nFOR EACH ROW EXECUTE FUNCTION trg_salary_audit();\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "createdb company",
      "purpose": "Create the DB"
     },
     {
      "cmd": "psql company -f db/schema.sql && psql company -f db/programmability.sql",
      "purpose": "Run both files"
     }
    ]
   },
   {
    "title": "Connection + package scripts",
    "files": [
     {
      "title": "db.js",
      "variants": {
       "js": "const { Pool } = require(\"pg\");\n\n// DATABASE_URL example: postgres://localhost/company\nmodule.exports = new Pool({ connectionString: process.env.DATABASE_URL || \"postgres://localhost/company\" });\n"
      }
     },
     {
      "title": "package.json",
      "variants": {
       "json": "{\n  \"name\": \"hr-api\",\n  \"version\": \"1.0.0\",\n  \"private\": true,\n  \"scripts\": {\n    \"db:setup\": \"psql company -f db/schema.sql && psql company -f db/programmability.sql\",\n    \"dev\": \"node --watch server.js\",\n    \"start\": \"node server.js\"\n  },\n  \"dependencies\": {\n    \"express\": \"^5.3.0\",\n    \"pg\": \"^8.23.1\"\n  }\n}\n"
      }
     }
    ]
   },
   {
    "title": "The API",
    "body": [
     "Every query uses placeholders (`$1`). For PUT, column names come from an **allow-list** (`FIELDS`), never from the request.",
     "The error handler maps Postgres codes to HTTP codes: FK violation → 422, bad id → 400. Users never see stack traces."
    ],
    "files": [
     {
      "title": "server.js",
      "variants": {
       "js": "const express = require(\"express\");\nconst pool = require(\"./db\");\n\nconst app = express();\napp.use(express.json());\n\nconst FIELDS = [\"firstname\", \"lastname\", \"position_id\", \"gender\", \"salary\", \"date_hired\"];\n\n// Validate a request body; returns an error message or null\nfunction validate(b, partial = false) {\n  for (const f of FIELDS) if (!partial && (b[f] === undefined || b[f] === \"\")) return `${f} is required`;\n  if (b.gender !== undefined && ![\"M\", \"F\"].includes(b.gender)) return \"gender must be M or F\";\n  if (b.salary !== undefined && !(Number(b.salary) >= 0)) return \"salary must be a number >= 0\";\n  if (b.date_hired !== undefined && !/^\\d{4}-\\d{2}-\\d{2}$/.test(b.date_hired)) return \"date_hired must be YYYY-MM-DD\";\n  return null;\n}\n\n// GET /employees?q=ana&page=1&limit=10  (search + pagination)\napp.get(\"/employees\", async (req, res, next) => {\n  try {\n    const q = `%${req.query.q || \"\"}%`;\n    const limit = Math.min(Number(req.query.limit) || 10, 50);\n    const page = Math.max(Number(req.query.page) || 1, 1);\n    const where = \"WHERE firstname ILIKE $1 OR lastname ILIKE $1 OR position_name ILIKE $1 OR department_name ILIKE $1\";\n    const { rows } = await pool.query(\n      `SELECT * FROM v_employee_directory ${where} ORDER BY id LIMIT $2 OFFSET $3`, [q, limit, (page - 1) * limit]);\n    const { rows: [{ count }] } = await pool.query(`SELECT count(*)::int FROM v_employee_directory ${where}`, [q]);\n    res.json({ data: rows, page, limit, total: count });\n  } catch (e) { next(e); }\n});\n\napp.get(\"/employees/:id\", async (req, res, next) => {\n  try {\n    const { rows } = await pool.query(\"SELECT * FROM v_employee_directory WHERE id = $1\", [req.params.id]);\n    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: \"Employee not found\" });\n  } catch (e) { next(e); }\n});\n\napp.post(\"/employees\", async (req, res, next) => {\n  const err = validate(req.body);\n  if (err) return res.status(422).json({ error: err });\n  try {\n    const b = req.body;\n    const { rows } = await pool.query(\n      `INSERT INTO tbl_employees (firstname, lastname, position_id, gender, salary, date_hired)\n       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,\n      [b.firstname, b.lastname, b.position_id, b.gender, b.salary, b.date_hired]);\n    res.status(201).location(`/employees/${rows[0].id}`).json({ id: rows[0].id });\n  } catch (e) { next(e); }\n});\n\n// PUT = partial update of the given fields only\napp.put(\"/employees/:id\", async (req, res, next) => {\n  const err = validate(req.body, true);\n  if (err) return res.status(422).json({ error: err });\n  const fields = FIELDS.filter((f) => req.body[f] !== undefined);   // allow-list: column names never come from the user\n  if (!fields.length) return res.status(422).json({ error: \"nothing to update\" });\n  try {\n    const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(\", \");\n    const { rowCount } = await pool.query(\n      `UPDATE tbl_employees SET ${sets} WHERE id = $${fields.length + 1}`, [...fields.map((f) => req.body[f]), req.params.id]);\n    rowCount ? res.sendStatus(204) : res.status(404).json({ error: \"Employee not found\" });\n  } catch (e) { next(e); }\n});\n\napp.delete(\"/employees/:id\", async (req, res, next) => {\n  try {\n    const { rowCount } = await pool.query(\"DELETE FROM tbl_employees WHERE id = $1\", [req.params.id]);\n    rowCount ? res.sendStatus(204) : res.status(404).json({ error: \"Employee not found\" });\n  } catch (e) { next(e); }\n});\n\napp.get(\"/positions\", async (req, res, next) => {\n  try {\n    const { rows } = await pool.query(\n      \"SELECT p.id, p.position_name, d.department_name FROM tbl_positions p JOIN tbl_departments d ON d.id = p.department_id ORDER BY p.id\");\n    res.json(rows);\n  } catch (e) { next(e); }\n});\n\napp.get(\"/reports/payroll\", async (req, res, next) => {\n  try {\n    const { rows } = await pool.query(\n      \"SELECT id, department_name, dept_payroll(id)::float AS payroll FROM tbl_departments ORDER BY payroll DESC\");\n    res.json(rows);\n  } catch (e) { next(e); }\n});\n\napp.get(\"/reports/salary-audit\", async (req, res, next) => {\n  try {\n    const { rows } = await pool.query(\"SELECT * FROM tbl_salary_audit ORDER BY id DESC LIMIT 50\");\n    res.json(rows);\n  } catch (e) { next(e); }\n});\n\n// Map common Postgres errors to proper HTTP codes; hide internals\napp.use((err, req, res, next) => {\n  if (err.code === \"23503\") return res.status(422).json({ error: \"position_id does not exist\" });   // FK violation\n  if (err.code === \"22P02\") return res.status(400).json({ error: \"invalid id or number\" });          // bad input syntax\n  console.error(err);\n  res.status(500).json({ error: \"Internal server error\" });\n});\n\nconst PORT = process.env.PORT || 4000;\napp.listen(PORT, () => console.log(`HR API on http://localhost:${PORT}`));\n"
      }
     }
    ]
   },
   {
    "title": "Test every route",
    "commands": [
     {
      "cmd": "npm run dev",
      "purpose": "Start (auto-restarts when you save)"
     },
     {
      "cmd": "curl 'localhost:4000/employees?q=qa'",
      "purpose": "Search: Natasha + Wanda"
     },
     {
      "cmd": "curl -i -X POST localhost:4000/employees -H 'Content-Type: application/json' -d '{\"firstname\":\"Ana\",\"lastname\":\"Cruz\",\"position_id\":1,\"gender\":\"F\",\"salary\":50000,\"date_hired\":\"2026-06-01\"}'",
      "purpose": "201 Created + Location header"
     },
     {
      "cmd": "curl -i -X POST localhost:4000/employees -H 'Content-Type: application/json' -d '{\"firstname\":\"x\"}'",
      "purpose": "422: lastname is required"
     },
     {
      "cmd": "curl -i -X PUT localhost:4000/employees/4 -H 'Content-Type: application/json' -d '{\"salary\":75000}'",
      "purpose": "204, and the trigger logs it"
     },
     {
      "cmd": "curl localhost:4000/reports/salary-audit",
      "purpose": "Shows old 70000 → new 75000"
     },
     {
      "cmd": "curl localhost:4000/reports/payroll",
      "purpose": "Payroll per department (stored function)"
     },
     {
      "cmd": "curl \"localhost:4000/employees?q=%27%20OR%20%271%27%3D%271\"",
      "purpose": "SQL injection attempt: 0 results (treated as text)"
     }
    ]
   }
  ],
  "done": [
   "All routes return the right codes: 201, 204, 400, 404, 422.",
   "The salary audit table fills on every raise.",
   "Next: build the Employee directory (Web Systems) on top of this API."
  ]
 },
 "Enrollment system schema": {
  "where": "PostgreSQL (psql) on your Mac",
  "time": "1 evening",
  "youNeed": [
   "PostgreSQL running"
  ],
  "tree": "enrollment-schema/\n  enroll.sql\n  queries.sql\n  race-test.sh\n  schema.sql\n  seed.sql",
  "steps": [
   {
    "title": "Create the folder + DB",
    "commands": [
     {
      "cmd": "mkdir ~/Developments/enrollment-schema && cd $_",
      "purpose": "Folder"
     },
     {
      "cmd": "createdb enrollment",
      "purpose": "Database"
     }
    ]
   },
   {
    "title": "Schema in 3NF",
    "body": [
     "M:N relationships (course ↔ prerequisite, student ↔ section) become junction tables. The composite PK on enrollments blocks double enrollment."
    ],
    "files": [
     {
      "title": "schema.sql",
      "variants": {
       "postgres": "-- Enrollment system in 3NF (PostgreSQL)\nCREATE TABLE programs (\n  code         VARCHAR(10) PRIMARY KEY,           -- natural key: BSIT, BSCS\n  name         VARCHAR(100) NOT NULL,\n  program_head VARCHAR(100) NOT NULL\n);\n\nCREATE TABLE students (\n  id           VARCHAR(10) PRIMARY KEY,           -- 2024-0001\n  firstname    VARCHAR(50) NOT NULL,\n  lastname     VARCHAR(50) NOT NULL,\n  program_code VARCHAR(10) NOT NULL REFERENCES programs(code),\n  year_level   SMALLINT NOT NULL CHECK (year_level BETWEEN 1 AND 5)\n);\n\nCREATE TABLE courses (\n  code  VARCHAR(10) PRIMARY KEY,                  -- DATSYS, WEBSYS\n  title VARCHAR(100) NOT NULL,\n  units SMALLINT NOT NULL CHECK (units BETWEEN 1 AND 6)\n);\n\n-- M:N: a course can have many prerequisites, a prerequisite unlocks many courses\nCREATE TABLE prerequisites (\n  course_code VARCHAR(10) REFERENCES courses(code),\n  prereq_code VARCHAR(10) REFERENCES courses(code),\n  PRIMARY KEY (course_code, prereq_code),\n  CHECK (course_code <> prereq_code)\n);\n\nCREATE TABLE sections (\n  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  course_code VARCHAR(10) NOT NULL REFERENCES courses(code),\n  term        VARCHAR(20) NOT NULL,                -- 2026-2027 2nd\n  section     VARCHAR(10) NOT NULL,                -- BSIT-2A\n  capacity    SMALLINT NOT NULL CHECK (capacity > 0),\n  UNIQUE (course_code, term, section)\n);\n\n-- M:N between students and sections; grade NULL = in progress\nCREATE TABLE enrollments (\n  student_id VARCHAR(10) REFERENCES students(id),\n  section_id INT REFERENCES sections(id),\n  grade      NUMERIC(3,2) CHECK (grade IN (1.00,1.25,1.50,1.75,2.00,2.25,2.50,2.75,3.00,5.00)),\n  PRIMARY KEY (student_id, section_id)            -- can't enroll twice in the same section\n);\n"
      }
     }
    ]
   },
   {
    "title": "Seed data",
    "body": [
     "Section 2 has only **2 seats** for the race test. Ben failed the prerequisite."
    ],
    "files": [
     {
      "title": "seed.sql",
      "variants": {
       "postgres": "INSERT INTO programs VALUES ('BSIT', 'BS Information Technology', 'Dr. Cruz');\nINSERT INTO students VALUES\n  ('2024-0001', 'Juan', 'Dela Cruz', 'BSIT', 2),\n  ('2024-0002', 'Ana', 'Reyes', 'BSIT', 2),\n  ('2024-0003', 'Ben', 'Santos', 'BSIT', 2),\n  ('2024-0004', 'Cara', 'Lim', 'BSIT', 2);\nINSERT INTO courses VALUES\n  ('CCIT05', 'Information Management', 3),\n  ('ITECC06', 'Web Development', 3),\n  ('DATSYS', 'Database Systems', 3),\n  ('ITELEC3', 'Web Systems and Technologies', 3);\nINSERT INTO prerequisites VALUES ('DATSYS', 'CCIT05'), ('ITELEC3', 'ITECC06'), ('ITELEC3', 'DATSYS');\n\nINSERT INTO sections (course_code, term, section, capacity) VALUES\n  ('CCIT05',  '2025-2026 2nd', 'BSIT-1A', 40),   -- id 1 (past term)\n  ('DATSYS',  '2026-2027 2nd', 'BSIT-2A', 2),    -- id 2: only 2 seats, for the lock demo\n  ('ITELEC3', '2026-2027 2nd', 'BSIT-2A', 40);   -- id 3\n\n-- Juan, Ana and Cara passed CCIT05; Ben failed it (5.00)\nINSERT INTO enrollments VALUES ('2024-0001', 1, 1.50), ('2024-0002', 1, 2.00), ('2024-0003', 1, 5.00), ('2024-0004', 1, 1.25);\n"
      }
     }
    ]
   },
   {
    "title": "The enroll function (all rules, transaction-safe)",
    "body": [
     "Order matters: **lock the section row first** (`FOR UPDATE`), then check duplicate → prerequisites → seats, then insert. The seat count can't go stale because nobody else can enroll in that section while you hold the lock."
    ],
    "files": [
     {
      "title": "enroll.sql",
      "variants": {
       "postgres": "-- enroll_student: all the business rules in ONE transaction-safe function\nCREATE OR REPLACE FUNCTION enroll_student(p_student VARCHAR, p_section INT)\nRETURNS TEXT LANGUAGE plpgsql AS $$\nDECLARE\n  v_course   VARCHAR;\n  v_capacity SMALLINT;\n  v_taken    INT;\n  v_missing  TEXT;\nBEGIN\n  -- 1) Lock the section row: concurrent enrollments for the same section wait here\n  SELECT course_code, capacity INTO v_course, v_capacity\n  FROM sections WHERE id = p_section FOR UPDATE;\n  IF NOT FOUND THEN RAISE EXCEPTION 'Section % does not exist', p_section; END IF;\n\n  -- 2) Already enrolled?\n  IF EXISTS (SELECT 1 FROM enrollments WHERE student_id = p_student AND section_id = p_section) THEN\n    RAISE EXCEPTION 'Student % is already enrolled in section %', p_student, p_section;\n  END IF;\n\n  -- 3) Prerequisites passed? (grade 1.00–3.00 = passed)\n  SELECT string_agg(pr.prereq_code, ', ') INTO v_missing\n  FROM prerequisites pr\n  WHERE pr.course_code = v_course\n    AND NOT EXISTS (\n      SELECT 1 FROM enrollments e JOIN sections s ON s.id = e.section_id\n      WHERE e.student_id = p_student AND s.course_code = pr.prereq_code AND e.grade <= 3.00);\n  IF v_missing IS NOT NULL THEN\n    RAISE EXCEPTION 'Missing prerequisite(s) for %: %', v_course, v_missing;\n  END IF;\n\n  -- 4) Seats left? (counted while holding the lock, so the count can't go stale)\n  SELECT count(*) INTO v_taken FROM enrollments WHERE section_id = p_section;\n  IF v_taken >= v_capacity THEN\n    RAISE EXCEPTION 'Section % is full (%/%)', p_section, v_taken, v_capacity;\n  END IF;\n\n  INSERT INTO enrollments (student_id, section_id) VALUES (p_student, p_section);\n  RETURN format('Enrolled %s in %s (%s/%s seats)', p_student, v_course, v_taken + 1, v_capacity);\nEND $$;\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "for f in schema seed enroll; do psql enrollment -f $f.sql; done",
      "purpose": "Load everything"
     },
     {
      "cmd": "psql enrollment -c \"SELECT enroll_student('2024-0003', 2);\"",
      "purpose": "Ben: ERROR Missing prerequisite(s) for DATSYS: CCIT05"
     }
    ]
   },
   {
    "title": "Race for the last seat",
    "files": [
     {
      "title": "race-test.sh",
      "variants": {
       "bash": "#!/usr/bin/env bash\n# Two students grab the LAST seat at the same time. Exactly one must win.\nDB=${DB:-enrollment}\npsql -q $DB -c \"SELECT enroll_student('2024-0001', 2);\"     # takes seat 1 of 2\npsql -q $DB -c \"BEGIN; SELECT enroll_student('2024-0002', 2); SELECT pg_sleep(2); COMMIT;\" &   # holds the lock 2 s\nsleep 0.5\npsql -q $DB -c \"SELECT enroll_student('2024-0004', 2);\"     # Cara: WAITS for the lock, then gets \"Section 2 is full\"\nwait\npsql $DB -c \"SELECT count(*) AS enrolled, 2 AS capacity FROM enrollments WHERE section_id = 2;\"\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "chmod +x race-test.sh && ./race-test.sh",
      "purpose": "Juan + Ana enroll, Cara waits, then gets 'Section 2 is full (2/2)'"
     }
    ]
   },
   {
    "title": "Reports",
    "files": [
     {
      "title": "queries.sql",
      "variants": {
       "postgres": "-- Class list with seats used\nSELECT s.id, s.course_code, s.section, count(e.student_id) AS enrolled, s.capacity\nFROM sections s LEFT JOIN enrollments e ON e.section_id = s.id\nGROUP BY s.id ORDER BY s.id;\n\n-- Each student's load this term (units)\nSELECT st.id, st.lastname, COALESCE(SUM(c.units), 0) AS units\nFROM students st\nLEFT JOIN enrollments e ON e.student_id = st.id\nLEFT JOIN sections s ON s.id = e.section_id AND s.term = '2026-2027 2nd'\nLEFT JOIN courses c ON c.code = s.course_code\nGROUP BY st.id ORDER BY st.id;\n\n-- Prerequisite chain of ITELEC3 (recursive)\nWITH RECURSIVE chain AS (\n  SELECT course_code, prereq_code, 1 AS depth FROM prerequisites WHERE course_code = 'ITELEC3'\n  UNION ALL\n  SELECT p.course_code, p.prereq_code, c.depth + 1\n  FROM prerequisites p JOIN chain c ON p.course_code = c.prereq_code\n)\nSELECT * FROM chain ORDER BY depth;\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "psql enrollment -f queries.sql",
      "purpose": "Class list, student load, recursive prerequisite chain"
     }
    ]
   }
  ],
  "done": [
   "The race ends with exactly 2/2 enrolled.",
   "Duplicate, prerequisite and full-section cases all raise clear errors.",
   "ERD drawn on dbdiagram.io from schema.sql."
  ]
 },
 "Dual-engine port": {
  "where": "Your Mac: PostgreSQL + MySQL 8.4",
  "time": "1 weekend",
  "youNeed": [
   "PostgreSQL and MySQL 8.4 both running (see the setup lesson)"
  ],
  "tree": "dual-engine/\n  DIFFERENCES.md\n  db/\n    mysql.sql\n    postgres.sql\n  package.json\n  repo/\n    mysql.js\n    postgres.js\n  server.js\n  test.sh",
  "steps": [
   {
    "title": "Create the project",
    "commands": [
     {
      "cmd": "mkdir -p ~/Developments/dual-engine/{db,repo} && cd ~/Developments/dual-engine",
      "purpose": "Folders"
     },
     {
      "cmd": "npm init -y && npm i express pg mysql2",
      "purpose": "Both drivers"
     }
    ]
   },
   {
    "title": "Same tables, two dialects",
    "files": [
     {
      "title": "db/postgres.sql",
      "variants": {
       "postgres": "CREATE TABLE departments (\n  id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  name VARCHAR(100) NOT NULL UNIQUE\n);\nCREATE TABLE employees (\n  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  firstname     VARCHAR(100) NOT NULL,\n  lastname      VARCHAR(100) NOT NULL,\n  department_id INT NOT NULL REFERENCES departments(id),\n  salary        NUMERIC(10,2) NOT NULL CHECK (salary >= 0),\n  active        BOOLEAN NOT NULL DEFAULT TRUE\n);\nINSERT INTO departments (name) VALUES ('Dev Ops'), ('QA'), ('Managerial');\nINSERT INTO employees (firstname, lastname, department_id, salary) VALUES\n  ('Jerwin', 'Cruz', 1, 60000), ('Tony', 'Stark', 1, 102000), ('Wanda', 'Maximoff', 2, 48000);\n"
      }
     },
     {
      "title": "db/mysql.sql",
      "variants": {
       "mysql": "CREATE TABLE departments (\n  id   INT AUTO_INCREMENT PRIMARY KEY,                 -- PG: GENERATED ALWAYS AS IDENTITY\n  name VARCHAR(100) NOT NULL UNIQUE\n) ENGINE=InnoDB;\nCREATE TABLE employees (\n  id            INT AUTO_INCREMENT PRIMARY KEY,\n  firstname     VARCHAR(100) NOT NULL,\n  lastname      VARCHAR(100) NOT NULL,\n  department_id INT NOT NULL,\n  salary        DECIMAL(10,2) NOT NULL CHECK (salary >= 0),   -- PG: NUMERIC\n  active        BOOLEAN NOT NULL DEFAULT TRUE,                -- stored as TINYINT(1)\n  FOREIGN KEY (department_id) REFERENCES departments(id)\n) ENGINE=InnoDB;\nINSERT INTO departments (name) VALUES ('Dev Ops'), ('QA'), ('Managerial');\nINSERT INTO employees (firstname, lastname, department_id, salary) VALUES\n  ('Jerwin', 'Cruz', 1, 60000), ('Tony', 'Stark', 1, 102000), ('Wanda', 'Maximoff', 2, 48000);\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "createdb hr_dual && psql hr_dual -f db/postgres.sql",
      "purpose": "Postgres side"
     },
     {
      "cmd": "mysql -u root -p -e 'CREATE DATABASE hr_dual' && mysql -u root -p hr_dual < db/mysql.sql",
      "purpose": "MySQL side"
     }
    ],
    "body": [
     "Don't name the database `dual`: **DUAL is a reserved word in MySQL** and `CREATE DATABASE dual` fails. We hit this while testing."
    ]
   },
   {
    "title": "Repository layer: one interface, two implementations",
    "body": [
     "Same function names and return shapes. All the SQL differences stay inside these two files."
    ],
    "files": [
     {
      "title": "repo/postgres.js",
      "variants": {
       "js": "const { Pool } = require(\"pg\");\nconst pool = new Pool({ connectionString: process.env.DATABASE_URL || \"postgres://localhost/hr_dual\" });\n\nmodule.exports = {\n  async listEmployees(search = \"\") {\n    const { rows } = await pool.query(\n      `SELECT e.id, e.firstname || ' ' || e.lastname AS name, d.name AS department, e.salary::float AS salary, e.active\n       FROM employees e JOIN departments d ON d.id = e.department_id\n       WHERE e.firstname ILIKE $1 OR e.lastname ILIKE $1          -- ILIKE = case-insensitive\n       ORDER BY e.id`, [`%${search}%`]);\n    return rows;\n  },\n  async createEmployee({ firstname, lastname, departmentId, salary }) {\n    const { rows } = await pool.query(\n      \"INSERT INTO employees (firstname, lastname, department_id, salary) VALUES ($1, $2, $3, $4) RETURNING id\",\n      [firstname, lastname, departmentId, salary]);\n    return rows[0].id;                                             // RETURNING gives the new id\n  },\n  async payrollByDepartment() {\n    const { rows } = await pool.query(\n      `SELECT d.name, COALESCE(SUM(e.salary), 0)::float AS payroll\n       FROM departments d FULL OUTER JOIN employees e ON e.department_id = d.id\n       GROUP BY d.name ORDER BY payroll DESC`);\n    return rows;\n  },\n};\n"
      }
     },
     {
      "title": "repo/mysql.js",
      "variants": {
       "js": "const mysql = require(\"mysql2/promise\");\nconst pool = mysql.createPool({\n  host: process.env.DB_HOST || \"localhost\",\n  port: Number(process.env.DB_PORT || 3306),\n  user: process.env.DB_USER || \"root\",\n  password: process.env.DB_PASSWORD || \"\",\n  database: process.env.DB_NAME || \"hr_dual\",\n});\n\nmodule.exports = {\n  async listEmployees(search = \"\") {\n    const [rows] = await pool.execute(\n      `SELECT e.id, CONCAT(e.firstname, ' ', e.lastname) AS name, d.name AS department,\n              CAST(e.salary AS DOUBLE) AS salary, e.active = 1 AS active\n       FROM employees e JOIN departments d ON d.id = e.department_id\n       WHERE e.firstname LIKE ? OR e.lastname LIKE ?              -- default collation is already case-insensitive\n       ORDER BY e.id`, [`%${search}%`, `%${search}%`]);           // ? placeholders, one value per ?\n    return rows.map((r) => ({ ...r, active: Boolean(r.active) }));\n  },\n  async createEmployee({ firstname, lastname, departmentId, salary }) {\n    const [result] = await pool.execute(\n      \"INSERT INTO employees (firstname, lastname, department_id, salary) VALUES (?, ?, ?, ?)\",\n      [firstname, lastname, departmentId, salary]);\n    return result.insertId;                                        // no RETURNING in MySQL\n  },\n  async payrollByDepartment() {\n    // no FULL OUTER JOIN in MySQL: LEFT JOIN is enough here (every employee has a department)\n    const [rows] = await pool.query(\n      `SELECT d.name, CAST(COALESCE(SUM(e.salary), 0) AS DOUBLE) AS payroll\n       FROM departments d LEFT JOIN employees e ON e.department_id = d.id\n       GROUP BY d.name ORDER BY payroll DESC`);\n    return rows;\n  },\n};\n"
      }
     }
    ]
   },
   {
    "title": "The API picks the engine from an env var",
    "files": [
     {
      "title": "server.js",
      "variants": {
       "js": "const express = require(\"express\");\n\n// Pick the engine with DB=postgres or DB=mysql. The routes never know which one runs.\nconst engine = process.env.DB || \"postgres\";\nconst repo = require(`./repo/${engine}`);\n\nconst app = express();\napp.use(express.json());\n\napp.get(\"/employees\", async (req, res, next) => {\n  try { res.json(await repo.listEmployees(req.query.q)); } catch (e) { next(e); }\n});\n\napp.post(\"/employees\", async (req, res, next) => {\n  const { firstname, lastname, departmentId, salary } = req.body;\n  if (!firstname || !lastname || !departmentId || !(Number(salary) >= 0)) return res.status(422).json({ error: \"invalid employee\" });\n  try { res.status(201).json({ id: await repo.createEmployee({ firstname, lastname, departmentId, salary }) }); } catch (e) { next(e); }\n});\n\napp.get(\"/reports/payroll\", async (req, res, next) => {\n  try { res.json(await repo.payrollByDepartment()); } catch (e) { next(e); }\n});\n\napp.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: \"Internal server error\" }); });\n\nconst PORT = process.env.PORT || 4000;\napp.listen(PORT, () => console.log(`API (${engine}) on http://localhost:${PORT}`));\n"
      }
     },
     {
      "title": "package.json",
      "variants": {
       "json": "{\n  \"name\": \"dual-engine\",\n  \"version\": \"1.0.0\",\n  \"private\": true,\n  \"scripts\": {\n    \"start:pg\": \"DB=postgres node server.js\",\n    \"start:mysql\": \"DB=mysql node server.js\"\n  },\n  \"dependencies\": {\n    \"express\": \"^5.3.0\",\n    \"mysql2\": \"^3.24.6\",\n    \"pg\": \"^8.23.1\"\n  }\n}\n"
      }
     }
    ]
   },
   {
    "title": "Run the same tests on both",
    "files": [
     {
      "title": "test.sh",
      "variants": {
       "bash": "#!/usr/bin/env bash\n# Same tests against whichever engine is running on $BASE. Usage: BASE=localhost:4000 ./test.sh\nset -euo pipefail\nBASE=${BASE:-localhost:4000}\nH='Content-Type: application/json'\necho \"list:    $(curl -s \"$BASE/employees\")\"\necho \"search:  $(curl -s \"$BASE/employees?q=STARK\")\"\necho \"create:  $(curl -s -X POST \"$BASE/employees\" -H \"$H\" -d '{\"firstname\":\"Ana\",\"lastname\":\"Reyes\",\"departmentId\":2,\"salary\":50000}')\"\necho \"payroll: $(curl -s \"$BASE/reports/payroll\")\"\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "npm run start:pg",
      "purpose": "Terminal 1: Postgres on :4000"
     },
     {
      "cmd": "./test.sh",
      "purpose": "Terminal 2: run the tests"
     },
     {
      "cmd": "DB_PASSWORD=yourpass npm run start:mysql",
      "purpose": "Stop the first, start MySQL"
     },
     {
      "cmd": "./test.sh",
      "purpose": "Same output, character for character"
     }
    ]
   },
   {
    "title": "Keep the cheatsheet",
    "files": [
     {
      "title": "DIFFERENCES.md",
      "variants": {
       "text": "# Postgres vs MySQL: what broke while porting\n\n| # | Problem | Postgres | MySQL | Fix |\n|---|---------|----------|-------|-----|\n| 1 | Auto ID | `GENERATED ALWAYS AS IDENTITY` | `AUTO_INCREMENT` | Separate DDL file per engine |\n| 2 | Placeholders | `$1, $2` (reuse `$1` twice) | `?` (one value per `?`) | Pass the search value twice in MySQL |\n| 3 | New row id | `RETURNING id` | `result.insertId` | Handle in the repo layer |\n| 4 | Concat | `a \\|\\| b` | `CONCAT(a, b)` (`\\|\\|` = OR!) | Use CONCAT in MySQL |\n| 5 | Case-insensitive search | `ILIKE` | `LIKE` (ci collation) | Engine-specific query |\n| 6 | FULL OUTER JOIN | supported | not supported | LEFT JOIN or LEFT + RIGHT + UNION |\n| 7 | DECIMAL comes back as string | `::float` | `CAST(... AS DOUBLE)` | Cast in SQL |\n| 8 | BOOLEAN | real boolean | TINYINT(1) → 1/0 | `Boolean(r.active)` |\n| 9 | Reserved words | `dual` is a normal name | `DUAL` is reserved: `CREATE DATABASE dual` fails | Rename (we use `hr_dual`) or quote with backticks |\n\nAdd a row every time you hit a new difference.\n"
      }
     }
    ]
   }
  ],
  "done": [
   "test.sh output is identical on both engines.",
   "DIFFERENCES.md has every issue you hit, with its fix."
  ]
 }
};
