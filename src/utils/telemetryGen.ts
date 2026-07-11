import { CellTower, SimCellData, GpsData, NetworkGen } from '../types';

// Standard Haversine distance in meters
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate the initial bearing (azimuth) from user to a tower
export function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Generate cell towers surrounding a latitude and longitude
export function generateCellTowers(centerLat: number, centerLng: number): CellTower[] {
  // We use fixed coordinate offsets (in degrees) to place towers around the user
  // Approx 0.001 deg is ~111m.
  const offsets = [
    // --- Jio Towers (5G SA / 4G LTE) ---
    { name: 'Jio', latOff: 0.0042, lngOff: 0.0031, gen: '5G SA' as NetworkGen, band: 'n78 (3500 MHz)', earfcn: 627300, pci: 142, id: 50421 },
    { name: 'Jio', latOff: -0.0035, lngOff: -0.0051, gen: '4G LTE' as NetworkGen, band: 'B3 (1800 MHz)', earfcn: 1650, pci: 284, id: 18451 },
    { name: 'Jio', latOff: -0.0012, lngOff: 0.0065, gen: '5G NSA' as NetworkGen, band: 'n258 (28 GHz)', earfcn: 2010150, pci: 96, id: 96154 },
    { name: 'Jio', latOff: 0.0015, lngOff: -0.0022, gen: '2G' as NetworkGen, band: 'GSM 1800', earfcn: 612, pci: 48, id: 2011 },
    { name: 'Jio', latOff: 0.0085, lngOff: -0.0092, gen: '5G SA' as NetworkGen, band: 'n78 (3500 MHz)', earfcn: 627400, pci: 153, id: 50422 },
    { name: 'Jio', latOff: -0.0095, lngOff: 0.0075, gen: '4G LTE' as NetworkGen, band: 'B5 (850 MHz)', earfcn: 2450, pci: 120, id: 18452 },
    { name: 'Jio', latOff: 0.0061, lngOff: 0.0099, gen: '5G SA' as NetworkGen, band: 'n28 (700 MHz)', earfcn: 150200, pci: 301, id: 50423 },
    { name: 'Jio', latOff: -0.0065, lngOff: -0.0112, gen: '4G LTE' as NetworkGen, band: 'B40 (2300 MHz)', earfcn: 39150, pci: 85, id: 18453 },
    { name: 'Jio', latOff: 0.0125, lngOff: 0.0019, gen: '5G SA' as NetworkGen, band: 'n78 (3500 MHz)', earfcn: 627300, pci: 144, id: 50424 },

    // --- Airtel Towers (5G / 4G LTE / 3G) ---
    { name: 'Airtel', latOff: 0.0028, lngOff: -0.0048, gen: '5G SA' as NetworkGen, band: 'n77 (3700 MHz)', earfcn: 646666, pci: 312, id: 71203 },
    { name: 'Airtel', latOff: -0.0049, lngOff: 0.0025, gen: '4G LTE' as NetworkGen, band: 'B40 (2300 MHz)', earfcn: 39150, pci: 74, id: 28091 },
    { name: 'Airtel', latOff: 0.0058, lngOff: -0.0015, gen: '3G' as NetworkGen, band: 'B8 (900 MHz)', earfcn: 3010, pci: 15, id: 9021 },
    { name: 'Airtel', latOff: -0.0115, lngOff: 0.0062, gen: '5G NSA' as NetworkGen, band: 'n78 (3500 MHz)', earfcn: 628000, pci: 320, id: 71204 },
    { name: 'Airtel', latOff: 0.0101, lngOff: -0.0084, gen: '4G LTE' as NetworkGen, band: 'B3 (1800 MHz)', earfcn: 1675, pci: 290, id: 28092 },
    { name: 'Airtel', latOff: -0.0022, lngOff: -0.0105, gen: '4G LTE' as NetworkGen, band: 'B1 (2100 MHz)', earfcn: 125, pci: 66, id: 28093 },
    { name: 'Airtel', latOff: 0.0078, lngOff: -0.0125, gen: '5G SA' as NetworkGen, band: 'n78 (3500 MHz)', earfcn: 646700, pci: 315, id: 71205 },
    { name: 'Airtel', latOff: -0.0132, lngOff: -0.0035, gen: '2G' as NetworkGen, band: 'GSM 900', earfcn: 110, pci: 12, id: 9022 },
    { name: 'Airtel', latOff: 0.0135, lngOff: 0.0115, gen: '5G SA' as NetworkGen, band: 'n77 (3700 MHz)', earfcn: 646666, pci: 318, id: 71206 },

    // --- Vi Towers (4G LTE / 3G / 2G) ---
    { name: 'Vi', latOff: -0.0075, lngOff: -0.0012, gen: '4G LTE' as NetworkGen, band: 'B1 (2100 MHz)', earfcn: 100, pci: 401, id: 10452 },
    { name: 'Vi', latOff: 0.0035, lngOff: 0.0082, gen: '4G LTE' as NetworkGen, band: 'B3 (1800 MHz)', earfcn: 1700, pci: 110, id: 10453 },
    { name: 'Vi', latOff: -0.0058, lngOff: 0.0051, gen: '3G' as NetworkGen, band: 'B40 (2300 MHz)', earfcn: 4050, pci: 52, id: 10454 },
    { name: 'Vi', latOff: 0.0091, lngOff: -0.0055, gen: '4G LTE' as NetworkGen, band: 'B8 (900 MHz)', earfcn: 3825, pci: 135, id: 10455 },
    { name: 'Vi', latOff: -0.0112, lngOff: -0.0085, gen: '4G LTE' as NetworkGen, band: 'B40 (2300 MHz)', earfcn: 39200, pci: 180, id: 10456 },
    { name: 'Vi', latOff: 0.0142, lngOff: -0.0072, gen: '4G LTE' as NetworkGen, band: 'B1 (2100 MHz)', earfcn: 100, pci: 405, id: 10457 },
    { name: 'Vi', latOff: -0.0015, lngOff: 0.0135, gen: '3G' as NetworkGen, band: 'B8 (900 MHz)', earfcn: 3800, pci: 42, id: 10458 },
    { name: 'Vi', latOff: -0.0148, lngOff: 0.0141, gen: '2G' as NetworkGen, band: 'GSM 1800', earfcn: 700, pci: 77, id: 10459 },

    // --- BSNL Towers (4G LTE / 3G / 2G State-Owned indigenously developed core) ---
    { name: 'BSNL', latOff: -0.0031, lngOff: 0.0042, gen: '4G LTE' as NetworkGen, band: 'B1 (2100 MHz)', earfcn: 150, pci: 201, id: 30411 },
    { name: 'BSNL', latOff: 0.0051, lngOff: -0.0035, gen: '3G' as NetworkGen, band: 'B8 (900 MHz)', earfcn: 2950, pci: 502, id: 30412 },
    { name: 'BSNL', latOff: -0.0078, lngOff: -0.0062, gen: '2G' as NetworkGen, band: 'GSM 900', earfcn: 120, pci: 18, id: 30413 },
    { name: 'BSNL', latOff: 0.0089, lngOff: 0.0055, gen: '4G LTE' as NetworkGen, band: 'B8 (900 MHz)', earfcn: 3850, pci: 205, id: 30414 },
    { name: 'BSNL', latOff: -0.0121, lngOff: 0.0105, gen: '4G LTE' as NetworkGen, band: 'B3 (1800 MHz)', earfcn: 1725, pci: 220, id: 30415 },
    { name: 'BSNL', latOff: 0.0118, lngOff: -0.0131, gen: '2G' as NetworkGen, band: 'GSM 1800', earfcn: 720, pci: 32, id: 30416 }
  ];

  return offsets.map((o, idx) => {
    // 1. Dynamic Hardware Equipment Manufacturer Vendors
    let vendor = 'Ericsson';
    if (o.name === 'Jio') {
      vendor = idx % 2 === 0 ? 'Samsung' : 'Ericsson';
    } else if (o.name === 'Airtel') {
      vendor = idx % 2 === 0 ? 'Ericsson' : 'Nokia';
    } else if (o.name === 'Vi') {
      vendor = idx % 3 === 0 ? 'Nokia' : (idx % 3 === 1 ? 'Ericsson' : 'Huawei');
    } else if (o.name === 'BSNL') {
      vendor = 'Tejas Networks (TCS)'; // India's domestically engineered radio hardware
    }

    // 2. Carrier Channel Bandwidth
    let bandwidth = '15 MHz';
    if (o.gen.includes('5G')) {
      if (o.band.includes('28 GHz')) bandwidth = '400 MHz';
      else if (o.band.includes('3500') || o.band.includes('3700')) bandwidth = '100 MHz';
      else bandwidth = '10 MHz'; // sub-GHz n28
    } else if (o.gen === '4G LTE') {
      if (o.band.includes('2300')) bandwidth = '20 MHz';
      else if (o.band.includes('1800') || o.band.includes('2100')) bandwidth = '15 MHz';
      else bandwidth = '10 MHz';
    } else if (o.gen === '3G') {
      bandwidth = '5 MHz';
    } else {
      bandwidth = '200 kHz'; // standard GSM channel spacing
    }

    // 3. MIMO configuration
    let mimo = '2x2 MIMO';
    if (o.gen.includes('5G')) {
      if (o.band.includes('3500') || o.band.includes('3700')) mimo = '64x64 Massive MIMO';
      else mimo = '4x4 MIMO';
    } else if (o.gen === '4G LTE') {
      mimo = o.band.includes('2300') || o.band.includes('1800') ? '4x4 MIMO' : '2x2 MIMO';
    } else if (o.gen === '2G') {
      mimo = 'SISO (1x1)';
    }

    // 4. Base Station ID (gNodeB ID for 5G, eNodeB ID for 4G/3G/2G)
    const gNodeBId = 100000 + Math.floor(o.id / 3);

    // 5. Status parameters
    let status: 'Active' | 'High Load' | 'Maintenance' | 'Low Power' = 'Active';
    if (idx % 14 === 0) status = 'High Load';
    else if (idx % 19 === 0) status = 'Maintenance';
    else if (idx % 23 === 0) status = 'Low Power';

    // 6. Carrier Aggregation specs
    let carrierAggregation = 'Not Supported';
    if (o.gen.includes('5G')) {
      carrierAggregation = 'Active (3CC NR-CA)';
    } else if (o.gen === '4G LTE') {
      if (o.name === 'BSNL') {
        carrierAggregation = 'Not Enabled';
      } else {
        carrierAggregation = idx % 2 === 0 ? 'Active (3-Band LTE-A)' : 'Active (2-Band LTE-A)';
      }
    }

    // 7. Duplex Mode
    const duplex = (o.band.includes('3500') || o.band.includes('3700') || o.band.includes('2300') || o.band.includes('28 GHz'))
      ? 'TDD'
      : 'FDD';

    return {
      id: o.id,
      pci: o.pci,
      lat: centerLat + o.latOff,
      lng: centerLng + o.lngOff,
      operator: o.name,
      generation: o.gen,
      band: o.band,
      earfcn: o.earfcn,
      azimuth: (idx * 45) % 360,
      height: o.gen.includes('5G') ? 22 : (o.gen === '3G' ? 25 : 30), // Height in meters
      txPower: o.gen.includes('5G') ? 40 : 44, // Transmit power in dBm
      gNodeBId,
      bandwidth,
      mimo,
      status,
      duplex,
      vendor,
      carrierAggregation
    };
  });
}

