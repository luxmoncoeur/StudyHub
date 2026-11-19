import type { LessonCase, Project } from "../types";

export const cases: Record<string, LessonCase[]> = {
  http: [{
    title: "\"It says 200 but the save failed\"",
    scenario: "A student API returns `200 {\"error\":\"email taken\"}` on failures. The frontend shows \"Saved!\" because `res.ok` is true.",
    steps: ["Use status codes for meaning: duplicate email → **409**, invalid form → **422**, not logged in → **401**, not allowed → **403**.", "Create → **201** + `Location` header. Delete → **204** (no body).", "The frontend can then branch on `res.status` instead of parsing error strings.", "Check it with `curl -i` and read the first line."],
    takeaway: "The status code is part of your API contract. Never return 200 for an error.",
  }],
  "fetch-async": [{
    title: "The spinner that never stops",
    scenario: "When the API server is down, the loading spinner spins forever and the user never sees an error.",
    steps: ["`fetch` hangs until the OS gives up, which can take a minute or more. Add `signal: AbortSignal.timeout(5000)`.", "Wrap it in try/catch/finally and set `loading = false` in **finally**.", "Show a friendly message plus a Retry button in the catch block.", "Remember `fetch` doesn't reject on 404/500, so check `res.ok` too."],
    takeaway: "Every network call needs a timeout, an error state and a finally.",
  }],
  "debounce-throttle": [{
    title: "Search box costs ₱₱₱ in API calls",
    scenario: "A product search calls a paid search API on every keystroke. Typing \"pancit canton\" made 13 calls.",
    steps: ["Debounce 300 ms, so it fires only after the user pauses: 1–2 calls.", "Ignore queries shorter than 2 characters.", "Abort the previous request with AbortController so a slow old response can't overwrite a new one.", "Cache recent results in a `Map` keyed by query."],
    takeaway: "Debounce input-driven calls. Throttle continuous events like scroll.",
  }],
  "event-loop": [{
    title: "The page freezes while generating a report",
    scenario: "Clicking \"Export 10,000 rows to CSV\" freezes the whole tab for 4 seconds. Even the button's hover style stops.",
    steps: ["One long synchronous loop blocks the main thread, so there's no rendering and no input.", "Split it into chunks of 500 rows and `await new Promise(r => setTimeout(r))` between chunks.", "Or move the work into a **Web Worker** so the UI stays smooth.", "Measure in the DevTools Performance tab: the long task (red corner) disappears."],
    takeaway: "Keep each task on the main thread short. Long work goes in chunks or a worker.",
  }],
  cors: [{
    title: "Works in Postman, fails in the browser",
    scenario: "A Vite app on :5173 calls Express on :4000. Postman works, and the browser console says *blocked by CORS policy*.",
    steps: ["Different port = different origin. Browsers enforce CORS and Postman doesn't.", "A POST with `Content-Type: application/json` triggers an OPTIONS **preflight**. Find it in the Network tab.", "Fix on the server: `cors({ origin: 'http://localhost:5173' })`. With cookies also set `credentials: true`, and never use `*`.", "Or skip CORS entirely with a dev proxy (`/api` → :4000)."],
    takeaway: "CORS is fixed on the server or with a proxy, never in the browser.",
  }],
  proxies: [{
    title: "One domain for frontend and API",
    scenario: "Production: the frontend is at `app.school.edu.ph`, the API at a random port. Cookies don't send and CORS is messy.",
    steps: ["Put nginx in front: `/` → Next.js :3000, `/api/` → Express :4000.", "The browser sees a single origin, so cookies work with `SameSite=Lax` and there's no CORS.", "nginx also handles TLS (HTTPS) and gzip, and can load-balance later.", "For SSE or WebSockets, add `proxy_buffering off` / upgrade headers."],
    takeaway: "A reverse proxy gives you one origin, HTTPS and a place to scale.",
  }],
  "rest-graphql": [{
    title: "The mobile app makes 12 requests per screen",
    scenario: "A student profile screen calls `/students/1`, `/students/1/grades`, `/courses/…` ×10.",
    steps: ["Option A (REST): add a purpose-built endpoint, `/students/1/summary`, which returns everything in one call.", "Option B (GraphQL): the client asks for exactly the fields it needs in one query.", "GraphQL trade-offs: harder caching, and you must limit query depth.", "For a capstone, Option A is usually enough."],
    takeaway: "Fix over/under-fetching with better endpoints first, and GraphQL if many clients need different shapes.",
  }],
  auth: [{
    title: "Logout doesn't really log out",
    scenario: "A JWT stored in localStorage is \"deleted\" on logout, but a copied token still opens `/api/grades` for 7 days.",
    steps: ["A JWT stays valid until `exp`. The server can't forget it.", "Shorten the access token to 15 min and use a refresh token stored server-side (revocable).", "Store tokens in an **HttpOnly** cookie, not localStorage (XSS can read localStorage).", "For a classic web app, a server session is simpler and revocable."],
    takeaway: "Choose sessions for easy logout. If you use JWTs, keep them short-lived.",
  }],
  security: [{
    title: "Change the ID in the URL, see another student's grades",
    scenario: "`GET /api/grades/2024-0001` returns Juan's grades. Juan changes it to `2024-0002` and sees Ana's.",
    steps: ["This is **IDOR** (OWASP A01: broken access control).", "On the server: `if (req.user.role !== 'admin' && req.user.studentId !== req.params.id) return 403`.", "Never trust IDs from the client. Derive \"me\" from the session.", "Test it: log in as a student, request someone else's ID, and expect 403."],
    takeaway: "Authorize every request on the server, per record.",
  }],
  performance: [{
    title: "Landing page LCP is 6 seconds",
    scenario: "A school org site's hero image is a 4 MB PNG with `loading=\"lazy\"`. Lighthouse Performance score: 38.",
    steps: ["Convert to AVIF/WebP at the display size: about 150 KB.", "**Remove** lazy from the hero and add `fetchpriority=\"high\"`.", "Add `width`/`height` to stop layout shift (CLS).", "Re-run Lighthouse: LCP should drop below 2.5 s."],
    takeaway: "The biggest wins are image size and not lazy-loading the hero.",
  }],
  realtime: [{
    title: "Queue display at the registrar",
    scenario: "A TV shows \"Now serving: 042\". It currently reloads every 5 s and flickers.",
    steps: ["Data flows one way (server → TV), so use **SSE**, not WebSockets.", "Server: `text/event-stream`, write `data: {\"now\":43}` on every change.", "Client: `new EventSource('/api/queue')`. It auto-reconnects after Wi-Fi drops.", "Behind nginx: `proxy_buffering off`."],
    takeaway: "One-way live updates → SSE. Two-way chat → WebSockets.",
  }],
  rendering: [{
    title: "Org announcements page vs student dashboard",
    scenario: "Which rendering mode for (a) public announcements and (b) a logged-in student's grades?",
    steps: ["(a) Same for everyone and changes a few times a day → **SSG/ISR** (`revalidate = 300`). Fast, and good for SEO.", "(b) Personal and private → **SSR** or client fetch after login. Never cache it publicly.", "Don't use CSR for public SEO pages: search engines see an empty shell first.", "Check with View Source: SSG/SSR pages have the content in the HTML."],
    takeaway: "Public and shared → static. Personal → render per request.",
  }],
  "devtools-a11y": [{
    title: "The form a blind applicant can't submit",
    scenario: "A scholarship form uses `<div onclick>` buttons and placeholder-only inputs. VoiceOver reads \"group, group, edit text\".",
    steps: ["Replace with a real `<button>` (focusable, works with Enter and Space).", "Give every input a `<label>` (placeholders disappear and aren't labels).", "Check contrast (4.5:1) and visible focus with Tab.", "Test with VoiceOver (**Cmd+F5**) and run Lighthouse Accessibility."],
    takeaway: "Semantic HTML first. It fixes most accessibility issues for free.",
  }],
};

