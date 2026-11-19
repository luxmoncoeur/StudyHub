"use client";
import { useEffect, useRef, useState } from "react";
import type { PGlite } from "@electric-sql/pglite";
import { Btn, inputCls } from "./ui";

// Your BSIT2A db_company dataset, converted from MariaDB to PostgreSQL
const SEED = `
CREATE TABLE tbl_departments (id SERIAL PRIMARY KEY, department_name VARCHAR(100) NOT NULL, status VARCHAR(10) NOT NULL);
CREATE TABLE tbl_positions (id SERIAL PRIMARY KEY, position_name VARCHAR(50) NOT NULL,
  department_id INT NOT NULL REFERENCES tbl_departments(id), status VARCHAR(11) NOT NULL);
CREATE TABLE tbl_employees (id SERIAL PRIMARY KEY, firstname VARCHAR(100) NOT NULL, lastname VARCHAR(100) NOT NULL,
  position_id INT NOT NULL REFERENCES tbl_positions(id), gender CHAR(1) NOT NULL, salary NUMERIC(10,2) NOT NULL,
  date_hired DATE NOT NULL, status VARCHAR(10) NOT NULL);
INSERT INTO tbl_departments (department_name, status) VALUES ('Dev Ops','ACTIVE'),('QA','ACTIVE'),('Managerial','ACTIVE');
INSERT INTO tbl_positions (position_name, department_id, status) VALUES
 ('Junior Developer',1,'ACTIVE'),('Senior Developer',1,'ACTIVE'),('Junior QA',2,'ACTIVE'),('Senior QA',2,'ACTIVE'),('Technical Manager',3,'ACTIVE');
INSERT INTO tbl_employees (firstname, lastname, position_id, gender, salary, date_hired, status) VALUES
 ('Jerwin','Cruz',1,'M',60000,'2018-06-30','ACTIVE'),('Peter','Parker',2,'M',65000,'2011-12-02','ACTIVE'),
 ('Tony','Stark',2,'M',102000,'2002-02-01','ACTIVE'),('Natasha','Romanoff',4,'F',70000,'2015-10-24','ACTIVE'),
 ('Wanda','Maximoff',3,'F',48000,'2016-09-25','ACTIVE'),('Steve','Rogers',1,'M',58000,'2017-07-25','ACTIVE'),
 ('Stephen','Strange',5,'M',52000,'2013-08-25','ACTIVE');`;

const PRESETS: [string, string][] = [
  ["JOIN 3 tables", `SELECT e.firstname, e.lastname, p.position_name, d.department_name
FROM tbl_employees e
JOIN tbl_positions p   ON p.id = e.position_id
JOIN tbl_departments d ON d.id = p.department_id
ORDER BY d.department_name;`],
  ["GROUP BY + HAVING", `SELECT d.department_name, COUNT(*) AS headcount, ROUND(AVG(e.salary), 2) AS avg_salary
FROM tbl_employees e
JOIN tbl_positions p   ON p.id = e.position_id
JOIN tbl_departments d ON d.id = p.department_id
GROUP BY d.department_name
HAVING COUNT(*) >= 2;`],
  ["Subquery", `SELECT firstname, lastname, salary
FROM tbl_employees
WHERE salary > (SELECT AVG(salary) FROM tbl_employees);`],
  ["CTE", `WITH dept_pay AS (
  SELECT p.department_id, SUM(e.salary) AS payroll
  FROM tbl_employees e JOIN tbl_positions p ON p.id = e.position_id
  GROUP BY p.department_id
)
SELECT d.department_name, dp.payroll
FROM dept_pay dp JOIN tbl_departments d ON d.id = dp.department_id
ORDER BY dp.payroll DESC;`],
  ["Window: RANK", `SELECT firstname, position_id, salary,
  RANK() OVER (ORDER BY salary DESC) AS overall_rank,
  salary - AVG(salary) OVER () AS diff_from_avg
FROM tbl_employees;`],
  ["Window: running total", `SELECT firstname, date_hired, salary,
  SUM(salary) OVER (ORDER BY date_hired) AS running_payroll,
  LAG(firstname) OVER (ORDER BY date_hired) AS hired_before
FROM tbl_employees;`],
  ["Transaction", `BEGIN;
UPDATE tbl_employees SET salary = salary * 1.10 WHERE position_id = 1;
SELECT firstname, salary FROM tbl_employees WHERE position_id = 1;
ROLLBACK;`],
  ["View", `CREATE OR REPLACE VIEW v_roster AS
SELECT e.id, e.firstname || ' ' || e.lastname AS name, p.position_name
FROM tbl_employees e JOIN tbl_positions p ON p.id = e.position_id;
SELECT * FROM v_roster;`],
  ["EXPLAIN", `EXPLAIN ANALYZE
SELECT * FROM tbl_employees WHERE lastname = 'Stark';`],
];

type Result = { fields: string[]; rows: Record<string, unknown>[] };

export function SqlDemo() {
  const db = useRef<PGlite | null>(null);
  const [ready, setReady] = useState(false);
  const [sql, setSql] = useState(PRESETS[0][1]);
  const [out, setOut] = useState<Result[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { PGlite } = await import("@electric-sql/pglite");
      const pg = new PGlite();
      await pg.exec(SEED);
      if (alive) { db.current = pg; setReady(true); }
    })().catch((e) => setErr(String(e)));
    return () => { alive = false; };
  }, []);

  const run = async () => {
    if (!db.current) return;
    setErr("");
    try {
      const res = await db.current.exec(sql);
      setOut(res.filter((r) => r.fields.length).map((r) => ({ fields: r.fields.map((f) => f.name), rows: r.rows as Record<string, unknown>[] })));
    } catch (e) { setErr((e as Error).message); setOut([]); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(([k, v]) => (
          <button key={k} onClick={() => setSql(v)} className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-neutral-400 hover:bg-white/5 hover:text-white">{k}</button>
        ))}
      </div>
      <textarea
        value={sql} onChange={(e) => setSql(e.target.value)} spellCheck={false}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
        className={`${inputCls} h-44 w-full resize-y font-mono text-[13px]`}
      />
      <div className="flex items-center gap-3">
        <Btn onClick={run} disabled={!ready}>{ready ? "Run ⌘↵" : "Booting Postgres…"}</Btn>
        <span className="text-xs text-neutral-500">Real PostgreSQL (PGlite) in your browser · tables: tbl_departments, tbl_positions, tbl_employees · reload to reset</span>
      </div>
      {err && <pre className="whitespace-pre-wrap rounded-md bg-rose-500/10 p-3 text-xs text-rose-300">{err}</pre>}
      {out.map((r, i) => (
        <div key={i} className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-xs">
            <thead className="bg-white/[0.03] text-neutral-400"><tr>{r.fields.map((f) => <th key={f} className="px-3 py-2 text-left font-medium">{f}</th>)}</tr></thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {r.rows.map((row, j) => (
                <tr key={j}>{r.fields.map((f) => <td key={f} className="px-3 py-1.5 text-neutral-200">{row[f] instanceof Date ? (row[f] as Date).toISOString().slice(0, 10) : String(row[f] ?? "NULL")}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
