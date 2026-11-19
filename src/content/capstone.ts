import type { Course } from "./types";

export const capstone: Course = {
  code: "CAPSONE",
  slug: "capstone",
  title: "Capstone Project and Research 1",
  units: 3,
  accent: "#f472b6",
  tagline: "Pick a defensible title, write Chapters 1–3, pass the defense.",
  ched: "Under CMO 25 s.2015 the BSIT capstone is a system application that solves a real problem or need, built over two 3-unit courses and presented in a public forum. Capstone 1 usually covers the title defense, the Chapters 1–3 proposal and the proposal defense, sometimes with a partial prototype.",
  lessons: [
    {
      slug: "choosing-topic",
      title: "Choosing a strong topic",
      why: "Most of the struggle happens here. A feasible, specific title saves you months.",
      points: [
        "Formula: `[System type] + [core technique] + for [specific client]`. E.g. *Web-Based Appointment System with SMS Notification for Barangay San Isidro Health Center*.",
        "Checklist: a real client who will sign, data you can actually get, at least 1 member who knows the stack, hardware under ~₱5,000, 5–7 core modules.",
        "Why titles get rejected: vague, too big for ~4 months, weak problem statement, duplicate in the batch, no differentiator.",
        "Avoid: a generic SIS with no twist, an \"AI chatbot for everything\", claims of accuracy with no labeled dataset, anything needing medical or financial licensing.",
      ],
    },
    {
      slug: "title-ideas",
      title: "20 title ideas (2025–2026)",
      why: "Starting points. Narrow each to one client and 5–7 modules.",
      points: [
        "**Web/Gov**: barangay certificate portal with OCR ID check · RHU appointment and queue with SMS · LGU scholarship ranking · barangay water billing with offline sync.",
        "**IoT**: aquaculture water-quality monitor (pH, temp, DO) · flood early warning with river-level sensor · smart parking occupancy · classroom energy monitor with auto shutoff.",
        "**AI**: RAG chatbot over the student handbook (with citations) · rice/corn leaf disease CNN (offline) · at-risk student early-warning dashboard · Taglish meeting-minutes generator.",
        "**Business**: sari-sari POS with double-entry ledger (ties to ACCTNG1) · TODA dispatch with GPS · event ticketing with QR check-in · boarding-house finder.",
        "**Other**: thesis archive with semantic search · face-recognition attendance with liveness (RA 10173 consent) · poultry farm management + IoT temp · screen-reader-first e-learning (WCAG 2.2 AA).",
        "These are suggestions, not from an official list. AI titles will get the question \"What's your dataset and how do you measure precision, recall and F1?\"",
      ],
    },
    {
      slug: "title-defense",
      title: "Title defense",
      why: "5–10 minutes of slides, then 10–20 minutes of panel questions.",
      points: [
        "Slides (5–7): Title · Problem · Beneficiaries · Solution (3–5 features) · Scope/Delimitations · Tech stack and team skills · 12–16-week Gantt chart.",
        "Expect: Who exactly are your users? How is it different from existing systems? Can you finish in 4 months? What's in and out of scope? How will you evaluate it? What if a dependency fails?",
        "Be able to explain every word in your title. \"I just felt like it\" gets rejected.",
        "Outcomes: Approved · Approved with revisions (most common) · Rejected (re-defend in 1–2 weeks).",
      ],
    },
    {
      slug: "chapters",
      title: "Chapters 1–3",
      why: "The proposal manuscript. Every school's template varies slightly, so follow yours.",
      points: [
        "**Ch 1 Introduction**: Project context · Purpose · General and specific objectives (SMART) · Scope and limitations · Significance · Definition of terms.",
        "**Ch 2 RRL/RRS**: foreign and local literature and studies (last 5–10 years) → synthesis → the gap your system fills → conceptual framework (IPO).",
        "**Ch 3 Methodology**: research design · SDLC model · requirements · design (context diagram, DFD/use case, ERD, wireframes) · tools · testing · respondents and sampling · instrument · statistical treatment.",
        "Write specific objectives as features you can test: \"To develop a module that sends SMS reminders 24 hours before an appointment.\"",
      ],
    },
    {
      slug: "sdlc",
      title: "SDLC models",
      why: "The panel will ask \"Why this model?\" Tie the answer to your constraints.",
      points: [
        "**Agile/Scrum**: 1–2-week sprints with a demo each sprint. Fits changing requirements and a client who can review often. The most common pick today.",
        "**Waterfall**: sequential phases. Fits fixed, well-understood requirements.",
        "**Prototyping**: build, user feedback, refine. Fits when the UI or requirements are unclear.",
        "**RAD / Iterative**: short timelines, module-by-module delivery.",
        "Good answer: \"Our client is available every 2 weeks, so we use 2-week sprints with a review demo.\"",
      ],
    },
    {
      slug: "evaluation",
      title: "ISO/IEC 25010 + weighted mean",
      why: "How almost every PH capstone proves the system works.",
      points: [
        "ISO 25010:2011 (still in most PH templates): Functional Suitability, Performance Efficiency, Compatibility, Usability, Reliability, Security, Maintainability, Portability.",
        "The 2023 edition has 9 characteristics with some renames. Use whichever version your adviser specifies.",
        "`WM = Σ(f × w) / N`. Example: 30 respondents, 5→14, 4→11, 3→4, 2→1 gives 128 / 30 = **4.27 → Excellent**.",
        "Bands are 0.80 wide: 4.21–5.00 · 3.41–4.20 · 2.61–3.40 · 1.81–2.60 · 1.00–1.80. Some schools use 4.20 as the cutoff, so check your template.",
      ],
      demo: "likert",
      code: [{
        title: "Weighted mean",
        variants: {
          python: `def weighted_mean(freq):  # freq = {5: 14, 4: 11, 3: 4, 2: 1, 1: 0}
    n = sum(freq.values())
    return sum(w * f for w, f in freq.items()) / n

weighted_mean({5: 14, 4: 11, 3: 4, 2: 1, 1: 0})  # 4.2666...`,
          js: `const weightedMean = (freq) => {
  const n = Object.values(freq).reduce((a, b) => a + b, 0);
  return Object.entries(freq).reduce((s, [w, f]) => s + w * f, 0) / n;
};`,
          postgres: `-- responses(criterion, score 1..5)
SELECT criterion, ROUND(AVG(score), 2) AS weighted_mean, COUNT(*) AS n
FROM responses GROUP BY criterion;`,
        },
      }],
    },
    {
      slug: "team-workflow",
      title: "Team workflow & tooling",
      why: "Panels and advisers increasingly ask to see your repo and task board.",
      beyond: true,
      points: [
        "Git: a `main` branch with feature branches and pull requests. Every member commits, because panels check contributions.",
        "Task board (GitHub Projects or Trello): backlog → doing → review → done. This is your Scrum evidence.",
        "Keep design docs (ERD, DFD, wireframes) in the repo and in Figma so Chapter 3 diagrams stay current.",
        "Data privacy (RA 10173): get consent for any personal data, collect only what you need, and mention it in the scope.",
      ],
      commands: [
        { cmd: "git switch -c feature/sms-reminder", purpose: "Create and switch to a feature branch" },
        { cmd: "git pull --rebase origin main", purpose: "Update your branch with teammates' work without merge noise" },
        { cmd: "git log --oneline --graph --all", purpose: "See the branch history and who did what" },
        { cmd: "gh pr create --fill", purpose: "Open a pull request from the terminal (GitHub CLI)" },
        { cmd: "git shortlog -sn", purpose: "Count commits per member (panels look at this)" },
      ],
    },
  ],
  activities: [
    { title: "Title workshop", steps: ["Write 3 titles using the formula.", "Run each one through the feasibility checklist.", "Answer the 10 panel questions for your best title in writing."] },
    { title: "Mock defense", steps: ["Make the 7-slide deck.", "Present to a friend for 7 minutes with a timer.", "Have them ask the hardest questions from the title defense lesson."] },
    { title: "RRL hunt", steps: ["Find 5 foreign and 5 local studies from the last 5 years (Google Scholar, PH university repositories).", "Make a matrix: author, year, features, gap.", "Write a 1-paragraph synthesis."] },
    { title: "Survey dry run", steps: ["Write 3 ISO 25010 questions per characteristic.", "Collect 10 fake responses in the Likert demo.", "Interpret the overall mean."] },
  ],
  projects: [
    { title: "Capstone proposal kit", level: "Core", scope: "A title, a 1-page concept paper, a context diagram, an ERD and a 16-week Gantt chart for your chosen topic.", stack: ["Figma", "draw.io", "Sheets"] },
    { title: "Clickable prototype", level: "Stretch", scope: "Front-end prototype of 3 core modules to show at the proposal defense.", stack: ["Next.js", "shadcn/ui"] },
  ],
};
