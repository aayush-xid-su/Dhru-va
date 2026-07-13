# ध्रु-VA (v4.0) — Multi-SIM Walk-Test RF Analyzer

Metrics Documentation

This document explains every radio frequency (RF), cellular, and GPS metric used throughout **Dhru-VA**.

# RF Metrics

| Metric | Description |
|---------|-------------|
| RSRP | Reference Signal Received Power |
| RSRQ | Reference Signal Received Quality |
| RSSI | Received Signal Strength Indicator |
| SINR | Signal to Interference plus Noise Ratio |
| TA | Timing Advance |
| PCI | Physical Cell Identity |
| Cell ID | Serving Cell Identifier |

---

# Signal Quality

| RSRP | Quality |
|------|---------|
| > -80 dBm | Excellent |
| -81 to -90 dBm | Good |
| -91 to -100 dBm | Fair |
| -101 to -112 dBm | Poor |
| < -112 dBm | Critical |

---

# 📑 Table of Contents

- RSRP
- RSRQ
- RSSI
- SINR
- CQI
- PCI
- Cell ID
- TAC
- MCC
- MNC
- EARFCN
- NRARFCN
- Band
- Timing Advance
- Latitude
- Longitude
- Altitude
- Speed
- Accuracy
- Operator
- Signal Classification
- LTE vs 5G Metrics

---

# 📶 RSRP (Reference Signal Received Power)

## Description

RSRP measures the average received power of LTE/5G reference signals.

It is the primary indicator of signal coverage.

## Unit

```
dBm
```

## Typical Range

| Value | Quality |
|--------|----------|
| ≥ -80 | Excellent |
| -81 to -90 | Good |
| -91 to -100 | Fair |
| -101 to -112 | Poor |
| < -112 | Critical |

## Usage

- Coverage Mapping
- RF Planning
- Drive Testing
- Network Optimization

---

# 📶 RSRQ (Reference Signal Received Quality)

## Description

Measures signal quality by combining RSRP and RSSI.

Lower values indicate congestion or interference.

## Unit

```
dB
```

## Typical Range

| Value | Quality |
|--------|----------|
| -3 to -9 | Excellent |
| -10 to -15 | Good |
| -16 to -19 | Fair |
| < -20 | Poor |

## Usage

- Congestion Detection
- Cell Quality Analysis
- LTE Optimization

---

# 📶 RSSI (Received Signal Strength Indicator)

## Description

Measures total received power including interference and noise.

## Unit

```
dBm
```

## Typical Range

| Value | Quality |
|--------|----------|
| ≥ -65 | Excellent |
| -66 to -75 | Good |
| -76 to -85 | Fair |
| < -86 | Poor |

## Usage

- Initial Signal Detection
- Legacy GSM Analysis
- LTE Baseline Measurement

---

# 📶 SINR (Signal to Interference + Noise Ratio)

## Description

Indicates how clean the received signal is.

Higher values mean better throughput.

## Unit

```
dB
```

## Typical Range

| Value | Quality |
|--------|----------|
| > 20 | Excellent |
| 13–20 | Good |
| 0–13 | Fair |
| < 0 | Poor |

## Usage

- Throughput Prediction
- Video Streaming Quality
- LTE Performance

---

# 📶 CQI (Channel Quality Indicator)

## Description

Represents the channel quality reported by the UE.

Higher CQI allows higher modulation schemes.

## Range

```
1–15
```

## Usage

- Adaptive Modulation
- Scheduling
- Link Optimization

---

# 🛰 PCI (Physical Cell Identity)

## Description

Unique identifier of an LTE/NR sector.

## Range

```
0–503
```

## Usage

- Neighbor Cell Detection
- Handover Analysis
- Cell Identification

---

# 🏢 Cell ID

## Description

Unique serving cell identifier.

## Example

```
34567891
```

## Usage

- Serving Cell
- Handover Logging
- Coverage Mapping

---

# 🏙 TAC (Tracking Area Code)

## Description

