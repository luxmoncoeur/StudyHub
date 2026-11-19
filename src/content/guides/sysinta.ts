import type { Guide } from "../types";

const LB_FILES = { title: "Create the 3 files", body: ["Make a folder `lb-demo` with `server.js`, `nginx.conf` and `compose.yaml`. Copy them exactly from the **Load balancing** lesson code tabs (JavaScript, nginx, YAML)."] };

export const guides: Record<string, Guide> = {
  "Draw the as-is": {
    where: "draw.io (diagrams.net)",
    time: "1 hour",
    steps: [
      { title: "List your school's systems", body: ["Enrollment, cashier, LMS (e.g. Moodle/Canvas), library, registrar/grades, ID system, email. Ask an upperclassman or the IT office."] },
      { title: "Draw the links", body: ["One box per system. Draw an arrow for each data exchange (e.g. enrollment → cashier: assessed fees), and label it with the data **and** the method (manual Excel, shared DB, API, CSV export)."] },
      { title: "Count and calculate", body: ["Point-to-point with n systems can need n(n−1)/2 links. 7 systems → up to 21. Mark each manual or fragile link in red."] },
      { title: "Draw the to-be", body: ["Redesign with a hub: an API gateway or message broker in the middle, with each system connected once. Write 3 bullets on what improves (fewer links, one data format, easier to add new systems)."] },
    ],
    done: ["As-is and to-be diagrams side by side.", "A short gap analysis: what changes and why."],
  },
  "Style match-up": {
    where: "Paper or a doc",
    time: "30 min",
    steps: [
      { title: "Classify these 10", body: [
        "1) Bank sends a daily payroll file over SFTP. 2) POS checks a GCash payment in real time. 3) Enrollment and cashier read the same `students` table. 4) An order triggers kitchen, inventory and SMS services. 5) Nightly export from the old library system to the new one.",
        "6) The mobile app asks the grades API for one student. 7) An IoT sensor stream goes to 3 consumers. 8) HR and payroll share one MySQL DB. 9) The LMS gets a `student.enrolled` event. 10) A government agency's SOAP service for TIN validation.",
      ] },
      { title: "Check", body: ["File transfer: 1, 5 · Shared DB: 3, 8 · RPC/API: 2, 6, 10 · Messaging: 4, 7, 9.", "For each, write one risk (e.g. the shared DB means a schema change breaks both apps)."] },
    ],
    done: ["8 or more correct, with a one-line justification each."],
  },
  "Double-click Pay": {
    where: "Express on your Mac",
    time: "45 min",
    steps: [
      { title: "A naive payment endpoint", code: { title: "pay.js", variants: { js: `const express = require("express");
const app = express();
app.use(express.json());
const charges = [];

app.post("/payments", (req, res) => {
  setTimeout(() => {                                   // pretend the bank is slow
    const charge = { id: charges.length + 1, amount: req.body.amount };
    charges.push(charge);
    console.log("CHARGED", charge);
    res.status(201).json(charge);
  }, 500);
});
app.get("/charges", (req, res) => res.json(charges));
app.listen(4000);` } } },
      { title: "Reproduce the bug", commands: [{ cmd: "for i in 1 2; do curl -s -X POST localhost:4000/payments -H 'Content-Type: application/json' -d '{\"amount\":500}' & done; wait", purpose: "2 simultaneous clicks" }, { cmd: "curl localhost:4000/charges", purpose: "2 charges, customer billed twice" }] },
      { title: "Add the idempotency middleware", body: ["Paste the `idempotency` middleware from the *Webhooks & idempotency* lesson and use it: `app.post('/payments', idempotency, handler)`.", "Note: the lesson version saves the response when it's sent. For truly simultaneous requests, also mark the key as *in progress* first and return 409 for duplicates still running."] },
      { title: "Retest with a key", commands: [{ cmd: "for i in 1 2; do curl -s -X POST localhost:4000/payments -H 'Idempotency-Key: order-123' -H 'Content-Type: application/json' -d '{\"amount\":500}'; echo; done", purpose: "Same key twice, one charge" }] },
    ],
    done: ["Without a key: 2 charges. With a key: 1 charge, and the retry gets the same response.", "You can explain why GET doesn't need this."],
  },
  "Scale & measure": {
    where: "Docker (OrbStack) on your Mac",
    time: "1 hour",
    steps: [
      LB_FILES,
      { title: "1 replica baseline", body: ["In compose.yaml set `replicas: 1`. To make the difference visible, add a little CPU work to server.js: `for (let i = 0; i < 2e6; i++);` before `res.end`."], commands: [{ cmd: "docker compose up -d", purpose: "Start" }, { cmd: "ab -n 2000 -c 50 http://localhost:8088/", purpose: "Load test (ab ships with macOS)" }] },
      { title: "3 replicas", commands: [{ cmd: "docker compose up -d --scale app=3 && docker compose restart lb", purpose: "Scale out; restart nginx so it sees the new IPs" }, { cmd: "ab -n 2000 -c 50 http://localhost:8088/", purpose: "Same test" }] },
      { title: "Chart it", body: ["From ab's output, copy **Requests per second** and the **95%** line for both runs. Make a bar chart in Sheets. That's your horizontal-scaling evidence (a sample CHED outcome: design a stress test)."] },
    ],
    done: ["Two ab runs recorded with req/s and p95.", "You can explain why replicas must be stateless."],
  },
  "Kill a container": {
    where: "Docker (OrbStack)",
    time: "20 min",
    steps: [
      LB_FILES,
      { title: "Start and watch the rotation", commands: [{ cmd: "docker compose up -d", purpose: "3 apps + nginx" }, { cmd: "while true; do curl -s localhost:8088; sleep 0.5; done", purpose: "Keep hitting the LB; watch host rotate" }] },
      { title: "Kill one", commands: [{ cmd: "docker ps --filter name=app", purpose: "List app containers" }, { cmd: "docker stop <one-container-id>", purpose: "Simulate a crash" }], body: ["Watch the curl loop. You may see one failed or slow request, then nginx marks that server down (`max_fails`) and only 2 hosts appear."] },
      { title: "Bring it back", commands: [{ cmd: "docker start <id>", purpose: "Recover" }], body: ["After `fail_timeout` (10 s) nginx tries it again and the third host returns to the rotation."] },
    ],
    done: ["You saw failover and recovery live.", "You can explain passive health checks (max_fails / fail_timeout)."],
  },
  "Campus order & pickup": {
    where: "Docker Compose: Express API + RabbitMQ + Python worker",
    time: "2–3 weekends",
    steps: [
      { title: "Architecture", body: ["`POST /orders` (Express) → saves the order and publishes to the `orders` queue → **kitchen worker** (Python, pika) marks it ready → publishes `order.ready` → **notifier** logs an SMS or calls a webhook."] },
      { title: "Compose skeleton", code: { title: "compose.yaml", variants: { yaml: `services:
  rabbitmq:
    image: rabbitmq:4-management
    ports: ["5672:5672", "15672:15672"]
    healthcheck: { test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"], interval: 5s, retries: 10 }
  api:
    build: ./api
    ports: ["4000:4000"]
    environment: { AMQP_URL: "amqp://guest:guest@rabbitmq:5672" }
    depends_on: { rabbitmq: { condition: service_healthy } }
  kitchen:
    build: ./kitchen
    environment: { AMQP_URL: "amqp://guest:guest@rabbitmq:5672" }
    depends_on: { rabbitmq: { condition: service_healthy } }` } } },
      { title: "Reliability", body: ["**Idempotency-Key** on POST /orders. Consumers **ack after work**. Add a dead-letter queue (`x-dead-letter-exchange`) for orders that fail 3 times."] },
      { title: "Demo script", body: ["Place 10 orders, then `docker compose up -d --scale kitchen=3` and show the work being shared. Kill a worker mid-order and show redelivery. Show the queue depth at localhost:15672."] },
    ],
    done: ["Orders flow through the queue to ready.", "Scaling and failure demos work live.", "There's a C4 diagram and README."],
  },
  "Enrollment ↔ Cashier ↔ LMS": {
    where: "Docker Compose: 3 services in 3 languages + RabbitMQ",
    time: "3–4 weekends",
    steps: [
      { title: "Services", body: ["**Enrollment** (Node/Express): `POST /enroll` publishes `student.enrolled`. **Cashier** (Python/FastAPI): computes fees and publishes `fees.assessed` or `payment.failed`. **LMS** (Java/Spring Boot): creates the account on `fees.assessed`."] },
      { title: "Canonical event format", code: { title: "student.enrolled", variants: { json: `{
  "eventId": "6f1c2a7e-…",
  "type": "student.enrolled",
  "occurredAt": "2026-11-20T08:00:00Z",
  "data": { "studentId": "2024-001", "name": "Juan Cruz", "units": 24, "program": "BSIT" }
}` } }, body: ["Every service dedupes by `eventId` (idempotent receiver)."] },
      { title: "Saga with compensation", body: ["If the cashier publishes `payment.failed`, enrollment listens and **cancels** the enrollment (a compensating action), and the LMS never creates the account. Draw this as a sequence diagram."] },
      { title: "Docs + demo", body: ["An OpenAPI file per service, one `docker compose up`, a happy-path demo plus a payment-failure demo."] },
    ],
    done: ["3 languages talking only through events.", "The failure path rolls back cleanly.", "Sequence diagram + OpenAPI specs."],
  },
  "API gateway + 3 services": {
    where: "Docker Compose: nginx + 3 small APIs + Redis",
    time: "2–3 weekends",
    steps: [
      { title: "Services", body: ["students, courses, grades: tiny APIs (any language) on internal ports, plus Redis."] },
      { title: "Gateway routing + rate limit", code: { title: "nginx.conf", variants: { nginx: `events {}
http {
  limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
  server {
    listen 80;
    location /students/ { limit_req zone=api burst=20 nodelay; limit_req_status 429; proxy_pass http://students:3000/; }
    location /courses/  { limit_req zone=api burst=20 nodelay; limit_req_status 429; proxy_pass http://courses:3000/; }
    location /grades/   { limit_req zone=api burst=20 nodelay; limit_req_status 429; proxy_pass http://grades:3000/; }
  }
}` } } },
      { title: "Auth + cache", body: ["Each service verifies the JWT with **pinned algorithms** (lesson code). The grades service uses Redis cache-aside with a 60 s TTL. Log HIT/MISS."] },
      { title: "Docs", body: ["An `openapi.yaml` per service, served with Swagger UI (`swaggerapi/swagger-ui` image)."] },
      { title: "Prove it", commands: [{ cmd: "ab -n 500 -c 50 http://localhost/students/", purpose: "Some requests get 429 once you're over the limit" }] },
    ],
    done: ["One entry point routes to 3 services.", "Rate limit, JWT check and cache all demonstrable."],
  },
  "Legacy ETL": {
    where: "Python (pandas) + MySQL + PostgreSQL",
    time: "2 weekends",
    steps: [
      { title: "Fake a legacy source", body: ["A MySQL table with messy data: dates as `11/20/2026` and `2026-11-20`, names in mixed case with extra spaces, duplicate students, `units` stored as text."] },
      { title: "Extract → Transform → Load", code: { title: "etl.py", variants: { python: `# pip install pandas sqlalchemy pymysql psycopg[binary]
import pandas as pd
from sqlalchemy import create_engine

src = create_engine("mysql+pymysql://root:pass@localhost/legacy")
dst = create_engine("postgresql+psycopg://localhost/reporting")

df = pd.read_sql("SELECT * FROM students_raw", src)                       # Extract
df["name"] = df["name"].str.strip().str.title()                           # Transform
df["enrolled_on"] = pd.to_datetime(df["enrolled_on"], format="mixed", errors="coerce")
df["units"] = pd.to_numeric(df["units"], errors="coerce").fillna(0).astype(int)
bad = df[df["enrolled_on"].isna()]
df = df.dropna(subset=["enrolled_on"]).drop_duplicates(subset=["student_id"])
df.to_sql("students", dst, if_exists="replace", index=False)              # Load
print(f"loaded {len(df)} rows, rejected {len(bad)}")` } } },
      { title: "Schedule + dashboard", body: ["Cron it nightly (SysAdmin lesson). Point Metabase (`docker run -p 3000:3000 metabase/metabase`) at the reporting DB and build 2 charts."] },
    ],
    done: ["Clean data in Postgres, with rejected rows counted and logged.", "It runs nightly and the dashboard shows it."],
  },
  "Resilience showcase": {
    where: "Node on your Mac (optionally Docker + Grafana)",
    time: "2 weekends",
    steps: [
      { title: "A flaky service B", code: { title: "flaky.js", variants: { js: `const http = require("http");
http.createServer((req, res) => {
  const r = Math.random();
  if (r < 0.3) { res.writeHead(500); return res.end("boom"); }           // 30% errors
  setTimeout(() => res.end("ok"), r < 0.5 ? 3000 : 50);                  // 20% very slow
}).listen(5000);` } } },
      { title: "Service A calls B with protection", body: ["Wrap the call in **timeout** (`AbortSignal.timeout(1000)`) → **retry with jitter** → **circuit breaker** → **fallback** (cached last value). Use the code from the *Retries, backoff & circuit breakers* lesson."] },
      { title: "Show the difference", body: ["Run 200 calls without protection vs with it. Count successes, average latency and how often the breaker opened. Kill B entirely: A should fail fast with the fallback instead of hanging."] },
      { title: "Visualize (stretch)", body: ["Expose a `/metrics` endpoint with prom-client and graph error rate and breaker state in Grafana."] },
    ],
    done: ["A stays responsive while B is failing or down.", "A before/after table of success rate and latency."],
  },
};