// Calculate RSRP, RSRQ, SINR, RSSI, TA based on distance
export function calculateRfMetrics(userLat: number, userLng: number, tower: CellTower, seedNoise: number) {
  const dist = getDistance(userLat, userLng, tower.lat, tower.lng);
  
  // Frequency in MHz from band string
  let freq = 1800; // default B3
  if (tower.band.includes('3500')) freq = 3500;
  else if (tower.band.includes('3700')) freq = 3700;
  else if (tower.band.includes('2300')) freq = 2300;
  else if (tower.band.includes('28 GHz')) freq = 28000;
  else if (tower.band.includes('900')) freq = 900;
  else if (tower.band.includes('800')) freq = 800;
  else if (tower.band.includes('1900')) freq = 1900;

  // 1. Free Space Path Loss (FSPL) approximation
  // FSPL (dB) = 20 log10(d in km) + 20 log10(f in MHz) + 32.44
  const distKm = Math.max(0.015, dist / 1000); // Floor distance at 15m to avoid infinity log
  let pathLoss = 20 * Math.log10(distKm) + 20 * Math.log10(freq) + 32.44;

  // Add realistic urban clutter loss based on generation/frequency
  if (freq >= 28000) {
    // Millimeter wave pathloss increases rapidly
    pathLoss += 35 + (distKm * 25); 
  } else if (freq >= 3000) {
    // Mid-band 5G
    pathLoss += 20 + (distKm * 6);
  } else {
    // Sub-GHz or LTE mid-band
    pathLoss += 14 + (distKm * 4);
  }

  // Log-normal shadowing slow-fading + fast fading (seedNoise is between -1 and 1)
  const fadeLoss = (seedNoise * 3.5); // Random fading amplitude up to 3.5 dB
  
  // Transmit power + gains - losses
  const antennaGain = 12; // dBi
  const cableLoss = 3; // dB
  let rsrp = Math.round(tower.txPower - pathLoss + antennaGain - cableLoss + fadeLoss);

  // Cap RSRP to realistic mobile range (-45 dBm to -140 dBm)
  rsrp = Math.min(-45, Math.max(-140, rsrp));

  // 2. SINR Calculation
  // Close to tower is > 25 dB, cell boundary falls below 0 dB, interference from other towers adds negative margin
  const relativeDist = Math.max(0, (distKm - 0.05) / 2); // normalize dist
  let sinr = Math.round(35 - (relativeDist * 38) + (seedNoise * 2));
  sinr = Math.min(35, Math.max(-15, sinr));

  // 3. RSRQ Calculation
  // Ranges from -3 dB (perfect) to -20 dB (poor / load)
  // Highly correlated with RSRP & SINR
  let rsrq = Math.round(rsrp / 15 - Math.max(0, -sinr) / 3 + (seedNoise * 0.8));
  rsrq = Math.min(-3, Math.max(-20, rsrq));

  // 4. RSSI Calculation
  // General approximation is RSSI = RSRP + 20 to 30 dB
  let rssi = Math.round(rsrp + 24 + (seedNoise * 1.5));
  rssi = Math.min(-30, Math.max(-120, rssi));

  // 5. Timing Advance (TA)
  // LTE 1 TA step is ~78 meters, 5G NR fractional step.
  const timingAdvance = Math.max(0, Math.floor(dist / 78));

  // 6. Signal Bars (0 - 5 level)
  let bars = 0;
  if (rsrp >= -80 && sinr >= 15) bars = 5;
  else if (rsrp >= -90 && sinr >= 10) bars = 4;
  else if (rsrp >= -100 && sinr >= 5) bars = 3;
  else if (rsrp >= -112 && sinr >= 0) bars = 2;
  else if (rsrp >= -122 && sinr >= -5) bars = 1;
  else bars = 0;

  return { rsrp, rsrq, sinr, rssi, timingAdvance, bars };
}

