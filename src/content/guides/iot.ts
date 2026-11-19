import type { Guide } from "../types";

const TINKERCAD_START = {
  title: "Open Tinkercad Circuits",
  body: [
    "Go to **tinkercad.com** and sign in (a free Google login works). Click **Create → Circuit**.",
    "In the right panel set the dropdown to **All** and search for parts. Drag them onto the canvas.",
    "Wire by clicking a pin, then clicking the destination. Click a wire to change its color (red = 5V, black = GND helps a lot).",
  ],
};

const WOKWI_ESP32_START = {
  title: "Create a Wokwi ESP32 project",
  body: [
    "Go to **wokwi.com** → **Start from scratch** → **ESP32**. Sign in if you want to save it.",
    "Click the blue **+** above the diagram to add parts. Drag from a pin to another pin to wire.",
    "Libraries: open the **Library Manager** tab (book icon next to `sketch.ino`) and add what the code `#include`s.",
    "Wi-Fi in Wokwi: SSID `Wokwi-GUEST`, no password, channel 6. It has outbound internet only, so use a **public broker** like `broker.hivemq.com`.",
  ],
};

const MQTT_LAMP_CODE = `#include <WiFi.h>
#include <PubSubClient.h>

const char* BASE = "bsit/CHANGE-ME";   // use your own unique name
const int OUT_PIN = 2;                 // LED (or relay IN pin)

WiFiClient net;
PubSubClient mqtt(net);
unsigned long lastStatus = 0;

void onMessage(char* topic, byte* payload, unsigned int len) {
  String msg;
  for (unsigned int i = 0; i < len; i++) msg += (char)payload[i];
  Serial.printf("%s -> %s\\n", topic, msg.c_str());
  if (msg == "on")  digitalWrite(OUT_PIN, HIGH);
  if (msg == "off") digitalWrite(OUT_PIN, LOW);
}

void connectMQTT() {
  while (!mqtt.connected()) {
    String id = "esp32-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (mqtt.connect(id.c_str())) {
      mqtt.subscribe((String(BASE) + "/cmd").c_str());
      Serial.println("MQTT connected + subscribed");
    } else {
      Serial.printf("MQTT failed rc=%d, retrying\\n", mqtt.state());
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(OUT_PIN, OUTPUT);
  WiFi.begin("Wokwi-GUEST", "", 6);
  while (WiFi.status() != WL_CONNECTED) { delay(250); Serial.print('.'); }
  Serial.println(" WiFi OK");
  mqtt.setServer("broker.hivemq.com", 1883);
  mqtt.setCallback(onMessage);
}

void loop() {
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();
  if (millis() - lastStatus >= 5000) {          // heartbeat so you can see it's alive
    lastStatus = millis();
    char buf[40];
    snprintf(buf, sizeof buf, "{\\"uptime\\":%lu,\\"out\\":%d}", millis() / 1000, digitalRead(OUT_PIN));
    mqtt.publish((String(BASE) + "/status").c_str(), buf);
  }
}`;

