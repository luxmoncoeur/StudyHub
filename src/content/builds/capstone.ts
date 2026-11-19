// Generated from tested project files. Do not edit by hand.
import type { Guide } from "../types";

export const builds: Record<string, Guide> = {
 "Clickable prototype": {
  "where": "Next.js on your Mac (fake data, no backend)",
  "time": "1 weekend",
  "youNeed": [
   "Node.js 20+",
   "Your chosen title (the example is an RHU appointment system)"
  ],
  "tree": "clickable-prototype/\n  DEMO-SCRIPT.md\n  src/\n    app/\n      admin/\n        page.tsx\n      book/\n        page.tsx\n      confirmation/\n        [id]/\n          confirmation.tsx\n          page.tsx\n      page.tsx\n    lib/\n      data.ts",
  "steps": [
   {
    "title": "Create the Next.js project",
    "body": [
     "This makes a fresh Next.js 16 app with TypeScript, Tailwind and the App Router. Accept the defaults."
    ],
    "commands": [
     {
      "cmd": "cd ~/Developments && npx create-next-app@latest clickable-prototype --yes",
      "purpose": "New Next.js app"
     },
     {
      "cmd": "cd clickable-prototype && code .",
      "purpose": "Open it in VS Code"
     }
    ]
   },
   {
    "title": "Fake data",
    "body": [
     "Saved in localStorage so bookings survive a refresh during the demo. Replace it with an API later."
    ],
    "files": [
     {
      "title": "src/lib/data.ts",
      "variants": {
       "ts": "// Fake data for the prototype. No backend yet: everything lives in the browser.\nexport type Appointment = {\n  id: string;\n  patient: string;\n  contact: string;\n  service: string;\n  date: string;\n  time: string;\n  status: \"Waiting\" | \"Serving\" | \"Done\";\n};\n\nexport const SERVICES = [\"General check-up\", \"Prenatal check-up\", \"Immunization\", \"Dental\", \"TB-DOTS\"];\nexport const TIMES = [\"8:00 AM\", \"9:00 AM\", \"10:00 AM\", \"1:00 PM\", \"2:00 PM\", \"3:00 PM\"];\n\nexport const SEED: Appointment[] = [\n  { id: \"RHU-1001\", patient: \"Maria Santos\", contact: \"0917 123 4567\", service: \"Prenatal check-up\", date: \"2026-11-24\", time: \"8:00 AM\", status: \"Serving\" },\n  { id: \"RHU-1002\", patient: \"Jose Ramos\", contact: \"0918 222 3344\", service: \"General check-up\", date: \"2026-11-24\", time: \"9:00 AM\", status: \"Waiting\" },\n  { id: \"RHU-1003\", patient: \"Lorna Bautista\", contact: \"0920 555 7788\", service: \"Immunization\", date: \"2026-11-24\", time: \"10:00 AM\", status: \"Waiting\" },\n];\n\nconst KEY = \"rhu-appointments\";\n\nexport function loadAppointments(): Appointment[] {\n  if (typeof window === \"undefined\") return SEED;\n  const raw = localStorage.getItem(KEY);\n  return raw ? JSON.parse(raw) : SEED;\n}\n\nexport function saveAppointments(list: Appointment[]) {\n  localStorage.setItem(KEY, JSON.stringify(list));\n}\n"
      }
     }
    ]
   },
   {
    "title": "Screen 1: landing",
    "files": [
     {
      "title": "src/app/page.tsx",
      "variants": {
       "ts": "import Link from \"next/link\";\n\nexport default function Home() {\n  return (\n    <main className=\"mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-8\">\n      <p className=\"text-sm font-medium text-emerald-700\">Barangay San Isidro Rural Health Unit</p>\n      <h1 className=\"text-4xl font-bold tracking-tight\">Book a check-up without waiting in line.</h1>\n      <p className=\"text-gray-600\">Pick a service and time slot. You&apos;ll get an SMS reminder the day before.</p>\n      <div className=\"flex gap-3\">\n        <Link href=\"/book\" className=\"rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white\">Book an appointment</Link>\n        <Link href=\"/admin\" className=\"rounded-lg border px-5 py-3 font-medium\">Staff: today&apos;s queue</Link>\n      </div>\n    </main>\n  );\n}\n"
      }
     }
    ]
   },
   {
    "title": "Screen 2: booking form",
    "body": [
     "It validates a PH mobile number, which shows the panel you thought about real users."
    ],
    "files": [
     {
      "title": "src/app/book/page.tsx",
      "variants": {
       "ts": "\"use client\";\n\nimport { useRouter } from \"next/navigation\";\nimport { useState } from \"react\";\nimport { SERVICES, TIMES, loadAppointments, saveAppointments } from \"@/lib/data\";\n\nexport default function BookPage() {\n  const router = useRouter();\n  const [form, setForm] = useState({ patient: \"\", contact: \"\", service: SERVICES[0], date: \"\", time: \"\" });\n  const [error, setError] = useState(\"\");\n\n  function submit(e: React.FormEvent) {\n    e.preventDefault();\n    if (!/^09\\d{2} ?\\d{3} ?\\d{4}$/.test(form.contact)) return setError(\"Enter a PH mobile number like 0917 123 4567.\");\n    if (!form.time) return setError(\"Pick a time slot.\");\n    const list = loadAppointments();\n    const id = `RHU-${1000 + list.length + 1}`;\n    saveAppointments([...list, { id, ...form, status: \"Waiting\" }]);\n    router.push(`/confirmation/${id}`);\n  }\n\n  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });\n\n  return (\n    <main className=\"mx-auto max-w-lg space-y-6 p-8\">\n      <h1 className=\"text-2xl font-bold\">Book an appointment</h1>\n      <form onSubmit={submit} className=\"space-y-4\">\n        <label className=\"block\">Full name\n          <input required value={form.patient} onChange={set(\"patient\")} className=\"mt-1 w-full rounded border px-3 py-2\" />\n        </label>\n        <label className=\"block\">Mobile number (for SMS reminder)\n          <input required value={form.contact} onChange={set(\"contact\")} placeholder=\"0917 123 4567\" className=\"mt-1 w-full rounded border px-3 py-2\" />\n        </label>\n        <label className=\"block\">Service\n          <select value={form.service} onChange={set(\"service\")} className=\"mt-1 w-full rounded border px-3 py-2\">\n            {SERVICES.map((s) => <option key={s}>{s}</option>)}\n          </select>\n        </label>\n        <label className=\"block\">Date\n          <input required type=\"date\" value={form.date} onChange={set(\"date\")} className=\"mt-1 w-full rounded border px-3 py-2\" />\n        </label>\n        <fieldset>\n          <legend className=\"mb-1\">Time slot</legend>\n          <div className=\"grid grid-cols-3 gap-2\">\n            {TIMES.map((t) => (\n              <button type=\"button\" key={t} onClick={() => setForm({ ...form, time: t })} aria-pressed={form.time === t}\n                className={`rounded border py-2 text-sm ${form.time === t ? \"border-emerald-700 bg-emerald-50 font-medium\" : \"\"}`}>\n                {t}\n              </button>\n            ))}\n          </div>\n        </fieldset>\n        {error && <p role=\"alert\" className=\"text-sm text-red-600\">{error}</p>}\n        <button className=\"w-full rounded-lg bg-emerald-700 py-3 font-medium text-white\">Confirm booking</button>\n      </form>\n    </main>\n  );\n}\n"
      }
     }
    ]
   },
   {
    "title": "Screen 3: confirmation + SMS preview",
    "body": [
     "The server page reads the URL inside `<Suspense>` and passes the id to the client component (Next 16 rule)."
    ],
    "files": [
     {
      "title": "src/app/confirmation/[id]/page.tsx",
      "variants": {
       "ts": "import { Suspense } from \"react\";\nimport { Confirmation } from \"./confirmation\";\n\n// Server page reads the URL inside Suspense, then hands the id to the client component\nexport default function ConfirmationPage({ params }: PageProps<\"/confirmation/[id]\">) {\n  return (\n    <Suspense fallback={<p className=\"p-8\">Loading…</p>}>\n      <WithId params={params} />\n    </Suspense>\n  );\n}\n\nasync function WithId({ params }: Pick<PageProps<\"/confirmation/[id]\">, \"params\">) {\n  const { id } = await params;\n  return <Confirmation id={id} />;\n}\n"
      }
     },
     {
      "title": "src/app/confirmation/[id]/confirmation.tsx",
      "variants": {
       "ts": "\"use client\";\n\nimport Link from \"next/link\";\nimport { useEffect, useState } from \"react\";\nimport { type Appointment, loadAppointments } from \"@/lib/data\";\n\nexport function Confirmation({ id }: { id: string }) {\n  const [appt, setAppt] = useState<Appointment | null | undefined>(undefined);\n  useEffect(() => { setAppt(loadAppointments().find((a) => a.id === id) ?? null); }, [id]);\n\n  if (appt === undefined) return <p className=\"p-8\">Loading…</p>;\n  if (appt === null) return <p className=\"p-8\">Appointment not found. <Link href=\"/book\" className=\"underline\">Book again</Link></p>;\n\n  return (\n    <main className=\"mx-auto max-w-lg space-y-6 p-8\">\n      <h1 className=\"text-2xl font-bold\">You&apos;re booked! ✅</h1>\n      <div className=\"rounded-lg border p-4\">\n        <p className=\"text-sm text-gray-500\">Reference no.</p>\n        <p className=\"font-mono text-2xl font-bold\">{appt.id}</p>\n        <p className=\"mt-3\">{appt.service} · {appt.date} at {appt.time}</p>\n      </div>\n      <div className=\"rounded-lg bg-gray-100 p-4 text-sm\">\n        <p className=\"mb-1 font-medium\">SMS preview (sent to {appt.contact} the day before)</p>\n        <p className=\"font-mono\">RHU San Isidro: Hi {appt.patient.split(\" \")[0]}, paalala po ng {appt.service} bukas, {appt.time}. Ref {appt.id}. Reply CANCEL to cancel.</p>\n      </div>\n      <Link href=\"/\" className=\"underline\">Back to home</Link>\n    </main>\n  );\n}\n"
      }
     }
    ]
   },
   {
    "title": "Screen 4: staff queue",
    "files": [
     {
      "title": "src/app/admin/page.tsx",
      "variants": {
       "ts": "\"use client\";\n\nimport { useEffect, useState } from \"react\";\nimport { type Appointment, loadAppointments, saveAppointments } from \"@/lib/data\";\n\nconst NEXT: Record<Appointment[\"status\"], Appointment[\"status\"]> = { Waiting: \"Serving\", Serving: \"Done\", Done: \"Done\" };\n\nexport default function AdminPage() {\n  const [list, setList] = useState<Appointment[]>([]);\n  useEffect(() => { setList(loadAppointments()); }, []);\n\n  function advance(id: string) {\n    const updated = list.map((a) => (a.id === id ? { ...a, status: NEXT[a.status] } : a));\n    setList(updated);\n    saveAppointments(updated);\n  }\n\n  const serving = list.find((a) => a.status === \"Serving\");\n\n  return (\n    <main className=\"mx-auto max-w-3xl space-y-6 p-8\">\n      <h1 className=\"text-2xl font-bold\">Today&apos;s queue</h1>\n      <div className=\"rounded-lg bg-emerald-700 p-6 text-white\">\n        <p className=\"text-sm opacity-80\">Now serving</p>\n        <p className=\"text-3xl font-bold\">{serving ? `${serving.id} · ${serving.patient}` : \"—\"}</p>\n      </div>\n      <table className=\"w-full text-sm\">\n        <thead><tr className=\"border-b text-left\"><th className=\"py-2\">Ref</th><th>Patient</th><th>Service</th><th>Time</th><th>Status</th><th /></tr></thead>\n        <tbody>\n          {list.map((a) => (\n            <tr key={a.id} className=\"border-b\">\n              <td className=\"py-2 font-mono\">{a.id}</td><td>{a.patient}</td><td>{a.service}</td><td>{a.time}</td>\n              <td>{a.status}</td>\n              <td>{a.status !== \"Done\" && <button onClick={() => advance(a.id)} className=\"rounded border px-2 py-1\">{a.status === \"Waiting\" ? \"Call\" : \"Done\"}</button>}</td>\n            </tr>\n          ))}\n        </tbody>\n      </table>\n    </main>\n  );\n}\n"
      }
     }
    ]
   },
   {
    "title": "Rehearse the demo",
    "files": [
     {
      "title": "DEMO-SCRIPT.md",
      "variants": {
       "text": "# 2-minute demo script (proposal defense)\n\n1. **Home (10 s):** \"Patients of the San Isidro RHU wait 2–3 hours in line. Our system lets them book a slot.\"\n2. **Book (40 s):** Enter *Juan Dela Cruz*, `0917 123 4567`, *General check-up*, tomorrow, 9:00 AM. Show the validation by typing a wrong number first.\n3. **Confirmation (20 s):** Point at the reference number and the **SMS preview**. \"This is objective #2: an SMS reminder 24 hours before.\"\n4. **Staff queue (40 s):** Open `/admin`. Click **Call** on the next patient, then **Done**. \"Now serving\" updates. \"This replaces the paper logbook.\"\n5. **Close (10 s):** \"The real version stores bookings in PostgreSQL and sends SMS through an SMS gateway API.\"\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "npm run dev",
      "purpose": "http://localhost:3000"
     }
    ]
   }
  ],
  "done": [
   "Book → confirmation → staff queue works end to end.",
   "You can do the 2-minute script without notes."
  ]
 }
};
