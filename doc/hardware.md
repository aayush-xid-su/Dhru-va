# ध्रु-VA (v4.0) — Multi-SIM Walk-Test RF Analyzer


## 🛠️ Hardware Implementation Guide (Real-Time Operation)

To transition from the built-in simulation layer to a **real physical hardware setup** that streams real-world field test data into the **ध्रु-VA** web interface, use one of the two industrial-grade implementation patterns detailed below.

### Hardware Architecture Overview
```
+-------------------------------------------------------------+
|                     FIELD TRANSMITTER MODULE                |
|  [GPS Antenna]          [LTE Main Antenna]  [LTE Div Ant]   |
|        |                        \                /          |
|   +----+----+                  +------------------+         |
|   | NEO-M8N |                  | SIM7600/SIM8200  |         |
|   |   GPS   |                  | 4G/5G LTE Modem  |         |
|   +----+----+                  +--------+---------+         |
|        | UART                           | UART              |
|        +---------------+ +--------------+                   |
|                        | |                                  |
|                  +-----+-----+                              |
|                  |   ESP32   |                              |
|                  | MCU Node  |                              |
|                  +-----+-----+                              |
|                        |                                    |
|                        v Wi-Fi / LTE Hotspot (TCP/JSON)     |
+------------------------+------------------------------------+
                         |
                         v
+------------------------+------------------------------------+
|                     CLOUD / GATEWAY LAYER                   |
|                  +-----+-----+                              |
|                  | Node/Go   |                              |
|                  | REST API  |                              |
|                  +-----+-----+                              |
+------------------------+------------------------------------+
                         |
                         v Server-Sent Events / WebSockets
+------------------------+------------------------------------+
|                  ध्रु-VA CLIENT (Web UI)                      |
+-------------------------------------------------------------+
```

---

### Pattern A: ESP32 + LTE SIM7600 + GPS (The Embedded Route)

This setup uses an **ESP32 microcontroller** paired with an **SIM7600E-H series module** (supporting 4G LTE-A and integrated GNSS) to fetch active cell data via **AT commands**, wrap it into a structured JSON payload, and POST it over a Wi-Fi or cellular uplink.

#### 1. Hardware Requirements
* **Microcontroller**: ESP32 Development Board (NodeMCU / FireBeetle).
* **LTE/GPS Shield**: SIM7600 Series Module (PCIe/mPCIe breakout boards).
* **Power Supply**: 5V/2A external regulator (SIM7600 modules draw high current peaks during cellular registration).
* **SIM Cards**: Active commercial SIMs (e.g., Airtel, Jio).

#### 2. Arduino / ESP32 C++ Production Firmware
Flash the following code to your ESP32 to query network parameters and push coordinates and signal levels to your backend:

