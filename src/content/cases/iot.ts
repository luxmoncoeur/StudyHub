import type { LessonCase, Project } from "../types";

export const cases: Record<string, LessonCase[]> = {
  electronics: [{
    title: "The LED that died in 2 seconds",
    scenario: "A groupmate wired a red LED straight to the Uno's 5 V pin without a resistor. It flashed brightly and went dark forever.",
    steps: ["Current with no resistor ≈ (5 − 2) / ~0 Ω, so it's limited only by the LED and the pin, far above the LED's 20 mA rating.", "Required: R = (5 − 2.0) / 0.020 = **150 Ω**. Next standard value up = **220 Ω** (Red-Red-Brown).", "With 220 Ω: I = 3 / 220 = **13.6 mA**, safe and still bright.", "Same LED on an ESP32 (3.3 V): (3.3 − 2) / 220 = 5.9 mA, dimmer but fine."],
    takeaway: "Every LED needs a series resistor. Compute it, then round **up** to a standard value.",
  }],
  breadboard: [{
    title: "The button that pressed itself",
    scenario: "A door-alarm prototype keeps triggering even when nobody touches the button. Serial Monitor shows random 0s and 1s.",
    steps: ["The pin was `INPUT` with nothing pulling it to a known level, so it **floats** and picks up noise.", "Fix A: `pinMode(2, INPUT_PULLUP)` and wire the button pin → GND. Pressed = LOW.", "Fix B: an external 10 kΩ from the pin to 5 V (pull-up) or to GND (pull-down).", "Verify: with the button released, the Serial Monitor shows a steady 1."],
    takeaway: "An unconnected input is random. Always give it a pull-up or pull-down.",
  }],
  "arduino-io": [{
    title: "Blink + button that ignores you",
    scenario: "A student's sketch blinks an LED with `delay(1000)` and also reads a button. The button only works if held for a full second.",
    steps: ["`delay()` freezes the whole loop, so the button is read once per second at most.", "Rewrite the blink with `millis()`: `if (millis() - last >= 1000) { last = millis(); toggle(); }`.", "Read the button every loop pass, which now runs thousands of times a second.", "Test: the button responds instantly while the LED keeps blinking."],
    takeaway: "Use `millis()` timing whenever the board must do more than one thing.",
  }],
  sensors: [{
    title: "Parking sensor reads 0 cm sometimes",
    scenario: "An HC-SR04 parking meter occasionally prints `0.0 cm` and the buzzer screams for no reason.",
    steps: ["`pulseIn` returns 0 when no echo comes back before the timeout (object too far or at an angle).", "Treat 0 as **out of range**, not as distance 0: `if (us == 0) return -1;`.", "Smooth spikes by taking the median of 3 readings.", "On an ESP32, check the 1k/2k divider on ECHO, because a 5 V echo can damage the pin."],
    takeaway: "Sensors lie sometimes. Handle the error value and filter noisy readings.",
  }],
  protocols: [{
    title: "HTTP or MQTT for 50 classroom sensors?",
    scenario: "The school wants temperature from 50 rooms every 10 s on one dashboard. Which protocol?",
    steps: ["HTTP: each reading = a new request with full headers, and the dashboard must poll.", "MQTT: devices keep one connection and **publish** to `school/<room>/temp`. The dashboard **subscribes** to `school/+/temp`.", "Use QoS 0 for frequent readings (losing one is fine) and QoS 1 for alarms.", "Add a Last Will message so the dashboard knows when a device goes offline."],
    takeaway: "Many small, frequent messages → MQTT. Occasional request/response → HTTP.",
  }],
  "esp32-mqtt": [{
    title: "Two ESP32s keep disconnecting each other",
    scenario: "Two group members flashed the same sketch. Both connect, but they kick each other off the broker every few seconds.",
    steps: ["MQTT client IDs must be **unique**: the broker drops the old connection when a duplicate ID connects.", "Build the ID from the chip: `\"esp32-\" + String((uint32_t)ESP.getEfuseMac(), HEX)`.", "Also make topics unique per device: `bsit/juan/room1/temp`.", "Verify with `mosquitto_sub -t 'bsit/#' -v`: both streams flow steadily."],
    takeaway: "Unique client ID per device, unique topic per data source.",
  }],
  architecture: [{
    title: "Explain your flood monitor to the panel",
    scenario: "The panel asks: \"Which layer is Node-RED? What happens if the internet goes down?\"",
    steps: ["Perception: HC-SR04 + ESP32. Network: Wi-Fi + MQTT. Application: Node-RED dashboard + alerts.", "Processing at the **edge**: the ESP32 computes the water level and the alert flag itself.", "Internet down: add a local buzzer driven by the ESP32 so the alarm still works (edge resilience).", "Draw it as 3 boxes with the protocol on each arrow."],
    takeaway: "Know your layers, and decide what must still work offline.",
  }],
  "iot-security": [{
    title: "Your Wi-Fi password is on GitHub",
    scenario: "A team pushed their capstone sketch to a public repo. It contains the school Wi-Fi password and a ThingSpeak write key.",
    steps: ["Rotate (change) the leaked password and API key **immediately**. Deleting the commit isn't enough because history keeps it.", "Move secrets to `secrets.h` and add it to `.gitignore`. Commit a `secrets.example.h` with placeholders.", "Use a separate IoT Wi-Fi/VLAN so a compromised device can't reach the school's main network.", "Prefer MQTT over TLS (8883) for anything beyond class demos."],
    takeaway: "Secrets never go in code. If they leak, rotate them first.",
  }],
};

