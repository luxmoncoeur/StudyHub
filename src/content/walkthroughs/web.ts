type W = Record<string, { title: string; body: string[] }[]>;

export const walk: W = {
  http: [
    { title: "A conversation of requests and responses", body: [
      "Every time your browser loads a page or calls an API, it sends an **HTTP request**: a method (GET, POST…), a path (`/api/employees`), headers (metadata like `Content-Type` and cookies), and sometimes a body (JSON). The server answers with a **response**: a status code, headers and a body. That's the whole web.",
      "Open DevTools → Network on any site to see this conversation happening dozens of times per page."] },
    { title: "Methods carry meaning", body: [
      "**GET** reads, **POST** creates, **PUT** replaces, **PATCH** partially updates, **DELETE** removes. GET must never change data, because browsers, crawlers and caches repeat GETs freely.",
      "**Idempotent** means doing it twice has the same effect as once. PUT and DELETE are idempotent; POST is not, since two POSTs create two orders. That's why payment APIs need idempotency keys."] },
    { title: "Status codes tell the client what happened", body: [
      "2xx success (200 OK, 201 Created, 204 No Content). 3xx redirects (301 permanent, 304 Not Modified = use your cache). 4xx is the **client's** fault: 400 bad input, **401 not logged in**, **403 logged in but not allowed**, 404 not found, 409 conflict, 422 validation failed, 429 too many requests. 5xx is the **server's** fault: 500 bug, 502/503/504 a proxy or upstream problem.",
      "Choosing the right code lets clients react correctly without parsing error messages."] },
    { title: "Caching and cookies", body: [
      "`Cache-Control: max-age=3600` lets the browser reuse a response for an hour. `ETag` + `If-None-Match` lets it ask \"has this changed?\" and get a tiny 304 if not.",
      "Cookies are small values the server asks the browser to send back on every request. That's how sessions work. Mark session cookies `HttpOnly` (JS can't read them), `Secure` (HTTPS only) and `SameSite=Lax` (blocks most cross-site attacks)."] },
  ],
  "fetch-async": [
    { title: "Why network code is asynchronous", body: [
      "A request might take 50 ms or 5 s. If JavaScript waited, the whole page would freeze. So `fetch` returns a **Promise**, a placeholder for a future result, and the page keeps running. `await` pauses only your function until the result arrives."] },
    { title: "The full shape of a safe request", body: [
      "`const res = await fetch(url, { signal: AbortSignal.timeout(5000) })` gives you a timeout so you never wait forever. Then **check `res.ok`**: fetch only rejects on network failure, so a 404 or 500 still \"succeeds\". Then `await res.json()`.",
      "Wrap it in try/catch for errors, and use finally to turn off the loading spinner no matter what happened."] },
    { title: "Cancelling and running in parallel", body: [
      "`AbortController` lets you cancel a request you no longer need, like an old search when the user keeps typing. `Promise.all([a, b])` runs requests at the same time instead of one after another; `Promise.allSettled` does the same when some are allowed to fail."] },
  ],
  "debounce-throttle": [
    { title: "The problem: events fire too often", body: [
      "Typing \"pancit canton\" fires 13 input events. Scrolling fires dozens per second. If each one triggers an API call or heavy work, you waste money, hammer the server and make the page sluggish."] },
    { title: "Debounce: wait until they stop", body: [
      "Debounce delays the action and **restarts the timer** on every new event. Only when events stop for, say, 300 ms does the action run, once. Perfect for search boxes, autosave and resize-end.",
      "Implementation: keep a timer; on every call, `clearTimeout(timer)` then `timer = setTimeout(fn, 300)`."] },
    { title: "Throttle: at most once per interval", body: [
      "Throttle lets the action run immediately, then ignores further calls until the interval passes. It runs **regularly while events continue**. Perfect for scroll position, mouse tracking and progress bars, where you want steady updates, not just the final one."] },
  ],
  "event-loop": [
    { title: "One thread, a queue of jobs", body: [
      "JavaScript in the browser runs on **one main thread**, which also paints the screen and handles clicks. Work is processed one job at a time from queues. While a job runs, nothing else can happen: no repainting, no clicks."] },
    { title: "Microtasks before macrotasks", body: [
      "After the current code finishes, the engine runs **all microtasks** (Promise callbacks, code after `await`), then may repaint, then takes **one macrotask** (a setTimeout callback, an event). That's why `setTimeout(fn, 0)` runs *after* an already-resolved Promise: the order is 1 4 3 2 in the classic quiz."] },
    { title: "Keeping the page responsive", body: [
      "A long synchronous loop (processing 100k rows) blocks the thread and the page freezes. That hurts **INP**, Google's responsiveness metric. Break the work into chunks with a yield between them, or move it to a **Web Worker** (a separate thread with no access to the DOM)."] },
  ],
  cors: [
    { title: "The Same-Origin Policy", body: [
      "An **origin** is scheme + host + port. `http://localhost:5173` and `http://localhost:4000` are different origins. By default, a page's JavaScript may **send** requests anywhere, but may only **read** responses from its own origin. This stops a malicious site from reading your bank data using your logged-in cookies."] },
    { title: "CORS: the server's permission slip", body: [
      "Cross-Origin Resource Sharing lets a server say \"this other origin may read my responses\" with the `Access-Control-Allow-Origin` header. The browser checks it; without it, JS gets an error even though the server responded (you'll see 200 in the Network tab).",
      "For \"non-simple\" requests (JSON bodies, `Authorization` headers, PUT/DELETE), the browser first sends an **OPTIONS preflight** asking permission. The real request only goes out if the server approves."] },
    { title: "How to fix it properly", body: [
      "Configure the server to allow your exact frontend origin (with `credentials: true` if cookies are involved; never `*` with cookies). Or avoid cross-origin entirely: a dev proxy or nginx serves the frontend and `/api` from the same origin. Postman and curl ignore CORS because they aren't browsers, so \"it works in Postman\" proves nothing."] },
  ],
  proxies: [
    { title: "A middleman for requests", body: [
      "A proxy receives a request and forwards it somewhere else. A **forward proxy** sits in front of clients, like a school network proxy that filters sites; servers see the proxy, not you. A **reverse proxy** sits in front of servers; clients see only the proxy, not your app servers."] },
    { title: "What a reverse proxy does for you", body: [
      "nginx in front of your app can route by path (`/` → Next.js, `/api` → Express), terminate HTTPS, compress responses, serve static files fast, load-balance across replicas and rate-limit abusers. One public address, many internal services."] },
    { title: "The dev proxy", body: [
      "During development, Vite or Next.js can forward `/api/*` to your backend. The browser thinks everything comes from one origin, so CORS disappears and cookies just work, matching how production behind nginx will behave."] },
  ],
  "rest-graphql": [
    { title: "REST: resources and verbs", body: [
      "REST models your data as **resources** with URLs (`/employees`, `/employees/7`) and uses HTTP methods for actions. It reuses everything HTTP already offers: status codes, caching and tools like curl. Simple and predictable, it's the default for most APIs."] },
    { title: "Where REST gets awkward", body: [
      "A screen might need data from 5 endpoints (**under-fetching**: many round trips), or an endpoint returns 40 fields when you need 3 (**over-fetching**). Mobile apps on slow connections feel this most."] },
    { title: "GraphQL: the client asks for exactly what it needs", body: [
      "One endpoint, and the client sends a query describing the shape of data it wants, across related objects, in one request. The trade-offs: HTTP caching is harder, errors often come back as 200, and the server must protect against huge nested queries. Use it when many different clients need different views of the same data."] },
  ],
  auth: [
    { title: "Authentication vs authorization", body: [
      "**Authentication** = who are you (login). **Authorization** = what may you do (roles, ownership). Mixing them up causes most access bugs: being logged in doesn't mean being allowed."] },
    { title: "Sessions and JWTs", body: [
      "**Session:** after login, the server stores your info and gives the browser a random ID in a cookie. Each request sends the ID, and the server looks it up. Logout = delete the server-side record. Simple and revocable.",
      "**JWT:** the server gives you a signed token containing your info. The server just verifies the signature, with no lookup. But it can't \"forget\" a token: it's valid until it expires. And it's **signed, not encrypted**, so anyone can read the payload. Keep JWTs short-lived and store them in HttpOnly cookies."] },
    { title: "OAuth and \"Sign in with Google\"", body: [
      "**OAuth 2.0** lets an app access something on your behalf (\"let this app read my calendar\") without your password. **OpenID Connect** adds identity on top: Google tells the app who you are. The recommended flow is Authorization Code + PKCE; use a library like Auth.js rather than implementing it yourself.",
      "Store passwords only as **bcrypt or argon2** hashes. These are slow by design, so stolen hashes are hard to crack."] },
  ],
  security: [
    { title: "Think like the attacker", body: [
      "Everything from the client can be faked: form values, hidden fields, URLs, headers. Attackers use curl, not your nice UI. So every security decision must happen **on the server**."] },
    { title: "The big three for student projects", body: [
      "**Broken access control** (OWASP #1): changing `/grades/1` to `/grades/2` shows someone else's data. Check ownership on every request. **Injection:** user input executed as SQL or HTML. Use parameterized queries, and render text with `textContent` / React `{value}`, never `innerHTML`.",
      "**CSRF:** another site makes your browser send a request with your cookies. `SameSite` cookies, CSRF tokens and checking `Origin` stop it, and so does never changing state with GET."] },
    { title: "Configuration and dependencies", body: [
      "Turn off debug mode in production, never ship default passwords, and add security headers (`helmet` in Express sets many). Keep a lockfile, run `npm audit`, and be careful with packages that have odd names (typosquats). OWASP's 2025 list added software supply chain failures for exactly this reason."] },
  ],
  performance: [
    { title: "What users feel, measured", body: [
      "Google's **Core Web Vitals**: **LCP** (Largest Contentful Paint), how fast the main content appears, good at ≤ 2.5 s. **INP** (Interaction to Next Paint), how fast the page reacts to clicks, ≤ 200 ms. **CLS** (Cumulative Layout Shift), how much things jump around, ≤ 0.1."] },
    { title: "The usual culprits and fixes", body: [
      "Slow LCP is usually a huge hero image: compress it (AVIF/WebP), size it properly, give it `fetchpriority=\"high\"`, and **don't** lazy-load it. Bad INP comes from too much JavaScript or long tasks: ship less JS and split heavy work. CLS comes from images without dimensions and late-loading ads: always set `width`/`height`."] },
    { title: "Measure, don't guess", body: [
      "Run Lighthouse in DevTools, fix the top items it lists, and run it again. Throttle the network to Slow 4G to see what most mobile users experience."] },
  ],
  realtime: [
    { title: "Getting updates without refreshing", body: [
      "HTTP is request/response: the server can't speak first. For live data you have three options. **Polling:** ask every few seconds. Simple, but wasteful and laggy. **SSE (Server-Sent Events):** the client opens one long request and the server keeps writing messages down it. **WebSockets:** a two-way channel both sides can send on anytime."] },
    { title: "Choosing", body: [
      "Server → client only (queue displays, notifications, live headcount, AI text streaming): **SSE**. It's plain HTTP, and `EventSource` reconnects automatically. Both directions, frequently (chat, multiplayer, collaborative editing): **WebSockets**, but you handle reconnection yourself. Low-traffic dashboards: polling is fine."] },
    { title: "Behind a proxy", body: [
      "Proxies like to buffer responses, which breaks streaming. For SSE through nginx set `proxy_buffering off`. For WebSockets, forward the `Upgrade` headers. In the HR portal project, we also had to send `Cache-Control: no-transform` so Next.js's dev proxy wouldn't compress the stream."] },
  ],
  rendering: [
    { title: "Where is the HTML built?", body: [
      "**CSR (client-side):** the server sends an empty shell plus JavaScript, and the browser builds the page. Fast navigation after load, slow first view, weak SEO. **SSR (server-side):** the server builds HTML for each request. Personal data and SEO, at the cost of server work per request.",
      "**SSG (static):** HTML built once at deploy time. Fastest and cheapest, but content is fixed until the next build. **ISR:** static, regenerated in the background every N seconds. Static speed with fresh-enough content."] },
    { title: "Picking per page", body: [
      "Ask two questions: is it the same for everyone, and how often does it change? Public and rarely changing (docs, announcements) → SSG/ISR. Personal or must be real-time (dashboard, grades) → SSR or client fetch after login. One Next.js app can mix all of these page by page."] },
  ],
  "devtools-a11y": [
    { title: "DevTools: see what the browser sees", body: [
      "**Elements:** inspect and live-edit HTML and CSS. **Console:** errors (CORS errors show here) and running JS. **Network:** every request with its status, headers, timing and the OPTIONS preflight; \"Copy as cURL\" reproduces a request in Terminal. **Application:** cookies (check the HttpOnly and SameSite flags) and storage. **Performance / Lighthouse:** find long tasks and audit the page."] },
    { title: "Accessibility: built for everyone", body: [
      "Some users navigate by keyboard only, use screen readers, or have low vision. Semantic HTML does most of the work: a real `<button>` is focusable and keyboard-operable for free, while a `<div onclick>` isn't. Every input needs a `<label>`; images need `alt` text.",
      "Check contrast (4.5:1 for text), make the focus outline visible, and don't use color alone to show meaning. Test with Tab and with VoiceOver (Cmd+F5 on your Mac). Accessibility is also part of ISO 25010 usability, which your capstone is evaluated on."] },
  ],
};
