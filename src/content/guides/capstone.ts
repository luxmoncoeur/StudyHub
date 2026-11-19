import type { Guide } from "../types";

export const guides: Record<string, Guide> = {
  "Title workshop": {
    where: "Google Docs with your group",
    time: "1.5 hours",
    steps: [
      { title: "Brainstorm problems, not apps", body: ["List 10 real problems you've seen at school, at home, in your barangay or a family business. Who suffers, and how often?"] },
      { title: "Write 3 titles with the formula", body: ["`[System type] + [core technique] + for [specific client]`.", "Bad: *Inventory System*. Good: *Web-Based Inventory and POS with Low-Stock SMS Alerts for Aling Nena's Sari-Sari Store*."] },
      { title: "Run the feasibility checklist", body: ["For each title: a real client who will sign? Data you can actually get? Someone who knows the stack? Hardware under ₱5,000? 5–7 modules max? Score each one out of 6."] },
      { title: "Answer the panel questions in writing", body: ["For the best title, answer: Who exactly are the users? How is it different from existing systems? What's out of scope? How will you evaluate it? What if the client backs out?"] },
    ],
    done: ["1 title scores 6/6 on feasibility.", "You can answer all 5 questions without hesitating."],
  },
  "Mock defense": {
    where: "Google Slides + a friend or family member as panel",
    time: "2 hours (prep + run)",
    steps: [
      { title: "Build 7 slides", body: ["Title · Problem (with a real number or quote from the client) · Beneficiaries · Solution (3–5 features) · Scope and delimitations · Tech stack and team skills · 16-week Gantt chart."] },
      { title: "Rehearse to time", body: ["Present in **7 minutes** with a timer. Cut anything that pushes you over."] },
      { title: "Get grilled", body: ["Give your mock panel the question list from the *Title defense* lesson. Record the Q&A on your phone."] },
      { title: "Review and fix", body: ["Watch the recording. Note every answer that started with \"uhm\" or \"I think\", and write a better answer for each."] },
    ],
    done: ["Presentation fits in 7 minutes.", "You have prepared answers for the 10 common panel questions."],
  },
  "RRL hunt": {
    where: "Google Scholar + PH university repositories",
    time: "2–3 hours",
    steps: [
      { title: "Search smart", body: ["Google Scholar: set **Since 2021**. Try `\"web-based\" appointment system Philippines`, `IoT water quality monitoring aquaculture`, etc.", "Local sources: university repositories, PSU/ResearchGate, and the *Asia Pacific Journal of Multidisciplinary Research*."] },
      { title: "Build a matrix", body: ["Columns: Author (Year) | Title | Local or Foreign | Features | Tools | Gap / limitation. Aim for 5 foreign + 5 local."] },
      { title: "Write the synthesis", body: ["One paragraph: what most studies did, what they lacked, and how your system fills that gap. The gap is your justification."] },
    ],
    done: ["10 studies in the matrix, all from the last 5 years.", "A synthesis paragraph that ends with your system's gap."],
  },
  "Survey dry run": {
    where: "Google Forms + this app's Likert demo",
    time: "1 hour",
    steps: [
      { title: "Write the instrument", body: ["3 statements per ISO 25010 characteristic, e.g. Usability: *\"The system is easy to learn.\"* Use a 5-point scale (5 = Strongly Agree)."] },
      { title: "Collect test responses", body: ["Send the Google Form to 10 classmates. Export the responses to Sheets."] },
      { title: "Compute the weighted mean", body: ["Count the frequency of each score per characteristic, enter them in the **Likert demo** (Evaluation lesson), and read the interpretation.", "In Sheets: `=AVERAGE(range)` gives the same weighted mean."] },
    ],
    done: ["Every characteristic has a WM and a verbal interpretation.", "You can show the formula Σ(f×w)/N by hand for one row."],
  },
  "Capstone proposal kit": {
    where: "Google Docs + draw.io + Sheets",
    time: "1–2 weeks",
    steps: [
      { title: "Concept paper (1 page)", body: ["Title, problem, objectives (general + 3–5 specific SMART objectives), scope, and beneficiaries."] },
      { title: "Context diagram", body: ["draw.io: your system in the middle, external entities around it (Customer, Admin, SMS Gateway), and labeled data flows."] },
      { title: "ERD", body: ["dbdiagram.io: entities, PKs/FKs, cardinalities. Normalize to 3NF (Database course, normalization lesson)."] },
      { title: "Gantt chart", body: ["Sheets: 16 weeks. Rows = requirements, design, sprints 1–5, testing, documentation, defense prep. Color by member."] },
    ],
    done: ["4 deliverables in one shared folder.", "Your adviser can understand the system from the context diagram alone."],
  },
  "Clickable prototype": {
    where: "Next.js + shadcn/ui on your Mac",
    time: "2 weekends",
    steps: [
      { title: "Scaffold", commands: [{ cmd: "npx create-next-app@latest proto && cd proto && npx shadcn@latest init", purpose: "Next.js + shadcn/ui" }, { cmd: "npx shadcn@latest add button card table dialog input form", purpose: "Common components" }] },
      { title: "Pick 3 core screens", body: ["The screens that prove your main objective, e.g. booking form → admin queue → SMS confirmation preview. Use fake data in a JSON file, no backend yet."] },
      { title: "Make it clickable", body: ["Link the screens with `<Link>`, add form validation and one dialog. Show realistic Filipino sample data (names, ₱ amounts)."] },
      { title: "Demo script", body: ["Write a 2-minute click-through for the proposal defense. Practice it twice."] },
    ],
    done: ["3 screens that link together and run with `npm run dev`.", "Someone outside your group can complete the main task without help."],
  },
};
