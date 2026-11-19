import type { LessonCase, Project } from "../types";

export const cases: Record<string, LessonCase[]> = {
  "what-is-si": [{
    title: "The registrar types grades twice",
    scenario: "Teachers enter grades in the LMS; the registrar re-types them into the student information system every semester.",
    steps: ["Two systems, the same data, a manual bridge: the classic integration problem.", "Option: the LMS exports a CSV nightly and the SIS imports it (file transfer).", "Better: the LMS calls the SIS grades API when grades are finalized (RPC).", "Either way: one source of truth (the LMS) and no re-typing."],
    takeaway: "Integration removes manual copying between systems.",
  }],
  "integration-styles": [{
    title: "Choosing a style for the canteen",
    scenario: "The canteen POS must update inventory, notify the kitchen, and send daily totals to accounting.",
    steps: ["Inventory decrement must be immediate and consistent → same transaction or a direct API call.", "Kitchen notification can be async → **messaging** (queue).", "Daily totals to accounting → **file transfer** (a nightly CSV) is fine.", "One system often uses several styles."],
    takeaway: "Pick the style per data flow based on how fresh and how reliable it must be.",
  }],
  "enterprise-architecture": [{
    title: "As-Is / To-Be for the library",
    scenario: "The library uses an Excel borrower list and paper cards. The VP asks for an EA proposal.",
    steps: ["**As-Is:** Excel + paper, no link to the student DB, overdue fines tracked manually.", "**To-Be:** library system reading students from the SIS API, QR-based borrowing, fines posted to the cashier.", "**Gap analysis:** needs the SIS API access, QR scanners, staff training.", "Use BDAT: Business process, Data, Application, Technology changes."],
    takeaway: "EA = where we are, where we want to be, and the gaps in between.",
  }],
  "soap-rest": [{
    title: "The government API is SOAP",
    scenario: "Your capstone must validate a TIN with an agency web service that only offers a WSDL (SOAP).",
    steps: ["Read the WSDL to find the operation and its input/output XML.", "Use a SOAP client (Python `zeep`, Java JAX-WS) instead of hand-writing XML.", "Wrap it in your own REST endpoint `GET /tin/:id/valid` (an **adapter**).", "The rest of your app stays JSON/REST."],
    takeaway: "Wrap legacy SOAP behind a small REST adapter.",
  }],
  "monolith-microservices": [{
    title: "Should our capstone use microservices?",
    scenario: "A team of 4 with 16 weeks wants 6 microservices with Kubernetes \"because it's modern\".",
    steps: ["Microservices cost a lot: networking, deployments, distributed data, more debugging.", "4 people, 1 product, a short deadline → a **modular monolith** (folders per module, one deploy).", "Keep clean module boundaries so splitting later is possible.", "Justify it in Chapter 3 with \"Monolith First\" (Fowler)."],
    takeaway: "Microservices solve organizational scale. Small teams start with a monolith.",
  }],
  "load-balancing": [{
    title: "Enrollment day crash",
    scenario: "On enrollment day the single app server hits 100% CPU and students get timeouts.",
    steps: ["Run 3 app replicas behind nginx (`upstream` with 3 servers).", "Use `least_conn` because enrollment requests vary in length.", "The app must be **stateless**: move sessions to Redis or the DB.", "Load test with `ab -n 2000 -c 100` before enrollment day."],
    takeaway: "Scale out behind a load balancer, but only stateless apps scale that way.",
  }],
  "rate-limiting": [{
    title: "Brute-force on the student portal login",
    scenario: "Logs show 5,000 login attempts per minute from a few IPs trying common passwords.",
    steps: ["nginx `limit_req` on `/login`: e.g. 5 r/min per IP with a small burst.", "Also per account: lock after 10 failures for 15 minutes (stops distributed attacks).", "Return **429** with `Retry-After`.", "With several app replicas, keep counters in Redis so the limit is shared."],
    takeaway: "Rate-limit logins per IP and per account, using a shared store.",
  }],
  messaging: [{
    title: "The SMS gateway is slow",
    scenario: "Checkout takes 6 seconds because the app waits for the SMS API to send the receipt.",
    steps: ["Checkout only needs to *request* the SMS, not wait for it.", "Publish `receipt.requested` to a queue and return immediately.", "A worker sends the SMS and retries if the gateway fails.", "Checkout drops to about 200 ms, and SMS outages no longer break sales."],
    takeaway: "Slow or unreliable side tasks go on a queue.",
  }],
  "webhooks-idempotency": [{
    title: "Customer charged twice",
    scenario: "The payment provider retried a webhook after a timeout. The shop marked the order paid twice and shipped twice.",
    steps: ["Providers retry webhooks, so duplicates are **normal**.", "Store each event ID and skip ones already processed (idempotent receiver).", "Verify the HMAC signature on the raw body before trusting it.", "Reply 2xx fast; do heavy work in a queue."],
    takeaway: "Webhook handlers must be idempotent and signature-verified.",
  }],
  resilience: [{
    title: "One slow service took down everything",
    scenario: "The grades service hung. Every portal page waited on it, threads piled up, and the whole portal went down.",
    steps: ["Add a **timeout** (e.g. 1 s) to every outbound call.", "Add a **circuit breaker**: after 5 failures, stop calling for 30 s and fail fast.", "Show a **fallback**: \"Grades temporarily unavailable\" while the rest of the page works.", "Retry only idempotent calls, with jittered backoff."],
    takeaway: "Contain failures: timeouts, breakers, fallbacks.",
  }],
  "caching-cap": [{
    title: "Announcements page hits the DB 10,000 times a minute",
    scenario: "Announcements change twice a day but are read constantly during enrollment.",
    steps: ["Cache-aside in Redis with a 5-minute TTL.", "On a new announcement, **delete** the cache key so the next read refills it.", "Stampede risk at expiry: add a small random jitter to the TTL.", "DB load drops by about 99%."],
    takeaway: "Cache read-heavy, rarely-changing data, and invalidate on write.",
  }],
  docker: [{
    title: "\"It works on my machine\"",
    scenario: "The capstone runs on one member's laptop but fails on the others: different Node, Postgres and Redis versions.",
    steps: ["Write a `compose.yaml` with app, postgres:17 and redis:7, with pinned versions.", "Put secrets in `.env` (gitignored) and commit a `.env.example`.", "Everyone runs `docker compose up -d` and gets an identical setup.", "The panel demo uses the same file."],
    takeaway: "Compose pins the whole environment so everyone runs the same thing.",
  }],
  "api-docs-auth": [{
    title: "The mobile team keeps guessing field names",
    scenario: "The web team changes `studentNo` to `studentId` and the mobile app breaks on release day.",
    steps: ["Write an `openapi.yaml` contract and review changes like code.", "Serve Swagger UI so the mobile team can try endpoints.", "Version breaking changes (`/v2/students`) instead of silently renaming.", "Service-to-service calls use client-credentials tokens, not shared user passwords."],
    takeaway: "An API contract (OpenAPI) prevents integration surprises.",
  }],
  "testing-bcp": [{
    title: "Set RTO and RPO for two systems",
    scenario: "The school asks: how long can enrollment be down, and how much data can it lose? Same question for the library.",
    steps: ["Enrollment (peak season): RTO 1 hour, RPO 15 minutes → frequent backups or a replica, plus an on-call person.", "Library catalog: RTO 1 day, RPO 24 hours → a nightly backup is enough.", "Cost rises as RTO/RPO shrink, so match them to business impact.", "Write the restore steps down and test them each term."],
    takeaway: "RTO = max downtime, RPO = max data loss. Decide per system.",
  }],
};

