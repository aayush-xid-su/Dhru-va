export type NetworkGen = '2G' | '3G' | '4G LTE' | '5G NSA' | '5G SA';

export interface SimCellData {
  simId: 1 | 2;
  operator: string;
  networkType: NetworkGen;
  cellId: number;
  pci: number; // Physical Cell Identity
  tac: number; // Tracking Area Code
  earfcn: number; // EARFCN for LTE or NRARFCN for 5G
  band: string; // e.g. "B3 (1800 MHz)" or "n78 (3500 MHz)"
  mcc: string; // Mobile Country Code
  mnc: string; // Mobile Network Code
  rsrp: number; // Reference Signal Received Power in dBm
  rsrq: number; // Reference Signal Received Quality in dB
  sinr: number; // Signal to Interference & Noise Ratio in dB
  rssi: number; // Received Signal Strength Indicator in dBm
  timingAdvance: number; // TA in symbols/meters
  bars: number; // 0 to 5 for signal indicators
  connectionState: 'Connected' | 'Idle' | 'Searching' | 'No Service';
}

export interface GpsData {
  latitude: number;
  longitude: number;
  speed: number; // km/h
  altitude: number; // meters
  accuracy: number; // meters
  heading: number; // degrees
}

export interface CellTower {
  id: number;
  pci: number;
  lat: number;
  lng: number;
  operator: string;
  generation: NetworkGen;
  band: string;
  earfcn: number;
  azimuth: number; // Heading angle of antennas in degrees
  height: number; // Tower height in meters
  txPower: number; // Transmit power in dBm
  gNodeBId?: number; // Base Station Identifier (gNodeB for 5G, eNodeB for 4G)
  bandwidth?: string; // Channel bandwidth e.g. "20 MHz", "100 MHz"
  mimo?: string; // Antenna MIMO scheme e.g. "4x4 MIMO", "64x64 Massive MIMO"
  status?: 'Active' | 'High Load' | 'Maintenance' | 'Low Power';
  duplex?: 'FDD' | 'TDD';
  vendor?: string; // Hardware manufacturer e.g. Ericsson, Nokia, Samsung
  carrierAggregation?: string; // Carrier Aggregation tier
}

export interface LogEntry {
  id: string;
  timestamp: number; // Epoch ms
  latitude: number;
  longitude: number;
  speed: number;
  altitude: number;
  sim1Operator: string;
  sim1Rsetup: {
    rsrp: number;
    rsrq: number;
    sinr: number;
    cellId: number;
    networkType: NetworkGen;
    band: string;
  };
  sim2Operator: string;
  sim2Rsetup: {
    rsrp: number;
    rsrq: number;
    sinr: number;
    cellId: number;
    networkType: NetworkGen;
    band: string;
  };
}

export interface AppSettings {
  refreshRate: number; // in ms, e.g. 1000
  mapType: 'streets' | 'satellite' | 'dark' | 'light';
  isAutoLogging: boolean;
  themeColor: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';
  notificationAlerts: boolean;
  simulationSpeed: number; // km/h
  simulationMode: 'real' | 'drive'; // Use real GPS or Simulated Drive test
  dualSimMode: boolean; // toggle to enable secondary sim slot diagnostics
}
