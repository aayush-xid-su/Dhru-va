import React, { useState, useMemo } from 'react';
import { LogEntry, NetworkGen } from '../types';
import { dbStore } from '../utils/db';
import { 
  Download, Trash2, Search, Calendar, MapPin, 
  Cpu, FileSpreadsheet, Info, ChevronRight, CheckCircle2 
} from 'lucide-react';

interface LogsTabProps {
  logs: LogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  themeColor: string;
}

export const LogsTab: React.FC<LogsTabProps> = ({
  logs,
  setLogs,
  themeColor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGen, setFilterGen] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<string>('');

  // Accent mapping helper
  const accentBorder = {
    cyan: 'border-cyan-500/30 ring-cyan-500',
    emerald: 'border-emerald-500/30 ring-emerald-500',
    amber: 'border-amber-500/30 ring-amber-500',
    rose: 'border-rose-500/30 ring-rose-500',
    slate: 'border-slate-500/30 ring-slate-500',
    indigo: 'border-indigo-500/30 ring-indigo-500'
  }[themeColor as 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo'] || 'border-cyan-500/30 ring-cyan-500';

  const accentText = {
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    slate: 'text-slate-400',
    indigo: 'text-indigo-400'
  }[themeColor as 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo'] || 'text-cyan-400';

  const accentBgButton = {
    cyan: 'bg-cyan-500 text-slate-950 hover:bg-cyan-400',
    emerald: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400',
    amber: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
    rose: 'bg-rose-500 text-white hover:bg-rose-400',
    slate: 'bg-slate-500 text-slate-950 hover:bg-slate-400',
    indigo: 'bg-indigo-500 text-white hover:bg-indigo-400'
  }[themeColor as 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo'] || 'bg-cyan-500 text-slate-950';

  // Apply filters to historical logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = 
        log.sim1Operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.sim2Operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.sim1Rsetup.cellId.toString().includes(searchQuery) ||
        log.sim2Rsetup.cellId.toString().includes(searchQuery);

      const matchGen = 
        filterGen === 'all' ||
        log.sim1Rsetup.networkType === filterGen ||
        log.sim2Rsetup.networkType === filterGen;

      return matchSearch && matchGen;
    });
  }, [logs, searchQuery, filterGen]);

  // Handle Database clear
  const handleClearDb = () => {
    if (window.confirm('Are you absolutely sure you want to delete all historical logs from this Room Mock Database? This operation cannot be undone.')) {
      dbStore.clearLogs();
      setLogs([]);
      setSelectedLog(null);
      triggerNotification('Logs database successfully formatted');
    }
  };

  const triggerNotification = (msg: string) => {
    setExportSuccess(msg);
    setTimeout(() => {
      setExportSuccess('');
    }, 3000);
  };

  // Export CSV download action
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    setIsExporting(true);
    const content = dbStore.exportToCSV(filteredLogs);
    
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dhru_va_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExporting(false);
    triggerNotification('CSV download initialized');
  };

  // Export JSON download action
  const handleExportJSON = () => {
    if (filteredLogs.length === 0) return;
    setIsExporting(true);
    const content = dbStore.exportToJSON(filteredLogs);
    
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dhru_va_telemetry_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExporting(false);
    triggerNotification('JSON download initialized');
  };

  return (
    <div className="space-y-4 pb-12 font-sans text-xs" id="drona-logs-root">
      
      {/* GLOBAL ALERTS/STATUS SYSTEM BANNER */}
      {exportSuccess && (
        <div className="fixed top-4 right-4 z-[5000] bg-slate-900 border border-emerald-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
          <span className="text-white font-medium text-xs">{exportSuccess}</span>
        </div>
      )}

      {/* FILTER CONTROLS BANNER */}
      <div className="bg-slate-900/60 border border-white/5 p-3.5 rounded-xl shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className={`w-4 h-4 ${accentText}`} />
            <h3 className="text-sm font-bold text-white tracking-wider uppercase font-sans">TELEMETRY DATABASE VIEWER</h3>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {filteredLogs.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-white/10 hover:bg-slate-700 hover:text-white rounded-lg text-white/80 cursor-pointer transition flex-1 sm:flex-initial select-none font-sans font-medium"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-white/10 hover:bg-slate-700 hover:text-white rounded-lg text-white/80 cursor-pointer transition flex-1 sm:flex-initial select-none font-sans font-medium"
                >
                  <Download className="w-3.5 h-3.5" /> JSON
                </button>
                <button
                  type="button"
                  onClick={handleClearDb}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-slate-950 rounded-lg text-rose-400 cursor-pointer transition flex-1 sm:flex-initial"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear DB
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* SEARCH FIELD */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/35" />
            <input
              type="text"
              placeholder="Search Cell ID, Carrier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 pl-8 pr-3 py-2 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:border-cyan-500/60 tracking-wide font-sans text-xs"
            />
          </div>

          {/* GENERATION GEN SELECT */}
          <div>
            <select
              value={filterGen}
              onChange={(e) => setFilterGen(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 px-3 py-2 rounded-lg text-white focus:outline-none focus:ring-1 focus:border-cyan-500/60 cursor-pointer text-xs"
            >
              <option value="all">All Telemetry Generations</option>
              <option value="5G SA">5G SA SA (Standalone)</option>
              <option value="5G NSA">5G NSA NSA (Non-Standalone)</option>
              <option value="4G LTE">4G LTE Cellular</option>
              <option value="3G">3G Legacy</option>
              <option value="2G">2G GSM</option>
            </select>
          </div>

          <div className="bg-slate-950 hover:bg-slate-900 border border-white/5 p-2 rounded-lg flex items-center justify-between text-[10px] font-mono text-white/40">
            <span>FILTERED MATCHES: <b className="text-white">{filteredLogs.length}</b></span>
            <span>TOTAL RECORDS: <b className="text-white">{logs.length}</b>/1000</span>
          </div>
        </div>
      </div>

      {/* CORE LOGS TABLE */}
      <div className="bg-slate-950 border border-white/5 rounded-xl overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto w-full max-h-[350px]">
          <table className="w-full text-left border-collapse min-w-[700px] select-none">
            <thead>
              <tr className="bg-slate-900 border-b border-white/5 text-[10px] uppercase font-mono tracking-widest text-white/45">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">GPS Location</th>
                <th className="py-2.5 px-3">SIM 1 RF Parameters</th>
                <th className="py-2.5 px-3">SIM 2 RF Parameters</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px] text-white/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/40 font-sans">
                    <Calendar className="w-8 h-8 mx-auto text-white/10 mb-2 animate-bounce" />
                    No logged telemetry points match parameters.<br />
                    <span className="text-[10px] block text-white/30 font-light mt-1">Ensure Auto-Logging is activated in Settings, then drive-test coordinates using the live Map.</span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3 whitespace-nowrap text-white/70">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-white/50">
                      {log.latitude.toFixed(5)}, {log.longitude.toFixed(5)} | {log.speed.toFixed(0)}km/h
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-cyan-400 font-bold">{log.sim1Rsetup.networkType}</span>
                      <span className="text-white/40 mx-1">/</span>
                      <span className="text-white/70">{log.sim1Operator}</span>
                      <span className="text-white/40 mx-1">/</span>
                      <b className="text-white">{log.sim1Rsetup.rsrp}</b> dBm
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-pink-400 font-bold">{log.sim2Rsetup.networkType}</span>
                      <span className="text-white/40 mx-1">/</span>
                      <span className="text-white/70">{log.sim2Operator}</span>
                      <span className="text-white/40 mx-1">/</span>
                      <b className="text-white">{log.sim2Rsetup.rsrp}</b> dBm
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap pr-4">
                      <ChevronRight className="w-4 h-4 text-white/30 inline" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED RECORD INSPECTION MODAL PANEL */}
      {selectedLog && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-4 overflow-y-auto max-h-[90vh] space-y-4 font-sans text-xs">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Info className={`w-4 h-4 ${accentText}`} />
                <h4 className="text-sm font-bold text-white tracking-widest uppercase font-mono">DRIVE LOG POINT SPECTRAL DETAIL</h4>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedLog(null)}
                className="text-white/50 hover:text-white px-2.5 py-1 hover:bg-white/5 rounded cursor-pointer font-bold select-none text-xs"
              >
                CLOSE
              </button>
            </div>

            {/* GPS Metrics */}
            <div className="bg-slate-950 border border-white/5 rounded-xl p-3 grid grid-cols-2 gap-3 font-mono">
              <div>
                <span className="text-[10px] text-white/40 block leading-none mb-1">GPS COORDINATES</span>
                <span className="text-sm text-white font-bold">{selectedLog.latitude.toFixed(6)}, {selectedLog.longitude.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/40 block leading-none mb-1">ALTITUDE / MOTION SPEED</span>
                <span className="text-sm text-white font-bold">{selectedLog.altitude.toFixed(0)}m / {selectedLog.speed.toFixed(1)} km/h</span>
              </div>
            </div>

            {/* SIM cards layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* S1 */}
              <div className="bg-slate-950 border border-white/5 p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-1">
                    <span className="text-xs font-bold text-cyan-400">SIM 1 : {selectedLog.sim1Operator}</span>
                    <span className="text-[9px] font-mono font-bold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-1 py-0.5 rounded leading-none">
                      {selectedLog.sim1Rsetup.networkType}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 font-mono text-[10px] text-white/70">
                    <div className="flex justify-between">
                      <span className="text-white/40">Serving Cell ID</span>
                      <span className="text-white font-bold">{selectedLog.sim1Rsetup.cellId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Operation Band</span>
                      <span className="text-white font-bold">{selectedLog.sim1Rsetup.band}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">RSRP Power</span>
                      <span className="text-white font-bold">{selectedLog.sim1Rsetup.rsrp} dBm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">SINR Noise</span>
                      <span className="text-white font-bold">{selectedLog.sim1Rsetup.sinr} dB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">RSRQ Quality</span>
                      <span className="text-white font-bold">{selectedLog.sim1Rsetup.rsrq} dB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* S2 */}
              <div className="bg-slate-950 border border-white/5 p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-1">
                    <span className="text-xs font-bold text-pink-400">SIM 2 : {selectedLog.sim2Operator}</span>
                    <span className="text-[9px] font-mono font-bold bg-pink-400/10 text-pink-400 border border-pink-400/20 px-1 py-0.5 rounded leading-none">
                      {selectedLog.sim2Rsetup.networkType}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 font-mono text-[10px] text-white/70">
                    <div className="flex justify-between">
                      <span className="text-white/40">Serving Cell ID</span>
                      <span className="text-white font-bold">{selectedLog.sim2Rsetup.cellId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Operation Band</span>
                      <span className="text-white font-bold">{selectedLog.sim2Rsetup.band}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">RSRP Power</span>
                      <span className="text-white font-bold">{selectedLog.sim2Rsetup.rsrp} dBm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">SINR Noise</span>
                      <span className="text-white font-bold">{selectedLog.sim2Rsetup.sinr} dB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">RSRQ Quality</span>
                      <span className="text-white font-bold">{selectedLog.sim2Rsetup.rsrq} dB</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="text-[10px] font-mono text-white/30 text-right w-full pt-1 border-t border-white/5">
              POINT RECORDED AT: {new Date(selectedLog.timestamp).toLocaleString()}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
