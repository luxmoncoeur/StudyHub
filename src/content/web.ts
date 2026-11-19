import type { Course } from "./types";

export const web: Course = {
  code: "ITELEC3",
  slug: "web",
  title: "Web Systems and Technologies",
  units: 3,
  accent: "#a78bfa",
  tagline: "HTTP, CORS, proxies, debouncing, auth, security, performance and real-time.",
  ched: "CMO-era web course: HTML/CSS/JS, client-server architecture and server-side scripting with a database. This version adds what the syllabus skips and what you'll hit in real projects: HTTP details, CORS, proxies, debouncing, auth, OWASP 2025, Core Web Vitals and real-time.",
  lessons: [
    {
      slug: "http",
      title: "HTTP in depth",
      why: "Every web bug report ends up being about a status code or a header.",
      points: [
        "Methods: GET (read) · POST (create) · PUT (replace) · PATCH (partial) · DELETE · OPTIONS (CORS preflight). GET, PUT and DELETE are **idempotent**, meaning repeating them has the same effect.",
        "Status: `201` created · `204` no content · `304` not modified · `400` bad input · **`401` not logged in vs `403` logged in but not allowed** · `409` conflict · `422` validation · `429` rate-limited · `502/503/504` proxy or upstream problems.",
        "Caching: `max-age=3600` · `no-cache` (store, but revalidate) · `no-store` (never store) · `ETag` + `If-None-Match` → `304`.",
        "Cookies: `HttpOnly` (JS can't read it) · `Secure` (HTTPS only) · `SameSite=Lax` (blocks most CSRF).",
      ],
      commands: [
        { cmd: "curl -i https://example.com", purpose: "Show response headers + body" },
        { cmd: "curl -I https://example.com", purpose: "Headers only (HEAD)" },
        { cmd: "curl -X POST -H 'Content-Type: application/json' -d '{\"name\":\"Ana\"}' localhost:4000/api/employees", purpose: "Send JSON" },
        { cmd: "curl -H 'If-None-Match: \"abc\"' -i localhost:4000/api/x", purpose: "Test ETag revalidation (expect 304)" },
        { cmd: "curl -v https://example.com", purpose: "Verbose: TLS handshake + request headers" },
      ],
    },
    {
      slug: "fetch-async",
      title: "fetch, async/await & cancellation",
      why: "The base of every API call in the browser.",
      points: [
        "`fetch` does **not** reject on 404/500. Check `res.ok`.",
        "`AbortSignal.timeout(5000)` cancels slow requests. `AbortController` cancels stale ones (like an old search).",
        "Run requests in parallel with `Promise.all`, or `Promise.allSettled` when some are allowed to fail.",
      ],
      code: [{
        title: "fetch with timeout + cancel stale search",
        variants: {
          js: `async function getJSON(url, { timeoutMs = 5000, signal } = {}) {
  const res = await fetch(url, {
    signal: signal ?? AbortSignal.timeout(timeoutMs),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

let controller;
async function search(q) {
  controller?.abort();                    // cancel the previous request
  controller = new AbortController();
  try {
    return await getJSON("/api/employees?q=" + encodeURIComponent(q), { signal: controller.signal });
  } catch (e) {
    if (e.name === "AbortError") return null;   // superseded by a newer search
    throw e;
  }
}`,
          python: `# pip install httpx
import httpx, asyncio

async def main():
    async with httpx.AsyncClient(timeout=5.0) as client:
        a, b = await asyncio.gather(client.get("https://api.github.com"), client.get("https://example.com"))
        a.raise_for_status()          # unlike fetch, this raises on 4xx/5xx
        print(a.json())

asyncio.run(main())`,
          java: `HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.github.com"))
    .header("Accept", "application/json").timeout(Duration.ofSeconds(5)).build();
client.sendAsync(req, HttpResponse.BodyHandlers.ofString())
    .thenApply(HttpResponse::body)
    .thenAccept(System.out::println)
    .join();`,
        },
      }],
    },
    {
      slug: "debounce-throttle",
      title: "Debounce vs throttle",
      why: "Without it, a search box sends one API call per keystroke.",
      points: [
        "**Debounce**: run once, after the calls **stop** for `wait` ms. Use it for search-as-you-type, autosave and resize-end.",
        "**Throttle**: run **at most once per** `wait` ms while events keep firing. Use it for scroll, mousemove and drag.",
        "Combine debounce with AbortController so a slow old response can't overwrite a newer one.",
        "Type in the demo to see the difference.",
      ],
      demo: "debounce",
      code: [{
        title: "Implementations",
        variants: {
          js: `function debounce(fn, wait = 300) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function throttle(fn, wait = 300) {      // leading + trailing call
  let last = 0, timer = null, lastArgs;
  return function (...args) {
    const now = Date.now();
    lastArgs = args;
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer); timer = null; last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => { last = Date.now(); timer = null; fn.apply(this, lastArgs); }, remaining);
    }
  };
}

input.addEventListener("input", debounce((e) => search(e.target.value), 300));
window.addEventListener("scroll", throttle(updateProgressBar, 100), { passive: true });`,
          ts: `// React hook version
import { useEffect, useState } from "react";

export function useDebounced<T>(value: T, wait = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), wait);
    return () => clearTimeout(t);
  }, [value, wait]);
  return v;
}

// const q = useDebounced(input); useEffect(() => { search(q) }, [q]);`,
        },
      }],
    },
    {
      slug: "event-loop",
      title: "The event loop",
      why: "Explains why your UI freezes and why the console logs come out in a strange order.",
      points: [
        "Order: synchronous code → **all microtasks** (Promises, `await`) → render → **one macrotask** (setTimeout, events) → repeat.",
        "A long synchronous loop blocks clicks and rendering, which hurts INP. Split it into chunks or move it to a Web Worker.",
      ],
      code: [{
        title: "Predict the output",
        variants: {
          js: `console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
// → 1 4 3 2`,
        },
      }],
    },
    {
      slug: "cors",
      title: "CORS",
      why: "The most common error when the frontend and backend run on different ports.",
      points: [
        "Origin = scheme + host + port. `localhost:5173` and `localhost:4000` are **different origins**.",
        "The browser blocks JS from **reading** a cross-origin response unless the server sends `Access-Control-Allow-Origin`. curl and Postman ignore CORS, which is why \"it works in Postman\".",
        "**Preflight**: PUT/PATCH/DELETE, an `Authorization` header or `Content-Type: application/json` make the browser send an `OPTIONS` request first.",
        "With cookies (`credentials: 'include'`), the server must send an exact origin, never `*`, plus `Allow-Credentials: true`.",
        "Fix it on the **server** or with a **dev proxy**. Never with a browser extension.",
      ],
      code: [{
        title: "Allow your frontend",
        variants: {
          js: `// npm i express cors
import express from "express";
import cors from "cors";

const app = express();
const allowed = new Set(["http://localhost:5173", "https://app.example.com"]);

app.use(cors({
  origin(origin, cb) {                 // undefined for curl / same-origin
    if (!origin || allowed.has(origin)) cb(null, true);
    else cb(new Error("CORS blocked: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,                         // cache the preflight for 10 min
}));`,
          python: `# pip install fastapi uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Content-Type", "Authorization"],
)`,
          java: `// Spring Boot
@Configuration
public class CorsConfig implements WebMvcConfigurer {
  @Override
  public void addCorsMappings(CorsRegistry r) {
    r.addMapping("/api/**")
     .allowedOrigins("http://localhost:5173")
     .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE")
     .allowCredentials(true);
  }
}`,
        },
      }],
    },
    {
      slug: "proxies",
      title: "Proxies: forward, reverse, dev",
      why: "A dev proxy makes CORS disappear, and a reverse proxy is how production apps are served.",
      points: [
        "**Forward proxy**: sits in front of clients (corporate proxy, VPN). The server sees the proxy.",
        "**Reverse proxy**: sits in front of servers (nginx, Caddy, Cloudflare). Handles TLS, load balancing, caching and compression.",
        "**Dev proxy**: the frontend dev server forwards `/api` to your backend. The browser sees one origin, so there's no CORS.",
      ],
      code: [{
        title: "Forward /api to the backend",
        variants: {
          js: `// next.config.js
module.exports = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: "http://localhost:4000/api/:path*" }];
  },
};

// vite.config.js
export default defineConfig({
  server: { proxy: { "/api": { target: "http://localhost:4000", changeOrigin: true } } },
});`,
          nginx: `location /api/ {
  proxy_pass http://127.0.0.1:4000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}`,
        },
      }],
    },
    {
      slug: "rest-graphql",
      title: "REST vs GraphQL",
      why: "Two ways to design an API. Know when to use each.",
      points: [
        "**REST**: resources + verbs (`GET /employees/7`). Uses HTTP caching and status codes. Can over-fetch, or need N requests for nested data.",
        "**GraphQL**: one endpoint, and the client picks the exact fields. Caching is harder, errors often come back with HTTP 200, and you must limit query depth.",
        "Default to REST for capstones. Reach for GraphQL when many different clients need different shapes of the same data.",
      ],
      code: [{
        title: "Same data, two styles",
        variants: {
          http: `GET /api/departments/1
GET /api/departments/1/positions
GET /api/positions/2/employees`,
          text: `# GraphQL: one request
query {
  department(id: 1) {
    department_name
    positions { position_name employees { firstname salary } }
  }
}`,
        },
      }],
    },
    {
      slug: "auth",
      title: "Sessions, JWT, OAuth & OIDC",
      why: "Every system needs login. Most security bugs live here.",
      points: [
        "**Session**: the server stores state and the cookie holds an ID. Logout is easy. Best for classic web apps.",
        "**JWT**: a signed token. **Signed, not encrypted**: anyone can read the payload. Logout is hard (wait for expiry). Store it in an HttpOnly cookie, not localStorage.",
        "**OAuth 2.0** = authorization (an app reads your calendar). **OIDC** = authentication on top of it (\"Sign in with Google\", ID token).",
        "Best practice (RFC 9700): **Authorization Code + PKCE** for every client. The Implicit and Password flows are deprecated.",
        "Hash passwords with **argon2id or bcrypt**, never MD5 or SHA.",
      ],
      code: [{
        title: "Hash & verify a password",
        variants: {
          js: `// npm i bcrypt
import bcrypt from "bcrypt";
const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(attempt, hash);`,
          python: `# pip install argon2-cffi
from argon2 import PasswordHasher
ph = PasswordHasher()
h = ph.hash(password)
ph.verify(h, attempt)   # raises on mismatch`,
          java: `// Spring Security
PasswordEncoder enc = new BCryptPasswordEncoder(12);
String hash = enc.encode(password);
boolean ok = enc.matches(attempt, hash);`,
        },
      }],
    },
    {
      slug: "security",
      title: "Web security (OWASP Top 10:2025)",
      why: "Panels and employers both check this.",
      points: [
        "**A01 Broken Access Control**: check permissions on the **server** for every request (`/api/employees/8` → may this user see #8?). SSRF is now part of A01.",
        "**A05 Injection**: parameterized SQL. **XSS**: use `textContent`, never `innerHTML` with user input. React escapes `{value}`, so avoid `dangerouslySetInnerHTML`. Add a CSP.",
        "**CSRF**: SameSite cookies, CSRF tokens, check `Origin`, and never change state with GET.",
        "**A02 Misconfiguration**: debug mode off, no default passwords, `helmet` in Express. **A03 Supply chain** (new): lockfiles, `npm audit`, `npm ci`.",
        "**A10 Exceptional conditions** (new): fail closed, and don't leak stack traces.",
      ],
      code: [{
        title: "XSS: wrong vs right",
        variants: {
          js: `// ❌ runs <img src=x onerror=alert(1)>
el.innerHTML = comment;

// ✅ shown as text
el.textContent = comment;

// Express security headers: npm i helmet
app.use(helmet());`,
        },
      }],
    },
    {
      slug: "performance",
      title: "Performance & Core Web Vitals",
      why: "Google ranks sites by these, and users leave slow pages.",
      points: [
        "**LCP ≤ 2.5 s** (loading) · **INP ≤ 200 ms** (responsiveness, which replaced FID) · **CLS ≤ 0.1** (layout shift). Measured at the 75th percentile.",
        "Never lazy-load the hero image. Give it `fetchpriority=\"high\"` and lazy-load everything below the fold.",
        "Always set `width`/`height` on images, which prevents layout shift.",
        "Ship less JS: code splitting, `import()`, `React.lazy`. Use AVIF/WebP and Brotli.",
      ],
      code: [{
        title: "Images done right",
        variants: {
          text: `<img src="hero.avif" fetchpriority="high" width="1200" height="600" alt="Campus">
<img src="gallery.webp" loading="lazy" width="600" height="400" alt="Lab">`,
        },
      }],
    },
    {
      slug: "realtime",
      title: "WebSockets vs SSE vs polling",
      why: "Live dashboards, chat and notifications.",
      points: [
        "**WebSocket**: two-way. Use it for chat, games and collaborative editing. You write the reconnect logic yourself.",
        "**SSE**: server → client over plain HTTP, with built-in auto-reconnect. Use it for notifications, live feeds and AI token streaming.",
        "**Polling**: the client asks every N seconds. Simplest, fine for low-traffic dashboards.",
      ],
      code: [{
        title: "SSE live clock",
        variants: {
          js: `// server (Express)
app.get("/events", (req, res) => {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  const id = setInterval(() => res.write("data: " + JSON.stringify({ time: Date.now() }) + "\\n\\n"), 1000);
  req.on("close", () => clearInterval(id));
});

// client
const es = new EventSource("/events");
es.onmessage = (e) => console.log(JSON.parse(e.data));`,
        },
      }, {
        title: "WebSocket broadcast chat",
        variants: {
          js: `// npm i ws
import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8080 });
wss.on("connection", (ws) =>
  ws.on("message", (msg) => {
    for (const c of wss.clients) if (c.readyState === 1) c.send(String(msg));
  })
);

// browser
const ws = new WebSocket("ws://localhost:8080");
ws.onmessage = (e) => console.log(e.data);
ws.onopen = () => ws.send("hello");`,
        },
      }],
    },
    {
      slug: "rendering",
      title: "CSR, SSR, SSG, ISR",
      why: "Choosing the right one in Next.js changes speed, SEO and cost.",
      points: [
        "**CSR**: HTML is built in the browser. Fine for dashboards behind a login, weak for SEO.",
        "**SSR**: built on the server for every request. Use it for personalized pages that need SEO.",
        "**SSG**: built once at build time. Use it for docs and blogs (this app uses it).",
        "**ISR**: static, regenerated every N seconds. In Next.js: `export const revalidate = 60`.",
      ],
    },
    {
      slug: "devtools-a11y",
      title: "DevTools & accessibility",
      why: "DevTools is how you debug the web. Accessibility is part of WCAG and of ISO 25010 usability.",
      points: [
        "**Network** tab: disable cache, throttle to Slow 4G, find the OPTIONS preflight, \"Copy as cURL\".",
        "**Application**: cookies (check the HttpOnly and SameSite flags), localStorage. **Performance**: long tasks and INP. **Lighthouse**: audits.",
        "Accessibility: use `<button>`, not `<div onclick>`. Give every input a `<label>`, every image `alt`. Contrast 4.5:1, keyboard focus visible, targets at least 24×24 px (WCAG 2.2).",
        "Test with VoiceOver: **Cmd+F5** on your Mac.",
      ],
    },
  ],
  activities: [
    { title: "CORS break & fix", steps: ["Run Vite on :5173 calling Express on :4000.", "Read the CORS error and find the OPTIONS row in the Network tab.", "Fix it with cors() config, then remove that and fix it with a Vite proxy instead."] },
    { title: "Search box", steps: ["Build a search over the HR API.", "Add debounce (300 ms) + AbortController + a loading state.", "Count requests in the Network tab before and after."] },
    { title: "Status code lab", steps: ["Make Express routes that return 201, 204, 304, 401, 403, 404, 422 and 429.", "Hit each with curl -i and explain each one in a sentence."] },
    { title: "Lighthouse audit", steps: ["Audit one of your old projects.", "Fix LCP (hero image), CLS (image sizes) and accessibility issues.", "Re-run and record the before/after scores."] },
  ],
  projects: [
    { title: "Employee directory", level: "Starter", scope: "A Next.js page over the HR API with debounced search, pagination and an accessible table.", stack: ["Next.js", "fetch"] },
    { title: "Auth playground", level: "Core", scope: "Session-cookie login vs JWT login side by side, comparing logout and CSRF behavior. Add Sign in with Google (OIDC + PKCE through a library).", stack: ["Express", "bcrypt", "OIDC"] },
    { title: "Full-stack HR portal", level: "Stretch", scope: "Auth + RBAC (admin/viewer), parameterized SQL, CORS config, Lighthouse score of 90+, SSE live headcount, behind an nginx reverse proxy.", stack: ["Next.js", "Express", "PostgreSQL", "nginx"] },
  ],
};