export const caseProject: Project = {
  title: "Case: Barangay clearance request portal",
  level: "Core",
  scope: "From scratch: residents request a barangay clearance online, staff approve it, and residents track the status. Built to pass the acceptance tests.",
  stack: ["Next.js", "Express", "PostgreSQL"],
  guide: {
    where: "Your Mac: Next.js + Express + PostgreSQL",
    time: "2–3 weekends",
    brief: {
      client: "Barangay San Isidro Hall",
      problem: "Residents line up for hours for a barangay clearance. Staff use a paper logbook and can't tell who is waiting or done.",
      requirements: [
        "Resident submits: full name, address, purpose, mobile number. Gets a reference number like `BC-2026-0001`.",
        "Resident checks status by reference number + mobile number (no account needed).",
        "Staff log in and see the queue; they can **Approve** or **Reject** (with a reason).",
        "Status flow: PENDING → APPROVED or REJECTED. No other transitions.",
        "Only staff can change status (server-side check). Inputs are validated on the server.",
      ],
    },
    tests: [
      { id: "TC-01", scenario: "Submit valid request", steps: "POST the form with all fields", expected: "**201**, reference `BC-2026-0001`, status PENDING" },
      { id: "TC-02", scenario: "Invalid mobile", steps: "mobile = `12345`", expected: "**422** with message *Enter a PH mobile number*" },
      { id: "TC-03", scenario: "Track request", steps: "GET status with correct ref + mobile", expected: "**200**, shows PENDING" },
      { id: "TC-04", scenario: "Wrong mobile for ref", steps: "Correct ref, different mobile", expected: "**404** (don't reveal that the ref exists)" },
      { id: "TC-05", scenario: "Resident tries to approve", steps: "PATCH status without staff session", expected: "**401**" },
      { id: "TC-06", scenario: "Staff approves", steps: "Staff login → PATCH `{status:'APPROVED'}`", expected: "**200**; tracking now shows APPROVED" },
      { id: "TC-07", scenario: "Illegal transition", steps: "PATCH an APPROVED request to PENDING", expected: "**409** *Invalid status change*" },
      { id: "TC-08", scenario: "Reject needs a reason", steps: "PATCH `{status:'REJECTED'}` with no reason", expected: "**422**" },
      { id: "TC-09", scenario: "XSS in purpose", steps: "purpose = `<script>alert(1)</script>`", expected: "Shown as plain text in the staff queue, no alert" },
    ],
    youNeed: ["The **HR REST API** and **Auth playground** projects done first (you'll reuse their patterns)", "PostgreSQL running"],
    steps: [
      { title: "Understand the brief", body: ["Turn each requirement into an endpoint. Each test case = one curl command you'll run at the end."] },
      { title: "Design the API and the table", body: ["`POST /requests` · `GET /requests/status?ref=&mobile=` · `GET /requests` (staff) · `PATCH /requests/:ref` (staff) · `POST /auth/login`."],
        code: { title: "schema.sql (starter)", variants: { postgres: `CREATE TABLE clearance_requests (
  id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ref        VARCHAR(20) UNIQUE NOT NULL,          -- BC-2026-0001
  full_name  VARCHAR(120) NOT NULL,
  address    VARCHAR(200) NOT NULL,
  purpose    VARCHAR(200) NOT NULL,
  mobile     VARCHAR(13) NOT NULL CHECK (mobile ~ '^09[0-9]{9}$'),
  status     VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status <> 'REJECTED' OR reason IS NOT NULL)  -- DB also enforces TC-08
);

-- Reference numbers: BC-<year>-<4 digits>, generated from the id
CREATE OR REPLACE FUNCTION next_ref(p_id INT) RETURNS TEXT LANGUAGE sql AS $$
  SELECT 'BC-' || extract(year FROM now())::int || '-' || lpad(p_id::text, 4, '0')
$$;` } } },
      { title: "Scaffold the API", commands: [{ cmd: "mkdir -p ~/Developments/clearance/api && cd $_ && npm init -y && npm i express pg express-session bcrypt helmet", purpose: "API project" }, { cmd: "createdb clearance && psql clearance -f schema.sql", purpose: "DB" }] },
      { title: "First slice: submit + track (TC-01 to TC-04)", body: ["Copy `db.js` and the error handler from the HR API. In POST, insert, then `UPDATE … SET ref = next_ref(id) … RETURNING ref`. Normalize the mobile number (remove spaces) before validating."] },
      { title: "Second slice: staff + status rules (TC-05 to TC-08)", body: ["Reuse `auth.js` (`requireRole`) from the HR portal. Allowed transitions: `{ PENDING: ['APPROVED','REJECTED'] }`. Anything else → 409."] },
      { title: "Frontend", body: ["Next.js pages: `/` request form, `/track` status lookup, `/staff` queue (login required). Render user text with `{value}` (React escapes it) to pass TC-09."] },
      { title: "Run all 9 test cases", body: ["Write them as a `tests.sh` of curl commands (like the dual-engine project) and record pass or fail."] },
    ],
    done: ["9/9 test cases pass.", "README with endpoints, the status diagram and test results."],
  },
};
