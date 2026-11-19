import type { Course } from "./types";

export const iot: Course = {
  code: "ITELEC2",
  slug: "iot",
  title: "Internet of Things",
  units: 3,
  accent: "#fbbf24",
  tagline: "Resistors and breadboards, then Arduino, then ESP32 over MQTT to a dashboard.",
  ched: "IT elective (school-defined under CMO 25 s.2015). It usually covers electronics basics, microcontrollers (Arduino/ESP32), sensors and actuators, IoT protocols (MQTT, HTTP, I2C, SPI), architecture layers, cloud dashboards and IoT security.",
  lessons: [
    {
      slug: "electronics",
      title: "Ohm's law, resistors & LEDs",
      why: "Without this you burn out LEDs and pins. With it you can wire anything.",
      points: [
        "`V = I × R`. LED resistor: `R = (Vsupply − Vf) / I`. Uno: (5 − 2.0) / 0.020 = 150 Ω, so use 220 Ω (the next standard value up).",
        "Color code: bands 1–2 are digits, band 3 is the multiplier, band 4 is the tolerance. Red-Red-Brown-Gold = 22 × 10 = **220 Ω ±5%**.",
        "LED polarity: the long leg is the anode (+). The flat edge of the rim marks the cathode (−).",
        "Voltage divider: `Vout = Vin × R2 / (R1 + R2)`. Use 1k/2k to bring 5 V down to ~3.3 V for the ESP32.",
      ],
      demo: "resistor",
    },
    {
      slug: "breadboard",
      title: "Breadboard, pull-ups & multimeter",
      why: "Most beginner bugs here are wiring bugs, not code bugs.",
      points: [
        "Each row of 5 holes is connected. The power rails run along the edges, and on many boards they're split in the middle, so check with a multimeter.",
        "A floating input reads random values. A pull-up (10 kΩ to VCC) or pull-down (to GND) gives it a defined default.",
        "`INPUT_PULLUP` turns on the internal pull-up. Wire the button from the pin to GND, and pressed reads `LOW`.",
        "No circuit simulator on your Mac yet? Use **Tinkercad Circuits** (Uno) or **Wokwi** (Uno + ESP32 + Wi-Fi) in the browser.",
      ],
    },
    {
      slug: "arduino-io",
      title: "Arduino: digital, analog, PWM, Serial",
      why: "The 6 functions behind almost every sketch.",
      points: [
        "`pinMode`, `digitalWrite`, `digitalRead`, `analogRead` (Uno 0–1023, ESP32 0–4095), `analogWrite` (PWM 0–255), `Serial.println`.",
        "`setup()` runs once and `loop()` runs forever.",
        "`delay()` blocks everything. Use `millis()` timing so the board can do several things at once.",
        "Arduino IDE 2 runs natively on Apple Silicon. If the Uno clone port doesn't show up, install the CH34x driver and use a **data** cable (the #1 cause).",
      ],
      code: [
        {
          title: "Blink",
          variants: {
            cpp: `void setup() { pinMode(LED_BUILTIN, OUTPUT); }

void loop() {
  digitalWrite(LED_BUILTIN, HIGH); delay(1000);
  digitalWrite(LED_BUILTIN, LOW);  delay(1000);
}`,
          },
          note: "Uno LED is pin 13. On the ESP32 DevKit it's often GPIO2.",
        },
        {
          title: "Button toggle with debounce (no delay)",
          variants: {
            cpp: `const int BTN = 2, LED = 13;
const unsigned long DEBOUNCE_MS = 50;
int lastReading = HIGH, stableState = HIGH, ledState = LOW;
unsigned long lastChange = 0;

void setup() { pinMode(BTN, INPUT_PULLUP); pinMode(LED, OUTPUT); }

void loop() {
  int reading = digitalRead(BTN);
  if (reading != lastReading) lastChange = millis();      // bouncing: restart timer
  if (millis() - lastChange > DEBOUNCE_MS && reading != stableState) {
    stableState = reading;
    if (stableState == LOW) {                              // pressed
      ledState = !ledState;
      digitalWrite(LED, ledState);
    }
  }
  lastReading = reading;
}`,
          },
          note: "This is the same idea as debouncing in Web Systems, done in hardware.",
        },
        {
          title: "analogRead: LDR light sensor",
          variants: {
            cpp: `void setup() { Serial.begin(9600); }

void loop() {
  int raw = analogRead(A0);              // 0..1023
  float volts = raw * (5.0 / 1023.0);
  Serial.print(raw); Serial.print('\\t'); Serial.println(volts, 2);
  delay(200);
}`,
          },
        },
      ],
    },
    {
      slug: "sensors",
      title: "Sensors & actuators",
      why: "DHT, ultrasonic, PIR and servo cover most student projects.",
      points: [
        "**DHT11/22**: temperature and humidity. Read at most every 2 s (DHT22).",
        "**HC-SR04**: distance = echo time × 0.0343 / 2 (cm). On an ESP32, put a divider on ECHO because it outputs 5 V.",
        "**PIR HC-SR501**: goes HIGH on motion. **LDR**: light level, read through a divider.",
        "**Servo** angle 0–180. **Relay**: use a module, never drive the coil straight from a pin, and keep away from 220 V mains without supervision.",
      ],
      code: [
        {
          title: "DHT22 temperature & humidity",
          variants: {
            cpp: `#include <DHT.h>   // Adafruit "DHT sensor library"
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() { Serial.begin(115200); dht.begin(); }

void loop() {
  delay(2000);
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) { Serial.println("DHT read failed"); return; }
  Serial.printf("T=%.1f C  H=%.1f %%\\n", t, h);   // printf works on ESP32
}`,
          },
        },
        {
          title: "HC-SR04 ultrasonic distance",
          variants: {
            cpp: `const int TRIG = 9, ECHO = 10;

void setup() { Serial.begin(9600); pinMode(TRIG, OUTPUT); pinMode(ECHO, INPUT); }

void loop() {
  digitalWrite(TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  unsigned long us = pulseIn(ECHO, HIGH, 30000UL);   // 30 ms timeout
  if (us == 0) Serial.println("out of range");
  else { Serial.print(us * 0.0343 / 2.0, 1); Serial.println(" cm"); }
  delay(100);
}`,
          },
        },
      ],
    },
    {
      slug: "protocols",
      title: "Protocols: MQTT, HTTP, I2C, SPI",
      why: "How devices talk to each other and to the cloud.",
      points: [
        "**MQTT**: publish/subscribe through a broker. Topics look like `bsit/juan/room1/temp`. `+` matches one level and `#` matches the rest. QoS 0/1/2. Port 1883 (8883 = TLS).",
        "**HTTP**: request/response (REST). Simpler but heavier than MQTT. ThingSpeak uses `GET /update?api_key=…&field1=…`.",
        "**I2C**: 2 wires (SDA/SCL), addressed. LCD backpack at 0x27/0x3F, OLED at 0x3C. Run an I2C scanner to find them.",
        "**SPI**: 4 wires (MOSI/MISO/SCK/CS), faster. Used by SD cards, TFTs and RFID RC522. **UART**: TX↔RX crossed.",
      ],
      commands: [
        { cmd: "brew install mosquitto", purpose: "MQTT broker + CLI clients on your Mac", os: "mac" },
        { cmd: "mosquitto_sub -h broker.hivemq.com -t 'bsit/CHANGE-ME/#' -v", purpose: "Watch every message under your topic" },
        { cmd: "mosquitto_pub -h broker.hivemq.com -t bsit/CHANGE-ME/cmd -m on", purpose: "Send a command to your device" },
        { cmd: "brew services start mosquitto", purpose: "Run a local broker on port 1883", os: "mac" },
      ],
    },
    {
      slug: "esp32-mqtt",
      title: "ESP32 Wi-Fi + MQTT",
      why: "The core IoT pattern: a sensor publishes to the cloud and a dashboard subscribes.",
      points: [
        "This runs in **Wokwi** as-is (`Wokwi-GUEST`, no password, channel 6). The free plan only has outbound internet, so use a public broker.",
        "Public brokers are readable by anyone. Use a unique topic and never send personal data.",
        "Use a unique client ID per device, or the broker will keep kicking one off.",
        "On a real board, put the SSID and password in `secrets.h` and add it to `.gitignore`.",
      ],
      code: [{
        title: "Publish temperature every 5 s",
        variants: {
          cpp: `#include <WiFi.h>
#include <PubSubClient.h>

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";
const char* BROKER    = "broker.hivemq.com";
const char* TOPIC     = "bsit/CHANGE-ME/room1/temp";

WiFiClient net;
PubSubClient mqtt(net);
unsigned long lastPub = 0;

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASS, 6);   // channel 6 is for Wokwi only
  while (WiFi.status() != WL_CONNECTED) { delay(250); Serial.print('.'); }
  Serial.println(WiFi.localIP());
}

void connectMQTT() {
  while (!mqtt.connected()) {
    String id = "esp32-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (mqtt.connect(id.c_str())) Serial.println("MQTT connected");
    else { Serial.printf("MQTT failed rc=%d\\n", mqtt.state()); delay(2000); }
  }
}

void setup() {
  Serial.begin(115200);
  connectWiFi();
  mqtt.setServer(BROKER, 1883);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();
  if (millis() - lastPub >= 5000) {
    lastPub = millis();
    float temp = 25.0 + random(0, 50) / 10.0;   // swap in dht.readTemperature()
    char payload[48];
    snprintf(payload, sizeof payload, "{\\"temp\\":%.1f}", temp);
    mqtt.publish(TOPIC, payload);
  }
}`,
        },
      }],
    },
    {
      slug: "architecture",
      title: "IoT architecture & dashboards",
      why: "How to explain your system in a diagram, plus where the data ends up.",
      points: [
        "3 layers: **Perception** (sensors/actuators) → **Network** (Wi-Fi, LoRa + protocols) → **Application** (dashboards/apps). The 5-layer model adds Processing and Business.",
        "Edge (on the device) vs fog (local gateway) vs cloud processing.",
        "Dashboards: **ThingSpeak** (HTTP, free, ≥15 s between updates) · **Blynk** (mobile app) · **Node-RED** (runs on your Mac, subscribes to MQTT).",
      ],
      commands: [
        { cmd: "npm i -g node-red && node-red", purpose: "Start Node-RED at http://localhost:1880" },
        { cmd: "npm i @flowfuse/node-red-dashboard", purpose: "Dashboard nodes (charts, gauges, buttons). Install from Node-RED's palette or ~/.node-red" },
      ],
    },
    {
      slug: "iot-security",
      title: "IoT security",
      why: "Most IoT breaches come from default passwords and open ports.",
      beyond: true,
      points: [
        "Change default credentials and give each device its own credentials.",
        "Use TLS (MQTT 8883, HTTPS). Never commit Wi-Fi or API keys to GitHub or a public Wokwi project.",
        "Keep firmware updated (OTA), close unused ports, and put IoT devices on their own network or VLAN.",
        "Reference: the OWASP IoT Top 10.",
      ],
    },
  ],
  activities: [
    { title: "Resistor speed run", steps: ["Pick 10 random resistors from a kit.", "Read each one's color code and verify with the demo and a multimeter."] },
    { title: "Traffic light (Tinkercad)", steps: ["3 LEDs + 220 Ω resistors on an Uno.", "Add a pedestrian button with debounce.", "Rewrite it without delay() using millis()."] },
    { title: "Parking sensor (Wokwi)", steps: ["HC-SR04 + 3 LEDs + a buzzer.", "Green above 50 cm, yellow at 20–50 cm, red and beeping below 20 cm."] },
    { title: "MQTT round trip", steps: ["Run the ESP32 sketch in Wokwi.", "Run mosquitto_sub on your Mac and watch the messages arrive.", "Add mqtt.setCallback so publishing 'on' lights an LED."] },
  ],
  projects: [
    { title: "Room weather station", level: "Starter", scope: "DHT22 → ThingSpeak every 20 s, with a public chart.", stack: ["ESP32", "DHT22", "HTTP"] },
    { title: "Flood level monitor", level: "Core", scope: "Ultrasonic sensor over a container → MQTT → Node-RED dashboard with an alert threshold.", stack: ["ESP32", "HC-SR04", "MQTT", "Node-RED"] },
    { title: "Smart lamp over MQTT", level: "Core", scope: "A dashboard button publishes on/off and the ESP32 subscribes and drives a relay or LED.", stack: ["ESP32", "relay", "MQTT"] },
    { title: "IoT + web full stack", level: "Stretch", scope: "ESP32 publishes, a Node service stores readings in Postgres, and a Next.js page charts them live.", stack: ["ESP32", "Node", "PostgreSQL", "Next.js"] },
  ],
};
