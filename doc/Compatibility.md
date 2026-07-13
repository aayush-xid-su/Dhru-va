# ध्रु-VA (v4.0) — Multi-SIM Walk-Test RF Analyzer

#  Compatibility Guide

This document outlines the supported platforms, browsers, hardware, operating systems, cellular technologies, and deployment environments for **Dhru-VA**.

---

# 📋 Table of Contents

- Browser Compatibility
- Operating System Support
- Device Compatibility
- Mobile Support
- Desktop Support
- Hardware Compatibility
- Cellular Network Compatibility
- GPS Compatibility
- API Compatibility
- Data Format Support
- Deployment Compatibility
- Performance Requirements
- Future Compatibility

---

# 🌍 Browser Compatibility

Dhru-VA is built using modern web technologies and is compatible with all major evergreen browsers.

| Browser | Supported | Minimum Version |
|----------|-----------|-----------------|
| ![](https://cdn.simpleicons.org/googlechrome/4285F4) Google Chrome | ✅ | 110+ |
| ![](https://cdn.simpleicons.org/microsoftedge/0078D7) Microsoft Edge | ✅ | 110+ |
| ![](https://cdn.simpleicons.org/firefox/FF7139) Mozilla Firefox | ✅ | 110+ |
| ![](https://cdn.simpleicons.org/apple/FFFFFF) Safari | ✅ | 16+ |
| ![](https://cdn.simpleicons.org/opera/FF1B2D) Opera | ✅ | Latest |
| Brave | ✅ | Latest |

---

# 💻 Desktop Operating Systems

| Operating System | Support |
|------------------|----------|
| 🐧 Ubuntu | ✅ |
| 🐧 Debian | ✅ |
| 🐧 Kali Linux | ✅ |
| 🐧 Fedora | ✅ |
| 🐧 Arch Linux | ✅ |
| 🪟 Windows 10 | ✅ |
| 🪟 Windows 11 | ✅ |
| 🍎 macOS Monterey | ✅ |
| 🍎 macOS Ventura | ✅ |
| 🍎 macOS Sonoma | ✅ |

---

# 📱 Mobile Operating Systems

| Platform | Support |
|----------|----------|
| Android 10+ | ✅ |
| Android 11 | ✅ |
| Android 12 | ✅ |
| Android 13 | ✅ |
| Android 14+ | ✅ |
| iOS 16+ | ✅ |
| iPadOS | ✅ |

---

# 📲 Device Compatibility

| Device | Support |
|----------|----------|
| Desktop PC | ✅ |
| Laptop | ✅ |
| Tablet | ✅ |
| Android Phone | ✅ |
| iPhone | ✅ |

---

# 🖥 Screen Resolution

| Resolution | Supported |
|-------------|-----------|
| 1366×768 | ✅ |
| 1600×900 | ✅ |
| 1920×1080 | ✅ |
| 2560×1440 | ✅ |
| 3840×2160 (4K) | ✅ |

Responsive layouts automatically adapt to different screen sizes.

---

# 📡 Cellular Technology Compatibility

| Technology | Supported |
|------------|-----------|
| GSM | ✅ |
| EDGE | ✅ |
| UMTS | ✅ |
| HSPA | ✅ |
| LTE (4G) | ✅ |
| LTE-A | ✅ |
| LTE Advanced Pro | ✅ |
| 5G NSA | ✅ |
| 5G SA | ✅ |

---

# 📶 Supported Operators

## 🇮🇳 India

- Airtel
- Reliance Jio
- Vodafone Idea (Vi)
- BSNL

## 🌍 International

Any operator exposing standard LTE/NR telemetry through supported hardware or APIs.

---

# 🔌 Hardware Compatibility

## ESP32

| Board | Support |
|--------|----------|
| ESP32 DevKit V1 | ✅ |
| ESP32 WROOM | ✅ |
| ESP32-WROVER | ✅ |
| FireBeetle ESP32 | ✅ |

---

## LTE / 5G Modems

| Modem | Support |
|--------|----------|
| SIM7600 | ✅ |
| SIM7600G-H | ✅ |
| SIM7600E | ✅ |
| SIM8200 | ✅ |
| Quectel EC25 | ✅ |
| Quectel RM500Q | ✅ |

---

## GPS Modules

| Module | Support |
|--------|----------|
| NEO-6M | ✅ |
| NEO-M8N | ✅ |
| SIM7600 GNSS | ✅ |
| Quectel GNSS | ✅ |

---

# 🤖 Android Compatibility

Supports Android applications using:

- TelephonyManager
- CellInfo APIs
- Location Services
- GNSS APIs

Permissions typically required:

- ACCESS_FINE_LOCATION
- ACCESS_COARSE_LOCATION
- READ_PHONE_STATE

---

# 🌐 API Compatibility

Supported communication methods:

- REST API
- HTTP
- HTTPS
- WebSocket
- Server-Sent Events (SSE)
- JSON Payloads

---

# 📦 Supported Data Formats

| Format | Support |
|---------|----------|
| JSON | ✅ |
| CSV | ✅ |
| GeoJSON | ✅ |
| GPX *(Planned)* | 🚧 |
| KML *(Planned)* | 🚧 |

---

# 🗺 Mapping Compatibility

Supported providers:

- OpenStreetMap
- Leaflet
- Custom Tile Servers

Future providers:

- MapLibre
- Mapbox
- Google Maps *(Optional Integration)*

---

# ☁ Deployment Compatibility

Dhru-VA can be deployed on:

| Platform | Supported |
|----------|-----------|
| Vercel | ✅ |
| Netlify | ✅ |
| GitHub Pages | ✅ |
| Cloudflare Pages | ✅ |
| Firebase Hosting | ✅ |
| Self Hosted | ✅ |
| Docker | ✅ |

---

# ⚙ Development Environment

| Tool | Version |
|------|----------|
| Node.js | 18+ |
| npm | 9+ |
| TypeScript | 5+ |
| Vite | Latest |
| React | 19+ |

---

# 📊 Performance Recommendations

| Resource | Recommended |
|-----------|-------------|
| CPU | Dual Core or Better |
| RAM | 4 GB Minimum |
| RAM | 8 GB Recommended |
| Internet | Stable Broadband |
| GPU | Hardware Acceleration Enabled |

---

# 🔒 Security Compatibility

Compatible with:

- HTTPS
- CORS
- JWT Authentication
- API Keys
- OAuth 2.0
- WebSocket Security

---

# 🚀 Future Compatibility

Planned support includes:

- 6G Networks
- Wi-Fi 7 Telemetry
- LoRaWAN
- NB-IoT
- CAT-M1
- MapLibre GL
- Progressive Web App (PWA)
- Native Desktop Application
- Electron Support

---

# 📈 Compatibility Matrix

| Component | Status |
|------------|--------|
| Modern Browsers | ✅ Fully Supported |
| Linux | ✅ |
| Windows | ✅ |
| macOS | ✅ |
| Android | ✅ |
| iOS | ✅ |
| ESP32 | ✅ |
| SIM7600 | ✅ |
| SIM8200 | ✅ |
| REST API | ✅ |
| WebSocket | ✅ |
| Local Storage | ✅ |
| Vercel Deployment | ✅ |

---