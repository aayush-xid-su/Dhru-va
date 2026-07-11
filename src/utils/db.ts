import { LogEntry, SimCellData, GpsData } from '../types';

const DB_KEY = 'drona_cellular_logs';

export const dbStore = {
  // Save entry to local logs DB
  saveLog(gps: GpsData, sim1: SimCellData, sim2: SimCellData): LogEntry {
    const logs = this.getLogs();
    
    const newLog: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      latitude: gps.latitude,
      longitude: gps.longitude,
      speed: gps.speed,
      altitude: gps.altitude,
      sim1Operator: sim1.operator,
      sim1Rsetup: {
        rsrp: sim1.rsrp,
        rsrq: sim1.rsrq,
        sinr: sim1.sinr,
        cellId: sim1.cellId,
        networkType: sim1.networkType,
        band: sim1.band
      },
      sim2Operator: sim2.operator,
      sim2Rsetup: {
        rsrp: sim2.rsrp,
        rsrq: sim2.rsrq,
        sinr: sim2.sinr,
        cellId: sim2.cellId,
        networkType: sim2.networkType,
        band: sim2.band
      }
    };

    // Maintain a max size of 1000 logs to prevent storage exhaustion
    const updated = [newLog, ...logs].slice(0, 1000);
    localStorage.setItem(DB_KEY, JSON.stringify(updated));
    return newLog;
  },

  // Retrieve all logged points
  getLogs(): LogEntry[] {
    try {
      const data = localStorage.getItem(DB_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading logs from DB', e);
      return [];
    }
  },

  // Clear log history
  clearLogs(): void {
    localStorage.removeItem(DB_KEY);
  },

  // Export logs to CSV
  exportToCSV(logs: LogEntry[]): string {
    const headers = [
      'Timestamp',
      'Latitude',
      'Longitude',
      'Speed (km/h)',
      'Altitude (m)',
      'SIM1 Operator',
      'SIM1 Network',
      'SIM1 Cell ID',
      'SIM1 Band',
      'SIM1 RSRP (dBm)',
      'SIM1 RSRQ (dB)',
      'SIM1 SINR (dB)',
      'SIM2 Operator',
      'SIM2 Network',
      'SIM2 Cell ID',
      'SIM2 Band',
      'SIM2 RSRP (dBm)',
      'SIM2 RSRQ (dB)',
      'SIM2 SINR (dB)'
    ];

    const rows = logs.map(l => [
      new Date(l.timestamp).toISOString(),
      l.latitude,
      l.longitude,
      l.speed.toFixed(1),
      l.altitude.toFixed(0),
      l.sim1Operator,
      l.sim1Rsetup.networkType,
      l.sim1Rsetup.cellId,
      l.sim1Rsetup.band,
      l.sim1Rsetup.rsrp,
      l.sim1Rsetup.rsrq,
      l.sim1Rsetup.sinr,
      l.sim2Operator,
      l.sim2Rsetup.networkType,
      l.sim2Rsetup.cellId,
      l.sim2Rsetup.band,
      l.sim2Rsetup.rsrp,
      l.sim2Rsetup.rsrq,
      l.sim2Rsetup.sinr
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  // Export logs as JSON
  exportToJSON(logs: LogEntry[]): string {
    return JSON.stringify(logs, null, 2);
  },

  // Get statistical aggregates for telecom metrics
  getAnalytics(logs: LogEntry[]) {
    if (logs.length === 0) {
      return {
        avgRsrp1: -100,
        avgRsrp2: -100,
        avgSinr1: 10,
        avgSinr2: 10,
        totalHandovers: 0,
        operatorShare: [],
        speedStats: { max: 0, avg: 0 },
        generationData: []
      };
    }

    let rsrpSum1 = 0, rsrpSum2 = 0;
    let sinrSum1 = 0, sinrSum2 = 0;
    let maxSpeed = 0, speedSum = 0;
    let hoCount = 0;

    const opCount: Record<string, number> = {};
    const genCount: Record<string, number> = {};

    logs.forEach((log, idx) => {
      rsrpSum1 += log.sim1Rsetup.rsrp;
      rsrpSum2 += log.sim2Rsetup.rsrp;
      sinrSum1 += log.sim1Rsetup.sinr;
      sinrSum2 += log.sim2Rsetup.sinr;

      maxSpeed = Math.max(maxSpeed, log.speed);
      speedSum += log.speed;

      // Count generation occurrences
      genCount[log.sim1Rsetup.networkType] = (genCount[log.sim1Rsetup.networkType] || 0) + 1;
      genCount[log.sim2Rsetup.networkType] = (genCount[log.sim2Rsetup.networkType] || 0) + 1;

      // Operator frequencies
      opCount[log.sim1Operator] = (opCount[log.sim1Operator] || 0) + 1;
      opCount[log.sim2Operator] = (opCount[log.sim2Operator] || 0) + 1;

      // Handover detection (if active cell id changed from previous same operator, count as handover)
      if (idx < logs.length - 1) {
        const prev = logs[idx + 1];
        if (log.sim1Rsetup.cellId !== prev.sim1Rsetup.cellId || log.sim2Rsetup.cellId !== prev.sim2Rsetup.cellId) {
          hoCount++;
        }
      }
    });

    const totalOperatorPoints = logs.length * 2;
    const operatorShare = Object.entries(opCount).map(([name, val]) => ({
      name,
      value: Math.round((val / totalOperatorPoints) * 100)
    }));

    const generationData = Object.entries(genCount).map(([name, val]) => ({
      name,
      value: Math.round((val / totalOperatorPoints) * 100)
    }));

    return {
      avgRsrp1: Math.round(rsrpSum1 / logs.length),
      avgRsrp2: Math.round(rsrpSum2 / logs.length),
      avgSinr1: Math.round(sinrSum1 / logs.length),
      avgSinr2: Math.round(sinrSum2 / logs.length),
      totalHandovers: hoCount,
      operatorShare,
      speedStats: { max: maxSpeed, avg: Math.round(speedSum / logs.length) },
      generationData
    };
  }
};
