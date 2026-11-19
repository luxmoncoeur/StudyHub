type W = Record<string, { title: string; body: string[] }[]>;

export const walk: W = {
  electronics: [
    { title: "Voltage, current, resistance: the water analogy", body: [
      "Think of a circuit as water in a pipe. **Voltage (V)** is the pressure pushing the water, **current (I)** is how much water flows per second, and **resistance (R)** is how narrow the pipe is. More pressure means more flow; a narrower pipe means less flow.",
      "Ohm's law ties them together: `V = I × R`. Rearranged, `I = V / R`: with the voltage fixed, a bigger resistor means less current. That's the whole reason resistors exist in your projects: to **limit current** so parts don't burn."] },
    { title: "Why an LED needs a resistor", body: [
      "An LED isn't a normal resistor. Once its *forward voltage* (Vf ≈ 2 V for red, ≈ 3 V for blue/white) is reached, it conducts almost freely, so current shoots up until something burns.",
      "So you add a resistor to \"eat\" the leftover voltage. The resistor gets `Vsupply − Vf`, and you pick R so the current is safe (~10–20 mA): `R = (5 − 2) / 0.02 = 150 Ω`. Resistors come in standard values, so round **up** to 220 Ω: slightly dimmer, much safer."] },
    { title: "Reading the color code", body: [
      "Bands 1 and 2 are digits, band 3 is how many zeros to add, and band 4 is the tolerance. Red(2) Red(2) Brown(×10) Gold = 22 × 10 = **220 Ω ±5%**. Brown Black Orange = 10 × 1000 = **10 kΩ**.",
      "Always hold the resistor with the gold or silver band on the right. When in doubt, measure it with a multimeter in Ω mode."] },
    { title: "The voltage divider", body: [
      "Two resistors in series split a voltage: `Vout = Vin × R2 / (R1 + R2)`. You'll use it to bring a 5 V sensor signal down to 3.3 V for an ESP32 (1 kΩ + 2 kΩ → 3.33 V), and with an LDR to turn light into a voltage the board can read."] },
  ],
  breadboard: [
    { title: "How a breadboard is connected inside", body: [
      "Under the plastic are metal strips. In the middle area, each **row of 5 holes** is one strip, so anything in the same row is connected. The gap down the center separates the left and right halves, which is why chips straddle it.",
      "The long **rails** along the edges run the full length and carry power: red for 5 V or 3.3 V, blue for GND. On many boards the rails are split halfway, so if half your circuit is dead, check that first."] },
    { title: "Floating inputs and pull-up resistors", body: [
      "A digital input reads HIGH or LOW. When nothing is connected (a button not pressed), the pin isn't HIGH or LOW. It **floats** and picks up electrical noise, so you get random readings.",
      "A **pull-up** resistor (≈10 kΩ to VCC) gently holds the pin HIGH when nothing else drives it. Pressing the button connects the pin to GND, so it reads LOW. Arduino has this resistor built in: `pinMode(pin, INPUT_PULLUP)`. Remember that the logic is inverted: **pressed = LOW**."] },
    { title: "Debugging wiring like a pro", body: [
      "Most \"my code doesn't work\" problems are wiring. Check in this order: is GND shared between all parts? Is the LED backwards (the long leg goes to +)? Are the rails split? Is the jumper in the right row?",
      "A multimeter in continuity mode beeps when two points are connected, which is the fastest way to find a bad jumper. In Tinkercad, hover over a pin to see its name."] },
  ],
  "arduino-io": [
    { title: "The shape of every sketch", body: [
      "`setup()` runs once when the board powers on: configure pins, start Serial, connect to Wi-Fi. `loop()` then runs forever, thousands of times per second. Your program is basically \"read inputs → decide → set outputs\", repeated."] },
    { title: "Digital vs analog, and fake analog (PWM)", body: [
      "**Digital** is on or off: `digitalWrite(pin, HIGH)` puts out 5 V, and `digitalRead` returns HIGH or LOW. **Analog input** measures a voltage: `analogRead(A0)` returns 0–1023 on the Uno (10-bit) or 0–4095 on the ESP32 (12-bit). Convert with `volts = raw × 5.0 / 1023`.",
      "Boards can't output a true in-between voltage, so they switch on and off very fast. That's **PWM**. `analogWrite(pin, 128)` is on ~50% of the time, so an LED looks half-bright and a motor spins at half speed."] },
    { title: "Why delay() is a trap", body: [
      "`delay(1000)` freezes everything for a second: no button reads, no sensor checks. Fine for blink, terrible for real projects.",
      "Instead, check the clock: remember when you last did something and act when enough time has passed: `if (millis() - last >= 1000) { last = millis(); ... }`. The loop keeps spinning, so everything stays responsive. Every multi-task sketch is built this way."] },
    { title: "Serial Monitor is your debugger", body: [
      "`Serial.begin(115200)` in setup, then `Serial.println(value)` anywhere. Print sensor values, states and \"reached here\" messages. The Serial Plotter graphs numbers live, which is great for spotting noisy sensors. The baud rate in the monitor must match `Serial.begin`."] },
  ],
  sensors: [
    { title: "Every sensor turns something physical into a signal", body: [
      "Some give an **analog voltage** (LDR, potentiometer, soil moisture), so you read them with `analogRead`. Some give a **digital signal** (PIR: HIGH when motion is detected). Some speak a **protocol** (DHT22 over one data wire, OLED displays over I2C), and a library handles the details.",
      "Knowing which type you have tells you which pin to use and which function to call."] },
    { title: "The ultrasonic sensor, explained", body: [
      "The HC-SR04 sends a burst of sound and times the echo. You trigger it with a 10 µs pulse on TRIG, then `pulseIn(ECHO, HIGH)` gives the round-trip time in microseconds.",
      "Sound travels at 343 m/s = 0.0343 cm/µs, and the sound goes there **and back**, so `distance = time × 0.0343 / 2`. No echo before the timeout returns 0, which means *out of range*, not \"0 cm\"."] },
    { title: "Actuators: making things move", body: [
      "A **servo** turns to an angle (0–180°) based on PWM, using the Servo library. A **relay** is a switch controlled by your board that can turn on a bigger load. Always use a relay *module* (it has the transistor and diode built in), and leave 220 V mains to supervised setups.",
      "Motors draw more current than a pin can give, so they need a driver board (L298N) and often a separate power supply with a shared GND."] },
  ],
  protocols: [
    { title: "Two kinds of talking: inside the board and across the network", body: [
      "**I2C, SPI and UART** connect chips on the same board, centimeters apart. **HTTP and MQTT** connect devices across a network, so your ESP32 can talk to the cloud. A typical project uses both: I2C to read a sensor, MQTT to send the reading."] },
    { title: "I2C, SPI, UART in one minute", body: [
      "**I2C** uses 2 shared wires (SDA data, SCL clock). Each device has an address (OLED 0x3C, LCD 0x27), so many devices share the bus. **SPI** uses 4 wires and is faster, with one chip-select wire per device (SD cards, TFT screens). **UART** is TX/RX serial, crossed between two devices (GPS modules, the USB serial link)."] },
    { title: "MQTT: publish/subscribe", body: [
      "Devices don't talk to each other directly. They talk to a **broker**. A sensor **publishes** a message to a *topic* like `school/room101/temp`. A dashboard **subscribes** to that topic (or `school/+/temp` for all rooms) and gets every new message.",
      "Neither side needs to know the other exists, so you can add dashboards or sensors without changing anything else. Messages are tiny and the connection stays open, which makes MQTT great for many small, frequent readings. QoS sets the delivery guarantee: 0 = at most once, 1 = at least once."] },
    { title: "When HTTP is better", body: [
      "HTTP is request/response: the device asks and the server answers. It's simpler to start with and works with any web API (ThingSpeak, your own Express server). Use it for occasional uploads or when you need a reply. Use MQTT for streams and for pushing commands **down** to devices."] },
  ],
  "esp32-mqtt": [
    { title: "The connection sequence", body: [
      "An ESP32 IoT sketch always does three things: join Wi-Fi, connect to the broker, then loop publishing and listening. Both connections can drop (weak signal, broker restart), so the loop checks and **reconnects** instead of assuming they're still up.",
      "`mqtt.loop()` must run every pass of the loop. It sends keep-alive pings and delivers incoming messages to your callback."] },
    { title: "Publishing data", body: [
      "Build a small JSON string, `{\"temp\":26.4}`, with `snprintf`, then `mqtt.publish(topic, payload)`. Use `millis()` to publish every few seconds without blocking. Pick topics as a path: `<project>/<device>/<measurement>`. Wildcards make that structure useful later."] },
    { title: "Receiving commands", body: [
      "Call `mqtt.setCallback(fn)`, then subscribe to a command topic after connecting. When someone publishes `on` to `.../cmd`, your callback runs with the payload. Compare it and act, e.g. switch a relay. That's how a dashboard button turns on a lamp across the internet."] },
    { title: "Testing without hardware", body: [
      "Wokwi simulates the ESP32 and gives it internet through `Wokwi-GUEST`. On your Mac, `mosquitto_sub` watches the topic and `mosquitto_pub` sends commands. You can build and test the full loop in a browser before buying parts."] },
  ],
  architecture: [
    { title: "The three layers", body: [
      "**Perception** is the physical layer: sensors and actuators. **Network** moves the data: Wi-Fi, LoRa or cellular, plus a protocol like MQTT. **Application** is where people see and use it: dashboards, alerts, mobile apps. Every IoT system, from a classroom monitor to a smart city, fits this shape.",
      "The 5-layer model splits out **Processing** (broker, database, rules) and **Business** (reports and decisions), which is useful for capstone documentation."] },
    { title: "Where does the thinking happen?", body: [
      "**Edge**: on the device itself (the ESP32 decides that water is too high). **Fog**: on a local gateway (a Raspberry Pi in the building). **Cloud**: on remote servers. Processing at the edge means faster reactions and it still works when the internet is down. The cloud gives you storage, history and dashboards from anywhere.",
      "Good designs do critical decisions at the edge and analytics in the cloud."] },
    { title: "Dashboards", body: [
      "**ThingSpeak** takes HTTP uploads and charts them for free (one update per 15 s). **Node-RED** runs on your computer, wires MQTT topics to gauges, charts and alerts by dragging nodes, and is great for demos. **Blynk** gives you a mobile app quickly. Pick one that fits your protocol."] },
  ],
  "iot-security": [
    { title: "Why IoT is a favorite target", body: [
      "IoT devices are often left with default passwords, never updated, and connected straight to the internet. Attackers scan for them automatically and recruit them into botnets. A compromised device on the school network can be a doorway to everything else."] },
    { title: "The basics that stop most attacks", body: [
      "Change default credentials and give each device its own. Keep secrets (Wi-Fi password, API keys) out of code: put them in a `secrets.h` that's in `.gitignore`. Encrypt traffic with TLS (MQTT port 8883, HTTPS). Put IoT devices on a separate network (VLAN) so a hacked sensor can't reach the registrar's server."] },
    { title: "Public brokers are public", body: [
      "`broker.hivemq.com` is great for learning, but **anyone** can read and write any topic. Use unique topic names, never send personal data, and never let a public topic control something dangerous. Real deployments use a private broker with usernames, passwords and TLS."] },
  ],
};
