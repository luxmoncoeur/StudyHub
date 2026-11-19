// Generated from tested project files. Do not edit by hand.
import type { Guide } from "../types";

export const builds: Record<string, Guide> = {
 "Campus order & pickup": {
  "where": "Docker Compose: RabbitMQ + Node API + Python kitchen + Node notifier",
  "time": "1–2 weekends",
  "youNeed": [
   "Docker Desktop or OrbStack running"
  ],
  "tree": "campus-order/\n  api/\n    Dockerfile\n    package.json\n    server.js\n  compose.yaml\n  demo.sh\n  kitchen/\n    Dockerfile\n    requirements.txt\n    worker.py\n  notifier/\n    Dockerfile\n    notifier.js\n    package.json",
  "steps": [
   {
    "title": "Create the folders",
    "commands": [
     {
      "cmd": "mkdir -p ~/Developments/campus-order/{api,kitchen,notifier} && cd ~/Developments/campus-order",
      "purpose": "4 services, 3 folders + RabbitMQ image"
     }
    ]
   },
   {
    "title": "compose.yaml",
    "body": [
     "`depends_on: service_healthy` waits for RabbitMQ to accept connections before starting the services."
    ],
    "files": [
     {
      "title": "compose.yaml",
      "variants": {
       "yaml": "services:\n  rabbitmq:\n    image: rabbitmq:4-management\n    ports: [\"5672:5672\", \"15672:15672\"]          # UI: http://localhost:15672  (guest / guest)\n    healthcheck:\n      test: [\"CMD\", \"rabbitmq-diagnostics\", \"-q\", \"ping\"]\n      interval: 5s\n      retries: 20\n\n  api:\n    build: ./api\n    ports: [\"4000:4000\"]\n    environment: { AMQP_URL: \"amqp://guest:guest@rabbitmq:5672\" }\n    depends_on: { rabbitmq: { condition: service_healthy } }\n\n  kitchen:\n    build: ./kitchen\n    environment: { AMQP_URL: \"amqp://guest:guest@rabbitmq:5672\" }\n    depends_on: { rabbitmq: { condition: service_healthy } }\n\n  notifier:\n    build: ./notifier\n    environment: { AMQP_URL: \"amqp://guest:guest@rabbitmq:5672\" }\n    depends_on: { rabbitmq: { condition: service_healthy } }\n"
      }
     }
    ]
   },
   {
    "title": "Order API (Node)",
    "body": [
     "**Idempotency-Key**: a retry with the same key gets the saved order instead of a duplicate.",
     "**Publisher confirms**: we answer 201 only after RabbitMQ has the message. The queue has a **dead-letter exchange** for poison messages."
    ],
    "files": [
     {
      "title": "api/package.json",
      "variants": {
       "json": "{ \"name\": \"order-api\", \"private\": true, \"dependencies\": { \"amqplib\": \"^0.10.4\", \"express\": \"^5.1.0\" } }\n"
      }
     },
     {
      "title": "api/Dockerfile",
      "variants": {
       "dockerfile": "FROM node:22-alpine\nWORKDIR /app\nCOPY package.json .\nRUN npm install --omit=dev\nCOPY . .\nCMD [\"node\", \"server.js\"]\n"
      }
     },
     {
      "title": "api/server.js",
      "variants": {
       "js": "const express = require(\"express\");\nconst amqp = require(\"amqplib\");\nconst crypto = require(\"crypto\");\n\nconst MENU = { adobo: 85, sisig: 95, \"pancit-canton\": 45, \"iced-tea\": 25 };\nconst orders = new Map();        // shortcut: in-memory; use Postgres in the real project\nconst idempotency = new Map();   // Idempotency-Key -> saved response\nlet channel;\n\nasync function connect() {\n  const conn = await amqp.connect(process.env.AMQP_URL);\n  channel = await conn.createConfirmChannel();\n  // Dead-letter setup: messages rejected by the kitchen land in orders.dead\n  await channel.assertExchange(\"dlx\", \"direct\", { durable: true });\n  await channel.assertQueue(\"orders.dead\", { durable: true });\n  await channel.bindQueue(\"orders.dead\", \"dlx\", \"orders\");\n  await channel.assertQueue(\"orders\", { durable: true, arguments: { \"x-dead-letter-exchange\": \"dlx\", \"x-dead-letter-routing-key\": \"orders\" } });\n  await channel.assertExchange(\"events\", \"topic\", { durable: true });\n  // listen for status updates so GET /orders/:id is current\n  const q = await channel.assertQueue(\"api.status\", { durable: true });\n  await channel.bindQueue(q.queue, \"events\", \"order.*\");\n  channel.consume(q.queue, (m) => {\n    const evt = JSON.parse(m.content);\n    const o = orders.get(evt.orderId);\n    if (o) o.status = evt.status;\n    channel.ack(m);\n  });\n}\n\nconst app = express();\napp.use(express.json());\n\napp.post(\"/orders\", async (req, res) => {\n  const key = req.get(\"Idempotency-Key\");\n  if (key && idempotency.has(key)) return res.status(201).json(idempotency.get(key));   // retry: same answer, no new order\n\n  const items = (req.body.items || []).filter((i) => MENU[i.name] && i.qty > 0);\n  if (!items.length || !req.body.studentId) return res.status(422).json({ error: \"studentId and valid items required\" });\n\n  const order = {\n    id: crypto.randomUUID(),\n    studentId: req.body.studentId,\n    items,\n    total: items.reduce((s, i) => s + MENU[i.name] * i.qty, 0),\n    status: \"QUEUED\",\n  };\n  orders.set(order.id, order);\n  // publish with confirm: only answer 201 once RabbitMQ has the message safely\n  channel.sendToQueue(\"orders\", Buffer.from(JSON.stringify(order)), { persistent: true, messageId: order.id });\n  await channel.waitForConfirms();\n  if (key) idempotency.set(key, order);\n  res.status(201).json(order);\n});\n\napp.get(\"/orders/:id\", (req, res) => {\n  const o = orders.get(req.params.id);\n  o ? res.json(o) : res.status(404).json({ error: \"not found\" });\n});\n\nconnect().then(() => app.listen(4000, () => console.log(\"order API on :4000\")));\n"
      }
     }
    ]
   },
   {
    "title": "Kitchen worker (Python)",
    "body": [
     "`prefetch_count=1` gives fair dispatch across cooks. Ack **after** cooking. An impossible order gets `nack(requeue=False)` and goes to the dead-letter queue instead of looping forever."
    ],
    "files": [
     {
      "title": "kitchen/requirements.txt",
      "variants": {
       "text": "pika==1.3.2\n"
      }
     },
     {
      "title": "kitchen/Dockerfile",
      "variants": {
       "dockerfile": "FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nCMD [\"python\", \"-u\", \"worker.py\"]\n"
      }
     },
     {
      "title": "kitchen/worker.py",
      "variants": {
       "python": "\"\"\"Kitchen worker: takes orders off the queue, 'cooks' them, publishes order.ready.\"\"\"\nimport json\nimport os\nimport random\nimport socket\nimport time\n\nimport pika\n\nparams = pika.URLParameters(os.environ[\"AMQP_URL\"])\nconn = pika.BlockingConnection(params)\nch = conn.channel()\nch.exchange_declare(\"events\", \"topic\", durable=True)\nch.queue_declare(\"orders\", durable=True, arguments={\"x-dead-letter-exchange\": \"dlx\", \"x-dead-letter-routing-key\": \"orders\"})\nch.basic_qos(prefetch_count=1)          # one order at a time per cook = fair dispatch\nme = socket.gethostname()\ndone = set()                            # idempotent receiver: skip duplicate deliveries\n\n\ndef publish(order_id, status):\n    ch.basic_publish(\"events\", f\"order.{status.lower()}\",\n                     json.dumps({\"orderId\": order_id, \"status\": status, \"by\": me}),\n                     pika.BasicProperties(delivery_mode=2))\n\n\ndef on_order(channel, method, props, body):\n    order = json.loads(body)\n    if order[\"id\"] in done:\n        channel.basic_ack(method.delivery_tag)\n        return\n    if any(i[\"qty\"] > 20 for i in order[\"items\"]):           # poison message: never retry, dead-letter it\n        print(f\"[{me}] rejecting impossible order {order['id'][:8]}\", flush=True)\n        channel.basic_nack(method.delivery_tag, requeue=False)\n        return\n    publish(order[\"id\"], \"COOKING\")\n    time.sleep(random.uniform(1, 3))                          # cooking...\n    publish(order[\"id\"], \"READY\")\n    done.add(order[\"id\"])\n    channel.basic_ack(method.delivery_tag)                    # ack AFTER the work is done\n    print(f\"[{me}] ready {order['id'][:8]} for {order['studentId']}\", flush=True)\n\n\nch.basic_consume(\"orders\", on_order)\nprint(f\"[{me}] kitchen waiting for orders\", flush=True)\nch.start_consuming()\n"
      }
     }
    ]
   },
   {
    "title": "Notifier (Node)",
    "body": [
     "Listens only to `order.ready` on the topic exchange. Swap the console.log for a real SMS API later."
    ],
    "files": [
     {
      "title": "notifier/package.json",
      "variants": {
       "json": "{ \"name\": \"notifier\", \"private\": true, \"dependencies\": { \"amqplib\": \"^0.10.4\" } }\n"
      }
     },
     {
      "title": "notifier/Dockerfile",
      "variants": {
       "dockerfile": "FROM node:22-alpine\nWORKDIR /app\nCOPY package.json .\nRUN npm install --omit=dev\nCOPY . .\nCMD [\"node\", \"notifier.js\"]\n"
      }
     },
     {
      "title": "notifier/notifier.js",
      "variants": {
       "js": "// Sends the \"your order is ready\" SMS. Here it just logs; swap in an SMS API (e.g. Semaphore) later.\nconst amqp = require(\"amqplib\");\n\n(async () => {\n  const conn = await amqp.connect(process.env.AMQP_URL);\n  const ch = await conn.createChannel();\n  await ch.assertExchange(\"events\", \"topic\", { durable: true });\n  const q = await ch.assertQueue(\"notifier\", { durable: true });\n  await ch.bindQueue(q.queue, \"events\", \"order.ready\");      // only care about READY\n  ch.consume(q.queue, (m) => {\n    const evt = JSON.parse(m.content);\n    console.log(`SMS -> order ${evt.orderId.slice(0, 8)} is READY for pickup (cooked by ${evt.by})`);\n    ch.ack(m);\n  });\n  console.log(\"notifier listening for order.ready\");\n})();\n"
      }
     }
    ]
   },
   {
    "title": "Run the demo",
    "files": [
     {
      "title": "demo.sh",
      "variants": {
       "bash": "#!/usr/bin/env bash\n# Place orders, retry one with the same key, send a poison order, then check queues.\nH='Content-Type: application/json'\nfor i in 1 2 3 4 5 6; do\n  curl -s -X POST localhost:4000/orders -H \"$H\" -d \"{\\\"studentId\\\":\\\"2024-000$i\\\",\\\"items\\\":[{\\\"name\\\":\\\"adobo\\\",\\\"qty\\\":1},{\\\"name\\\":\\\"iced-tea\\\",\\\"qty\\\":2}]}\" | head -c 60; echo\ndone\necho \"-- double-click with the same Idempotency-Key:\"\nfor i in 1 2; do curl -s -X POST localhost:4000/orders -H \"$H\" -H \"Idempotency-Key: tap-42\" -d '{\"studentId\":\"2024-0099\",\"items\":[{\"name\":\"sisig\",\"qty\":1}]}' | head -c 60; echo; done\necho \"-- poison order (qty 99):\"\ncurl -s -X POST localhost:4000/orders -H \"$H\" -d '{\"studentId\":\"2024-0100\",\"items\":[{\"name\":\"adobo\",\"qty\":99}]}' | head -c 60; echo\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "docker compose up -d --build",
      "purpose": "Build + start everything"
     },
     {
      "cmd": "docker compose up -d --scale kitchen=3",
      "purpose": "3 cooks"
     },
     {
      "cmd": "chmod +x demo.sh && ./demo.sh",
      "purpose": "6 orders, a double-tap, a poison order"
     },
     {
      "cmd": "docker compose logs -f kitchen notifier",
      "purpose": "Watch the cooks share the work + SMS lines"
     },
     {
      "cmd": "docker compose exec rabbitmq rabbitmqctl list_queues name messages consumers",
      "purpose": "orders.dead = 1 (the poison order)"
     },
     {
      "cmd": "docker compose down",
      "purpose": "Stop"
     }
    ]
   }
  ],
  "done": [
   "The double-tap returns the same order id.",
   "Work is spread across 3 kitchen containers.",
   "The poison order is in orders.dead, and GET /orders/:id shows QUEUED → COOKING → READY."
  ]
 },
 "Enrollment ↔ Cashier ↔ LMS": {
  "where": "Docker Compose: Node + Python + Java services + RabbitMQ",
  "time": "2 weekends",
  "youNeed": [
   "Docker Desktop or OrbStack running (the Java build downloads Maven the first time, ~5 min)"
  ],
  "tree": "enrollment-saga/\n  EVENTS.md\n  cashier/\n    Dockerfile\n    cashier.py\n    requirements.txt\n  compose.yaml\n  demo.sh\n  enrollment/\n    Dockerfile\n    package.json\n    server.js\n  lms/\n    Dockerfile\n    pom.xml\n    src/\n      main/\n        java/\n          edu/\n            campus/\n              lms/\n                App.java",
  "steps": [
   {
    "title": "Create the folders",
    "commands": [
     {
      "cmd": "mkdir -p ~/Developments/enrollment-saga/{enrollment,cashier,lms/src/main/java/edu/campus/lms} && cd ~/Developments/enrollment-saga",
      "purpose": "3 services"
     }
    ]
   },
   {
    "title": "Agree on the event contract first",
    "body": [
     "This canonical data model is what lets 3 languages work together without knowing about each other."
    ],
    "files": [
     {
      "title": "EVENTS.md",
      "variants": {
       "text": "# Event contract (canonical data model)\n\nEvery message on the `campus` topic exchange looks like:\n\n```json\n{ \"eventId\": \"uuid\", \"type\": \"student.enrolled\", \"occurredAt\": \"2026-11-20T08:00:00Z\", \"data\": { ... } }\n```\n\n| type | published by | data | consumed by |\n|------|--------------|------|-------------|\n| `student.enrolled` | enrollment | `enrollmentId, studentId, name, units` | cashier |\n| `fees.assessed` | cashier | `enrollmentId, studentId, name, amount` | lms, enrollment |\n| `payment.failed` | cashier | `enrollmentId, reason` | enrollment (compensates: CANCELLED) |\n| `lms.account.created` | lms | `enrollmentId, username` | enrollment (ACTIVE) |\n\nRules: consumers dedupe by `eventId` (idempotent receiver) and ack only after processing.\n"
      }
     },
     {
      "title": "compose.yaml",
      "variants": {
       "yaml": "services:\n  rabbitmq:\n    image: rabbitmq:4-management\n    ports: [\"5672:5672\", \"15672:15672\"]\n    healthcheck: { test: [\"CMD\", \"rabbitmq-diagnostics\", \"-q\", \"ping\"], interval: 5s, retries: 20 }\n\n  enrollment:            # Node.js: REST API + saga coordinator\n    build: ./enrollment\n    ports: [\"4000:4000\"]\n    environment: { AMQP_URL: \"amqp://guest:guest@rabbitmq:5672\" }\n    depends_on: { rabbitmq: { condition: service_healthy } }\n\n  cashier:               # Python: assesses fees\n    build: ./cashier\n    environment: { AMQP_URL: \"amqp://guest:guest@rabbitmq:5672\" }\n    depends_on: { rabbitmq: { condition: service_healthy } }\n\n  lms:                   # Java: creates LMS accounts\n    build: ./lms\n    environment: { AMQP_HOST: rabbitmq }\n    depends_on: { rabbitmq: { condition: service_healthy } }\n"
      }
     }
    ]
   },
   {
    "title": "Enrollment service (Node): API + saga state",
    "body": [
     "Returns **202 Accepted**, because the work finishes asynchronously. It listens for results and updates the status: ASSESSED → ACTIVE, or **CANCELLED** (the compensation)."
    ],
    "files": [
     {
      "title": "enrollment/package.json",
      "variants": {
       "json": "{ \"name\": \"enrollment\", \"private\": true, \"dependencies\": { \"amqplib\": \"^0.10.4\", \"express\": \"^5.1.0\" } }\n"
      }
     },
     {
      "title": "enrollment/Dockerfile",
      "variants": {
       "dockerfile": "FROM node:22-alpine\nWORKDIR /app\nCOPY package.json .\nRUN npm install --omit=dev\nCOPY . .\nCMD [\"node\", \"server.js\"]\n"
      }
     },
     {
      "title": "enrollment/server.js",
      "variants": {
       "js": "const express = require(\"express\");\nconst amqp = require(\"amqplib\");\nconst crypto = require(\"crypto\");\n\nconst enrollments = new Map();   // shortcut: in-memory; use a DB table in the real project\nconst seen = new Set();          // processed eventIds\nlet ch;\n\nconst event = (type, data) => ({ eventId: crypto.randomUUID(), type, occurredAt: new Date().toISOString(), data });\nconst publish = (e) => ch.publish(\"campus\", e.type, Buffer.from(JSON.stringify(e)), { persistent: true });\n\nfunction setStatus(id, status, note) {\n  const en = enrollments.get(id);\n  if (!en) return;\n  en.status = status;\n  en.history.push({ status, note, at: new Date().toISOString() });\n}\n\nasync function start() {\n  const conn = await amqp.connect(process.env.AMQP_URL);\n  ch = await conn.createChannel();\n  await ch.assertExchange(\"campus\", \"topic\", { durable: true });\n  const q = await ch.assertQueue(\"enrollment.inbox\", { durable: true });\n  for (const key of [\"fees.assessed\", \"payment.failed\", \"lms.account.created\"]) await ch.bindQueue(q.queue, \"campus\", key);\n\n  ch.consume(q.queue, (m) => {\n    const e = JSON.parse(m.content);\n    if (!seen.has(e.eventId)) {\n      seen.add(e.eventId);\n      if (e.type === \"fees.assessed\") setStatus(e.data.enrollmentId, \"ASSESSED\", `fees ₱${e.data.amount}`);\n      if (e.type === \"payment.failed\") setStatus(e.data.enrollmentId, \"CANCELLED\", e.data.reason);   // compensation\n      if (e.type === \"lms.account.created\") setStatus(e.data.enrollmentId, \"ACTIVE\", `LMS user ${e.data.username}`);\n    }\n    ch.ack(m);\n  });\n\n  const app = express();\n  app.use(express.json());\n\n  app.post(\"/enroll\", (req, res) => {\n    const { studentId, name, units } = req.body;\n    if (!studentId || !name || !(units > 0)) return res.status(422).json({ error: \"studentId, name, units required\" });\n    const id = crypto.randomUUID();\n    enrollments.set(id, { id, studentId, name, units, status: \"PENDING\", history: [] });\n    setStatus(id, \"PENDING\", \"waiting for cashier\");\n    publish(event(\"student.enrolled\", { enrollmentId: id, studentId, name, units }));\n    res.status(202).json({ id, status: \"PENDING\" });   // 202 = accepted, finishes asynchronously\n  });\n\n  app.get(\"/enrollments/:id\", (req, res) => {\n    const en = enrollments.get(req.params.id);\n    en ? res.json(en) : res.status(404).json({ error: \"not found\" });\n  });\n\n  app.listen(4000, () => console.log(\"enrollment on :4000\"));\n}\n\nstart();\n"
      }
     }
    ]
   },
   {
    "title": "Cashier (Python)",
    "body": [
     "Fees = units × ₱1,500 + ₱3,200 misc. Student `2024-9999` has a hold, which triggers `payment.failed`."
    ],
    "files": [
     {
      "title": "cashier/requirements.txt",
      "variants": {
       "text": "pika==1.3.2\n"
      }
     },
     {
      "title": "cashier/Dockerfile",
      "variants": {
       "dockerfile": "FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nCMD [\"python\", \"-u\", \"cashier.py\"]\n"
      }
     },
     {
      "title": "cashier/cashier.py",
      "variants": {
       "python": "\"\"\"Cashier: listens for student.enrolled, assesses fees, publishes the result.\"\"\"\nimport json\nimport os\nimport uuid\nfrom datetime import datetime, timezone\n\nimport pika\n\nPER_UNIT = 1_500\nMISC = 3_200\nHOLDS = {\"2024-9999\"}          # students with an unpaid balance: enrollment must be cancelled\n\nconn = pika.BlockingConnection(pika.URLParameters(os.environ[\"AMQP_URL\"]))\nch = conn.channel()\nch.exchange_declare(\"campus\", \"topic\", durable=True)\nch.queue_declare(\"cashier.inbox\", durable=True)\nch.queue_bind(\"cashier.inbox\", \"campus\", \"student.enrolled\")\nseen = set()\n\n\ndef publish(type_, data):\n    evt = {\"eventId\": str(uuid.uuid4()), \"type\": type_, \"occurredAt\": datetime.now(timezone.utc).isoformat(), \"data\": data}\n    ch.basic_publish(\"campus\", type_, json.dumps(evt), pika.BasicProperties(delivery_mode=2))\n\n\ndef on_enrolled(channel, method, props, body):\n    e = json.loads(body)\n    if e[\"eventId\"] not in seen:\n        seen.add(e[\"eventId\"])\n        d = e[\"data\"]\n        if d[\"studentId\"] in HOLDS:\n            publish(\"payment.failed\", {\"enrollmentId\": d[\"enrollmentId\"], \"reason\": \"unpaid balance from last term\"})\n            print(f\"HOLD {d['studentId']}: payment.failed\", flush=True)\n        else:\n            amount = d[\"units\"] * PER_UNIT + MISC\n            publish(\"fees.assessed\", {\"enrollmentId\": d[\"enrollmentId\"], \"studentId\": d[\"studentId\"], \"name\": d[\"name\"], \"amount\": amount})\n            print(f\"assessed {d['studentId']}: ₱{amount:,}\", flush=True)\n    channel.basic_ack(method.delivery_tag)\n\n\nch.basic_consume(\"cashier.inbox\", on_enrolled)\nprint(\"cashier waiting\", flush=True)\nch.start_consuming()\n"
      }
     }
    ]
   },
   {
    "title": "LMS (Java)",
    "body": [
     "A multi-stage Dockerfile builds the fat jar with Maven, then runs it on a small JRE image. `slf4j-nop` **1.7.x** matches amqp-client's logging API; 2.x prints a warning."
    ],
    "files": [
     {
      "title": "lms/pom.xml",
      "variants": {
       "html": "<project xmlns=\"http://maven.apache.org/POM/4.0.0\">\n  <modelVersion>4.0.0</modelVersion>\n  <groupId>edu.campus</groupId>\n  <artifactId>lms</artifactId>\n  <version>1.0</version>\n  <properties>\n    <maven.compiler.release>21</maven.compiler.release>\n    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>\n  </properties>\n  <dependencies>\n    <dependency><groupId>com.rabbitmq</groupId><artifactId>amqp-client</artifactId><version>5.22.0</version></dependency>\n    <dependency><groupId>com.fasterxml.jackson.core</groupId><artifactId>jackson-databind</artifactId><version>2.18.2</version></dependency>\n    <dependency><groupId>org.slf4j</groupId><artifactId>slf4j-nop</artifactId><version>1.7.36</version></dependency>\n  </dependencies>\n  <build>\n    <plugins>\n      <plugin>\n        <artifactId>maven-assembly-plugin</artifactId>\n        <version>3.7.1</version>\n        <configuration>\n          <archive><manifest><mainClass>edu.campus.lms.App</mainClass></manifest></archive>\n          <descriptorRefs><descriptorRef>jar-with-dependencies</descriptorRef></descriptorRefs>\n          <finalName>lms</finalName>\n          <appendAssemblyId>false</appendAssemblyId>\n        </configuration>\n        <executions><execution><phase>package</phase><goals><goal>single</goal></goals></execution></executions>\n      </plugin>\n    </plugins>\n  </build>\n</project>\n"
      }
     },
     {
      "title": "lms/Dockerfile",
      "variants": {
       "dockerfile": "# Stage 1: build the fat jar with Maven\nFROM maven:3.9-eclipse-temurin-21 AS build\nWORKDIR /src\nCOPY pom.xml .\nRUN mvn -q dependency:go-offline\nCOPY src ./src\nRUN mvn -q package -DskipTests\n\n# Stage 2: small runtime image\nFROM eclipse-temurin:21-jre\nCOPY --from=build /src/target/lms.jar /app/lms.jar\nCMD [\"java\", \"-jar\", \"/app/lms.jar\"]\n"
      }
     },
     {
      "title": "lms/src/main/java/edu/campus/lms/App.java",
      "variants": {
       "java": "package edu.campus.lms;\n\nimport com.fasterxml.jackson.databind.JsonNode;\nimport com.fasterxml.jackson.databind.ObjectMapper;\nimport com.rabbitmq.client.*;\n\nimport java.nio.charset.StandardCharsets;\nimport java.time.Instant;\nimport java.util.*;\n\n/** LMS: when fees are assessed, create the student's LMS account and announce it. */\npublic class App {\n    private static final ObjectMapper JSON = new ObjectMapper();\n    private static final Set<String> seen = new HashSet<>();               // idempotent receiver\n    private static final Map<String, String> accounts = new HashMap<>();   // studentId -> username\n\n    public static void main(String[] args) throws Exception {\n        ConnectionFactory factory = new ConnectionFactory();\n        factory.setHost(System.getenv().getOrDefault(\"AMQP_HOST\", \"localhost\"));\n        Connection conn = factory.newConnection();\n        Channel ch = conn.createChannel();\n\n        ch.exchangeDeclare(\"campus\", \"topic\", true);\n        ch.queueDeclare(\"lms.inbox\", true, false, false, null);\n        ch.queueBind(\"lms.inbox\", \"campus\", \"fees.assessed\");\n        ch.basicQos(1);\n\n        DeliverCallback onMessage = (tag, delivery) -> {\n            JsonNode e = JSON.readTree(delivery.getBody());\n            if (seen.add(e.get(\"eventId\").asText())) {\n                JsonNode d = e.get(\"data\");\n                String studentId = d.get(\"studentId\").asText();\n                String username = accounts.computeIfAbsent(studentId,\n                        id -> d.get(\"name\").asText().toLowerCase().replaceAll(\"[^a-z]\", \"\") + \".\" + id.substring(id.length() - 4));\n\n                Map<String, Object> out = new LinkedHashMap<>();\n                out.put(\"eventId\", UUID.randomUUID().toString());\n                out.put(\"type\", \"lms.account.created\");\n                out.put(\"occurredAt\", Instant.now().toString());\n                out.put(\"data\", Map.of(\"enrollmentId\", d.get(\"enrollmentId\").asText(), \"username\", username));\n                ch.basicPublish(\"campus\", \"lms.account.created\", MessageProperties.PERSISTENT_TEXT_PLAIN,\n                        JSON.writeValueAsBytes(out));\n                System.out.println(\"LMS account \" + username + \" for \" + studentId);\n            }\n            ch.basicAck(delivery.getEnvelope().getDeliveryTag(), false);   // ack after the work\n        };\n        ch.basicConsume(\"lms.inbox\", false, onMessage, tag -> {});\n        System.out.println(\"lms waiting\");\n    }\n}\n"
      }
     }
    ]
   },
   {
    "title": "Run the happy path and the compensation",
    "files": [
     {
      "title": "demo.sh",
      "variants": {
       "bash": "#!/usr/bin/env bash\nH='Content-Type: application/json'\nOK=$(curl -s -X POST localhost:4000/enroll -H \"$H\" -d '{\"studentId\":\"2024-0001\",\"name\":\"Juan Dela Cruz\",\"units\":24}' | sed 's/.*\"id\":\"\\([^\"]*\\)\".*/\\1/')\nHOLD=$(curl -s -X POST localhost:4000/enroll -H \"$H\" -d '{\"studentId\":\"2024-9999\",\"name\":\"Ben Santos\",\"units\":21}' | sed 's/.*\"id\":\"\\([^\"]*\\)\".*/\\1/')\nsleep 3\necho \"happy path:\"; curl -s localhost:4000/enrollments/$OK; echo\necho \"compensation path:\"; curl -s localhost:4000/enrollments/$HOLD; echo\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "docker compose up -d --build",
      "purpose": "Build all 3 languages + RabbitMQ"
     },
     {
      "cmd": "chmod +x demo.sh && ./demo.sh",
      "purpose": "Juan → ACTIVE, Ben → CANCELLED"
     },
     {
      "cmd": "docker compose logs cashier lms",
      "purpose": "See each service's part"
     },
     {
      "cmd": "docker compose down",
      "purpose": "Stop"
     }
    ]
   }
  ],
  "done": [
   "Juan's history: PENDING → ASSESSED (₱39,200) → ACTIVE (LMS user juandelacruz.0001).",
   "Ben's history: PENDING → CANCELLED (unpaid balance), and no LMS account was created.",
   "You can draw the sequence diagram from memory."
  ]
 },
 "API gateway + 3 services": {
  "where": "Docker Compose: nginx gateway + Node services + Redis + Swagger UI",
  "time": "1 weekend",
  "youNeed": [
   "Docker Desktop or OrbStack running"
  ],
  "tree": "api-gateway/\n  compose.yaml\n  demo.sh\n  docs/\n    openapi.yaml\n  gateway/\n    nginx.conf\n  service/\n    Dockerfile\n    auth.js\n    package.json\n    server.js",
  "steps": [
   {
    "title": "Create the folders",
    "commands": [
     {
      "cmd": "mkdir -p ~/Developments/api-gateway/{gateway,service,docs} && cd ~/Developments/api-gateway",
      "purpose": "Folders"
     }
    ]
   },
   {
    "title": "compose.yaml",
    "body": [
     "One service image runs 4 times with a different `SERVICE` env, which keeps the code small. YAML anchors (`&service`, `<<:`) avoid repetition."
    ],
    "files": [
     {
      "title": "compose.yaml",
      "variants": {
       "yaml": "# One command: docker compose up -d --build   → gateway on http://localhost:8090\nx-service: &service\n  build: ./service\n  environment: &env\n    JWT_SECRET: ${JWT_SECRET:-dev-only-change-me}\n    REDIS_URL: redis://redis:6379\n\nservices:\n  gateway:\n    image: nginx:1.27-alpine\n    ports: [\"8090:80\"]\n    volumes: [\"./gateway/nginx.conf:/etc/nginx/nginx.conf:ro\"]\n    depends_on: [auth, students, courses, grades, docs]\n\n  auth:     { <<: *service, environment: { <<: *env, SERVICE: auth } }\n  students: { <<: *service, environment: { <<: *env, SERVICE: students } }\n  courses:  { <<: *service, environment: { <<: *env, SERVICE: courses } }\n  grades:   { <<: *service, environment: { <<: *env, SERVICE: grades }, depends_on: [redis] }\n\n  redis:\n    image: redis:7-alpine\n\n  docs:\n    image: swaggerapi/swagger-ui\n    environment: { SWAGGER_JSON: /docs/openapi.yaml, BASE_URL: /docs }\n    volumes: [\"./docs:/docs:ro\"]\n"
      }
     }
    ]
   },
   {
    "title": "Gateway: routing + rate limiting",
    "files": [
     {
      "title": "gateway/nginx.conf",
      "variants": {
       "nginx": "events {}\nhttp {\n  # 5 requests/second per client IP, bursts of 10 allowed; extra requests get 429\n  limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;\n  limit_req_status 429;\n\n  server {\n    listen 80;\n\n    location /auth/     { proxy_pass http://auth:3000/; }                                   # login is not rate-limited here\n    location /students/ { limit_req zone=api burst=10 nodelay; proxy_pass http://students:3000/; }\n    location /courses/  { limit_req zone=api burst=10 nodelay; proxy_pass http://courses:3000/; }\n    location /grades/   { limit_req zone=api burst=10 nodelay; proxy_pass http://grades:3000/; }\n    location /docs/     { proxy_pass http://docs:8080/docs/; }\n\n    location = /health { return 200 \"gateway ok\\n\"; }\n  }\n}\n"
      }
     }
    ]
   },
   {
    "title": "Shared JWT helper",
    "body": [
     "Each service verifies the token itself and **pins** the algorithm and issuer (blocks `alg:none` tricks)."
    ],
    "files": [
     {
      "title": "service/auth.js",
      "variants": {
       "js": "const jwt = require(\"jsonwebtoken\");\nconst SECRET = process.env.JWT_SECRET;\n\n// Every service verifies the token itself (zero trust: don't rely only on the gateway)\nfunction requireJwt(req, res, next) {\n  const token = req.get(\"Authorization\")?.replace(/^Bearer /, \"\");\n  if (!token) return res.status(401).json({ error: \"missing token\" });\n  try {\n    req.user = jwt.verify(token, SECRET, { algorithms: [\"HS256\"], issuer: \"campus-auth\" });   // pin alg + issuer\n    next();\n  } catch (e) {\n    res.status(401).json({ error: `invalid token: ${e.message}` });\n  }\n}\n\nfunction issue(user) {\n  return jwt.sign({ sub: user.id, role: user.role }, SECRET, { algorithm: \"HS256\", issuer: \"campus-auth\", expiresIn: \"15m\" });\n}\n\nmodule.exports = { requireJwt, issue };\n"
      }
     }
    ]
   },
   {
    "title": "The services (auth, students, courses, grades)",
    "body": [
     "`grades` uses **cache-aside** with Redis and a 60 s TTL. The `X-Cache` header shows HIT or MISS."
    ],
    "files": [
     {
      "title": "service/package.json",
      "variants": {
       "json": "{ \"name\": \"campus-service\", \"private\": true, \"dependencies\": { \"express\": \"^5.1.0\", \"jsonwebtoken\": \"^9.0.2\", \"redis\": \"^4.7.0\" } }\n"
      }
     },
     {
      "title": "service/Dockerfile",
      "variants": {
       "dockerfile": "FROM node:22-alpine\nWORKDIR /app\nCOPY package.json .\nRUN npm install --omit=dev\nCOPY . .\nCMD [\"node\", \"server.js\"]\n"
      }
     },
     {
      "title": "service/server.js",
      "variants": {
       "js": "// One small codebase, four services. SERVICE env picks which routes run.\nconst express = require(\"express\");\nconst { createClient } = require(\"redis\");\nconst { requireJwt, issue } = require(\"./auth\");\n\nconst SERVICE = process.env.SERVICE;\nconst app = express();\napp.use(express.json());\n\nconst students = [{ id: \"2024-0001\", name: \"Juan Dela Cruz\" }, { id: \"2024-0002\", name: \"Ana Reyes\" }];\nconst courses = [{ code: \"DATSYS\", title: \"Database Systems\" }, { code: \"SYSINTA\", title: \"System Integration and Architecture\" }];\n\nif (SERVICE === \"auth\") {\n  // Demo login: in real life check a password hash in a DB\n  app.post(\"/token\", (req, res) => {\n    const { username } = req.body;\n    if (!username) return res.status(422).json({ error: \"username required\" });\n    res.json({ token: issue({ id: username, role: username === \"registrar\" ? \"admin\" : \"student\" }) });\n  });\n}\n\nif (SERVICE === \"students\") app.get(\"/\", requireJwt, (req, res) => res.json(students));\nif (SERVICE === \"courses\") app.get(\"/\", requireJwt, (req, res) => res.json(courses));\n\nif (SERVICE === \"grades\") {\n  const redis = createClient({ url: process.env.REDIS_URL });\n  redis.on(\"error\", (e) => console.error(\"redis\", e.message));\n  redis.connect();\n\n  // Pretend this is a slow query on the registrar database\n  async function slowGradeLookup(studentId) {\n    await new Promise((r) => setTimeout(r, 800));\n    return { studentId, grades: [{ course: \"DATSYS\", grade: 1.5 }, { course: \"SYSINTA\", grade: 1.25 }] };\n  }\n\n  // Cache-aside: try Redis first, fall back to the DB, then fill the cache\n  app.get(\"/:studentId\", requireJwt, async (req, res) => {\n    const key = `grades:${req.params.studentId}`;\n    const hit = await redis.get(key).catch(() => null);\n    if (hit) return res.set(\"X-Cache\", \"HIT\").json(JSON.parse(hit));\n    const data = await slowGradeLookup(req.params.studentId);\n    await redis.set(key, JSON.stringify(data), { EX: 60 }).catch(() => {});   // 60 s TTL\n    res.set(\"X-Cache\", \"MISS\").json(data);\n  });\n}\n\napp.get(\"/health\", (req, res) => res.json({ service: SERVICE, ok: true }));\napp.listen(3000, () => console.log(`${SERVICE} service on :3000`));\n"
      }
     }
    ]
   },
   {
    "title": "API docs",
    "files": [
     {
      "title": "docs/openapi.yaml",
      "variants": {
       "yaml": "openapi: 3.1.0\ninfo: { title: Campus API (via gateway), version: 1.0.0 }\nservers: [{ url: http://localhost:8090 }]\ncomponents:\n  securitySchemes:\n    bearer: { type: http, scheme: bearer, bearerFormat: JWT }\nsecurity: [{ bearer: [] }]\npaths:\n  /auth/token:\n    post:\n      security: []\n      summary: Get a JWT (demo login)\n      requestBody:\n        content: { application/json: { schema: { type: object, properties: { username: { type: string } }, required: [username] } } }\n      responses: { \"200\": { description: Token }, \"422\": { description: Missing username } }\n  /students/:\n    get: { summary: List students, responses: { \"200\": { description: OK }, \"401\": { description: No/invalid token }, \"429\": { description: Rate limited } } }\n  /courses/:\n    get: { summary: List courses, responses: { \"200\": { description: OK }, \"401\": { description: No/invalid token } } }\n  /grades/{studentId}:\n    get:\n      summary: Grades of one student (cached 60 s in Redis; see X-Cache header)\n      parameters: [{ name: studentId, in: path, required: true, schema: { type: string } }]\n      responses: { \"200\": { description: OK }, \"401\": { description: No/invalid token } }\n"
      }
     }
    ]
   },
   {
    "title": "Run the demo",
    "files": [
     {
      "title": "demo.sh",
      "variants": {
       "bash": "#!/usr/bin/env bash\nG=localhost:8090\necho \"no token:   $(curl -s -o /dev/null -w '%{http_code}' $G/students/)\"\nTOKEN=$(curl -s -X POST $G/auth/token -H 'Content-Type: application/json' -d '{\"username\":\"juan\"}' | sed 's/.*\"token\":\"\\([^\"]*\\)\".*/\\1/')\nA=\"Authorization: Bearer $TOKEN\"\necho \"students:   $(curl -s -H \"$A\" $G/students/)\"\necho \"bad token:  $(curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer abc' $G/courses/)\"\nfor i in 1 2; do echo \"grades #$i:  $(curl -s -o /dev/null -w '%{time_total}s ' -D - -H \"$A\" $G/grades/2024-0001 | grep -i x-cache | tr -d '\\r')\"; done\necho \"burst of 30 requests → status codes:\"\nfor i in $(seq 1 30); do curl -s -o /dev/null -w '%{http_code} ' -H \"$A\" $G/courses/; done; echo\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "docker compose up -d --build",
      "purpose": "Gateway on http://localhost:8090"
     },
     {
      "cmd": "chmod +x demo.sh && ./demo.sh",
      "purpose": "401s, cache MISS then HIT, burst → 429s"
     },
     {
      "cmd": "open http://localhost:8090/docs/",
      "purpose": "Swagger UI"
     }
    ]
   }
  ],
  "done": [
   "No token or a bad token → 401.",
   "The second grades call is an X-Cache HIT.",
   "A burst of 30 gets 10 × 200, then 429s."
  ]
 },
 "Legacy ETL": {
  "where": "Python 3 + PostgreSQL on your Mac",
  "time": "1 weekend",
  "youNeed": [
   "PostgreSQL running",
   "Python 3"
  ],
  "tree": "legacy-etl/\n  etl.py\n  legacy_export.csv\n  requirements.txt\n  schema.sql\n  test_etl.py",
  "steps": [
   {
    "title": "Create the project + virtual environment",
    "commands": [
     {
      "cmd": "mkdir ~/Developments/legacy-etl && cd $_",
      "purpose": "Folder"
     },
     {
      "cmd": "python3 -m venv .venv && source .venv/bin/activate",
      "purpose": "Isolated Python packages"
     },
     {
      "cmd": "pip install -r requirements.txt",
      "purpose": "psycopg 3 (after creating the file below)"
     }
    ],
    "files": [
     {
      "title": "requirements.txt",
      "variants": {
       "text": "psycopg[binary]>=3.2\n"
      }
     }
    ]
   },
   {
    "title": "The messy legacy export",
    "body": [
     "Mixed date formats, odd spacing and capitals, a duplicate, units written as a word, a missing ID. This is what real school data looks like."
    ],
    "files": [
     {
      "title": "legacy_export.csv",
      "variants": {
       "text": "student_id,name,program,enrolled_on,units,email\n2024-0001,  juan DELA cruz ,BSIT,11/20/2026,24,JUAN@school.edu.ph\n2024-0002,Ana Reyes,bsit,2026-11-20,21,ana@school.edu.ph\n2024-0003,ben santos,BSIT,20/11/2026,twenty,ben@school.edu.ph\n2024-0002,Ana Reyes,BSIT,2026-11-21,21,ana@school.edu.ph\n2024-0004,Cara  Lim,BSCS,2026/11/19,18,\n2024-0005,dan go,BSIT,not a date,24,dan@school.edu.ph\n,Nameless Row,BSIT,2026-11-20,21,x@school.edu.ph\n"
      }
     }
    ]
   },
   {
    "title": "Reporting database",
    "files": [
     {
      "title": "schema.sql",
      "variants": {
       "postgres": "-- Reporting database (the \"new system\")\nCREATE TABLE IF NOT EXISTS students (\n  student_id  VARCHAR(10) PRIMARY KEY,\n  full_name   VARCHAR(120) NOT NULL,\n  program     VARCHAR(10) NOT NULL,\n  enrolled_on DATE NOT NULL,\n  units       SMALLINT NOT NULL CHECK (units BETWEEN 0 AND 30),\n  email       VARCHAR(200),\n  loaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()\n);\nCREATE TABLE IF NOT EXISTS etl_rejects (\n  id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  raw       TEXT NOT NULL,\n  reason    TEXT NOT NULL,\n  run_at    TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "createdb reporting && psql reporting -f schema.sql",
      "purpose": "Target DB + rejects table"
     }
    ]
   },
   {
    "title": "The ETL script",
    "body": [
     "`dd/mm/yyyy` is **rejected, not guessed**: 01/02 could be Jan 2 or Feb 1. The load uses `ON CONFLICT … DO UPDATE`, so running it twice doesn't duplicate rows (idempotent)."
    ],
    "files": [
     {
      "title": "etl.py",
      "variants": {
       "python": "\"\"\"Legacy CSV export -> clean -> Postgres reporting DB.\n\nUsage: python etl.py legacy_export.csv\nNeeds: pip install \"psycopg[binary]\"   and   DATABASE_URL (default postgres://localhost/reporting)\n\"\"\"\nimport csv\nimport os\nimport re\nimport sys\nfrom datetime import date, datetime\n\nimport psycopg\n\nDATE_FORMATS = [\"%Y-%m-%d\", \"%m/%d/%Y\", \"%Y/%m/%d\"]   # dd/mm/yyyy is ambiguous: reject it, don't guess\nWORDS = {\"twenty\": 20, \"eighteen\": 18, \"twenty-one\": 21, \"twenty-four\": 24}\n\n\ndef parse_date(s: str) -> date:\n    for fmt in DATE_FORMATS:\n        try:\n            return datetime.strptime(s.strip(), fmt).date()\n        except ValueError:\n            pass\n    raise ValueError(f\"unrecognized date '{s}'\")\n\n\ndef parse_units(s: str) -> int:\n    s = s.strip().lower()\n    if s.isdigit():\n        return int(s)\n    if s in WORDS:\n        return WORDS[s]\n    raise ValueError(f\"bad units '{s}'\")\n\n\ndef clean_name(s: str) -> str:\n    return re.sub(r\"\\s+\", \" \", s).strip().title()     # \"  juan DELA cruz \" -> \"Juan Dela Cruz\"\n\n\ndef transform(row: dict) -> dict:\n    if not row[\"student_id\"].strip():\n        raise ValueError(\"missing student_id\")\n    return {\n        \"student_id\": row[\"student_id\"].strip(),\n        \"full_name\": clean_name(row[\"name\"]),\n        \"program\": row[\"program\"].strip().upper(),\n        \"enrolled_on\": parse_date(row[\"enrolled_on\"]),\n        \"units\": parse_units(row[\"units\"]),\n        \"email\": row[\"email\"].strip().lower() or None,\n    }\n\n\ndef run(path: str):\n    good, rejects = {}, []\n    with open(path, newline=\"\", encoding=\"utf-8\") as f:          # Extract\n        for row in csv.DictReader(f):\n            try:\n                rec = transform(row)                              # Transform\n                good[rec[\"student_id\"]] = rec                     # dedupe: the last row per student wins\n            except ValueError as e:\n                rejects.append((\",\".join(row.values()), str(e)))\n\n    url = os.environ.get(\"DATABASE_URL\", \"postgres://localhost/reporting\")\n    with psycopg.connect(url) as conn, conn.cursor() as cur:    # Load (one transaction)\n        cur.executemany(\n            \"\"\"INSERT INTO students (student_id, full_name, program, enrolled_on, units, email)\n               VALUES (%(student_id)s, %(full_name)s, %(program)s, %(enrolled_on)s, %(units)s, %(email)s)\n               ON CONFLICT (student_id) DO UPDATE SET\n                 full_name = EXCLUDED.full_name, program = EXCLUDED.program, enrolled_on = EXCLUDED.enrolled_on,\n                 units = EXCLUDED.units, email = EXCLUDED.email, loaded_at = now()\"\"\",\n            list(good.values()))\n        cur.executemany(\"INSERT INTO etl_rejects (raw, reason) VALUES (%s, %s)\", rejects)\n\n    print(f\"loaded {len(good)} students, rejected {len(rejects)}\")\n    for raw, reason in rejects:\n        print(f\"  REJECT {reason}: {raw}\")\n\n\nif __name__ == \"__main__\":\n    run(sys.argv[1] if len(sys.argv) > 1 else \"legacy_export.csv\")\n"
      }
     }
    ]
   },
   {
    "title": "Test, run, schedule",
    "files": [
     {
      "title": "test_etl.py",
      "variants": {
       "python": "# Run: python test_etl.py   (pure functions only, no database needed)\nfrom etl import clean_name, parse_date, parse_units, transform\n\nassert clean_name(\"  juan DELA cruz \") == \"Juan Dela Cruz\"\nassert str(parse_date(\"11/20/2026\")) == \"2026-11-20\"\nassert str(parse_date(\"2026/11/19\")) == \"2026-11-19\"\nassert parse_units(\"twenty\") == 20\nfor bad in [\"20/11/2026\", \"not a date\"]:\n    try:\n        parse_date(bad); raise AssertionError(bad)\n    except ValueError:\n        pass\nrec = transform({\"student_id\": \"1\", \"name\": \"a b\", \"program\": \"bsit\", \"enrolled_on\": \"2026-01-01\", \"units\": \"21\", \"email\": \" X@Y.COM \"})\nassert rec[\"program\"] == \"BSIT\" and rec[\"email\"] == \"x@y.com\"\nprint(\"all tests passed\")\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "python test_etl.py",
      "purpose": "all tests passed"
     },
     {
      "cmd": "python etl.py legacy_export.csv",
      "purpose": "loaded 3 students, rejected 3 (with reasons)"
     },
     {
      "cmd": "psql reporting -c 'SELECT * FROM students; SELECT reason FROM etl_rejects;'",
      "purpose": "Clean data + rejects"
     },
     {
      "cmd": "crontab -e  →  0 1 * * * cd ~/Developments/legacy-etl && .venv/bin/python etl.py legacy_export.csv >> etl.log 2>&1",
      "purpose": "Nightly at 01:00"
     }
    ]
   }
  ],
  "done": [
   "3 clean rows loaded, 3 rejects logged with reasons.",
   "A rerun keeps 3 rows (no duplicates).",
   "Stretch: point Metabase at the reporting DB."
  ]
 },
 "Resilience showcase": {
  "where": "Node.js on your Mac (no installs needed)",
  "time": "1 evening",
  "youNeed": [
   "Node.js 20+"
  ],
  "tree": "resilience/\n  bench.js\n  flaky.js\n  resilience.js\n  service-a.js",
  "steps": [
   {
    "title": "Create the folder",
    "commands": [
     {
      "cmd": "mkdir ~/Developments/resilience && cd $_",
      "purpose": "Folder"
     }
    ],
    "body": [
     "We use port **5050**, not 5000. On macOS, port 5000 belongs to the AirPlay Receiver and answers 403, which confused our first test."
    ]
   },
   {
    "title": "Service B: deliberately flaky",
    "body": [
     "30% errors and 15% three-second hangs. `POST /toggle` takes it fully down."
    ],
    "files": [
     {
      "title": "flaky.js",
      "variants": {
       "js": "// Service B: a deliberately unreliable \"payment rates\" service\n// Port 5050, not 5000: on macOS, port 5000 is taken by the AirPlay Receiver\nconst http = require(\"http\");\n\nlet up = true;   // flip with: curl -X POST localhost:5050/toggle\nhttp.createServer((req, res) => {\n  if (req.method === \"POST\" && req.url === \"/toggle\") { up = !up; return res.end(`up=${up}\\n`); }\n  if (!up) { res.writeHead(503); return res.end(\"down\"); }\n  const r = Math.random();\n  if (r < 0.3) { res.writeHead(500); return res.end(\"boom\"); }                 // 30% errors\n  const delay = r < 0.45 ? 3000 : 30;                                           // 15% very slow\n  setTimeout(() => res.end(JSON.stringify({ rate: 56.12, at: Date.now() })), delay);\n}).listen(5050, () => console.log(\"flaky B on :5050\"));\n"
      }
     }
    ]
   },
   {
    "title": "The resilience toolkit",
    "body": [
     "**Timeout** (never wait forever) → **retry with full jitter** (only for 5xx/429) → **circuit breaker** (stop calling a dead service, fail fast)."
    ],
    "files": [
     {
      "title": "resilience.js",
      "variants": {
       "js": "// Reusable resilience helpers: timeout, retry with full jitter, circuit breaker\n\nasync function fetchWithTimeout(url, ms) {\n  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });\n  if (!res.ok) {\n    const err = new Error(`HTTP ${res.status}`);\n    err.retryable = res.status >= 500 || res.status === 429;   // don't retry 4xx client errors\n    throw err;\n  }\n  return res.json();\n}\n\nasync function withRetry(fn, { retries = 3, baseMs = 100, capMs = 1000 } = {}) {\n  for (let attempt = 0; ; attempt++) {\n    try {\n      return await fn();\n    } catch (err) {\n      if (attempt >= retries || err.retryable === false) throw err;\n      const delay = Math.random() * Math.min(capMs, baseMs * 2 ** attempt);   // full jitter\n      await new Promise((r) => setTimeout(r, delay));\n    }\n  }\n}\n\nclass CircuitBreaker {\n  constructor({ failureThreshold = 5, resetMs = 5000 } = {}) {\n    this.failureThreshold = failureThreshold;\n    this.resetMs = resetMs;\n    this.failures = 0;\n    this.state = \"CLOSED\";\n    this.openedAt = 0;\n    this.opens = 0;\n  }\n  async call(fn) {\n    if (this.state === \"OPEN\") {\n      if (Date.now() - this.openedAt < this.resetMs) throw Object.assign(new Error(\"circuit open\"), { retryable: false });\n      this.state = \"HALF_OPEN\";   // let one trial call through\n    }\n    try {\n      const out = await fn();\n      this.failures = 0;\n      this.state = \"CLOSED\";\n      return out;\n    } catch (e) {\n      if (this.state === \"HALF_OPEN\" || ++this.failures >= this.failureThreshold) {\n        if (this.state !== \"OPEN\") this.opens++;\n        this.state = \"OPEN\";\n        this.openedAt = Date.now();\n      }\n      throw e;\n    }\n  }\n}\n\nmodule.exports = { fetchWithTimeout, withRetry, CircuitBreaker };\n"
      }
     }
    ]
   },
   {
    "title": "Service A: calls B safely, with a fallback",
    "files": [
     {
      "title": "service-a.js",
      "variants": {
       "js": "// Service A: calls B safely and always answers fast\nconst http = require(\"http\");\nconst { fetchWithTimeout, withRetry, CircuitBreaker } = require(\"./resilience\");\n\nconst B = process.env.B_URL || \"http://localhost:5050\";\nconst breaker = new CircuitBreaker({ failureThreshold: 5, resetMs: 5000 });\nlet lastGood = null;   // fallback value\n\nasync function getRate() {\n  try {\n    const data = await breaker.call(() => withRetry(() => fetchWithTimeout(B, 500)));\n    lastGood = data;\n    return { ...data, source: \"live\" };\n  } catch (e) {\n    if (lastGood) return { ...lastGood, source: `fallback (${e.message})` };   // degrade gracefully\n    throw e;\n  }\n}\n\nhttp.createServer(async (req, res) => {\n  if (req.url === \"/health\") return res.end(JSON.stringify({ breaker: breaker.state, opens: breaker.opens }));\n  try {\n    res.end(JSON.stringify(await getRate()));\n  } catch (e) {\n    res.writeHead(503);\n    res.end(JSON.stringify({ error: e.message }));\n  }\n}).listen(4000, () => console.log(\"service A on :4000\"));\n"
      }
     }
    ]
   },
   {
    "title": "Benchmark: direct vs protected",
    "files": [
     {
      "title": "bench.js",
      "variants": {
       "js": "// Compare calling B directly vs through A. Usage: node bench.js 100\nconst N = Number(process.argv[2] || 100);\n\nasync function run(label, url) {\n  let ok = 0, fallback = 0, failed = 0;\n  const times = [];\n  for (let i = 0; i < N; i++) {\n    const t = performance.now();\n    try {\n      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });\n      const body = await res.json().catch(() => ({}));\n      if (!res.ok) failed++;\n      else if (String(body.source).startsWith(\"fallback\")) fallback++;\n      else ok++;\n    } catch { failed++; }\n    times.push(performance.now() - t);\n  }\n  times.sort((a, b) => a - b);\n  const p = (q) => Math.round(times[Math.floor(q * (times.length - 1))]);\n  console.log(`${label.padEnd(14)} ok ${ok}  fallback ${fallback}  failed ${failed}  p50 ${p(0.5)}ms  p95 ${p(0.95)}ms  max ${p(1)}ms`);\n}\n\n(async () => {\n  await run(\"direct to B\", \"http://localhost:5050\");\n  await run(\"through A\", \"http://localhost:4000\");\n})();\n"
      }
     }
    ],
    "commands": [
     {
      "cmd": "node flaky.js",
      "purpose": "Terminal 1"
     },
     {
      "cmd": "node service-a.js",
      "purpose": "Terminal 2"
     },
     {
      "cmd": "node bench.js 60",
      "purpose": "Terminal 3: compare"
     },
     {
      "cmd": "curl -X POST localhost:5050/toggle",
      "purpose": "Kill B"
     },
     {
      "cmd": "for i in $(seq 8); do curl -s -o /dev/null -w '%{time_total}s ' localhost:4000; done; curl -s localhost:4000/health",
      "purpose": "Slow until the breaker opens, then instant"
     }
    ]
   }
  ],
  "done": [
   "Our run: direct = 16 failures, p95 3.0 s. Through A = 0 failures, p95 0.9 s.",
   "With B down, A answers in <1 ms with `fallback (circuit open)`."
  ]
 }
};
