// Generated from tested project files. Do not edit by hand.
import type { Guide } from "../types";

export const builds: Record<string, Guide> = {
 "Employee directory": {
  "where": "Next.js + the HR REST API (Database course project)",
  "time": "1 weekend",
  "youNeed": [
   "The **HR REST API** running on :4000 (Database → Projects)"
  ],
  "tree": "employee-directory/\n  next.config.ts\n  src/\n    app/\n      directory.tsx\n      page.tsx\n      use-debounced.ts",
  "steps": [
   {
    "title": "Create the Next.js project",
    "body": [
     "This makes a fresh Next.js 16 app with TypeScript, Tailwind and the App Router. Accept the defaults."
    ],
    "commands": [
     {
      "cmd": "cd ~/Developments && npx create-next-app@latest employee-directory --yes",
      "purpose": "New Next.js app"
     },
     {
      "cmd": "cd employee-directory && code .",
      "purpose": "Open it in VS Code"
     }
    ]
   },
   {
    "title": "Proxy /api to the HR API",
    "body": [
     "Same origin means no CORS. `API_URL` lets you point it somewhere else later."
    ],
    "files": [
     {
      "title": "next.config.ts",
      "variants": {
       "ts": "import type { NextConfig } from \"next\";\n\nconst nextConfig: NextConfig = {\n  cacheComponents: true,\n  partialPrefetching: true,\n  reactCompiler: true,\n  turbopack: { rules: { \"*.css\": { loaders: [\"@tailwindcss/turbopack\"], as: \"*.css\" } } },\n  // Dev proxy: /api/* → the HR API on :4000. Same origin, so no CORS needed.\n  async rewrites() {\n    return [{ source: \"/api/:path*\", destination: `${process.env.API_URL ?? \"http://localhost:4000\"}/:path*` }];\n  },\n};\n\nexport default nextConfig;\n"
      }
     }
    ]
   },
   {
    "title": "Debounce hook",
    "files": [
     {
      "title": "src/app/use-debounced.ts",
      "variants": {
       "ts": "import { useEffect, useState } from \"react\";\n\n// Returns `value` only after it stops changing for `wait` ms\nexport function useDebounced<T>(value: T, wait = 300) {\n  const [v, setV] = useState(value);\n  useEffect(() => {\n    const t = setTimeout(() => setV(value), wait);\n    return () => clearTimeout(t);\n  }, [value, wait]);\n  return v;\n}\n"
      }
     }
    ]
   },
   {
    "title": "The directory component",
    "body": [
     "Search is debounced (300 ms), and each request gets an `AbortController` so stale responses can't overwrite new ones.",
     "`q` and `page` live in the **URL**, so the back button and shared links work. The table uses `<caption>`, `<th scope>` and a labeled input for accessibility."
    ],
    "files": [
     {
      "title": "src/app/directory.tsx",
      "variants": {
       "ts": "\"use client\";\n\nimport { usePathname, useRouter, useSearchParams } from \"next/navigation\";\nimport { useEffect, useState } from \"react\";\nimport { useDebounced } from \"./use-debounced\";\n\ntype Employee = { id: number; firstname: string; lastname: string; position_name: string; department_name: string; salary: string; date_hired: string };\ntype Page = { data: Employee[]; page: number; limit: number; total: number };\n\nconst peso = (n: string) => \"₱\" + Number(n).toLocaleString(\"en-PH\");\n\nexport function Directory() {\n  const router = useRouter();\n  const pathname = usePathname();\n  const params = useSearchParams();\n  const page = Number(params.get(\"page\") ?? 1);\n  const [q, setQ] = useState(params.get(\"q\") ?? \"\");\n  const debouncedQ = useDebounced(q, 300);\n  const [result, setResult] = useState<Page | null>(null);\n  const [status, setStatus] = useState<\"idle\" | \"loading\" | \"error\">(\"idle\");\n\n  // Keep q + page in the URL so the back button and shared links work\n  const go = (next: { q?: string; page?: number }) => {\n    const sp = new URLSearchParams(params);\n    if (next.q !== undefined) { next.q ? sp.set(\"q\", next.q) : sp.delete(\"q\"); sp.set(\"page\", \"1\"); }\n    if (next.page !== undefined) sp.set(\"page\", String(next.page));\n    router.replace(`${pathname}?${sp}`);\n  };\n\n  useEffect(() => { if (debouncedQ !== (params.get(\"q\") ?? \"\")) go({ q: debouncedQ }); }, [debouncedQ]); // eslint-disable-line react-hooks/exhaustive-deps\n\n  useEffect(() => {\n    const controller = new AbortController();   // cancel the request if the query changes again\n    setStatus(\"loading\");\n    fetch(`/api/employees?q=${encodeURIComponent(params.get(\"q\") ?? \"\")}&page=${page}&limit=5`, { signal: controller.signal })\n      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })\n      .then((data: Page) => { setResult(data); setStatus(\"idle\"); })\n      .catch((e) => { if (e.name !== \"AbortError\") setStatus(\"error\"); });\n    return () => controller.abort();\n  }, [params, page]);\n\n  const pages = result ? Math.max(1, Math.ceil(result.total / result.limit)) : 1;\n\n  return (\n    <div className=\"space-y-4\">\n      <label className=\"block\">\n        <span className=\"mb-1 block text-sm font-medium\">Search employees</span>\n        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder=\"Name, position or department\"\n          className=\"w-full rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-600\" />\n      </label>\n\n      <p aria-live=\"polite\" className=\"text-sm text-gray-600\">\n        {status === \"loading\" ? \"Loading…\" : status === \"error\" ? \"Could not reach the API. Is it running on :4000?\" : `${result?.total ?? 0} result(s)`}\n      </p>\n\n      <table className=\"w-full border-collapse text-sm\">\n        <caption className=\"sr-only\">Employee directory</caption>\n        <thead>\n          <tr className=\"border-b text-left\">\n            <th scope=\"col\" className=\"py-2\">Name</th>\n            <th scope=\"col\">Position</th>\n            <th scope=\"col\">Department</th>\n            <th scope=\"col\" className=\"text-right\">Salary</th>\n          </tr>\n        </thead>\n        <tbody>\n          {result?.data.map((e) => (\n            <tr key={e.id} className=\"border-b\">\n              <td className=\"py-2\">{e.firstname} {e.lastname}</td>\n              <td>{e.position_name}</td>\n              <td>{e.department_name}</td>\n              <td className=\"text-right font-mono\">{peso(e.salary)}</td>\n            </tr>\n          ))}\n          {result && result.data.length === 0 && (\n            <tr><td colSpan={4} className=\"py-6 text-center text-gray-500\">No employees match “{params.get(\"q\")}”.</td></tr>\n          )}\n        </tbody>\n      </table>\n\n      <nav aria-label=\"Pagination\" className=\"flex items-center gap-3 text-sm\">\n        <button disabled={page <= 1} onClick={() => go({ page: page - 1 })} className=\"rounded border px-3 py-1 disabled:opacity-40\">← Prev</button>\n        <span>Page {page} of {pages}</span>\n        <button disabled={page >= pages} onClick={() => go({ page: page + 1 })} className=\"rounded border px-3 py-1 disabled:opacity-40\">Next →</button>\n      </nav>\n    </div>\n  );\n}\n"
      }
     }
    ]
   },
   {
    "title": "The page",
    "body": [
     "`useSearchParams` reads the URL, so in Next 16 it **must** sit inside `<Suspense>` or the build fails."
    ],
    "files": [
     {
      "title": "src/app/page.tsx",
      "variants": {
       "ts": "import { Suspense } from \"react\";\nimport { Directory } from \"./directory\";\n\nexport default function Home() {\n  return (\n    <main className=\"mx-auto max-w-3xl space-y-6 p-8\">\n      <h1 className=\"text-2xl font-bold\">Employee Directory</h1>\n      {/* useSearchParams reads the URL, so it must sit inside Suspense */}\n      <Suspense fallback={<p>Loading…</p>}>\n        <Directory />\n      </Suspense>\n    </main>\n  );\n}\n"
      }
     }
    ]
   },
   {
    "title": "Run both",
    "commands": [
     {
      "cmd": "cd ~/Developments/hr-api && npm run dev",
      "purpose": "Terminal 1: API on :4000"
     },
     {
      "cmd": "npm run dev -- -p 3001",
      "purpose": "Terminal 2: directory on :3001"
     }
    ],
    "body": [
     "Type *senior* quickly and watch DevTools → Network: **1 request**, not 6."
    ]
   }
  ],
  "done": [
   "Search, paging and the back button work.",
   "Typing fast sends 1 request.",
   "Lighthouse Accessibility ≥ 95."
  ]
 },
 "Auth playground": {
  "where": "Express on your Mac",
  "time": "1 weekend",
  "youNeed": [
   "Node.js 20+"
  ],
  "tree": "auth-playground/\n  .env.example\n  public/\n    index.html\n  server.js\n  users.js",
  "steps": [
   {
    "title": "Create the project",
    "commands": [
     {
      "cmd": "mkdir -p ~/Developments/auth-playground/public && cd ~/Developments/auth-playground",
      "purpose": "Folders"
     },
     {
      "cmd": "npm init -y && npm i express express-session bcrypt jsonwebtoken cookie-parser",
      "purpose": "Sessions, hashing, JWT"
     }
    ]
   },
   {
    "title": "Secrets",
    "files": [
     {
      "title": ".env.example",
      "variants": {
       "bash": "SESSION_SECRET=change-me-to-a-long-random-string\nJWT_SECRET=change-me-to-another-long-random-string\n"
      }
     }
    ],
    "body": [
     "Copy to `.env` and use long random values. Never commit `.env`."
    ]
   },
   {
    "title": "User store with bcrypt",
    "body": [
     "Passwords are hashed with cost 12. Login compares even when the email doesn't exist, so response time doesn't reveal which emails are registered."
    ],
    "files": [
     {
      "title": "users.js",
      "variants": {
       "js": "const bcrypt = require(\"bcrypt\");\n\n// In-memory user store for the lab (use a DB table in a real app)\nconst users = new Map();\n\nasync function register(email, password, role = \"viewer\") {\n  if (users.has(email)) throw new Error(\"Email already registered\");\n  if (!password || password.length < 8) throw new Error(\"Password must be at least 8 characters\");\n  const hash = await bcrypt.hash(password, 12);   // never store the plain password\n  users.set(email, { id: users.size + 1, email, role, hash });\n}\n\nasync function verify(email, password) {\n  const user = users.get(email);\n  // compare even when the user doesn't exist, so response time doesn't reveal valid emails\n  const ok = await bcrypt.compare(password || \"\", user?.hash ?? \"$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv\");\n  return ok && user ? user : null;\n}\n\nmodule.exports = { register, verify, users };\n"
      }
     }
    ]
   },
   {
    "title": "Two login styles side by side",
    "body": [
     "Session: the server keeps the state, and logout destroys it. JWT: the token **is** the state, and logout can only delete the browser's copy."
    ],
    "files": [
     {
      "title": "server.js",
      "variants": {
       "js": "const express = require(\"express\");\nconst session = require(\"express-session\");\nconst cookieParser = require(\"cookie-parser\");\nconst jwt = require(\"jsonwebtoken\");\nconst { register, verify } = require(\"./users\");\n\nconst SESSION_SECRET = process.env.SESSION_SECRET || \"dev-session-secret\";\nconst JWT_SECRET = process.env.JWT_SECRET || \"dev-jwt-secret\";\n\nconst app = express();\napp.use(express.json());\napp.use(cookieParser());\napp.use(express.static(\"public\"));\napp.use(session({\n  name: \"sid\",\n  secret: SESSION_SECRET,\n  resave: false,\n  saveUninitialized: false,\n  cookie: { httpOnly: true, sameSite: \"lax\", secure: false, maxAge: 60 * 60 * 1000 },   // secure: true behind HTTPS\n}));\n\napp.post(\"/register\", async (req, res) => {\n  try {\n    await register(req.body.email, req.body.password);\n    res.status(201).json({ ok: true });\n  } catch (e) {\n    res.status(409).json({ error: e.message });\n  }\n});\n\n/* ---------- 1) Session login: server keeps the state ---------- */\napp.post(\"/session/login\", async (req, res) => {\n  const user = await verify(req.body.email, req.body.password);\n  if (!user) return res.status(401).json({ error: \"Invalid email or password\" });\n  req.session.regenerate((err) => {          // new session id on login (prevents session fixation)\n    if (err) return res.sendStatus(500);\n    req.session.user = { id: user.id, email: user.email, role: user.role };\n    res.json({ ok: true });\n  });\n});\n\napp.get(\"/session/me\", (req, res) => (req.session.user ? res.json(req.session.user) : res.sendStatus(401)));\n\napp.post(\"/session/logout\", (req, res) => {\n  req.session.destroy(() => res.clearCookie(\"sid\").sendStatus(204));   // server forgets it: old cookie is now useless\n});\n\n/* ---------- 2) JWT login: the token carries the state ---------- */\napp.post(\"/jwt/login\", async (req, res) => {\n  const user = await verify(req.body.email, req.body.password);\n  if (!user) return res.status(401).json({ error: \"Invalid email or password\" });\n  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: \"15m\" });\n  res.cookie(\"token\", token, { httpOnly: true, sameSite: \"lax\", maxAge: 15 * 60 * 1000 }).json({ ok: true, token });\n});\n\nfunction requireJwt(req, res, next) {\n  const token = req.cookies.token || req.get(\"Authorization\")?.replace(/^Bearer /, \"\");\n  if (!token) return res.sendStatus(401);\n  try {\n    req.user = jwt.verify(token, JWT_SECRET, { algorithms: [\"HS256\"] });   // pin the algorithm\n    next();\n  } catch {\n    res.sendStatus(401);\n  }\n}\n\napp.get(\"/jwt/me\", requireJwt, (req, res) => res.json(req.user));\n\napp.post(\"/jwt/logout\", (req, res) => {\n  // We can only delete the browser's copy. A copied token still works until it expires.\n  res.clearCookie(\"token\").sendStatus(204);\n});\n\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => console.log(`Auth playground on http://localhost:${PORT}`));\n"
      }
     }
    ]
   },
   {
    "title": "Test page",
    "files": [
     {
      "title": "public/index.html",
      "variants": {
       "html": "<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <title>Auth playground</title>\n  <style>\n    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }\n    section { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin: 1rem 0; }\n    input, button { padding: .4rem .6rem; margin: .2rem 0; }\n    pre { background: #f5f5f5; padding: .6rem; border-radius: 6px; white-space: pre-wrap; }\n  </style>\n</head>\n<body>\n  <h1>Auth playground</h1>\n  <section>\n    <label>Email <input id=\"email\" value=\"ana@example.com\" /></label>\n    <label>Password <input id=\"password\" type=\"password\" value=\"password123\" /></label>\n    <button onclick=\"call('POST', '/register')\">Register</button>\n  </section>\n  <section>\n    <h2>Session</h2>\n    <button onclick=\"call('POST', '/session/login')\">Log in</button>\n    <button onclick=\"call('GET', '/session/me')\">Who am I?</button>\n    <button onclick=\"call('POST', '/session/logout')\">Log out</button>\n  </section>\n  <section>\n    <h2>JWT</h2>\n    <button onclick=\"call('POST', '/jwt/login')\">Log in</button>\n    <button onclick=\"call('GET', '/jwt/me')\">Who am I?</button>\n    <button onclick=\"call('POST', '/jwt/logout')\">Log out</button>\n  </section>\n  <pre id=\"out\">Responses appear here.</pre>\n  <script>\n    async function call(method, url) {\n      const body = method === \"POST\"\n        ? JSON.stringify({ email: email.value, password: password.value })\n        : undefined;\n      const res = await fetch(url, { method, body, headers: { \"Content-Type\": \"application/json\" } });\n      const text = await res.text();\n      out.textContent = `${method} ${url} → ${res.status}\\n${text}`;   // textContent: never innerHTML with server data\n    }\n  </script>\n</body>\n</html>\n"
      }
     }
    ]
   },
   {
    "title": "The experiment",
    "commands": [
     {
      "cmd": "node --env-file=.env server.js",
      "purpose": "Start at http://localhost:3000"
     },
     {
      "cmd": "curl -s -c s.txt -X POST localhost:3000/session/login -H 'Content-Type: application/json' -d '{\"email\":\"ana@example.com\",\"password\":\"password123\"}'",
      "purpose": "Session login (register on the page first)"
     },
     {
      "cmd": "cp s.txt old.txt && curl -s -b s.txt -X POST localhost:3000/session/logout && curl -i -b old.txt localhost:3000/session/me",
      "purpose": "Old session cookie after logout: 401 ✔"
     },
     {
      "cmd": "TOKEN=$(curl -s -X POST localhost:3000/jwt/login -H 'Content-Type: application/json' -d '{\"email\":\"ana@example.com\",\"password\":\"password123\"}' | sed 's/.*\"token\":\"\\([^\"]*\\)\".*/\\1/')",
      "purpose": "JWT login, save the token"
     },
     {
      "cmd": "curl -s -X POST localhost:3000/jwt/logout && curl -i -H \"Authorization: Bearer $TOKEN\" localhost:3000/jwt/me",
      "purpose": "Old JWT after logout: still 200!"
     }
    ],
    "body": [
     "That last 200 is the lesson: a stolen JWT works until it expires. Keep JWTs short-lived (15 min) and use a refresh token or a denylist."
    ]
   },
   {
    "title": "Stretch: Sign in with Google",
    "body": [
     "Use **Auth.js** in a Next.js app. Create OAuth credentials in Google Cloud Console with redirect URI `http://localhost:3000/api/auth/callback/google`. Auth.js handles Authorization Code + PKCE for you."
    ]
   }
  ],
  "done": [
   "Wrong password → 401, duplicate email → 409.",
   "You can explain why the old session fails but the old JWT works."
  ]
 },
 "Full-stack HR portal": {
  "where": "Express API + Next.js + PostgreSQL + nginx (Docker)",
  "time": "2–3 weekends",
  "youNeed": [
   "The **HR REST API** and **Employee directory** projects (this builds on both)",
   "Docker Desktop or OrbStack (for nginx)"
  ],
  "tree": "hr-portal/\n  api/\n    auth.js\n    create-user.js\n    db/\n      auth.sql\n    events.js\n    package.json\n    server.js\n  nginx/\n    compose.yaml\n    nginx.conf\n  web/\n    src/\n      app/\n        admin/\n          page.tsx\n        header.tsx\n        login/\n          page.tsx\n        page.tsx\n        use-me.ts",
  "steps": [
   {
    "title": "Set up the folders",
    "body": [
     "Copy your finished projects into one portal folder: `api/` (from hr-api) and `web/` (from employee-directory)."
    ],
    "commands": [
     {
      "cmd": "mkdir ~/Developments/hr-portal && cd $_",
      "purpose": "Portal folder"
     },
     {
      "cmd": "cp -R ../hr-api api && cp -R ../employee-directory web && mkdir nginx",
      "purpose": "Reuse your two projects"
     },
     {
      "cmd": "cd api && npm i express-session bcrypt helmet",
      "purpose": "Auth + security packages"
     }
    ]
   },
   {
    "title": "API: users table + a script to create users",
    "files": [
     {
      "title": "api/db/auth.sql",
      "variants": {
       "postgres": "-- Users who can log in to the portal. role decides what they may do.\nCREATE TABLE IF NOT EXISTS app_users (\n  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  email         VARCHAR(200) NOT NULL UNIQUE,\n  password_hash TEXT NOT NULL,\n  role          VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'viewer'))\n);\n"
      }
     },
     {
      "title": "api/create-user.js",
      "variants": {
       "js": "// Usage: node create-user.js admin@hr.local 'StrongPass123' admin\nconst bcrypt = require(\"bcrypt\");\nconst pool = require(\"./db\");\n\n(async () => {\n  const [email, password, role = \"viewer\"] = process.argv.slice(2);\n  if (!email || !password || password.length < 8) {\n    console.error(\"usage: node create-user.js EMAIL PASSWORD(8+ chars) [admin|viewer]\");\n    process.exit(1);\n  }\n  const hash = await bcrypt.hash(password, 12);\n  await pool.query(\n    \"INSERT INTO app_users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = $3\",\n    [email, hash, role]);\n  console.log(`saved ${email} (${role})`);\n  await pool.end();\n})();\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "psql company -f db/auth.sql",
      "purpose": "Create app_users"
     },
     {
      "cmd": "node create-user.js admin@hr.local 'AdminPass123' admin && node create-user.js viewer@hr.local 'ViewerPass123' viewer",
      "purpose": "Two test users"
     }
    ]
   },
   {
    "title": "API: login + role middleware",
    "body": [
     "**401** = not logged in, **403** = logged in but wrong role. These checks run on the server (OWASP A01). Hiding a button is not security."
    ],
    "files": [
     {
      "title": "api/auth.js",
      "variants": {
       "js": "const express = require(\"express\");\nconst bcrypt = require(\"bcrypt\");\nconst pool = require(\"./db\");\n\nconst router = express.Router();\n\nrouter.post(\"/login\", async (req, res, next) => {\n  try {\n    const { email, password } = req.body;\n    const { rows } = await pool.query(\"SELECT * FROM app_users WHERE email = $1\", [email]);\n    const user = rows[0];\n    if (!user || !(await bcrypt.compare(password || \"\", user.password_hash)))\n      return res.status(401).json({ error: \"Invalid email or password\" });\n    req.session.regenerate((err) => {\n      if (err) return next(err);\n      req.session.user = { id: user.id, email: user.email, role: user.role };\n      res.json(req.session.user);\n    });\n  } catch (e) { next(e); }\n});\n\nrouter.get(\"/me\", (req, res) => (req.session.user ? res.json(req.session.user) : res.sendStatus(401)));\n\nrouter.post(\"/logout\", (req, res) => req.session.destroy(() => res.clearCookie(\"sid\").sendStatus(204)));\n\n// Middleware: 401 = not logged in, 403 = logged in but wrong role (OWASP A01: check on the SERVER)\nconst requireLogin = (req, res, next) => (req.session.user ? next() : res.sendStatus(401));\nconst requireRole = (role) => (req, res, next) => {\n  if (!req.session.user) return res.sendStatus(401);\n  if (req.session.user.role !== role) return res.status(403).json({ error: `Requires ${role}` });\n  next();\n};\n\nmodule.exports = { router, requireLogin, requireRole };\n"
      }
     }
    ]
   },
   {
    "title": "API: live headcount with Server-Sent Events",
    "body": [
     "`no-transform` matters: without it, Next.js's dev proxy compresses and **buffers** the stream, so updates never arrive. We hit this in testing."
    ],
    "files": [
     {
      "title": "api/events.js",
      "variants": {
       "js": "const pool = require(\"./db\");\n\n// Server-Sent Events: every open dashboard gets the new headcount instantly\nconst clients = new Set();\n\nasync function headcount() {\n  const { rows: [r] } = await pool.query(\"SELECT count(*)::int AS n FROM tbl_employees WHERE status = 'ACTIVE'\");\n  return r.n;\n}\n\nasync function stream(req, res) {\n  res.writeHead(200, { \"Content-Type\": \"text/event-stream\", \"Cache-Control\": \"no-cache, no-transform\", Connection: \"keep-alive\" });\n  res.write(`data: ${JSON.stringify({ headcount: await headcount() })}\\n\\n`);\n  clients.add(res);\n  const ping = setInterval(() => res.write(\": ping\\n\\n\"), 25000);   // keeps proxies from closing idle streams\n  req.on(\"close\", () => { clearInterval(ping); clients.delete(res); });\n}\n\nasync function broadcast() {\n  const msg = `data: ${JSON.stringify({ headcount: await headcount() })}\\n\\n`;\n  for (const res of clients) res.write(msg);\n}\n\nmodule.exports = { stream, broadcast };\n"
      }
     }
    ]
   },
   {
    "title": "API: wire it into server.js",
    "body": [
     "Same routes as before, now protected: reads need login, writes need admin. A create or delete broadcasts the new headcount."
    ],
    "files": [
     {
      "title": "api/server.js",
      "variants": {
       "js": "const express = require(\"express\");\nconst session = require(\"express-session\");\nconst helmet = require(\"helmet\");\nconst pool = require(\"./db\");\nconst { router: auth, requireLogin, requireRole } = require(\"./auth\");\nconst { stream, broadcast } = require(\"./events\");\n\nconst app = express();\napp.set(\"trust proxy\", 1);                 // we run behind nginx\napp.use(helmet());                         // security headers (OWASP A02)\napp.use(express.json());\napp.use(session({\n  name: \"sid\",\n  secret: process.env.SESSION_SECRET || \"dev-only-secret\",\n  resave: false,\n  saveUninitialized: false,\n  cookie: { httpOnly: true, sameSite: \"lax\", secure: process.env.NODE_ENV === \"production\", maxAge: 8 * 60 * 60 * 1000 },\n}));\n\napp.use(\"/auth\", auth);\napp.get(\"/events\", requireLogin, stream);\n\nconst FIELDS = [\"firstname\", \"lastname\", \"position_id\", \"gender\", \"salary\", \"date_hired\"];\n\n// Validate a request body; returns an error message or null\nfunction validate(b, partial = false) {\n  for (const f of FIELDS) if (!partial && (b[f] === undefined || b[f] === \"\")) return `${f} is required`;\n  if (b.gender !== undefined && ![\"M\", \"F\"].includes(b.gender)) return \"gender must be M or F\";\n  if (b.salary !== undefined && !(Number(b.salary) >= 0)) return \"salary must be a number >= 0\";\n  if (b.date_hired !== undefined && !/^\\d{4}-\\d{2}-\\d{2}$/.test(b.date_hired)) return \"date_hired must be YYYY-MM-DD\";\n  return null;\n}\n\n// GET /employees?q=ana&page=1&limit=10  (search + pagination)\napp.get(\"/employees\", requireLogin, async (req, res, next) => {\n  try {\n    const q = `%${req.query.q || \"\"}%`;\n    const limit = Math.min(Number(req.query.limit) || 10, 50);\n    const page = Math.max(Number(req.query.page) || 1, 1);\n    const where = \"WHERE firstname ILIKE $1 OR lastname ILIKE $1 OR position_name ILIKE $1 OR department_name ILIKE $1\";\n    const { rows } = await pool.query(\n      `SELECT * FROM v_employee_directory ${where} ORDER BY id LIMIT $2 OFFSET $3`, [q, limit, (page - 1) * limit]);\n    const { rows: [{ count }] } = await pool.query(`SELECT count(*)::int FROM v_employee_directory ${where}`, [q]);\n    res.json({ data: rows, page, limit, total: count });\n  } catch (e) { next(e); }\n});\n\napp.get(\"/employees/:id\", requireLogin, async (req, res, next) => {\n  try {\n    const { rows } = await pool.query(\"SELECT * FROM v_employee_directory WHERE id = $1\", [req.params.id]);\n    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: \"Employee not found\" });\n  } catch (e) { next(e); }\n});\n\napp.post(\"/employees\", requireRole(\"admin\"), async (req, res, next) => {\n  const err = validate(req.body);\n  if (err) return res.status(422).json({ error: err });\n  try {\n    const b = req.body;\n    const { rows } = await pool.query(\n      `INSERT INTO tbl_employees (firstname, lastname, position_id, gender, salary, date_hired)\n       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,\n      [b.firstname, b.lastname, b.position_id, b.gender, b.salary, b.date_hired]);\n    res.status(201).location(`/employees/${rows[0].id}`).json({ id: rows[0].id });\n    broadcast();\n  } catch (e) { next(e); }\n});\n\n// PUT = partial update of the given fields only\napp.put(\"/employees/:id\", requireRole(\"admin\"), async (req, res, next) => {\n  const err = validate(req.body, true);\n  if (err) return res.status(422).json({ error: err });\n  const fields = FIELDS.filter((f) => req.body[f] !== undefined);   // allow-list: column names never come from the user\n  if (!fields.length) return res.status(422).json({ error: \"nothing to update\" });\n  try {\n    const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(\", \");\n    const { rowCount } = await pool.query(\n      `UPDATE tbl_employees SET ${sets} WHERE id = $${fields.length + 1}`, [...fields.map((f) => req.body[f]), req.params.id]);\n    rowCount ? res.sendStatus(204) : res.status(404).json({ error: \"Employee not found\" });\n  } catch (e) { next(e); }\n});\n\napp.delete(\"/employees/:id\", requireRole(\"admin\"), async (req, res, next) => {\n  try {\n    const { rowCount } = await pool.query(\"DELETE FROM tbl_employees WHERE id = $1\", [req.params.id]);\n    rowCount ? res.sendStatus(204) : res.status(404).json({ error: \"Employee not found\" });\n    if (rowCount) broadcast();\n  } catch (e) { next(e); }\n});\n\napp.get(\"/positions\", requireLogin, async (req, res, next) => {\n  try {\n    const { rows } = await pool.query(\n      \"SELECT p.id, p.position_name, d.department_name FROM tbl_positions p JOIN tbl_departments d ON d.id = p.department_id ORDER BY p.id\");\n    res.json(rows);\n  } catch (e) { next(e); }\n});\n\napp.get(\"/reports/payroll\", requireLogin, async (req, res, next) => {\n  try {\n    const { rows } = await pool.query(\n      \"SELECT id, department_name, dept_payroll(id)::float AS payroll FROM tbl_departments ORDER BY payroll DESC\");\n    res.json(rows);\n  } catch (e) { next(e); }\n});\n\napp.get(\"/reports/salary-audit\", requireRole(\"admin\"), async (req, res, next) => {\n  try {\n    const { rows } = await pool.query(\"SELECT * FROM tbl_salary_audit ORDER BY id DESC LIMIT 50\");\n    res.json(rows);\n  } catch (e) { next(e); }\n});\n\n// Map common Postgres errors to proper HTTP codes; hide internals\napp.use((err, req, res, next) => {\n  if (err.code === \"23503\") return res.status(422).json({ error: \"position_id does not exist\" });   // FK violation\n  if (err.code === \"22P02\") return res.status(400).json({ error: \"invalid id or number\" });          // bad input syntax\n  console.error(err);\n  res.status(500).json({ error: \"Internal server error\" });\n});\n\nconst PORT = process.env.PORT || 4000;\napp.listen(PORT, () => console.log(`HR API on http://localhost:${PORT}`));\n"
      }
     },
     {
      "title": "api/package.json",
      "variants": {
       "json": "{\n  \"name\": \"hr-portal-api\",\n  \"version\": \"1.0.0\",\n  \"private\": true,\n  \"scripts\": {\n    \"db:setup\": \"psql company -f db/schema.sql && psql company -f db/programmability.sql && psql company -f db/auth.sql\",\n    \"dev\": \"node --watch server.js\",\n    \"start\": \"node server.js\"\n  }\n}\n"
      }
     }
    ]
   },
   {
    "title": "Web: who's logged in",
    "files": [
     {
      "title": "web/src/app/use-me.ts",
      "variants": {
       "ts": "\"use client\";\n\nimport { useRouter } from \"next/navigation\";\nimport { useEffect, useState } from \"react\";\n\nexport type Me = { id: number; email: string; role: \"admin\" | \"viewer\" };\n\n// Loads the logged-in user; sends visitors to /login. (The API enforces access anyway.)\nexport function useMe() {\n  const router = useRouter();\n  const [me, setMe] = useState<Me | null>(null);\n  useEffect(() => {\n    fetch(\"/api/auth/me\").then(async (r) => (r.ok ? setMe(await r.json()) : router.replace(\"/login\")));\n  }, [router]);\n  return me;\n}\n"
      }
     }
    ]
   },
   {
    "title": "Web: login page",
    "files": [
     {
      "title": "web/src/app/login/page.tsx",
      "variants": {
       "ts": "\"use client\";\n\nimport { useRouter } from \"next/navigation\";\nimport { useState } from \"react\";\n\nexport default function LoginPage() {\n  const router = useRouter();\n  const [email, setEmail] = useState(\"\");\n  const [password, setPassword] = useState(\"\");\n  const [error, setError] = useState(\"\");\n\n  async function submit(e: React.FormEvent) {\n    e.preventDefault();\n    setError(\"\");\n    const res = await fetch(\"/api/auth/login\", {\n      method: \"POST\",\n      headers: { \"Content-Type\": \"application/json\" },\n      body: JSON.stringify({ email, password }),\n    });\n    if (res.ok) router.replace(\"/\");\n    else setError((await res.json()).error ?? \"Login failed\");\n  }\n\n  return (\n    <main className=\"mx-auto mt-24 max-w-sm space-y-4 p-6\">\n      <h1 className=\"text-2xl font-bold\">HR Portal login</h1>\n      <form onSubmit={submit} className=\"space-y-3\">\n        <label className=\"block\">\n          <span className=\"text-sm font-medium\">Email</span>\n          <input type=\"email\" required autoComplete=\"username\" value={email} onChange={(e) => setEmail(e.target.value)} className=\"mt-1 w-full rounded border px-3 py-2\" />\n        </label>\n        <label className=\"block\">\n          <span className=\"text-sm font-medium\">Password</span>\n          <input type=\"password\" required autoComplete=\"current-password\" value={password} onChange={(e) => setPassword(e.target.value)} className=\"mt-1 w-full rounded border px-3 py-2\" />\n        </label>\n        {error && <p role=\"alert\" className=\"text-sm text-red-600\">{error}</p>}\n        <button className=\"w-full rounded bg-black py-2 text-white\">Log in</button>\n      </form>\n    </main>\n  );\n}\n"
      }
     }
    ]
   },
   {
    "title": "Web: header with live headcount + logout",
    "files": [
     {
      "title": "web/src/app/header.tsx",
      "variants": {
       "ts": "\"use client\";\n\nimport Link from \"next/link\";\nimport { useRouter } from \"next/navigation\";\nimport { useEffect, useState } from \"react\";\nimport type { Me } from \"./use-me\";\n\nexport function Header({ me }: { me: Me }) {\n  const router = useRouter();\n  const [headcount, setHeadcount] = useState<number | null>(null);\n\n  // Live headcount over Server-Sent Events (EventSource reconnects by itself)\n  useEffect(() => {\n    const es = new EventSource(\"/api/events\");\n    es.onmessage = (e) => setHeadcount(JSON.parse(e.data).headcount);\n    return () => es.close();\n  }, []);\n\n  async function logout() {\n    await fetch(\"/api/auth/logout\", { method: \"POST\" });\n    router.replace(\"/login\");\n  }\n\n  return (\n    <header className=\"flex flex-wrap items-center gap-4 border-b pb-4\">\n      <Link href=\"/\" className=\"text-xl font-bold\">HR Portal</Link>\n      {me.role === \"admin\" && <Link href=\"/admin\" className=\"text-blue-600 underline\">Admin</Link>}\n      <span className=\"rounded bg-green-100 px-2 py-0.5 text-sm text-green-800\" aria-live=\"polite\">\n        Active headcount: <b>{headcount ?? \"…\"}</b>\n      </span>\n      <span className=\"ml-auto text-sm text-gray-600\">{me.email} ({me.role})</span>\n      <button onClick={logout} className=\"rounded border px-3 py-1 text-sm\">Log out</button>\n    </header>\n  );\n}\n"
      }
     }
    ]
   },
   {
    "title": "Web: directory home + admin page",
    "files": [
     {
      "title": "web/src/app/page.tsx",
      "variants": {
       "ts": "\"use client\";\n\nimport { Suspense } from \"react\";\nimport { Directory } from \"./directory\";\nimport { Header } from \"./header\";\nimport { useMe } from \"./use-me\";\n\nexport default function Home() {\n  const me = useMe();\n  if (!me) return <p className=\"p-8\">Loading…</p>;\n  return (\n    <main className=\"mx-auto max-w-4xl space-y-6 p-8\">\n      <Header me={me} />\n      <Suspense fallback={<p>Loading…</p>}>\n        <Directory />\n      </Suspense>\n    </main>\n  );\n}\n"
      }
     },
     {
      "title": "web/src/app/admin/page.tsx",
      "variants": {
       "ts": "\"use client\";\n\nimport { useEffect, useState } from \"react\";\nimport { Header } from \"../header\";\nimport { useMe } from \"../use-me\";\n\ntype Position = { id: number; position_name: string; department_name: string };\ntype Employee = { id: number; firstname: string; lastname: string; position_name: string };\nconst empty = { firstname: \"\", lastname: \"\", position_id: \"\", gender: \"F\", salary: \"\", date_hired: \"\" };\n\nexport default function AdminPage() {\n  const me = useMe();\n  const [positions, setPositions] = useState<Position[]>([]);\n  const [employees, setEmployees] = useState<Employee[]>([]);\n  const [form, setForm] = useState(empty);\n  const [msg, setMsg] = useState(\"\");\n\n  const load = () => fetch(\"/api/employees?limit=50\").then((r) => r.json()).then((d) => setEmployees(d.data ?? []));\n  useEffect(() => {\n    if (me?.role !== \"admin\") return;\n    fetch(\"/api/positions\").then((r) => r.json()).then(setPositions);\n    load();\n  }, [me]);\n\n  if (!me) return <p className=\"p-8\">Loading…</p>;\n  if (me.role !== \"admin\") return <p className=\"p-8\">403: admins only.</p>;\n\n  async function add(e: React.FormEvent) {\n    e.preventDefault();\n    const res = await fetch(\"/api/employees\", {\n      method: \"POST\",\n      headers: { \"Content-Type\": \"application/json\" },\n      body: JSON.stringify({ ...form, position_id: Number(form.position_id), salary: Number(form.salary) }),\n    });\n    setMsg(res.ok ? \"Employee added.\" : (await res.json()).error);\n    if (res.ok) { setForm(empty); load(); }\n  }\n\n  async function remove(id: number) {\n    if (!confirm(\"Delete this employee?\")) return;\n    const res = await fetch(`/api/employees/${id}`, { method: \"DELETE\" });\n    setMsg(res.ok ? \"Deleted.\" : \"Delete failed\");\n    load();\n  }\n\n  const field = (k: keyof typeof empty) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value }) });\n\n  return (\n    <main className=\"mx-auto max-w-4xl space-y-6 p-8\">\n      <Header me={me} />\n      <form onSubmit={add} className=\"grid grid-cols-2 gap-3 rounded border p-4\">\n        <h2 className=\"col-span-2 font-semibold\">Add employee</h2>\n        <label>First name<input required {...field(\"firstname\")} className=\"w-full rounded border px-2 py-1\" /></label>\n        <label>Last name<input required {...field(\"lastname\")} className=\"w-full rounded border px-2 py-1\" /></label>\n        <label>Position\n          <select required {...field(\"position_id\")} className=\"w-full rounded border px-2 py-1\">\n            <option value=\"\">—</option>\n            {positions.map((p) => <option key={p.id} value={p.id}>{p.position_name} ({p.department_name})</option>)}\n          </select>\n        </label>\n        <label>Gender\n          <select {...field(\"gender\")} className=\"w-full rounded border px-2 py-1\"><option>F</option><option>M</option></select>\n        </label>\n        <label>Salary<input required type=\"number\" min=\"0\" {...field(\"salary\")} className=\"w-full rounded border px-2 py-1\" /></label>\n        <label>Date hired<input required type=\"date\" {...field(\"date_hired\")} className=\"w-full rounded border px-2 py-1\" /></label>\n        <button className=\"col-span-2 rounded bg-black py-2 text-white\">Add</button>\n        {msg && <p role=\"status\" className=\"col-span-2 text-sm\">{msg}</p>}\n      </form>\n      <ul className=\"divide-y rounded border\">\n        {employees.map((e) => (\n          <li key={e.id} className=\"flex items-center p-2 text-sm\">\n            <span className=\"flex-1\">{e.firstname} {e.lastname} · {e.position_name}</span>\n            <button onClick={() => remove(e.id)} className=\"text-red-600\">Delete</button>\n          </li>\n        ))}\n      </ul>\n    </main>\n  );\n}\n"
      }
     }
    ]
   },
   {
    "title": "Run in dev",
    "commands": [
     {
      "cmd": "cd api && npm run dev",
      "purpose": "Terminal 1: API :4000"
     },
     {
      "cmd": "cd web && npm run dev",
      "purpose": "Terminal 2: web :3000"
     }
    ],
    "body": [
     "Log in as admin in one window and as viewer in another. Add an employee as admin: the viewer's headcount updates **instantly**. The viewer has no Admin link, and calling the API directly still gets 403."
    ]
   },
   {
    "title": "Production-style: one address through nginx",
    "body": [
     "Build and start the web app (`npm run build && npm start`), then run nginx in Docker. Port **8090** avoids clashing with other dev servers. SSE needs `proxy_buffering off`."
    ],
    "files": [
     {
      "title": "nginx/nginx.conf",
      "variants": {
       "nginx": "events {}\nhttp {\n  # The API and the web app run on your Mac; Docker reaches it as host.docker.internal\n  upstream api { server host.docker.internal:4000; }\n  upstream web { server host.docker.internal:3000; }\n\n  server {\n    listen 80;\n\n    # Live headcount stream: no buffering, long timeout\n    location /api/events {\n      proxy_pass http://api/events;\n      proxy_http_version 1.1;\n      proxy_set_header Connection \"\";\n      proxy_buffering off;\n      proxy_read_timeout 1h;\n    }\n\n    # /api/employees -> http://api/employees (the trailing slash strips /api)\n    location /api/ {\n      proxy_pass http://api/;\n      proxy_set_header Host $host;\n      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n      proxy_set_header X-Forwarded-Proto $scheme;\n    }\n\n    location / {\n      proxy_pass http://web;\n      proxy_set_header Host $host;\n      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    }\n  }\n}\n"
      }
     },
     {
      "title": "nginx/compose.yaml",
      "variants": {
       "yaml": "services:\n  nginx:\n    image: nginx:1.27-alpine\n    ports: [\"8090:80\"]\n    volumes: [\"./nginx.conf:/etc/nginx/nginx.conf:ro\"]\n    extra_hosts: [\"host.docker.internal:host-gateway\"]   # needed on Linux; harmless on Mac\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "cd nginx && docker compose up -d",
      "purpose": "nginx on http://localhost:8090"
     },
     {
      "cmd": "curl -I localhost:8090/api/employees",
      "purpose": "401 through nginx = routing works"
     }
    ]
   }
  ],
  "done": [
   "Viewer gets 403 on writes, both in the UI and via curl.",
   "The headcount updates live in other tabs.",
   "Everything is served from http://localhost:8090."
  ]
 }
};