// Generate full SIM cards state based on current location and available towers
export function getSimTelemetry(
  userLat: number,
  userLng: number,
  towers: CellTower[],
  op1: string,
  op2: string,
  seedNoise: number,
  lockCellId1?: number,
  lockCellId2?: number
): { sim1: SimCellData; sim2: SimCellData; servingTower1: CellTower | null; servingTower2: CellTower | null } {
  
  // Filter candidate towers for SIM 1 operator
  let candidates1 = towers.filter(t => t.operator === op1);
  if (candidates1.length === 0) candidates1 = towers; // fallback

  // Filter candidate towers for SIM 2 operator
  let candidates2 = towers.filter(t => t.operator === op2);
  if (candidates2.length === 0) candidates2 = towers; // fallback

  // Determine active tower for Operator 1
  let activeTower1: CellTower | null = null;
  if (lockCellId1) {
    activeTower1 = towers.find(t => t.id === lockCellId1) || null;
  }
  if (!activeTower1) {
    // Auto-select the strongest tower for Operator 1 based on distance
    activeTower1 = candidates1.reduce((strongest, cell) => {
      const dS = getDistance(userLat, userLng, strongest.lat, strongest.lng);
      const dC = getDistance(userLat, userLng, cell.lat, cell.lng);
      return dC < dS ? cell : strongest;
    }, candidates1[0]);
  }

  // Determine active tower for Operator 2
  let activeTower2: CellTower | null = null;
  if (lockCellId2) {
    activeTower2 = towers.find(t => t.id === lockCellId2) || null;
  }
  if (!activeTower2) {
    // Auto-select the strongest tower for Operator 2
    activeTower2 = candidates2.reduce((strongest, cell) => {
      const dS = getDistance(userLat, userLng, strongest.lat, strongest.lng);
      const dC = getDistance(userLat, userLng, cell.lat, cell.lng);
      return dC < dS ? cell : strongest;
    }, candidates2[0]);
  }

  // Calculate RF values for Sim 1
  const sim1Metrics = activeTower1
    ? calculateRfMetrics(userLat, userLng, activeTower1, seedNoise)
    : { rsrp: -140, rsrq: -20, sinr: -15, rssi: -120, timingAdvance: 0, bars: 0 };

  const mcc = '404'; // India standard MCC
  const sim1: SimCellData = {
    simId: 1,
    operator: op1,
    networkType: activeTower1 ? activeTower1.generation : '4G LTE',
    cellId: activeTower1 ? activeTower1.id : 0,
    pci: activeTower1 ? activeTower1.pci : 0,
    tac: 14092,
    earfcn: activeTower1 ? activeTower1.earfcn : 0,
    band: activeTower1 ? activeTower1.band : 'No Band',
    mcc,
    mnc: op1.toLowerCase().includes('jio') ? '854' : (op1.toLowerCase().includes('airtel') ? '45' : '20'),
    rsrp: sim1Metrics.rsrp,
    rsrq: sim1Metrics.rsrq,
    sinr: sim1Metrics.sinr,
    rssi: sim1Metrics.rssi,
    timingAdvance: sim1Metrics.timingAdvance,
    bars: sim1Metrics.bars,
    connectionState: activeTower1 ? (sim1Metrics.rsrp > -125 ? 'Connected' : 'Searching') : 'No Service'
  };

  // Calculate RF values for Sim 2
  const sim2Metrics = activeTower2
    ? calculateRfMetrics(userLat, userLng, activeTower2, seedNoise)
    : { rsrp: -140, rsrq: -20, sinr: -15, rssi: -120, timingAdvance: 0, bars: 0 };

  const sim2: SimCellData = {
    simId: 2,
    operator: op2,
    networkType: activeTower2 ? activeTower2.generation : '4G LTE',
    cellId: activeTower2 ? activeTower2.id : 0,
    pci: activeTower2 ? activeTower2.pci : 0,
    tac: 14092,
    earfcn: activeTower2 ? activeTower2.earfcn : 0,
    band: activeTower2 ? activeTower2.band : 'No Band',
    mcc,
    mnc: op2.toLowerCase().includes('jio') ? '854' : (op2.toLowerCase().includes('airtel') ? '45' : '20'),
    rsrp: sim2Metrics.rsrp,
    rsrq: sim2Metrics.rsrq,
    sinr: sim2Metrics.sinr,
    rssi: sim2Metrics.rssi,
    timingAdvance: sim2Metrics.timingAdvance,
    bars: sim2Metrics.bars,
    connectionState: activeTower2 ? (sim2Metrics.rsrp > -125 ? 'Connected' : 'Searching') : 'No Service'
  };

  return {
    sim1,
    sim2,
    servingTower1: activeTower1,
    servingTower2: activeTower2
  };
}