export const caseProject: Project = {
  title: "Case: Classroom comfort monitor",
  level: "Starter",
  scope: "From scratch: a Wokwi ESP32 monitor that reports temperature and light per room and raises an alert, built against acceptance test cases.",
  stack: ["Wokwi", "ESP32", "DHT22", "LDR", "MQTT"],
  guide: {
    where: "Wokwi (browser) + Mac Terminal (mosquitto)",
    time: "1 weekend",
    brief: {
      client: "Sta. Rosa National High School, Facilities Office",
      problem: "Classrooms get too hot in the afternoon and teachers turn on lights that aren't needed. Staff want live readings per room and an alert when a room passes 32 °C.",
      requirements: [
        "Read temperature + humidity (DHT22) and light level (LDR) every 10 s.",
        "Publish JSON to `school/<room>/env`, e.g. `{\"t\":31.2,\"h\":70,\"light\":812}`.",
        "Publish `ALERT` to `school/<room>/alert` once when t ≥ 32 °C, and `OK` when it drops below 31 °C (hysteresis, no spam).",
        "A red LED on the board mirrors the alert state.",
        "Recover by itself if Wi-Fi or the broker drops.",
      ],
    },
    tests: [
      { id: "TC-01", scenario: "Normal reading", steps: "Set DHT22 to 28 °C in Wokwi, wait 10 s", expected: "One JSON message on `school/room-101/env` with t = 28.0" },
      { id: "TC-02", scenario: "Hot room", steps: "Slide temperature to 33 °C", expected: "`ALERT` published **once**, red LED on" },
      { id: "TC-03", scenario: "No alert spam", steps: "Keep it at 33 °C for 1 min", expected: "No extra `ALERT` messages" },
      { id: "TC-04", scenario: "Cooling down", steps: "Slide to 30.5 °C", expected: "`OK` published once, LED off" },
      { id: "TC-05", scenario: "Hysteresis band", steps: "Move between 31.5 and 31.9 °C", expected: "No messages on the alert topic" },
      { id: "TC-06", scenario: "Sensor failure", steps: "Disconnect the DHT22 data wire", expected: "Serial prints `DHT read failed`; no bogus JSON published" },
    ],
    youNeed: ["Wokwi ESP32 project", "DHT22, LDR module (or LDR + 10 kΩ), red LED + 220 Ω", "`brew install mosquitto`"],
    steps: [
      { title: "Understand the brief", body: ["Read the requirements and the test cases **before** wiring. Each test case is something you'll demo. Write the topic names down."] },
      { title: "Design", body: ["Draw the 3 layers (DHT22/LDR → ESP32 → MQTT → staff dashboard). Note the alert rule: ON at ≥ 32, OFF below 31."] },
      { title: "Wire it in Wokwi", wiring: [
        { from: "DHT22 VCC / GND", to: "3V3 / GND" }, { from: "DHT22 SDA", to: "GPIO 15" },
        { from: "LDR module AO", to: "GPIO 34", note: "ADC1 pin: works while Wi-Fi is on" }, { from: "GPIO 2 → 220 Ω", to: "Red LED anode", note: "cathode → GND" },
      ] },
      { title: "Build the first slice: readings only", body: ["Start from the **Room weather station** project's DHT22 code. Print t, h and `analogRead(34)` to Serial every 10 s. Pass TC-06 first."] },
      { title: "Add MQTT publishing", body: ["Reuse the connection code from the **MQTT round trip** activity. Build the JSON with `snprintf` and pass TC-01."] },
      { title: "Add the alert state machine", body: ["Keep `bool alerting = false;`. If `!alerting && t >= 32` → publish ALERT, LED on, `alerting = true`. If `alerting && t < 31` → publish OK, LED off, `alerting = false`. That passes TC-02 to TC-05."],
        code: { title: "Alert logic (starter)", variants: { cpp: `bool alerting = false;

void checkAlert(float t, const char* alertTopic) {
  if (!alerting && t >= 32.0) {
    alerting = true;
    digitalWrite(2, HIGH);
    mqtt.publish(alertTopic, "ALERT");
  } else if (alerting && t < 31.0) {   // 1 °C hysteresis: no flapping at the threshold
    alerting = false;
    digitalWrite(2, LOW);
    mqtt.publish(alertTopic, "OK");
  }
}` } } },
      { title: "Run the test cases", commands: [{ cmd: "mosquitto_sub -h broker.hivemq.com -t 'school/#' -v", purpose: "Watch every message while you go through TC-01 to TC-06" }], body: ["Mark each test case pass or fail in a table. That table goes in your documentation."] },
    ],
    done: ["All 6 test cases pass.", "The README has the wiring table, topics and test results."],
  },
};
