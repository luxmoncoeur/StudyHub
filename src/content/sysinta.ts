import type { Course } from "./types";

export const sysinta: Course = {
  code: "SYSINTA",
  slug: "sysinta",
  title: "System Integration and Architecture",
  units: 3,
  accent: "#fb7185",
  tagline: "Make separate systems work as one: APIs, queues, load balancing, rate limits.",
  ched: "Core BSIT course (CMO 25 s.2015) on integrating different systems and applications. Sample outcomes (Gordon College): decide whether to in-source or out-source IT, design a stress test, and implement an enterprise integration middleware platform. Topics include enterprise architecture, middleware, integration patterns, SOA and web services, plus the modern stack: microservices, brokers and resilience patterns.",
  lessons: [
    {
      slug: "what-is-si",
      title: "What is system integration?",
      why: "Every school and company runs separate systems that have to share data.",
      points: [
        "Linking subsystems (enrollment, cashier, LMS, devices, partners) so they act as one system.",
        "**Point-to-point**: n(n−1)/2 links. 10 systems need 45 links (\"spaghetti\").",
        "**Hub-and-spoke / broker**: n links through a central hub. **ESB**: a shared bus that routes, transforms and mediates protocols.",
        "**API-led / microservices**: smart endpoints, dumb pipes.",
      ],
    },
    {
      slug: "integration-styles",
      title: "The 4 integration styles",
      why: "Exam favorite, and the first decision in any integration design.",
      points: [
        "**File transfer**: A exports a CSV and B imports it nightly. Simple, but the data is stale. Example: a payroll CSV sent to the bank over SFTP.",
        "**Shared database**: both apps share one schema. Consistent, but tightly coupled. Example: enrollment and cashier on one MySQL.",
        "**Remote procedure invocation** (REST, SOAP, gRPC): real-time, but B must be up. Example: a POS calling a payment API.",
        "**Messaging**: A puts a message on a queue and B consumes it later. Decoupled and scalable, but eventually consistent. Example: order → queue → inventory.",
        "EIP pattern names to know: Channel, Pub-Sub, Router, Translator, Splitter, Aggregator, Dead Letter Channel, Idempotent Receiver, Canonical Data Model.",
      ],
    },
    {
      slug: "enterprise-architecture",
      title: "Enterprise architecture & middleware",
      why: "The theory half of the course, and what the exams test.",
      points: [
        "**Zachman**: a 6×6 grid. Columns are What/How/Where/Who/When/Why, and rows are perspectives from Planner to Worker.",
        "**TOGAF ADM**: Preliminary → A Vision → B Business → C Information Systems → D Technology → E Solutions → F Migration → G Governance → H Change. Requirements management sits at the center.",
        "**BDAT** domains: Business, Data, Application, Technology. Exam favorite: **As-Is vs To-Be + gap analysis**.",
        "Middleware types: RPC · ORB (CORBA, RMI) · **MOM** (RabbitMQ, IBM MQ) · TP monitors · DB middleware (ODBC/JDBC) · app servers · ESB/iPaaS.",
        "**EAI** = integrate inside one enterprise. **SOA** = reusable services with contracts (WSDL), usually over an ESB. **Microservices** = small services, each deployed independently with its own DB.",
      ],
    },
    {
      slug: "soap-rest",
      title: "SOAP vs REST, XML vs JSON",
      why: "Government, banking and telco systems still run SOAP. New APIs use REST.",
      points: [
        "SOAP: XML envelope only, a strict WSDL contract, WS-Security. REST: any format (usually JSON), HTTP verbs and status codes, optional OpenAPI.",
        "REST constraints (Fielding): client-server, stateless, cacheable, uniform interface, layered system.",
        "XML: namespaces, XSD validation, XPath. JSON: lighter, native to JS, validated with JSON Schema.",
        "A converter between them is the EIP **Message Translator**.",
      ],
      code: [{
        title: "Same student, both formats",
        variants: {
          text: `<!-- SOAP 1.1 request -->
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:s="http://example.com/student">
  <soapenv:Header/>
  <soapenv:Body><s:GetStudent><s:id>2024-001</s:id></s:GetStudent></soapenv:Body>
</soapenv:Envelope>

<!-- XML data -->
<student id="2024-001"><name>Juan</name><units>21</units></student>`,
          json: `{ "id": "2024-001", "name": "Juan", "units": 21 }`,
        },
      }, {
        title: "XML → JSON translator",
        variants: {
          python: `import json, xml.etree.ElementTree as ET

xml = '<student id="2024-001"><name>Juan</name><units>21</units></student>'
root = ET.fromstring(xml)
data = {"id": root.get("id"), "name": root.findtext("name"), "units": int(root.findtext("units"))}
print(json.dumps(data))`,
          java: `// Jackson: com.fasterxml.jackson.dataformat:jackson-dataformat-xml
XmlMapper xml = new XmlMapper();
JsonNode node = xml.readTree("<student id=\\"2024-001\\"><name>Juan</name><units>21</units></student>");
String json = new ObjectMapper().writeValueAsString(node);`,
          js: `// npm i fast-xml-parser
import { XMLParser } from "fast-xml-parser";
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
const { student } = parser.parse('<student id="2024-001"><name>Juan</name><units>21</units></student>');
console.log(JSON.stringify(student));   // {"name":"Juan","units":21,"id":"2024-001"}`,
        },
      }],
    },
    {
      slug: "monolith-microservices",
      title: "Monolith vs microservices + API gateway",
      why: "The architecture question you'll be asked in interviews and capstone defenses.",
      beyond: true,
      points: [
        "Monolith: deployed as one unit with one DB. Failure is all-or-nothing. Best for small teams and early products.",
        "Microservices: each service is deployed on its own with its own DB. Failure is partial, so you need resilience patterns. Best for many teams.",
        "**Monolith first** (Fowler): split only once you understand the boundaries. For a capstone, a modular monolith is usually right.",
        "**API gateway**: a single entry point that handles routing, auth, rate limiting, TLS and logging (nginx, Kong, Envoy). BFF = one gateway per frontend.",
      ],
    },
    {
      slug: "load-balancing",
      title: "Load balancing",
      why: "How one site serves thousands of users: many copies behind one address.",
      beyond: true,
      points: [
        "**Round robin** (the nginx default, supports `weight=`) · **least_conn** (best when requests vary in length) · **ip_hash** (sticky sessions).",
        "Passive health checks: `max_fails=3 fail_timeout=10s` stops sending traffic to a dead server.",
        "L4 (TCP) vs L7 (HTTP-aware: route by path or header).",
        "**Horizontal scaling** (more nodes) needs stateless apps, so keep sessions in Redis or a JWT. **Vertical** (a bigger machine) has a ceiling.",
      ],
      demo: "loadbalancer",
      code: [{
        title: "nginx over 3 Node replicas (Docker)",
        variants: {
          js: `// server.js: each replica reports its hostname
const http = require("http");
const os = require("os");
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ host: os.hostname(), path: req.url }) + "\\n");
}).listen(3000);`,
          nginx: `events {}
http {
  upstream app {
    # default = round robin; try: least_conn;  or  ip_hash;
    server app:3000 max_fails=3 fail_timeout=10s;
  }
  server {
    listen 80;
    location / {
      proxy_pass http://app;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
  }
}`,
          yaml: `# compose.yaml
services:
  app:
    image: node:22-alpine
    working_dir: /app
    volumes: ["./server.js:/app/server.js:ro"]
    command: node server.js
    deploy:
      replicas: 3
  lb:
    image: nginx:1.27-alpine
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf:ro"]
    ports: ["8088:80"]
    depends_on: [app]`,
          bash: `docker compose up -d
for i in {1..6}; do curl -s localhost:8088; done   # host rotates A,B,C,A,B,C
docker compose down`,
        },
        note: "Tested with Docker on a Mac. If port 8088 is taken, change the host port.",
      }],
    },
    {
      slug: "rate-limiting",
      title: "Rate limiting",
      why: "Protects your API from abuse, brute force and runaway clients (HTTP 429).",
      beyond: true,
      points: [
        "**Token bucket**: tokens refill at rate r up to capacity b, and each request costs 1. Allows bursts up to b. The most common algorithm.",
        "**Leaky bucket**: drains at a fixed rate and drops overflow (nginx `limit_req`). **Fixed window**: a simple counter, but up to 2× the limit at window edges.",
        "**Sliding log**: exact, but stores every timestamp. **Sliding window counter**: `prev × overlap + current` (Cloudflare: 0.003% error).",
        "With several replicas, the counter must be shared (Redis `INCR` + `EXPIRE`), or each replica allows the full limit.",
        "Send `Retry-After` with the 429.",
      ],
      demo: "ratelimit",
      code: [{
        title: "Token bucket",
        variants: {
          js: `class TokenBucket {
  constructor(capacity, refillPerSec) {
    this.capacity = capacity;
    this.rate = refillPerSec;
    this.tokens = capacity;
    this.last = performance.now();
  }
  allow() {
    const now = performance.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.last) / 1000) * this.rate);
    this.last = now;
    if (this.tokens >= 1) { this.tokens -= 1; return true; }
    return false;
  }
}

// Express middleware, one bucket per IP (in-memory)
const buckets = new Map();
app.use((req, res, next) => {
  const b = buckets.get(req.ip) ?? buckets.set(req.ip, new TokenBucket(10, 1)).get(req.ip);
  if (b.allow()) return next();
  res.set("Retry-After", "1").status(429).json({ error: "Too Many Requests" });
});`,
          python: `import time

class TokenBucket:
    def __init__(self, capacity, refill_per_sec):
        self.capacity, self.rate = capacity, refill_per_sec
        self.tokens, self.last = capacity, time.monotonic()

    def allow(self):
        now = time.monotonic()
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False`,
          java: `public class TokenBucket {
    private final long capacity;
    private final double refillPerNano;
    private double tokens;
    private long last = System.nanoTime();

    public TokenBucket(long capacity, double refillPerSec) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.refillPerNano = refillPerSec / 1e9;
    }

    public synchronized boolean tryAcquire() {
        long now = System.nanoTime();
        tokens = Math.min(capacity, tokens + (now - last) * refillPerNano);
        last = now;
        if (tokens >= 1) { tokens -= 1; return true; }
        return false;
    }
}`,
          nginx: `# 10 req/s per IP, bursts of 20 allowed, excess gets 429
limit_req_zone $binary_remote_addr zone=perip:10m rate=10r/s;
server {
  location /api/ {
    limit_req zone=perip burst=20 nodelay;
    limit_req_status 429;
    proxy_pass http://app;
  }
}`,
        },
      }, {
        title: "Sliding window counter (Cloudflare-style)",
        variants: {
          python: `import time

class SlidingWindowCounter:
    def __init__(self, limit, window_sec):
        self.limit, self.window = limit, window_sec
        self.cur_win, self.cur, self.prev = None, 0, 0

    def allow(self):
        now = time.time()
        w = int(now // self.window)
        if w != self.cur_win:
            self.prev = self.cur if self.cur_win == w - 1 else 0
            self.cur_win, self.cur = w, 0
        elapsed = (now % self.window) / self.window
        if self.prev * (1 - elapsed) + self.cur < self.limit:
            self.cur += 1
            return True
        return False`,
        },
      }],
    },
    {
      slug: "messaging",
      title: "Message queues & event-driven",
      why: "Slow or unreliable work goes on a queue so the user doesn't wait.",
      beyond: true,
      points: [
        "**RabbitMQ**: queues + exchanges, messages kept until acked. Use it for task queues. The best first broker for you.",
        "**Kafka**: a replayable, partitioned log. Use it for event streaming and analytics. **Redis Pub/Sub**: fire-and-forget, so offline subscribers miss messages.",
        "Ack **after** processing. `prefetch(1)` = fair dispatch. Durable queue + persistent messages survive a restart.",
        "**Outbox pattern**: write the DB row and the event in one transaction. **Saga**: local steps plus compensating actions instead of distributed transactions.",
        "Orchestration (a central conductor) vs choreography (services react to events).",
      ],
      code: [{
        title: "RabbitMQ work queue",
        variants: {
          js: `// producer.js: npm i amqplib
const amqp = require("amqplib");
(async () => {
  const conn = await amqp.connect(process.env.AMQP_URL);
  const ch = await conn.createChannel();
  await ch.assertQueue("orders", { durable: true });
  for (let i = 1; i <= 5; i++) {
    ch.sendToQueue("orders", Buffer.from(JSON.stringify({ orderId: i })), { persistent: true });
  }
  await ch.close(); await conn.close();
})();

// consumer.js
(async () => {
  const conn = await amqp.connect(process.env.AMQP_URL);
  const ch = await conn.createChannel();
  await ch.assertQueue("orders", { durable: true });
  ch.prefetch(1);
  ch.consume("orders", (m) => {
    console.log("got", m.content.toString());
    ch.ack(m);                      // only after the work succeeds
  });
})();`,
          python: `# pip install pika
import pika, json
conn = pika.BlockingConnection(pika.ConnectionParameters("localhost"))
ch = conn.channel()
ch.queue_declare(queue="orders", durable=True)
ch.basic_publish(exchange="", routing_key="orders", body=json.dumps({"orderId": 1}),
                 properties=pika.BasicProperties(delivery_mode=pika.DeliveryMode.Persistent))

def on_msg(ch, method, props, body):
    print("got", body)
    ch.basic_ack(delivery_tag=method.delivery_tag)

ch.basic_qos(prefetch_count=1)
ch.basic_consume(queue="orders", on_message_callback=on_msg)
ch.start_consuming()`,
          yaml: `services:
  rabbitmq:
    image: rabbitmq:4-management
    ports: ["5672:5672", "15672:15672"]   # UI: localhost:15672 guest/guest
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 5s
      retries: 10`,
        },
      }],
      commands: [
        { cmd: "docker compose up -d --scale consumer=3", purpose: "3 competing consumers share the queue" },
        { cmd: "docker compose exec rabbitmq rabbitmqctl list_queues name messages consumers", purpose: "Inspect queue depth" },
      ],
    },
    {
      slug: "webhooks-idempotency",
      title: "Webhooks & idempotency",
      why: "Payments (GCash, Stripe) send webhooks and retry them. Never charge twice.",
      beyond: true,
      points: [
        "A webhook is a server-to-server POST sent when an event happens. Verify the **HMAC signature** over the raw bytes, reply 2xx fast, and **dedupe by event ID**.",
        "Use `hmac.compare_digest` (constant time) to block timing attacks.",
        "**Idempotency-Key** header (Stripe): the same key returns the saved response instead of running the action again. This fixes the double-click \"Pay\" bug.",
        "GET, PUT and DELETE are already idempotent. POST needs a key.",
      ],
      code: [{
        title: "Webhook receiver: HMAC + dedupe",
        variants: {
          python: `import hmac, hashlib, json, os
from http.server import BaseHTTPRequestHandler, HTTPServer

SECRET = os.environ.get("WEBHOOK_SECRET", "dev-secret").encode()
seen_ids = set()   # shortcut: in-memory; use Redis/DB for real

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        expected = hmac.new(SECRET, body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, self.headers.get("X-Signature", "")):
            self.send_response(401); self.end_headers(); return
        event = json.loads(body)
        if event["id"] in seen_ids:          # duplicate: ack, don't reprocess
            self.send_response(200); self.end_headers(); return
        seen_ids.add(event["id"])
        print("processing", event, flush=True)
        self.send_response(200); self.end_headers()

HTTPServer(("0.0.0.0", 9000), Handler).serve_forever()`,
          bash: `BODY='{"id":"evt_1","type":"payment.succeeded"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac dev-secret | awk '{print $NF}')
curl -i -X POST localhost:9000 -H "X-Signature: $SIG" -d "$BODY"   # 200
curl -i -X POST localhost:9000 -H "X-Signature: $SIG" -d "$BODY"   # 200, not reprocessed
curl -i -X POST localhost:9000 -H "X-Signature: bad"  -d "$BODY"   # 401`,
        },
      }, {
        title: "Idempotency middleware",
        variants: {
          js: `// shortcut: Map store; production uses Redis SET key val NX EX 86400
const store = new Map();
function idempotency(req, res, next) {
  const key = req.get("Idempotency-Key");
  if (!key) return next();
  const hit = store.get(key);
  if (hit) return res.status(hit.status).json(hit.body);   // replay
  const json = res.json.bind(res);
  res.json = (body) => { store.set(key, { status: res.statusCode, body }); return json(body); };
  next();
}
app.post("/payments", idempotency, createPayment);`,
        },
      }],
    },
    {
      slug: "resilience",
      title: "Retries, backoff & circuit breakers",
      why: "In distributed systems something is always failing. Fail gracefully.",
      beyond: true,
      points: [
        "Retry only transient failures: network errors, 429, 502/503/504. Respect `Retry-After`.",
        "**Exponential backoff + full jitter**: `sleep = random(0, min(cap, base × 2^attempt))`. Without the randomness, every client retries at the same moment.",
        "**Circuit breaker**: CLOSED → too many failures → OPEN (fail fast) → after a timeout, HALF_OPEN → one trial call decides.",
        "Python: `tenacity`. Java: Resilience4j.",
      ],
      code: [{
        title: "Retry with jitter + circuit breaker",
        variants: {
          js: `async function withRetry(fn, { retries = 5, baseMs = 100, capMs = 5000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try { return await fn(); }
    catch (err) {
      if (attempt >= retries || err.retryable === false) throw err;
      const delay = Math.random() * Math.min(capMs, baseMs * 2 ** attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

class CircuitBreaker {
  constructor(fn, { failureThreshold = 3, resetMs = 5000 } = {}) {
    Object.assign(this, { fn, failureThreshold, resetMs, failures: 0, state: "CLOSED", openedAt: 0 });
  }
  async call(...args) {
    if (this.state === "OPEN") {
      if (Date.now() - this.openedAt < this.resetMs) throw new Error("circuit open");
      this.state = "HALF_OPEN";
    }
    try {
      const out = await this.fn(...args);
      this.failures = 0; this.state = "CLOSED";
      return out;
    } catch (e) {
      if (this.state === "HALF_OPEN" || ++this.failures >= this.failureThreshold) {
        this.state = "OPEN"; this.openedAt = Date.now();
      }
      throw e;
    }
  }
}`,
          python: `# pip install tenacity
from tenacity import retry, wait_random_exponential, stop_after_attempt

@retry(wait=wait_random_exponential(multiplier=0.1, max=5), stop=stop_after_attempt(5))
def call_payment_api():
    ...`,
          java: `// Resilience4j
CircuitBreaker cb = CircuitBreaker.ofDefaults("payments");
Retry retry = Retry.ofDefaults("payments");
Supplier<String> call = Decorators.ofSupplier(paymentClient::charge)
    .withCircuitBreaker(cb).withRetry(retry).decorate();`,
        },
      }],
    },
    {
      slug: "caching-cap",
      title: "Caching, CAP & scaling",
      why: "Caching is the cheapest speed boost. CAP explains the trade-offs.",
      beyond: true,
      points: [
        "**Cache-aside**: read the cache. On a miss, read the DB and set the cache with a TTL. On a write, update the DB, then **delete** the key.",
        "Problems: stale data, stampede (fix with a lock or jittered TTL), penetration (cache \"not found\" results too).",
        "**CAP**: during a network partition, choose Consistency or Availability. A single-node DB isn't partitioned, so CAP doesn't apply there.",
        "**12-factor**: stateless processes, so you can add replicas freely.",
      ],
      code: [{
        title: "Cache-aside with Redis",
        variants: {
          python: `import json, redis
r = redis.Redis(decode_responses=True)

def get_student(sid, db):
    key = f"student:{sid}"
    if (hit := r.get(key)) is not None:
        return json.loads(hit)
    row = db.fetch_student(sid)
    r.set(key, json.dumps(row), ex=300)     # 5-min TTL
    return row

def update_student(sid, data, db):
    db.update_student(sid, data)
    r.delete(f"student:{sid}")              # invalidate, don't update`,
          js: `// npm i redis
import { createClient } from "redis";
const r = await createClient().connect();

async function getStudent(id) {
  const key = "student:" + id;
  const hit = await r.get(key);
  if (hit) return JSON.parse(hit);
  const row = await db.fetchStudent(id);
  await r.set(key, JSON.stringify(row), { EX: 300 });
  return row;
}`,
        },
      }],
      commands: [
        { cmd: "docker run -d -p 6379:6379 redis:7-alpine", purpose: "Run Redis locally" },
        { cmd: "redis-cli PING", purpose: "Health check (expect PONG)" },
        { cmd: "redis-cli SET k v EX 60 · TTL k", purpose: "Set a value with a TTL, check the seconds left" },
        { cmd: "redis-cli SCAN 0 MATCH student:*", purpose: "Iterate keys safely (KEYS * blocks the server)" },
        { cmd: "redis-cli MONITOR", purpose: "Watch every command live" },
      ],
    },
    {
      slug: "docker",
      title: "Docker & Compose",
      why: "How you run a multi-service system on your laptop with one command.",
      beyond: true,
      points: [
        "Compose v2 is `docker compose` (with a space). The file is `compose.yaml`, and the old `version:` key is ignored.",
        "Services reach each other by **service name** (Docker's built-in DNS), e.g. `amqp://rabbitmq:5672`.",
        "Use `depends_on: condition: service_healthy` for slow starters like RabbitMQ and Postgres.",
        "On a Mac: OrbStack or Docker Desktop.",
      ],
      commands: [
        { cmd: "docker compose up -d", purpose: "Start all services in the background" },
        { cmd: "docker compose ps", purpose: "Status of each service" },
        { cmd: "docker compose logs -f app", purpose: "Follow one service's logs" },
        { cmd: "docker compose up -d --scale app=5", purpose: "Change the replica count" },
        { cmd: "docker compose exec app sh", purpose: "Shell inside a container" },
        { cmd: "docker compose down -v", purpose: "Stop everything and delete volumes" },
        { cmd: "docker network inspect <net>", purpose: "See the service DNS network" },
      ],
    },
    {
      slug: "api-docs-auth",
      title: "OpenAPI, service auth & observability",
      why: "Integration means other teams use your API. Document it, secure it, watch it.",
      beyond: true,
      points: [
        "**OpenAPI** = a machine-readable REST contract. FastAPI generates `/docs` automatically. Java: springdoc. Node: swagger-ui-express.",
        "Service-to-service auth: **API key** (identifies the app) · **OAuth2 client credentials** (machine-to-machine token) · **JWT** (pin `algorithms`) · **mTLS**.",
        "Observability: **logs** (structured JSON + trace ID) · **metrics** (Rate, Errors, Duration) · **traces** (OpenTelemetry, Jaeger).",
      ],
      code: [{
        title: "OpenAPI spec",
        variants: {
          yaml: `openapi: 3.1.0
info: { title: Student API, version: 1.0.0 }
paths:
  /students/{id}:
    get:
      parameters: [{ name: id, in: path, required: true, schema: { type: string } }]
      responses:
        "200": { description: OK, content: { application/json: { schema: { $ref: "#/components/schemas/Student" } } } }
        "404": { description: Not found }
components:
  schemas:
    Student:
      type: object
      required: [id, name]
      properties: { id: { type: string }, name: { type: string }, units: { type: integer } }`,
        },
      }, {
        title: "Client credentials + JWT verify",
        variants: {
          bash: `curl -s -X POST https://auth.example.com/oauth/token \\
  -d grant_type=client_credentials -d client_id=$ID -d client_secret=$SECRET -d scope=orders:read
# then: curl -H "Authorization: Bearer $TOKEN" https://api.example.com/orders`,
          js: `// npm i jsonwebtoken
const jwt = require("jsonwebtoken");
const claims = jwt.verify(token, PUBLIC_KEY, {
  algorithms: ["RS256"],          // pin it: blocks alg:none / confusion attacks
  audience: "orders-api",
  issuer: "https://auth.example.com",
});`,
        },
      }],
    },
    {
      slug: "testing-bcp",
      title: "Stress testing, sourcing & BCP",
      why: "Two of the sample CHED outcomes: the stress test and the in-source vs out-source decision.",
      points: [
        "Load test with `ab`, k6 or JMeter. Compare 1 vs 3 replicas: requests per second and p95 latency are your evidence for horizontal scaling.",
        "In-source vs out-source: weigh cost, core competency, control, security and the SLA.",
        "**RTO** = the maximum downtime you can accept. **RPO** = the maximum data loss window. Hot / warm / cold sites.",
      ],
      commands: [
        { cmd: "ab -n 1000 -c 50 http://localhost:8088/", purpose: "1000 requests, 50 at a time: throughput + latency (ships with macOS)" },
        { cmd: "brew install k6 && k6 run script.js", purpose: "Scriptable load test in JS", os: "mac" },
      ],
      code: [{
        title: "k6 load test",
        variants: {
          js: `// script.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = { vus: 50, duration: "30s" };

export default function () {
  const res = http.get("http://localhost:8088/");
  check(res, { "status 200": (r) => r.status === 200 });
  sleep(0.1);
}`,
        },
      }],
    },
  ],
  activities: [
    { title: "Draw the as-is", steps: ["Map your school's systems (enrollment, cashier, LMS, library) and the links between them.", "Count the point-to-point links.", "Redesign it as hub/bus and compare."] },
    { title: "Style match-up", steps: ["Write 10 integration scenarios.", "Pick File / Shared DB / RPC / Messaging for each and justify it in one line."] },
    { title: "Double-click Pay", steps: ["Make a POST /payments that 'charges' and logs.", "Double-click: 2 charges.", "Add the Idempotency-Key middleware: 1 charge."] },
    { title: "Scale & measure", steps: ["Run the nginx LB demo.", "ab -n 1000 -c 50 with 1 replica, then 3.", "Chart requests/sec and p95."] },
    { title: "Kill a container", steps: ["Run the LB demo, then docker stop one app container.", "Keep curling and watch nginx route around it."] },
  ],
  projects: [
    { title: "Campus order & pickup", level: "Core", scope: "Canteen order API → RabbitMQ → kitchen worker → webhook/SMS notifier. Idempotency keys and a dead-letter queue.", stack: ["Express", "RabbitMQ", "Python worker", "Compose"] },
    { title: "Enrollment ↔ Cashier ↔ LMS", level: "Stretch", scope: "Enrollment emits student.enrolled, the cashier assesses fees, and the LMS creates the account. Saga with compensation if payment fails. Polyglot services.", stack: ["Node", "FastAPI", "Spring Boot", "RabbitMQ"] },
    { title: "API gateway + 3 services", level: "Stretch", scope: "nginx gateway with JWT checks and rate limiting, Redis cache, OpenAPI docs per service, one-command compose.", stack: ["nginx", "Redis", "Swagger UI"] },
    { title: "Legacy ETL", level: "Core", scope: "Nightly CSV from a 'legacy' MySQL → Python ETL (clean dates, dedupe) → Postgres reporting DB → dashboard.", stack: ["Python", "pandas", "PostgreSQL", "cron"] },
    { title: "Resilience showcase", level: "Stretch", scope: "Service A calls a flaky service B. Add a timeout, retry with jitter, a circuit breaker and a fallback, then visualize in Grafana.", stack: ["Node", "Prometheus", "Grafana"] },
  ],
};