// Map signal score from metrics (0 extremely poor to 100 excellent)
export function calculateSignalQualityScore(rsrp: number, sinr: number): number {
  // Normalize RSRP: -140 to -50 mapped to 0 to 50
  const normalizedRsrp = Math.min(50, Math.max(0, (rsrp + 140) * (50 / 90)));
  // Normalize SINR: -10 to +30 mapped to 0 to 50
  const normalizedSinr = Math.min(50, Math.max(0, (sinr + 10) * (50 / 40)));
  return Math.round(normalizedRsrp + normalizedSinr);
}

// Generate signal analysis status text and styling color
export function getSignalAnalysisSummary(score: number): { text: string; color: string; desc: string } {
  if (score >= 85) return { text: 'Excellent', color: 'emerald', desc: 'Optimal signal with exceptionally low interference. Highest modulation schemes (256-QAM) available.' };
  if (score >= 68) return { text: 'Good', color: 'cyan', desc: 'Stable connection. Supports high-speed downloads, streaming, and premium cellular voice calls.' };
  if (score >= 45) return { text: 'Fair', color: 'amber', desc: 'Moderate signal. Normal cellular operation, may fallback to lower carrier aggregation bands.' };
  if (score >= 25) return { text: 'Poor', color: 'rose', desc: 'Weak coverage with high packet loss. High probability of dropping calls or cell handover failures.' };
  return { text: 'Critical', color: 'red', desc: 'No useful signal. Edge-of-cell attenuation or severe inter-cell interference. Handset searching constantly.' };
}