Identifies a tracking area inside an LTE network.

## Usage

- Mobility Management
- Registration
- Paging

---

# 🌍 MCC (Mobile Country Code)

## Description

Identifies the country.

### Example

| Country | MCC |
|----------|-----|
| India | 404 / 405 |
| USA | 310 |
| UK | 234 |

---

# 📡 MNC (Mobile Network Code)

## Description

Identifies the mobile operator.

### Example

| Operator | MCC | MNC |
|-----------|-----|-----|
| Airtel |404|45|
| Jio |405|840|
| Vi |404|86|
| BSNL |404|38|

---

# 📻 EARFCN

## Description

E-UTRA Absolute Radio Frequency Channel Number.

Represents LTE carrier frequency.

## Usage

- LTE Frequency
- Band Identification

---

# 📻 NRARFCN

## Description

5G New Radio Absolute RF Channel Number.

Used for NR frequency identification.

---

# 📡 LTE Band

## Description

Represents LTE operating frequency band.

### Common Bands

| Band | Frequency |
|--------|-----------|
| B1 |2100 MHz|
| B3 |1800 MHz|
| B5 |850 MHz|
| B8 |900 MHz|
| B40 |2300 MHz|
| B41 |2500 MHz|

---

# 📡 Timing Advance (TA)

## Description

Distance estimation between UE and Base Station.

## Approximation

```
1 TA ≈ 78 meters
```

## Usage

- Trilateration
- Distance Estimation
- RF Planning

---

# 📍 Latitude

## Description

North-South geographical coordinate.

Example

```
20.2961
```

---

# 📍 Longitude

## Description

East-West geographical coordinate.

Example

```
85.8245
```

---

# 🏔 Altitude

## Description

Height above mean sea level.

## Unit

```
Meters
```

---

# 🚗 Speed

## Description

Current movement speed.

## Unit

```
km/h
```

---

# 🎯 GPS Accuracy

## Description

Estimated GPS precision.

## Unit

```
Meters
```

Typical

```
3–10 m
```

---

# 📱 Operator

Represents currently connected network.

Examples

- Airtel
- Jio
- Vodafone Idea
- BSNL

---

# 📶 Signal Classification

| Signal | Color |
|----------|--------|
| Excellent | 🟢 |
| Good | 🔵 |
| Fair | 🟡 |
| Poor | 🟠 |
| Critical | 🔴 |

---

# 📊 LTE vs 5G Metrics

| Metric | LTE | 5G NR |
|---------|-----|-------|
| RSRP | ✅ | ✅ |
| RSRQ | ✅ | ✅ |
| RSSI | ✅ | Limited |
| SINR | ✅ | ✅ |
| CQI | ✅ | ✅ |
| PCI | ✅ | ✅ |
| EARFCN | ✅ | ❌ |
| NRARFCN | ❌ | ✅ |
| Band | ✅ | ✅ |
| Timing Advance | ✅ | ✅ |

---

# 📈 Metric Relationships

```
                    RF Quality

                       │

      ┌────────────────┼────────────────┐

      │                │                │

    RSRP             RSRQ             RSSI

      │                │                │

      └────────────┬───┴───────────────┘
                   │
                 SINR
                   │
             Network Quality
                   │
             Download Speed
                   │
            User Experience
```

---

# 🛰 GPS Metrics

```
GPS

├── Latitude

├── Longitude

├── Altitude

├── Speed

├── Direction

└── Accuracy
```

---

# 📊 Complete RF Measurement Flow

```
Cell Tower

↓

Reference Signal

↓

Mobile Device

↓

RSSI

↓

RSRP

↓

RSRQ

↓

SINR

↓

CQI

↓

Application Dashboard

↓

Analytics

↓

Export
```

---

# 📚 References

- 3GPP TS 36.214
- 3GPP TS 38.215
- 3GPP TS 36.133
- 3GPP TS 38.133
- ETSI LTE Specifications
- OpenStreetMap Documentation
- Android Telephony API Documentation