export const guides: Record<string, Guide> = {
  "Resistor speed run": {
    where: "Tinkercad Circuits (browser) + the resistor demo in this app",
    time: "20–30 min",
    youNeed: ["Tinkercad account", "Lesson 1 resistor demo open in another tab"],
    steps: [
      TINKERCAD_START,
      {
        title: "Place 10 resistors with random values",
        body: [
          "Search **Resistor** and drag 10 onto the canvas. Click each one and set a different **Resistance** (e.g. 220 Ω, 330 Ω, 1 kΩ, 4.7 kΩ, 10 kΩ, 47 kΩ, 100 kΩ…).",
          "Tinkercad repaints the color bands to match. Now **hide the inspector** so you can't see the value.",
        ],
      },
      {
        title: "Read each one by its bands",
        body: [
          "Band 1 and band 2 are digits, band 3 is the multiplier (number of zeros), and band 4 is the tolerance (gold = ±5%).",
          "Write your guess for each resistor, then check it in the resistor demo by picking the same colors.",
        ],
      },
      {
        title: "Verify with Tinkercad's multimeter",
        body: [
          "Search **Multimeter**, drag it in, and set its mode to **Resistance (Ω)**.",
          "Wire the multimeter's two probes to the two legs of a resistor, then click **Start Simulation**. The display shows the exact value.",
        ],
        wiring: [
          { from: "Multimeter COM (black)", to: "Resistor leg 1" },
          { from: "Multimeter Ω (red)", to: "Resistor leg 2", note: "Mode must be Resistance" },
        ],
      },
    ],
    done: ["You read 10 out of 10 resistors correctly without looking at the inspector.", "You can say why a 220 Ω is used with an LED on a 5 V pin: (5 − 2) / 0.02 = 150 Ω, so take the next standard value up."],
    physical: ["Kits come with mixed resistors. Sort them by reading the bands, then confirm with a real multimeter on the 2k or 20k range.", "Hold the resistor so the **gold band is on the right** before reading."],
  },

  "Traffic light (Tinkercad)": {
    where: "Tinkercad Circuits (browser)",
    time: "45–60 min",
    youNeed: ["Arduino Uno R3", "Breadboard (small)", "3 LEDs: red, yellow, green", "3 × 220 Ω resistors", "1 pushbutton"],
    steps: [
      TINKERCAD_START,
      {
        title: "Place the parts",
        body: [
          "Drag in **Arduino Uno R3**, a **Breadboard Small**, 3 **LEDs** (click each and set its color), 3 **Resistors** set to **220 Ω**, and a **Pushbutton**.",
          "LED legs: the **bent leg is the anode (+)** and the straight leg is the cathode (−). Hover a leg in Tinkercad to see its name.",
        ],
      },
      {
        title: "Wire it",
        body: ["Each LED: Arduino pin → 220 Ω resistor → LED anode, then LED cathode → GND rail. The button uses the Uno's internal pull-up, so there's no resistor for it."],
        wiring: [
          { from: "Uno GND", to: "Breadboard − rail", note: "One GND wire feeds every cathode" },
          { from: "Uno pin 13", to: "220 Ω → RED LED anode" },
          { from: "Uno pin 12", to: "220 Ω → YELLOW LED anode" },
          { from: "Uno pin 11", to: "220 Ω → GREEN LED anode" },
          { from: "Each LED cathode", to: "Breadboard − rail" },
          { from: "Button leg 1", to: "Uno pin 2" },
          { from: "Button leg 2 (diagonal)", to: "Breadboard − rail", note: "Pressed = LOW with INPUT_PULLUP" },
        ],
      },
      {
        title: "Add the code",
        body: ["Click **Code** → change **Blocks** to **Text** → confirm. Replace everything with the sketch below. It uses `millis()` instead of `delay()`, so the button is read at all times."],
        code: {
          title: "Traffic light with pedestrian button",
          variants: {
            cpp: `const int RED = 13, YELLOW = 12, GREEN = 11, BTN = 2;
const unsigned long GO_MS = 5000, SLOW_MS = 2000, STOP_MS = 5000;

enum State { GO, SLOW, STOP };
State state = GO;
unsigned long since = 0;
bool walkRequested = false;

void setLights(bool r, bool y, bool g) {
  digitalWrite(RED, r); digitalWrite(YELLOW, y); digitalWrite(GREEN, g);
}

void setup() {
  pinMode(RED, OUTPUT); pinMode(YELLOW, OUTPUT); pinMode(GREEN, OUTPUT);
  pinMode(BTN, INPUT_PULLUP);
  Serial.begin(9600);
  setLights(LOW, LOW, HIGH);
}

void loop() {
  if (digitalRead(BTN) == LOW) walkRequested = true;   // latch the request
  unsigned long now = millis();

  switch (state) {
    case GO:     // a pedestrian request cuts green short to 1 s
      if (now - since >= (walkRequested ? 1000UL : GO_MS)) {
        state = SLOW; since = now; setLights(LOW, HIGH, LOW);
      }
      break;
    case SLOW:
      if (now - since >= SLOW_MS) {
        state = STOP; since = now; setLights(HIGH, LOW, LOW);
        walkRequested = false;
        Serial.println("WALK");
      }
      break;
    case STOP:
      if (now - since >= STOP_MS) {
        state = GO; since = now; setLights(LOW, LOW, HIGH);
        Serial.println("DON'T WALK");
      }
      break;
  }
}`,
          },
        },
      },
      {
        title: "Simulate and test",
        body: [
          "Click **Start Simulation**. Green → yellow → red should cycle every 5 / 2 / 5 seconds.",
          "Click the button while it's green. It should switch to yellow within about 1 second. Open the **Serial Monitor** (bottom of the Code panel) to see WALK and DON'T WALK.",
        ],
      },
    ],
    done: ["All 3 LEDs light in the right order.", "The button shortens green without freezing the cycle.", "You can explain why `delay()` would break the button (the board can't read the pin while it's sleeping)."],
    physical: ["Same wiring on a real breadboard. Plug the Uno into your Mac, pick **Arduino Uno** and the port in Arduino IDE 2, then Upload.", "No port showing? Use a data USB cable and install the CH34x driver if it's a clone."],
  },

  "Parking sensor (Wokwi)": {
    where: "Wokwi (browser), Arduino Uno project",
    time: "45 min",
    youNeed: ["Arduino Uno", "HC-SR04 ultrasonic sensor", "3 LEDs (green, yellow, red) + 3 × 220 Ω", "Buzzer"],
    steps: [
      { title: "Create a Wokwi Uno project", body: ["**wokwi.com** → **Start from scratch** → **Arduino Uno**. Add parts with the blue **+**: HC-SR04, 3 LEDs, 3 resistors (click to set 220 Ω), and a Buzzer."] },
      {
        title: "Wire it",
        wiring: [
          { from: "HC-SR04 VCC", to: "Uno 5V" },
          { from: "HC-SR04 GND", to: "Uno GND" },
          { from: "HC-SR04 TRIG", to: "Uno 9" },
          { from: "HC-SR04 ECHO", to: "Uno 10" },
          { from: "Uno 5 → 220 Ω", to: "Green LED A (anode)", note: "LED C (cathode) → GND" },
          { from: "Uno 6 → 220 Ω", to: "Yellow LED A", note: "C → GND" },
          { from: "Uno 7 → 220 Ω", to: "Red LED A", note: "C → GND" },
          { from: "Buzzer pin 1", to: "Uno 8" },
          { from: "Buzzer pin 2", to: "Uno GND" },
        ],
      },
      {
        title: "Paste the code",
        code: {
          title: "Parking distance meter",
          variants: {
            cpp: `const int TRIG = 9, ECHO = 10, GREEN = 5, YELLOW = 6, RED = 7, BUZZER = 8;

float readCm() {
  digitalWrite(TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  unsigned long us = pulseIn(ECHO, HIGH, 30000UL);   // 30 ms timeout ≈ 5 m
  return us == 0 ? -1 : us * 0.0343 / 2.0;           // -1 = nothing in range
}

void setup() {
  pinMode(TRIG, OUTPUT); pinMode(ECHO, INPUT);
  pinMode(GREEN, OUTPUT); pinMode(YELLOW, OUTPUT); pinMode(RED, OUTPUT); pinMode(BUZZER, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  float cm = readCm();
  bool nearZone = cm >= 0 && cm < 20;
  bool midZone  = cm >= 20 && cm <= 50;
  bool farZone  = cm < 0 || cm > 50;

  digitalWrite(GREEN, farZone);
  digitalWrite(YELLOW, midZone);
  digitalWrite(RED, nearZone);
  if (nearZone) tone(BUZZER, 1000, 80);

  Serial.println(cm);
  delay(nearZone ? 150 : 100);
}`,
          },
        },
      },
      {
        title: "Test it with the distance slider",
        body: [
          "Press the green **▶ play** button, then **click the HC-SR04** on the diagram. A slider appears so you can set the distance.",
          "Drag it: above 50 cm → green, 20–50 cm → yellow, below 20 cm → red + beeping.",
        ],
      },
      { title: "Level up", body: ["Make the beep faster as the object gets closer: use `delay(map(cm, 0, 20, 50, 300))` in the near zone.", "Print to the **Serial Plotter**, since it graphs numbers automatically."] },
    ],
    done: ["Each zone lights the right LED.", "The buzzer only sounds below 20 cm.", "You can explain why the distance is divided by 2 (sound travels there and back)."],
    physical: ["On a real **Uno**, wire it exactly the same way. On an **ESP32**, ECHO outputs 5 V, so put a 1 kΩ / 2 kΩ divider on it."],
  },

  "MQTT round trip": {
    where: "Wokwi (ESP32) + your Mac Terminal",
    time: "45 min",
    youNeed: ["Wokwi ESP32 project", "1 LED + 220 Ω", "Mosquitto clients on your Mac: `brew install mosquitto`"],
    steps: [
      WOKWI_ESP32_START,
      {
        title: "Wire an LED",
        wiring: [
          { from: "ESP32 GPIO 2", to: "220 Ω → LED A (anode)" },
          { from: "LED C (cathode)", to: "ESP32 GND" },
        ],
      },
      {
        title: "Paste the sketch and pick a unique topic",
        body: ["Add the **PubSubClient** library in the Library Manager. Change `CHANGE-ME` to something only you would use, e.g. `bsit/juan-3b`. Public brokers are shared with the whole world."],
        code: { title: "ESP32: publish status + subscribe to commands", variants: { cpp: MQTT_LAMP_CODE } },
      },
      {
        title: "Watch messages from your Mac",
        body: ["Start the simulation. In Terminal, subscribe to everything under your topic. You should see a status message every 5 seconds."],
        commands: [
          { cmd: "mosquitto_sub -h broker.hivemq.com -t 'bsit/CHANGE-ME/#' -v", purpose: "Watch all messages under your topic (-v prints the topic too)" },
        ],
      },
      {
        title: "Send commands back",
        body: ["In a **second** Terminal tab, publish `on` and `off`. The LED in Wokwi should follow, and the Serial Monitor prints each message."],
        commands: [
          { cmd: "mosquitto_pub -h broker.hivemq.com -t bsit/CHANGE-ME/cmd -m on", purpose: "Turn the LED on" },
          { cmd: "mosquitto_pub -h broker.hivemq.com -t bsit/CHANGE-ME/cmd -m off", purpose: "Turn the LED off" },
        ],
      },
    ],
    done: ["Status messages arrive on your Mac every 5 seconds.", "`on` and `off` from your Mac control the LED in the browser.", "You can explain publish, subscribe, topic and broker in one sentence each."],
    physical: ["Real ESP32: replace `Wokwi-GUEST` with your Wi-Fi name and password, and drop the `, 6` channel argument. Board: **ESP32 Dev Module** in Arduino IDE (add the Espressif board URL in Settings first)."],
  },

  "Room weather station": {
    where: "Wokwi (ESP32 + DHT22) + ThingSpeak (free)",
    time: "1–1.5 hours",
    youNeed: ["Free **thingspeak.com** account (MathWorks login)", "Wokwi ESP32 project", "DHT22 part"],
    steps: [
      {
        title: "Create a ThingSpeak channel",
        body: [
          "ThingSpeak → **Channels → New Channel**. Name it *Room Weather*. Tick **Field 1** = Temperature and **Field 2** = Humidity. Save.",
          "Open the **API Keys** tab and copy the **Write API Key**.",
        ],
      },
      WOKWI_ESP32_START,
      {
        title: "Wire the DHT22",
        wiring: [
          { from: "DHT22 VCC", to: "ESP32 3V3" },
          { from: "DHT22 SDA (data)", to: "ESP32 GPIO 15" },
          { from: "DHT22 GND", to: "ESP32 GND" },
        ],
      },
      {
        title: "Paste the code",
        body: ["Add the **DHT sensor library** (Adafruit) in Library Manager. Paste your Write API Key. ThingSpeak's free tier accepts one update every **15 s**, so we send every 20 s."],
        code: {
          title: "DHT22 → ThingSpeak over HTTP",
          variants: {
            cpp: `#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

DHT dht(15, DHT22);
const char* API_KEY = "PASTE_WRITE_API_KEY";

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin("Wokwi-GUEST", "", 6);
  while (WiFi.status() != WL_CONNECTED) { delay(250); Serial.print('.'); }
  Serial.println(" WiFi OK");
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) { Serial.println("DHT read failed"); delay(2000); return; }

  String url = String("http://api.thingspeak.com/update?api_key=") + API_KEY +
               "&field1=" + String(t, 1) + "&field2=" + String(h, 1);
  HTTPClient http;
  http.begin(url);
  int code = http.GET();                       // body = entry number, 0 = rejected
  Serial.printf("T=%.1f H=%.1f -> HTTP %d, entry %s\\n", t, h, code, http.getString().c_str());
  http.end();

  delay(20000);
}`,
          },
        },
      },
      {
        title: "Run it and watch the chart",
        body: [
          "Start the simulation. **Click the DHT22** to change the temperature and humidity with sliders.",
          "On ThingSpeak, open **Private View**. A new point appears every 20 s. Under **Sharing**, make it public if you want a link to show your teacher.",
        ],
      },
    ],
    done: ["The Serial Monitor shows `HTTP 200` with an increasing entry number.", "Both charts update on ThingSpeak.", "Changing the slider in Wokwi changes the next data point."],
    physical: ["Real DHT22/DHT11: same 3 wires. Bare sensors (not modules) need a 10 kΩ pull-up between data and 3V3.", "Keep the API key in `secrets.h`, not in a public repo."],
  },

  "Flood level monitor": {
    where: "Wokwi (ESP32 + HC-SR04) → public MQTT broker → Node-RED on your Mac",
    time: "2–3 hours",
    youNeed: ["Wokwi ESP32 project", "HC-SR04", "Node.js on your Mac", "Node-RED: `npm i -g node-red`"],
    steps: [
      WOKWI_ESP32_START,
      {
        title: "Wire the sensor (mounted above the water)",
        body: ["Imagine the sensor at the top of a 100 cm container pointing down. Water level = container depth − measured distance."],
        wiring: [
          { from: "HC-SR04 VCC", to: "ESP32 VIN (5V)" },
          { from: "HC-SR04 GND", to: "ESP32 GND" },
          { from: "HC-SR04 TRIG", to: "ESP32 GPIO 5" },
          { from: "HC-SR04 ECHO", to: "ESP32 GPIO 18", note: "Real board: 1k/2k divider" },
        ],
      },
      {
        title: "Publish the level as JSON",
        body: ["Add **PubSubClient**. Set your unique topic."],
        code: {
          title: "ESP32 flood level publisher",
          variants: {
            cpp: `#include <WiFi.h>
#include <PubSubClient.h>

const char* TOPIC = "bsit/CHANGE-ME/flood";
const int TRIG = 5, ECHO = 18;
const float DEPTH_CM = 100.0;    // sensor to container bottom
const float ALERT_CM = 70.0;     // water level that triggers an alert

WiFiClient net;
PubSubClient mqtt(net);

float readCm() {
  digitalWrite(TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  unsigned long us = pulseIn(ECHO, HIGH, 30000UL);
  return us == 0 ? -1 : us * 0.0343 / 2.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG, OUTPUT); pinMode(ECHO, INPUT);
  WiFi.begin("Wokwi-GUEST", "", 6);
  while (WiFi.status() != WL_CONNECTED) delay(250);
  mqtt.setServer("broker.hivemq.com", 1883);
}

void loop() {
  if (!mqtt.connected()) {
    String id = "esp32-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (!mqtt.connect(id.c_str())) { delay(2000); return; }
  }
  mqtt.loop();

  float d = readCm();
  if (d >= 0) {
    float level = constrain(DEPTH_CM - d, 0, DEPTH_CM);
    char buf[64];
    snprintf(buf, sizeof buf, "{\\"level\\":%.1f,\\"alert\\":%s}", level, level >= ALERT_CM ? "true" : "false");
    mqtt.publish(TOPIC, buf);
    Serial.println(buf);
  }
  delay(3000);
}`,
          },
        },
      },
      {
        title: "Start Node-RED and install the dashboard",
        commands: [
          { cmd: "npm i -g node-red", purpose: "Install Node-RED once" },
          { cmd: "node-red", purpose: "Start it, then open http://localhost:1880" },
        ],
        body: ["In Node-RED: **☰ menu → Manage palette → Install** → search `@flowfuse/node-red-dashboard` → Install."],
      },
      {
        title: "Build the flow",
        body: [
          "Drag in an **mqtt in** node. Add a new server `broker.hivemq.com`, port `1883`. Set the topic to `bsit/CHANGE-ME/flood` and Output to **a parsed JSON object**.",
          "Connect it to a **change** node: set `msg.payload` to `msg.payload.level`. Connect that to a **gauge** (0–100 cm) and a **chart**.",
          "From the mqtt node, also add a **switch** node on `msg.payload.alert` == `true` → **notification** node (\"FLOOD ALERT\").",
          "Click **Deploy**, then open **http://localhost:1880/dashboard**.",
        ],
      },
      {
        title: "Simulate a flood",
        body: ["In Wokwi, click the HC-SR04 and drag the distance **down**, since less distance means higher water. Past 70 cm of water, the alert pops up on the dashboard."],
      },
    ],
    done: ["The gauge and chart move when you drag the Wokwi slider.", "An alert shows when the level reaches 70 cm.", "You can draw the 3-layer architecture: sensor (perception) → MQTT (network) → dashboard (application)."],
    physical: ["Use a pail and mount the HC-SR04 pointing down. Measure the real empty depth and update `DEPTH_CM`.", "Add the 1 kΩ / 2 kΩ divider on ECHO for the ESP32's 3.3 V pins."],
  },

  "Smart lamp over MQTT": {
    where: "Wokwi (ESP32 + relay/LED) + Node-RED dashboard",
    time: "1.5 hours",
    youNeed: ["Wokwi ESP32 project", "Relay Module part (or just an LED)", "Node-RED running (see the Flood monitor walkthrough)"],
    steps: [
      WOKWI_ESP32_START,
      {
        title: "Wire the relay (or LED)",
        wiring: [
          { from: "Relay VCC", to: "ESP32 VIN (5V)" },
          { from: "Relay GND", to: "ESP32 GND" },
          { from: "Relay IN", to: "ESP32 GPIO 2" },
          { from: "(optional) LED via 220 Ω", to: "GPIO 2 → GND", note: "Easier to see in the sim" },
        ],
      },
      { title: "Flash the subscriber sketch", body: ["Same code as the MQTT round-trip activity. It subscribes to `…/cmd` and drives GPIO 2."], code: { title: "ESP32 lamp controller", variants: { cpp: MQTT_LAMP_CODE } } },
      {
        title: "Dashboard switch in Node-RED",
        body: [
          "Drag a **switch** (dashboard) node. Set its On payload to string `on` and its Off payload to string `off`.",
          "Connect it to an **mqtt out** node: server `broker.hivemq.com`, topic `bsit/CHANGE-ME/cmd`, **Retain = true**. Retain means the lamp gets its last state even after a reboot.",
          "Add an **mqtt in** on `bsit/CHANGE-ME/status` → **text** node to show the uptime and lamp state. Deploy.",
        ],
      },
      { title: "Test", body: ["Flip the switch on **localhost:1880/dashboard**. The relay or LED in Wokwi follows within about 1 second. Restart the simulation: thanks to retain, it comes back in the last state."] },
    ],
    done: ["The dashboard switch controls the Wokwi lamp.", "The state survives a simulation restart (retained message).", "The status text updates every 5 s."],
    physical: ["Use a **relay module** (with a transistor/optocoupler) and a 5 V lamp or LED strip. **Don't switch 220 V mains** without your instructor."],
  },

  "IoT + web full stack": {
    where: "Wokwi ESP32 → MQTT → Node.js on your Mac → PostgreSQL → Next.js",
    time: "1–2 weekends",
    youNeed: ["The ESP32 temperature publisher from the ESP32 + MQTT lesson", "PostgreSQL on your Mac (Database course, setup lesson)", "Node.js 20+"],
    steps: [
      { title: "Publish readings from Wokwi", body: ["Run the lesson's ESP32 sketch with topic `bsit/CHANGE-ME/room1/temp`. It sends `{\"temp\":26.4}` every 5 s."] },
      {
        title: "Create the database",
        commands: [
          { cmd: "createdb iot", purpose: "New database for readings" },
          { cmd: "mkdir iot-ingest && cd iot-ingest && npm init -y && npm i mqtt pg", purpose: "Ingest service project" },
        ],
      },
      {
        title: "Write the ingest service (MQTT → Postgres)",
        body: ["The `+` wildcard matches any device name, so room1, room2 and so on all get stored."],
        code: {
          title: "ingest.mjs",
          variants: {
            js: `import mqtt from "mqtt";
import pg from "pg";

const pool = new pg.Pool({ connectionString: "postgres://localhost/iot" });
await pool.query(
  "CREATE TABLE IF NOT EXISTS readings (" +
  " id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY," +
  " device TEXT NOT NULL, temp NUMERIC(5,1) NOT NULL," +
  " created_at TIMESTAMPTZ NOT NULL DEFAULT now())"
);

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");
client.on("connect", () => client.subscribe("bsit/CHANGE-ME/+/temp"));
client.on("message", async (topic, buf) => {
  try {
    const { temp } = JSON.parse(buf.toString());
    const device = topic.split("/")[2];
    if (typeof temp !== "number") throw new Error("temp missing");   // public broker: validate input
    await pool.query("INSERT INTO readings (device, temp) VALUES ($1, $2)", [device, temp]);
    console.log("saved", device, temp);
  } catch (e) {
    console.error("bad message on", topic, e.message);
  }
});`,
          },
        },
        commands: [{ cmd: "node ingest.mjs", purpose: "Run it, and you should see 'saved room1 26.4' every 5 s" }],
      },
      {
        title: "Add an API + live page in Next.js",
        commands: [{ cmd: "npx create-next-app@latest iot-web && cd iot-web && npm i pg", purpose: "New Next.js app" }],
        code: {
          title: "app/api/readings/route.ts + app/page.tsx",
          variants: {
            ts: `// app/api/readings/route.ts
import pg from "pg";
const pool = new pg.Pool({ connectionString: "postgres://localhost/iot" });

export async function GET() {
  const { rows } = await pool.query(
    "SELECT device, temp::float AS temp, created_at FROM readings ORDER BY id DESC LIMIT 20"
  );
  return Response.json(rows);
}

// app/page.tsx
"use client";
import { useEffect, useState } from "react";

type Reading = { device: string; temp: number; created_at: string };

export default function Page() {
  const [rows, setRows] = useState<Reading[]>([]);
  useEffect(() => {
    const load = () => fetch("/api/readings").then((r) => r.json()).then(setRows);
    load();
    const id = setInterval(load, 5000);        // simple polling
    return () => clearInterval(id);
  }, []);
  return (
    <main style={{ padding: 24 }}>
      <h1>Latest: {rows[0]?.temp ?? "—"} °C</h1>
      <ul>{rows.map((r, i) => <li key={i}>{r.device}: {r.temp} °C at {new Date(r.created_at).toLocaleTimeString()}</li>)}</ul>
    </main>
  );
}`,
          },
        },
      },
      { title: "Stretch goals", body: ["Swap polling for **SSE** (Web Systems, real-time lesson).", "Chart with Recharts. Add a `devices` table and a threshold alert.", "Run ingest + Postgres with **docker compose** (SysInta)."] },
    ],
    done: ["Readings flow from Wokwi to Postgres (`SELECT count(*) FROM readings;` keeps growing).", "The Next.js page updates every 5 s.", "Bad JSON on the topic is logged, not crashed on."],
  },
};