export const caseProject: Project = {
  title: "Case: Canteen payment webhook integration",
  level: "Core",
  scope: "From scratch: integrate a canteen order service with a mock e-wallet provider that sends signed, sometimes-duplicated webhooks. Verified with test cases.",
  stack: ["Node/Express", "HMAC", "Docker Compose (optional)"],
  guide: {
    where: "Node.js on your Mac (2 small services)",
    time: "1 weekend",
    brief: {
      client: "Campus Canteen Cooperative",
      problem: "Students pay with an e-wallet QR. Orders must be marked PAID only when the wallet confirms, but confirmations sometimes arrive twice, late, or forged by pranksters.",
      requirements: [
        "**Order service** (:4000): `POST /orders` creates an order (UNPAID) and returns a payment reference.",
        "**Mock wallet** (:4100): `POST /pay` simulates a payment, then sends a webhook to `POST /webhooks/wallet` on the order service, signed with HMAC-SHA256 (header `X-Signature`).",
        "The webhook marks the order PAID only if the signature is valid and the amount matches.",
        "Duplicate webhooks (same `eventId`) are acknowledged but not processed again.",
        "The mock wallet retries up to 3 times if the order service doesn't answer 2xx.",
      ],
    },
    tests: [
      { id: "TC-01", scenario: "Happy path", steps: "Create an order, pay through the mock wallet", expected: "Order becomes **PAID**" },
      { id: "TC-02", scenario: "Duplicate webhook", steps: "Replay the same webhook (same eventId)", expected: "**200**, order still PAID, processed once (check logs)" },
      { id: "TC-03", scenario: "Forged webhook", steps: "Send a webhook with `X-Signature: fake`", expected: "**401**, order unchanged" },
      { id: "TC-04", scenario: "Amount mismatch", steps: "Valid signature, but amount ₱1 instead of ₱85", expected: "**422**, order stays UNPAID, logged as suspicious" },
      { id: "TC-05", scenario: "Unknown order", steps: "Valid webhook for a non-existent order", expected: "**404**" },
      { id: "TC-06", scenario: "Order service down", steps: "Stop the order service, pay, start it within 10 s", expected: "The wallet's retry eventually succeeds → PAID" },
      { id: "TC-07", scenario: "Double payment attempt", steps: "Pay the same order twice", expected: "The second payment is rejected by the order service (already PAID): **409**" },
    ],
    steps: [
      { title: "Understand the brief", body: ["Draw the sequence: Student → Order service (create) → Wallet (pay) → webhook → Order service (mark PAID). Mark where duplicates and forgeries can enter."] },
      { title: "Scaffold both services", commands: [{ cmd: "mkdir -p ~/Developments/canteen-pay/{orders,wallet} && cd ~/Developments/canteen-pay", purpose: "Two services" }, { cmd: "cd orders && npm init -y && npm i express && cd ../wallet && npm init -y && npm i express", purpose: "Express in each" }] },
      { title: "Shared signing rule", body: ["Both sides compute `HMAC-SHA256(secret, rawBody)` as hex. Verify on the **raw bytes**: use `express.raw({ type: 'application/json' })` on the webhook route, then `JSON.parse` after verifying."],
        code: { title: "orders/verify.js (starter)", variants: { js: `const crypto = require("crypto");
const SECRET = process.env.WEBHOOK_SECRET || "dev-secret";

function sign(rawBody) {
  return crypto.createHmac("sha256", SECRET).update(rawBody).digest("hex");
}

// constant-time compare: prevents timing attacks
function isValid(rawBody, signature) {
  const expected = Buffer.from(sign(rawBody));
  const given = Buffer.from(String(signature || ""));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

module.exports = { sign, isValid };` } } },
      { title: "First slice: orders + happy path (TC-01)", body: ["Orders in a `Map` for now: `{ id, item, amount, status }`. The wallet's `/pay` takes `{ orderId, amount }`, builds `{ eventId, orderId, amount, type: 'payment.succeeded' }`, signs it, and POSTs it to the webhook URL."] },
      { title: "Hardening (TC-02 to TC-05, TC-07)", body: ["Order of checks in the webhook: signature (401) → order exists (404) → amount matches (422) → eventId already seen (200, skip) → status already PAID (409 for new payments) → mark PAID."] },
      { title: "Retries (TC-06)", body: ["Reuse `withRetry` from the **Resilience showcase** project in the wallet: 3 attempts with jittered backoff."] },
      { title: "Run the test cases", body: ["Write `tests.sh` with curl commands for each test case, plus one where you sign a payload yourself with `openssl dgst -sha256 -hmac dev-secret` (see the Webhooks lesson)."] },
    ],
    done: ["7/7 test cases pass.", "Sequence diagram + README with the order of checks and why."],
  },
};
