import type { Guide } from "../types";

export const guides: Record<string, Guide> = {
  "CORS break & fix": {
    where: "Your Mac: Vite app on :5173 + Express API on :4000",
    time: "1 hour",
    steps: [
      { title: "Make the API", commands: [{ cmd: "mkdir api && cd api && npm init -y && npm i express cors", purpose: "Backend" }], code: { title: "api/server.js (no CORS yet)", variants: { js: `const express = require("express");
const app = express();
app.use(express.json());
app.get("/api/employees", (req, res) => res.json([{ id: 1, firstname: "Ana" }]));
app.post("/api/employees", (req, res) => res.status(201).json(req.body));
app.listen(4000, () => console.log("API on :4000"));` } } },
      { title: "Make the frontend", commands: [{ cmd: "npm create vite@latest web -- --template vanilla && cd web && npm i && npm run dev", purpose: "Frontend on :5173" }], body: ["In `main.js`: `fetch('http://localhost:4000/api/employees').then(r => r.json()).then(console.log)`"] },
      { title: "See it break", body: ["Open the page and DevTools (**Cmd+Opt+I**) → Console: *blocked by CORS policy*. Then in the **Network** tab the request shows status 200: the server answered, but the **browser** refused to let your JS read it.", "Change the fetch to a POST with `Content-Type: application/json` and find the **OPTIONS** preflight row."] },
      { title: "Fix #1: server CORS config", code: { title: "api/server.js", variants: { js: `const cors = require("cors");
app.use(cors({ origin: "http://localhost:5173", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));` } }, body: ["Restart and reload. It works. In Network, check the response header `Access-Control-Allow-Origin`."] },
      { title: "Fix #2: dev proxy (remove the cors() line first)", code: { title: "web/vite.config.js", variants: { js: `import { defineConfig } from "vite";
export default defineConfig({
  server: { proxy: { "/api": "http://localhost:4000" } },
});` } }, body: ["Change the fetch to a **relative** URL: `fetch('/api/employees')`. Same origin now, so there's no CORS at all."] },
    ],
    done: ["You saw the CORS error, the preflight row and both fixes.", "You can explain why curl and Postman never show CORS errors."],
  },
  "Search box": {
    where: "Your Mac: the CORS lab project or Next.js",
    time: "1 hour",
    steps: [
      { title: "Add a search endpoint with fake latency", code: { title: "api/server.js", variants: { js: `const people = ["Ana Cruz", "Ben Reyes", "Carla Santos", "Dan Lim", "Ella Tan", "Gina Uy"];
app.get("/api/search", (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const delay = 200 + Math.random() * 800;          // random latency = out-of-order responses
  setTimeout(() => res.json(people.filter((p) => p.toLowerCase().includes(q))), delay);
});` } } },
      { title: "Naive version first", body: ["Call fetch on every `input` event. Type *carla* fast and watch the Network tab: 5 requests, and sometimes an **old** response arrives last and shows the wrong results."] },
      { title: "Debounce + AbortController", code: { title: "web/main.js", variants: { js: `const input = document.querySelector("#q");
const list = document.querySelector("#results");
const status = document.querySelector("#status");
let controller;

function debounce(fn, wait) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

async function search(q) {
  controller?.abort();                         // cancel the stale request
  controller = new AbortController();
  status.textContent = "Loading…";
  try {
    const res = await fetch("/api/search?q=" + encodeURIComponent(q), { signal: controller.signal });
    const data = await res.json();
    list.innerHTML = "";
    for (const name of data) {                 // textContent, never innerHTML with data (XSS)
      const li = document.createElement("li");
      li.textContent = name;
      list.append(li);
    }
    status.textContent = data.length + " result(s)";
  } catch (e) {
    if (e.name !== "AbortError") status.textContent = "Error: " + e.message;
  }
}

input.addEventListener("input", debounce((e) => search(e.target.value), 300));` } }, body: ["HTML: `<input id=\"q\"> <p id=\"status\"></p> <ul id=\"results\"></ul>`"] },
      { title: "Measure", body: ["Type *carla* again: 1 request instead of 5, and cancelled ones show as **(canceled)** in Network."] },
    ],
    done: ["Requests drop from 1 per keystroke to 1 per pause.", "Results never show stale data."],
  },
  "Status code lab": {
    where: "Express + curl",
    time: "45 min",
    steps: [
      { title: "One route per status", code: { title: "status.js", variants: { js: `const express = require("express");
const app = express();
app.use(express.json());

app.post("/items", (req, res) => res.status(201).location("/items/7").json({ id: 7 }));
app.delete("/items/7", (req, res) => res.sendStatus(204));
app.get("/cached", (req, res) => {
  const etag = '"v1"';
  if (req.get("If-None-Match") === etag) return res.sendStatus(304);
  res.set("ETag", etag).json({ data: "hello" });
});
app.get("/me", (req, res) => (req.get("Authorization") ? res.json({ user: "ana" }) : res.sendStatus(401)));
app.get("/admin", (req, res) => res.sendStatus(403));
app.post("/validate", (req, res) => (req.body.email ? res.json({ ok: true }) : res.status(422).json({ error: "email required" })));
let hits = 0;
app.get("/limited", (req, res) => (++hits > 3 ? res.set("Retry-After", "10").sendStatus(429) : res.json({ hits })));
app.use((req, res) => res.sendStatus(404));
app.listen(4000);` } } },
      { title: "Hit each one", commands: [
        { cmd: "curl -i -X POST localhost:4000/items", purpose: "201 + Location header" },
        { cmd: "curl -i -X DELETE localhost:4000/items/7", purpose: "204, empty body" },
        { cmd: "curl -i -H 'If-None-Match: \"v1\"' localhost:4000/cached", purpose: "304 Not Modified" },
        { cmd: "curl -i localhost:4000/me", purpose: "401: not logged in" },
        { cmd: "curl -i localhost:4000/admin", purpose: "403: logged in but not allowed" },
        { cmd: "curl -i -X POST -H 'Content-Type: application/json' -d '{}' localhost:4000/validate", purpose: "422 validation" },
        { cmd: "for i in 1 2 3 4; do curl -s -o /dev/null -w '%{http_code}\\n' localhost:4000/limited; done", purpose: "200 200 200 429" },
      ] },
      { title: "Explain each", body: ["Write one sentence per code. Focus on **401 vs 403** and **200 vs 201 vs 204**, which panels and interviews love."] },
    ],
    done: ["You've seen all 8 codes with your own server.", "You can say which to return for a duplicate email (409) and a bad form (422)."],
  },
  "Lighthouse audit": {
    where: "Chrome DevTools → Lighthouse",
    time: "1–1.5 hours",
    steps: [
      { title: "Baseline", body: ["Run a production build of an old project (`npm run build && npm start`). DevTools → **Lighthouse** → Mobile → Analyze. Screenshot the 4 scores plus LCP, CLS and TBT."] },
      { title: "Fix LCP", body: ["Find the LCP element (Lighthouse names it). If it's an image: compress it to WebP/AVIF, set `fetchpriority=\"high\"`, and **remove** `loading=\"lazy\"` from it."] },
      { title: "Fix CLS", body: ["Add `width` and `height` to every `<img>`, and reserve space for anything that loads late."] },
      { title: "Fix accessibility", body: ["Go through the list: missing `alt`, low contrast, inputs without `<label>`, buttons without names. Each one is usually a one-line fix."] },
      { title: "Re-run", body: ["Compare before and after in a small table for your portfolio."] },
    ],
    done: ["Performance and Accessibility both improved, with screenshots.", "You can explain LCP, INP and CLS in one sentence each."],
  },
  "Employee directory": {
    where: "Next.js + the HR API (Database course)",
    time: "1 weekend",
    steps: [
      { title: "Proxy to the API", code: { title: "next.config.ts", variants: { ts: `const nextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: "http://localhost:4000/:path*" }];
  },
};
export default nextConfig;` } } },
      { title: "Debounced search + pagination", body: ["Add `?q=&page=` support to the API (`ILIKE $1`, `LIMIT 10 OFFSET $2`). In the page, use the `useDebounced` hook from the debounce lesson and keep `q` and `page` in the URL with `useSearchParams` so the back button works."] },
      { title: "Accessible table", body: ["A real `<table>` with `<th scope=\"col\">`, a `<label>` on the search input, a visible focus style, and \"No results\" and loading states."] },
    ],
    done: ["Search + paging work, and the URL is shareable.", "Lighthouse Accessibility ≥ 95."],
  },
  "Auth playground": {
    where: "Express on your Mac",
    time: "2 weekends",
    steps: [
      { title: "Setup", commands: [{ cmd: "npm i express express-session bcrypt jsonwebtoken cookie-parser", purpose: "Sessions, hashing, JWT" }] },
      { title: "Session login", code: { title: "Session-based", variants: { js: `const session = require("express-session");
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false /* true behind HTTPS */ } }));

app.post("/session/login", async (req, res) => {
  const user = users.get(req.body.email);
  if (!user || !(await bcrypt.compare(req.body.password, user.hash))) return res.sendStatus(401);
  req.session.regenerate(() => { req.session.userId = user.id; res.json({ ok: true }); });
});
app.post("/session/logout", (req, res) => req.session.destroy(() => res.sendStatus(204)));` } } },
      { title: "JWT login", code: { title: "Token-based", variants: { js: `const jwt = require("jsonwebtoken");
app.post("/jwt/login", async (req, res) => {
  const user = users.get(req.body.email);
  if (!user || !(await bcrypt.compare(req.body.password, user.hash))) return res.sendStatus(401);
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
  res.cookie("token", token, { httpOnly: true, sameSite: "lax" }).json({ ok: true });
});` } } },
      { title: "Compare logout", body: ["Log in both ways, copy the JWT, then \"log out\". Replay the old JWT with curl. It **still works** until it expires. The session ID doesn't. Write down why."] },
      { title: "Sign in with Google", body: ["Use a library (Auth.js for Next.js, or `openid-client`) for **Authorization Code + PKCE**. Create OAuth credentials in Google Cloud Console with redirect URI `http://localhost:3000/api/auth/callback/google`."] },
    ],
    done: ["Both login styles work, and passwords are stored as bcrypt hashes.", "You've shown the JWT-after-logout problem.", "Google sign-in works locally."],
  },
  "Full-stack HR portal": {
    where: "Next.js + Express + PostgreSQL + nginx",
    time: "3–4 weekends",
    steps: [
      { title: "Plan", body: ["Roles: **admin** (CRUD) and **viewer** (read). Pages: login, directory, employee detail, admin edit, live headcount."] },
      { title: "RBAC on the server", code: { title: "Middleware", variants: { js: `const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.sendStatus(401);
  if (req.user.role !== role) return res.sendStatus(403);     // A01: check on the SERVER
  next();
};
app.put("/employees/:id", requireRole("admin"), updateEmployee);` } } },
      { title: "Live headcount with SSE", body: ["`GET /events` streams `{ headcount }` whenever an employee is added. The client uses `new EventSource('/api/events')`. See the real-time lesson."] },
      { title: "Behind nginx", body: ["Serve Next.js on :3000 and the API on :4000. nginx: `/` → 3000, `/api/` → 4000. Same origin, so no CORS needed. Add `helmet()` to Express."] },
      { title: "Quality gate", body: ["Lighthouse ≥ 90 on all categories. Try IDOR (a viewer calling PUT) → expect 403. Try SQLi in search → treated as text."] },
    ],
    done: ["Admin and viewer see different capabilities, enforced server-side.", "SSE headcount updates live, and Lighthouse ≥ 90."],
  },
};
