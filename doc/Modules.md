# ध्रु-VA (v4.0) — Multi-SIM Walk-Test RF Analyzer


This document provides a detailed overview of every module available in **Dhru-VA**, including its purpose, functionality, data flow, and responsibilities.

# Modules

```
Dashboard
│
├── Live RF Monitor
├── GIS Map
├── Analytics
├── Walk Test Logs
├── Trilateration Lab
├── Settings
└── Export Center
```


---

# 📊 Dashboard Module

The Dashboard is the central workspace of Dhru-VA, providing a real-time overview of network conditions and telemetry.

## Features

- Live RF metrics
- Signal quality indicators
- Connected operator
- GPS location
- Cell ID
- PCI
- Timing Advance
- Live status cards
- Network health summary
- Quick statistics

### Displays

- RSRP
- RSRQ
- SINR
- RSSI
- Speed
- Altitude
- Latitude
- Longitude
- Connected Cell

---

# 🗺️ Live Map Module

The GIS Map visualizes RF measurements geographically using Leaflet.

## Features

- Interactive OpenStreetMap
- Live device tracking
- Cell tower markers
- Coverage radius
- Signal heatmap
- Sector visualization
- Operator color coding
- Path history
- Marker clustering
- Zoom controls

### Layers

- Device Position
- Tower Position
- Signal Strength
- Coverage Area
- Route History

---

# 📡 RF Metrics Module

Processes and displays radio frequency parameters.

## Parameters

- RSRP
- RSRQ
- RSSI
- SINR
- CQI
- PCI
- EARFCN
- Cell ID
- TAC
- MCC
- MNC

### Responsibilities

- Signal calculation
- Quality classification
- Threshold comparison
- Health scoring
- Metric normalization

---

# 📈 Analytics Module

Provides graphical insights into collected telemetry.

## Charts

- Signal timeline
- Speed graph
- Altitude graph
- Operator comparison
- Signal histogram
- Coverage analysis
- Quality distribution

### Analytics

- Average RSRP
- Best Signal
- Worst Signal
- Coverage Percentage
- Distance Travelled
- Packet Count

---

# 📝 Walk-Test Logger

Stores telemetry generated during field surveys.

## Records

- Timestamp
- GPS Coordinates
- Speed
- Altitude
- Network Operator
- RF Metrics
- Cell Information

### Export Formats

- CSV
- JSON

---

# 🎯 Trilateration Module

Educational visualization explaining cellular positioning.

## Supports

- Single Tower
- Dual Tower
- Triple Tower
- Circle Intersection
- Timing Advance
- Estimated Device Location

### Algorithms

- Distance Estimation
- Circle Geometry
- Signal Radius
- Position Calculation

---

# 📡 Hardware Integration Module

Interfaces with external telemetry hardware.

## Supported Devices

- ESP32
- SIM7600
- SIM8200
- Android Telephony API
- GPS Modules

### Responsibilities

- Receive telemetry
- Parse JSON
- Validate packets
- Synchronize updates
- Stream live data

---

# 🔄 Live Telemetry Module

Handles real-time communication.

## Protocols

- REST API
- WebSocket
- Server-Sent Events

### Responsibilities

- Packet processing
- Data synchronization
- Event broadcasting
- Session management

---

# 💾 Storage Module

Responsible for local persistence.

## Storage Types

- Browser LocalStorage
- JSON Export
- CSV Export

### Features

- Save Sessions
- Load Sessions
- Delete Records
- Offline Mode

---

# ⚙️ Settings Module

Allows application customization.

## Configuration

- Theme
- Operator Filters
- RF Thresholds
- Map Style
- Update Interval
- Units
- Export Options

---

# 📤 Export Module

Exports collected telemetry.

## Formats

- CSV
- JSON

### Includes

- GPS
- RF Metrics
- Timestamp
- Operator
- Cell Information

---

# 🎨 User Interface Module

Responsible for rendering the application.

## Components

- Sidebar
- Navbar
- Dashboard Cards
- Metric Gauges
- Tables
- Charts
- Dialogs
- Notifications
- Theme Manager

---

# 🔒 Data Validation Module

Ensures telemetry integrity.

## Validation

- Coordinate Validation
- Signal Validation
- Timestamp Validation
- Packet Verification
- Missing Data Detection

---

# 📍 GPS Module

Processes geographical information.

## Supports

- Latitude
- Longitude
- Altitude
- Speed
- Direction
- Distance Calculation

---