```cpp
#include <HardwareSerial.h>
#include <WiFi.h>
#include <HTTPClient.h>

// Serial lines for SIM7600 communications
#define RXD2 16
#define TXD2 17
HardwareSerial simSerial(2);

// Configuration Constants
const char* WIFI_SSID = "Your_Field_Hotspot";
const char* WIFI_PASS = "HotspotPassword";
const char* SERVER_ENDPOINT = "https://your-drona-api.run.app/api/telemetry";

unsigned long lastUpdate = 0;
const int updateInterval = 2000; // Poll and send every 2 seconds

struct TelemetryData {
  float latitude;
  float longitude;
  float speed;
  float altitude;
  int rsrp;
  int rsrq;
  int sinr;
  int cellId;
  int pci;
  char operatorName[32];
};

void setup() {
  Serial.begin(115200);
  simSerial.begin(115200, SERIAL_8N1, RXD2, TXD2);
  
  // Connect to Wi-Fi Uplink
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nUplink Established!");

  // Initialize GPS on the modem
  sendATCommand("AT+CGPS=1", 1000); 
}

void loop() {
  if (millis() - lastUpdate > updateInterval) {
    lastUpdate = millis();
    if (WiFi.status() == WL_CONNECTED) {
      TelemetryData data = collectTelemetry();
      sendPayload(data);
    }
  }
}

// Function to communicate with modem over AT commands
String sendATCommand(String cmd, const int timeout) {
  String response = "";
  simSerial.println(cmd);
  long int time = millis();
  while ((time + timeout) > millis()) {
    while (simSerial.available()) {
      char c = simSerial.read();
      response += c;
    }
  }
  return response;
}

TelemetryData collectTelemetry() {
  TelemetryData t;
  t.latitude = 28.6139; // Fallbacks
  t.longitude = 77.2090;
  t.speed = 0.0;
  t.altitude = 210.0;
  t.rsrp = -90;
  t.rsrq = -10;
  t.sinr = 15;
  t.cellId = 0;
  t.pci = 0;
  strcpy(t.operatorName, "Airtel");

  // Query GNSS coordinates
  String gpsRaw = sendATCommand("AT+CGPSINFO", 500);
  if (gpsRaw.indexOf("+CGPSINFO:") != -1 && gpsRaw.indexOf(",,,,") == -1) {
    // Parse latitude & longitude out of the NMEA string sequence
    // Example format: +CGPSINFO: 2836.834000,N,07712.540000,E,300526,112233.0,210.4,0.0,0.0
    int firstComma = gpsRaw.indexOf(':') + 1;
    int secondComma = gpsRaw.indexOf(',', firstComma);
    String latStr = gpsRaw.substring(firstComma, secondComma);
    // Convert DDMM.MMMM to Decimal Degrees
    if (latStr.length() > 4) {
      float dd = latStr.substring(0, 2).toFloat();
      float mm = latStr.substring(2).toFloat();
      t.latitude = dd + (mm / 60.0);
    }
    
    int thirdComma = gpsRaw.indexOf(',', secondComma + 3);
    int fourthComma = gpsRaw.indexOf(',', thirdComma + 1);
    String lngStr = gpsRaw.substring(thirdComma + 1, fourthComma);
    if (lngStr.length() > 4) {
      float dd = lngStr.substring(0, 3).toFloat();
      float mm = lngStr.substring(3).toFloat();
      t.longitude = dd + (mm / 60.0);
    }
  }

  // Query RF metrics (AT+CESQ returns RSRP and RSRQ ratios)
  String cesqRaw = sendATCommand("AT+CESQ", 500);
  int cesqIdx = cesqRaw.indexOf("+CESQ:");
  if (cesqIdx != -1) {
    // Format: +CESQ: <rxlev>,<ber>,<rscp>,<ecno>,<rsrq>,<rsrp>
    // Parse last parameters to convert to dBm
    int r = cesqRaw.lastIndexOf(',');
    int rsrpVal = cesqRaw.substring(r + 1).toInt();
    t.rsrp = -140 + rsrpVal; // SIM7600 mapping formula
  }

  // Query Network Operator name
  String copsRaw = sendATCommand("AT+COPS?", 500);
  int copsIdx = copsRaw.indexOf("\"");
  if (copsIdx != -1) {
    int endIdx = copsRaw.indexOf("\"", copsIdx + 1);
    String op = copsRaw.substring(copsIdx + 1, endIdx);
    strcpy(t.operatorName, op.c_str());
  }

  return t;
}

void sendPayload(TelemetryData t) {
  HTTPClient http;
  http.begin(SERVER_ENDPOINT);
  http.addHeader("Content-Type", "application/json");

  // Create formatted JSON payload
  String json;
  json += "{";
  json += "\"latitude\":" + String(t.latitude, 6) + ",";
  json += "\"longitude\":" + String(t.longitude, 6) + ",";
  json += "\"speed\":" + String(t.speed, 2) + ",";
  json += "\"altitude\":" + String(t.altitude, 2) + ",";
  json += "\"operator\":\"" + String(t.operatorName) + "\",";
  json += "\"rsrp\":" + String(t.rsrp) + ",";
  json += "\"rsrq\":" + String(t.rsrq) + ",";
  json += "\"sinr\":" + String(t.sinr);
  json += "}";

  int httpCode = http.POST(json);
  if (httpCode > 0) {
    Serial.printf("[HTTP] POST... code: %d\n", httpCode);
  } else {
    Serial.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}
```

