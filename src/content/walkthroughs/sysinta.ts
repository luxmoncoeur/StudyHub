type W = Record<string, { title: string; body: string[] }[]>;

export const walk: W = {
  "what-is-si": [
    { title: "Systems that don't talk", body: [
      "A school runs enrollment, cashier, LMS, library and HR systems, often bought from different vendors at different times. Each has its own database, so the same student exists five times. People bridge the gaps by re-typing data and emailing spreadsheets. **System integration** connects these systems so data flows automatically and stays consistent."] },
    { title: "How to connect them", body: [
      "**Point-to-point:** each system connects directly to the others it needs. Fine for 3 systems, chaos at 10 (up to 45 links), where every change breaks something. **Hub / broker / ESB:** each system connects once to a central hub that routes and translates messages.",
      "**API-led / microservices:** each system exposes a clean API and communicates through simple channels. Most modern integration mixes these approaches."] },
  ],
  "integration-styles": [
    { title: "The four classic styles", body: [
      "**File transfer:** one system exports a file (CSV/XML) and another imports it on a schedule. Simple and decoupled, but the data is stale until the next run. **Shared database:** both systems read and write the same tables. Always consistent, but tightly coupled, so a schema change breaks both.",
      "**Remote procedure invocation:** one system calls the other's API (REST, SOAP, gRPC) and waits for an answer. Real-time, but if the other system is down, the caller fails too. **Messaging:** one system drops a message on a queue, and the other processes it when it can. Decoupled and resilient, but the result is eventually consistent, not instant."] },
    { title: "Choosing", body: [
      "Ask per data flow: how fresh must it be, and what happens if the other side is down? Daily totals → file transfer. Price check during checkout → API call. Kitchen notification → messaging. A real system uses several styles at once."] },
  ],
  "enterprise-architecture": [
    { title: "Architecture before technology", body: [
      "Enterprise architecture (EA) is the blueprint of how an organization's business processes, data, applications and technology fit together (the **BDAT** domains). It answers \"what should we build and why\" before \"which framework\"."] },
    { title: "As-Is, To-Be, Gap", body: [
      "Document the **As-Is** (current systems, data flows, pain points), design the **To-Be** (the target state), then list the **gaps** (what must be built, bought, migrated or trained). This is a favorite exam and capstone-defense question."] },
    { title: "Frameworks and middleware", body: [
      "**Zachman** is a grid classifying architecture descriptions (what/how/where/who/when/why × perspectives). **TOGAF ADM** is a step-by-step cycle for developing architecture. **Middleware** is the software in between systems: message queues (RabbitMQ), application servers, database drivers, integration platforms."] },
  ],
  "soap-rest": [
    { title: "Two generations of web services", body: [
      "**SOAP** (older, enterprise and government) wraps every message in an XML envelope, describes operations in a strict **WSDL** contract, and supports standards for security and reliable delivery. **REST** (modern, web and mobile) uses plain HTTP: URLs for resources, methods for actions, usually JSON, with OpenAPI as an optional contract."] },
    { title: "XML and JSON", body: [
      "Both describe structured data. XML has tags, attributes, namespaces and schema validation (XSD), so it's verbose but precise. JSON is lighter and native to JavaScript. Converting between them is a common integration task: the **Message Translator** pattern."] },
    { title: "Living with legacy", body: [
      "You'll meet SOAP services from banks and agencies. Don't let them leak into your whole app: write a small adapter that calls SOAP with a proper client library and exposes a clean REST endpoint to the rest of your system."] },
  ],
  "monolith-microservices": [
    { title: "One deployable vs many", body: [
      "A **monolith** is one application, deployed as one unit, usually with one database. A **microservices** architecture splits it into small services, each deployed independently with its own data, talking over the network."] },
    { title: "The real trade-off", body: [
      "Microservices let large organizations move independently: separate teams, separate release schedules, scaling only the busy part. The price is network calls that can fail, distributed data, harder debugging and more infrastructure. For a small team, a well-organized **modular monolith** delivers faster.",
      "\"Monolith first\": start with clear modules in one app, and split only when a module truly needs independent scaling or ownership."] },
    { title: "API gateway", body: [
      "When there are many services, clients shouldn't know all their addresses. An **API gateway** is a single entry point that routes requests, checks authentication, rate-limits and logs. nginx, Kong and cloud gateways fill this role."] },
  ],
  "load-balancing": [
    { title: "Many servers, one address", body: [
      "One server has a limit. A **load balancer** sits in front of several identical copies (replicas) and spreads requests across them. Users see one address; you can add or remove replicas behind it. If one dies, health checks take it out of rotation."] },
    { title: "Algorithms", body: [
      "**Round robin:** take turns, simple and the default. **Least connections:** send to the least busy server, better when some requests take much longer. **IP hash:** the same client always hits the same server (sticky sessions). The simulator in this lesson shows round robin piling work onto a slow server while least connections avoids it."] },
    { title: "The catch: state", body: [
      "If a user's session lives in server A's memory and their next request lands on server B, they're logged out. Scalable apps are **stateless**: sessions in Redis or a database (or in a token), uploaded files in shared storage. Then any replica can handle any request."] },
  ],
  "rate-limiting": [
    { title: "Why limit requests", body: [
      "Without limits, one buggy script or attacker can flood your API, slowing it for everyone, running up costs, or brute-forcing passwords. Rate limiting caps how many requests a client (by IP, API key or account) may make per time window, and answers **429 Too Many Requests** beyond that."] },
    { title: "Token bucket, intuitively", body: [
      "Imagine a bucket holding up to N tokens, refilled at a steady rate. Each request takes one token; no token means rejected. A full bucket allows short **bursts** (a page loading 10 assets at once), while the refill rate caps the long-term average. Play with the demo in this lesson to feel it."] },
    { title: "Other algorithms and where to enforce", body: [
      "**Fixed window** counters are simple but allow double bursts at window edges. **Sliding window** smooths that out. **Leaky bucket** (nginx `limit_req`) processes at a constant rate.",
      "Enforce limits at the gateway (nginx) for broad protection, and per account for logins. With several app replicas, counters must live in a shared store like Redis, or each replica allows the full limit."] },
  ],
  messaging: [
    { title: "Fire, forget, and trust the queue", body: [
      "With a message queue, the sender puts a message in the queue and moves on immediately. The receiver processes it when it can. If the receiver is down, messages wait safely. The two sides don't need to be online at the same time, which makes the system faster and more resilient."] },
    { title: "Queues, exchanges and acknowledgements", body: [
      "In RabbitMQ, producers publish to **exchanges**, which route messages into **queues** (direct, topic or fanout routing). Consumers take messages and **ack** them only after finishing the work. If a consumer crashes mid-task, the unacked message is redelivered.",
      "Several consumers on one queue share the work (**competing consumers**), so scaling is just starting more workers. Messages that keep failing go to a **dead-letter queue** for inspection instead of looping forever."] },
    { title: "Event-driven design", body: [
      "Instead of calling every interested system, a service announces what happened: `order.placed`, `student.enrolled`. Anyone who cares subscribes. Adding a new consumer (analytics, SMS) needs no change to the publisher. Multi-step business processes across services become **sagas**: each step has a compensating action if a later step fails."] },
  ],
  "webhooks-idempotency": [
    { title: "Webhooks: \"don't call us, we'll call you\"", body: [
      "Instead of polling a payment provider every few seconds asking \"is it paid yet?\", you give it a URL. When the event happens, the provider POSTs the details to your URL: a **webhook**."] },
    { title: "Trust, but verify", body: [
      "Anyone can POST to your webhook URL, so providers **sign** each request (an HMAC of the body with a shared secret). Recompute the signature over the raw body and compare it in constant time; reject mismatches with 401. Then validate the content (does the amount match the order?)."] },
    { title: "Idempotency: safe to repeat", body: [
      "Networks fail and providers retry, so the same webhook can arrive twice. Store each event ID and skip duplicates, while still answering 2xx so the provider stops retrying.",
      "The same idea applies to your own APIs: clients send an `Idempotency-Key` with a POST. If they retry (a double-click, a timeout), the server returns the saved result instead of charging twice."] },
  ],
  resilience: [
    { title: "Failure is normal in distributed systems", body: [
      "Once your system calls other services over a network, something will be slow or down at any given moment. The goal isn't to prevent every failure; it's to stop one failure from spreading and taking everything down (a **cascading failure**)."] },
    { title: "The toolkit, in order", body: [
      "**Timeouts:** never wait forever; a slow dependency must not tie up your server. **Retries with exponential backoff and jitter:** try again after 100 ms, 200 ms, 400 ms…, randomized so thousands of clients don't retry at the same instant. Retry only temporary errors (5xx, 429), and only safe or idempotent operations.",
      "**Circuit breaker:** after too many failures, stop calling the broken service for a while and fail immediately. After a cool-down, let one trial request through to check if it recovered. **Fallback:** show cached data or a friendly \"temporarily unavailable\" instead of an error page."] },
  ],
  "caching-cap": [
    { title: "Caching: remember expensive answers", body: [
      "If the same data is read far more often than it changes, store a copy somewhere fast (Redis, in memory). **Cache-aside:** check the cache; on a miss, read the database and save the result with a TTL (expiry time). When the data changes, **delete** the cache key so the next read fetches fresh data.",
      "Pitfalls: stale data (keep TTLs sensible), a stampede when a hot key expires (add random jitter), and caching personal data where others can see it."] },
    { title: "CAP theorem", body: [
      "When data is copied across several servers and the network between them breaks (a **partition**), you must choose: keep answering, possibly with stale data (**Availability**), or refuse until the copies agree (**Consistency**). You can't have both during a partition. Banking leans toward consistency; a social feed leans toward availability."] },
    { title: "Scaling up vs out", body: [
      "**Vertical:** a bigger server. Easy, but there's a ceiling and it's a single point of failure. **Horizontal:** more servers behind a load balancer. No ceiling, but the app must be stateless and data must be shared or partitioned."] },
  ],
  docker: [
    { title: "Containers: ship the environment with the app", body: [
      "A container packages your app with exactly the runtime and libraries it needs, so it runs the same on your Mac, a groupmate's laptop and the server. An **image** is the recipe (built from a Dockerfile); a **container** is a running instance of it."] },
    { title: "Compose: the whole system in one file", body: [
      "Real projects have several parts: app, database, cache, broker. `compose.yaml` describes them all (images, ports, environment variables, startup order), and `docker compose up -d` starts everything. Containers find each other by **service name** (`postgres:5432`), thanks to Docker's internal DNS.",
      "Use `depends_on` with health checks for slow starters like databases and RabbitMQ, and pin image versions so everyone runs the same thing."] },
  ],
  "api-docs-auth": [
    { title: "APIs are contracts", body: [
      "When other teams or systems depend on your API, changing a field name can break them. **OpenAPI** describes every endpoint, parameter and response in a YAML file, which is human-readable and machine-usable. Swagger UI turns it into interactive docs; tools generate client code from it. Breaking changes get a new version (`/v2`)."] },
    { title: "Authenticating services, not people", body: [
      "When one service calls another, there's no user typing a password. Options: **API keys** (simple, identify the calling app), **OAuth 2.0 client credentials** (the service exchanges its ID and secret for a short-lived token with limited scopes), **JWT** verification (always pin the algorithm), and **mTLS** (both sides present certificates)."] },
    { title: "Observability", body: [
      "In a multi-service system you need to see what's happening: **logs** (events, with a request ID to follow one request across services), **metrics** (request rate, error rate, latency) and **traces** (the path of one request through every service, via OpenTelemetry). Without them, debugging is guesswork."] },
  ],
  "testing-bcp": [
    { title: "Stress testing: find the breaking point first", body: [
      "Before enrollment day, simulate it. Tools like `ab` and k6 fire thousands of requests and report throughput (requests/second) and latency percentiles. **p95** is the time 95% of requests beat, which says more than the average. Compare 1 vs 3 replicas to prove that scaling out works."] },
    { title: "In-source or out-source?", body: [
      "Build or run it yourself, or pay a provider? Weigh cost, whether it's your core competency, control over data, security and privacy (Data Privacy Act), and what the provider's SLA guarantees."] },
    { title: "Business continuity", body: [
      "**RTO** (Recovery Time Objective): how long the system may be down. **RPO** (Recovery Point Objective): how much data, measured in time, you can afford to lose. Enrollment in peak season might need RTO 1 h / RPO 15 min, while a library catalog can accept a day. Backups, replicas and documented recovery steps are sized to these numbers, and tested."] },
  ],
};