---

### Pattern B: Native Android Telephony API Client

For professional deployments, a custom Android application can act as the walk-test receiver probe. Android's high-level SDK accesses modem interfaces directly and aggregates multi-SIM diagnostic structures programmatically without custom breakout boards.

#### Android Telephony Manager Integration (Kotlin)
Utilize the `TelephonyManager` to scan LTE and NR (5G) metrics from dual SIM interfaces:

```kotlin
import android.content.Context
import android.telephony.CellInfo
import android.telephony.CellInfoLte
import android.telephony.CellInfoNr
import android.telephony.TelephonyManager

fun fetchSIMTelemetry(context: Context) {
    val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
    
    // Check manifest permissions for ACCESS_FINE_LOCATION & READ_PHONE_STATE
    val cellInfoList: List<CellInfo>? = telephonyManager.allCellInfo
    
    cellInfoList?.forEach { info ->
        if (info.isRegistered) {
            when (info) {
                is CellInfoLte -> {
                    val cellSignalLte = info.cellSignalStrength
                    val rsrp = cellSignalLte.rsrp
                    val rsrq = cellSignalLte.rsrq
                    val rssi = cellSignalLte.rssi
                    val sinr = cellSignalLte.rssi // Or channel SINR
                    val pci = info.cellIdentity.pci
                    val earfcn = info.cellIdentity.earfcn
                    
                    println("LTE serving Cell: PCI=$pci, RSRP=$rsrp dBm, RSRQ=$rsrq dB")
                }
                is CellInfoNr -> {
                    // NR (5G) specific metrics
                    val cellSignalNr = info.cellSignalStrength
                    val ssRsrp = cellSignalNr.csiRsrp // or ssRsrp
                    val ssRsrq = cellSignalNr.csiRsrq
                    val ssSinr = cellSignalNr.csiSinr
                    val pci = info.cellIdentity.pci
                    
                    println("NR (5G) serving Cell: PCI=$pci, SS-RSRP=$ssRsrp dBm, SS-SINR=$ssSinr dB")
                }
            }
        }
    }
}
```

---

### Server Connection Bridge

To pipe these remote JSON payloads directly into **ध्रु-VA**'s live map, create an API route (`/api/telemetry`) on the Express backend of the application to cache the latest hardware package, and stream it to the browser client via a persistent socket:

```ts
// server.ts - Hardware Bridge API Node
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());

let latestHardwareFrame = null;

// Endpoint for ESP32 / Android app to POST telemetry
app.post('/api/telemetry', (req, res) => {
  const { latitude, longitude, speed, altitude, operator, rsrp, rsrq, sinr } = req.body;
  
  latestHardwareFrame = {
    timestamp: Date.now(),
    gps: { latitude, longitude, speed, altitude },
    rf: { operator, rsrp, rsrq, sinr }
  };

  // Broadcast to all active browser clients
  io.emit('hardware_telemetry_update', latestHardwareFrame);
  
  res.status(200).json({ status: 'received' });
});

io.on('connection', (socket) => {
  console.log('Client dashboard connected');
  if (latestHardwareFrame) {
    socket.emit('hardware_telemetry_update', latestHardwareFrame);
  }
});

server.listen(3000, () => {
  console.log('Bridge gateway operating on port 3000');
});
```

---




## ⚙️ Development & Quickstart

To install local modules, compile the static bundles, and trigger the development build-chain:

```bash
# 1. Install workspace dependencies
npm install

# 2. Fire up the hot-reload local server (binds to http://localhost:3000)
npm run dev

# 3. Compile client-side packages and assets
npm run build

# 4. Spin up the production-optimized preview
npm run start
```

---

