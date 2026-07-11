import React from 'react';
import { SimCellData, GpsData, CellTower } from '../types';
import { 
  Signal, Radio, RadioTower, Compass, Navigation, 
  Gauge, MapPin, Cpu, Smartphone, Activity 
} from 'lucide-react';
import { getSignalAnalysisSummary, calculateSignalQualityScore, getDistance } from '../utils/telemetryGen';
import { MiniMap } from './MiniMap';

interface DashboardTabProps {
  sim1: SimCellData;
  sim2: SimCellData;
  gps: GpsData;
  setGps: React.Dispatch<React.SetStateAction<GpsData>>;
  towers: CellTower[];
  activeTower1: CellTower | null;
  activeTower2: CellTower | null;
  themeColor: string;
  dualSimMode: boolean;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  sim1,
  sim2,
  gps,
  setGps,
  towers,
  activeTower1,
  activeTower2,
  themeColor,
  dualSimMode
}) => {
  const score1 = calculateSignalQualityScore(sim1.rsrp, sim1.sinr);
  const score2 = calculateSignalQualityScore(sim2.rsrp, sim2.sinr);
  const analysis1 = getSignalAnalysisSummary(score1);
  const analysis2 = getSignalAnalysisSummary(score2);

  // Map theme colors to CSS accent rules
  const accentClasses = {
    cyan: 'text-cyan-500 border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20',
    emerald: 'text-emerald-500 border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20',
    amber: 'text-amber-500 border-amber-500 bg-amber-500/10 hover:bg-amber-500/20',
    rose: 'text-rose-500 border-rose-500 bg-rose-500/10 hover:bg-rose-500/20',
    slate: 'text-slate-400 border-slate-400 bg-slate-400/10 hover:bg-slate-400/20',
    indigo: 'text-indigo-500 border-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20'
  }[themeColor as 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo'] || 'text-cyan-500 border-cyan-500 bg-cyan-500/10';

  const glowText = {
    cyan: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]',
    emerald: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]',
    amber: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]',
    rose: 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.2)]',
    slate: 'text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.2)]',
    indigo: 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.2)]'
  }[themeColor as 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo'] || 'text-cyan-400';

  const badgeColor = (state: string) => {
    switch (state) {
      case 'Connected': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'Idle': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Searching': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse';
      default: return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
    if (score >= 60) return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5';
    if (score >= 40) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  };

  const renderSimBars = (bars: number) => {
    return (
      <div className="flex items-end gap-[2px] h-3">
        {[1, 2, 3, 4, 5].map((b) => (
          <div
            key={b}
            className={`w-[3px] rounded-t-sm transition-all duration-300 ${
              b <= bars 
                ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 h-' + (b * 2) + '/5 height-level-' + b 
                : 'bg-white/10 h-' + (b * 2) + '/5 height-level-' + b
            }`}
            style={{ height: `${b * 2.5}px` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-12" id="drona-dashboard-root">
      
      {/* HEADER SYSTEM CO-PILOT CARD */}
      <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className={`absolute -right-16 -top-16 w-36 h-36 rounded-full filter blur-3xl opacity-15 bg-${themeColor}-500`} />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <RadioTower className={`w-5 h-5 text-${themeColor}-400 animate-pulse`} />
              <span className="text-xs font-mono font-medium text-white/50 tracking-wider">PRIMARY ACTIVE SIM : SIM 1</span>
            </div>
            <h1 className="text-xl font-bold font-sans text-white mt-1 leading-none">
              {sim1.operator} <span className="text-xs font-normal border border-white/10 rounded px-1.5 py-0.5 ml-2 text-white/70 bg-white/5">{sim1.networkType}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto border-t border-white/5 pt-3 sm:pt-0 sm:border-0">
            <div className={`px-3 py-1.5 rounded-xl border ${scoreColor(score1)} flex flex-col items-center min-w-[70px]`}>
              <span className="text-[10px] font-mono font-medium text-white/40 tracking-wider">RF QUALITY</span>
              <span className="text-base font-bold font-mono">{score1}%</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full bg-${analysis1.color}-400 animate-ping`} />
                <span className={`text-sm font-semibold text-${analysis1.color}-400`}>{analysis1.text} Signal</span>
              </div>
              <p className="text-[10px] text-white/50 max-w-[200px] leading-tight mt-0.5 font-sans leading-relaxed">
                Serving via Cell #{sim1.cellId} (PCI {sim1.pci})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS REAL-TIME CAROUSEL GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-3 shadow-md flex flex-col justify-between">
          <span className="text-[10px] font-mono text-white/40 tracking-widest leading-none">RSRP (RX POWER)</span>
          <div className="my-2">
            <span className={`text-2xl font-bold font-mono ${glowText}`}>{sim1.rsrp}</span>
            <span className="text-xs text-white/50 ml-1 font-mono">dBm</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-white/30 border-t border-white/5 pt-1.5 mt-0.5">
            <span>MAX: -45</span>
            <span>MIN: -140</span>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-3 shadow-md flex flex-col justify-between">
          <span className="text-[10px] font-mono text-white/40 tracking-widest leading-none">SINR (NOISE RATIO)</span>
          <div className="my-2">
            <span className={`text-2xl font-bold font-mono ${glowText}`}>
              {sim1.sinr > 0 ? `+${sim1.sinr}` : sim1.sinr}
            </span>
            <span className="text-xs text-white/50 ml-1 font-mono">dB</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-white/30 border-t border-white/5 pt-1.5 mt-0.5">
            <span>CLEAN: &gt;20</span>
            <span>POOR: &lt;0</span>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-3 shadow-md flex flex-col justify-between">
          <span className="text-[10px] font-mono text-white/40 tracking-widest leading-none">RSRQ (RX QUALITY)</span>
          <div className="my-2">
            <span className={`text-2xl font-bold font-mono ${glowText}`}>{sim1.rsrq}</span>
            <span className="text-xs text-white/50 ml-1 font-mono">dB</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-white/30 border-t border-white/5 pt-1.5 mt-0.5">
            <span>GOOD: -3</span>
            <span>CELL_EDGE: -20</span>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-3 shadow-md flex flex-col justify-between">
          <span className="text-[10px] font-mono text-white/40 tracking-widest leading-none">TIMING ADVANCE</span>
          <div className="my-2">
            <span className={`text-2xl font-bold font-mono ${glowText}`}>{sim1.timingAdvance}</span>
            <span className="text-xs text-white/50 ml-1 font-mono">TA</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-white/30 border-t border-white/5 pt-1.5 mt-0.5">
            <span>DIST: ~{Math.round(sim1.timingAdvance * 78)}m</span>
            <span>1 TA = 78m</span>
          </div>
        </div>
      </div>

      {/* REAL-TIME TELEMETRY PLOT WITH MINIMAP */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <Compass className={`w-4 h-4 text-${themeColor}-400`} />
            <h3 className="text-sm font-semibold text-white/95 font-sans">LIVE RF SIGNAL PLOT & GEOLOCATION</h3>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping mr-0.5" />
            <span>DRIVETEST ACTIVE</span>
          </div>
        </div>

        {/* Embed Live Interactive Plot Map */}
        <MiniMap
          gps={gps}
          setGps={setGps}
          towers={towers}
          sim1={sim1}
          sim2={sim2}
          servingTower1={activeTower1}
          servingTower2={activeTower2}
          themeColor={themeColor}
        />

        {/* Coordinate Stats Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-white/45 tracking-wider">LATITUDE</span>
            <p className="text-bold font-mono text-white text-sm">{gps.latitude.toFixed(6)}°</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-white/45 tracking-wider">LONGITUDE</span>
            <p className="text-bold font-mono text-white text-sm">{gps.longitude.toFixed(6)}°</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-white/45 tracking-wider">DRIVE SPEED</span>
            <div className="flex items-baseline gap-1">
              <p className="text-bold font-mono text-white text-sm">{gps.speed.toFixed(1)}</p>
              <span className="text-[10px] font-mono text-white/40">km/h</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-white/45 tracking-wider">ALTITUDE</span>
            <p className="text-bold font-mono text-white text-sm">{gps.altitude.toFixed(0)} m (±{gps.accuracy.toFixed(0)}m)</p>
          </div>
        </div>

        {/* Geolocation Triangulation Info Board */}
        <div className="border-t border-white/5 pt-3 mt-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-white tracking-widest uppercase font-mono">Multi-Station Geolocation (3-Tower Trilateration)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1">
            {towers
              .map(t => ({
                ...t,
                dist: Math.round(getDistance(gps.latitude, gps.longitude, t.lat, t.lng))
              }))
              .sort((a, b) => a.dist - b.dist)
              .slice(0, 3)
              .map((t, idx) => (
                <div key={t.id} className="bg-slate-950/70 border border-white/5 rounded-xl p-2.5 flex flex-col justify-between space-y-1 font-mono hover:border-white/10 transition">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="font-bold text-white/50">ANCHOR SITE #{idx + 1}</span>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-1 py-0.5 rounded leading-none font-bold">Ranging</span>
                  </div>
                  <div className="text-[10px] font-sans font-bold text-white leading-tight mt-0.5">{t.operator} ({t.generation})</div>
                  <div className="flex justify-between items-baseline text-[9px] text-white/40">
                    <span>PCI / Cell ID</span>
                    <span className="text-white font-semibold">{t.pci} / #{t.id.toString().slice(-3)}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-[9px] text-white/40 border-t border-white/5 pt-1 mt-0.5">
                    <span>Propagation Delay</span>
                    <span className="text-emerald-400 font-bold">~{t.dist} meters</span>
                  </div>
                </div>
              ))
            }
          </div>
          <p className="text-[9px] text-white/40 leading-relaxed font-sans mt-1">
            * Geolocation triggers trilateration calculation nodes. The physical intersection of distance ranges from three servers uniquely converges at the exact receiver position (Latitude: {gps.latitude.toFixed(5)}, Longitude: {gps.longitude.toFixed(5)}) with zero scalar ambiguity.
          </p>
        </div>
      </div>

      {/* DUAL SIM TELEMETRY CARDS */}
      <div className={`grid grid-cols-1 ${dualSimMode ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'} gap-4`}>
        
        {/* SIM 1 INTEGRATED DETAIL CARD */}
        <div className="bg-slate-950 border border-white/5 rounded-xl shadow-xl hover:border-white/10 transition-colors relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 to-emerald-500" />
          
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 font-bold font-mono text-sm">
                  S1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{sim1.operator}</h4>
                  <span className="text-[10px] font-mono text-white/40">MCC/MNC: {sim1.mcc}/{sim1.mnc}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {renderSimBars(sim1.bars)}
                <span className={`text-[10px] font-sans font-medium px-2 py-0.5 rounded-full ${badgeColor(sim1.connectionState)}`}>
                  {sim1.connectionState}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 border-t border-white/5 pt-3">
              <div className="bg-slate-900/40 p-2 rounded-lg border border-white/5 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-white/30 tracking-wider uppercase">RF SPECIFICATIONS</span>
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50 font-sans">Generation</span>
                    <span className="text-cyan-400 font-bold">{sim1.networkType}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50 font-sans">Cell ID</span>
                    <span className="text-white font-mono">{sim1.cellId}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50 font-sans">Physical PCI</span>
                    <span className="text-white font-mono">{sim1.pci}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50 font-sans">TAC / LAC</span>
                    <span className="text-white font-mono">{sim1.tac}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50 font-sans">Band Info</span>
                    <span className="text-amber-400 font-bold text-[10px] max-w-[100px] text-right truncate" title={sim1.band}>{sim1.band}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50 font-sans">ARFCN channel</span>
                    <span className="text-white font-mono">{sim1.earfcn}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 p-2 rounded-lg border border-white/5 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-white/30 tracking-wider uppercase">SIGNAL LEVELS</span>
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">RSRP</span>
                    <span className="text-white font-mono font-medium">{sim1.rsrp} dBm</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">SINR</span>
                    <span className="text-white font-mono font-medium">{sim1.sinr} dB</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">RSRQ</span>
                    <span className="text-white font-mono font-medium">{sim1.rsrq} dB</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">RSSI</span>
                    <span className="text-white font-mono font-medium">{sim1.rssi} dBm</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">T. Advance</span>
                    <span className="text-white font-mono font-medium">{sim1.timingAdvance} TA</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Qual. Score</span>
                    <span className={`font-mono font-bold font-medium ${score1 >= 75 ? 'text-emerald-400' : score1 >= 50 ? 'text-cyan-400' : 'text-rose-400'}`}>{score1}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Serving Tower Coordinates */}
            {activeTower1 && (
              <div className="mt-3 bg-slate-950 border border-white/5 rounded-lg p-2.5 space-y-2">
                <div className="text-[10.5px] font-mono font-bold text-cyan-400 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <RadioTower className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>ACTIVE CELL CAPABILITY INFO</span>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold ${
                    activeTower1.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                    activeTower1.status === 'High Load' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/15' :
                    'bg-slate-500/10 text-slate-400 border border-white/10'
                  }`}>
                    {activeTower1.status || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9.5px] font-mono text-white/60">
                  <div className="flex justify-between border-b border-white/5 pb-0.5">
                    <span>Base Station</span>
                    <span className="text-white font-bold">
                      {activeTower1.generation.includes('5G') ? 'gNodeB' : 'eNodeB'} #{activeTower1.gNodeBId || activeTower1.id}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-0.5">
                    <span>RF Vendor</span>
                    <span className="text-cyan-300 font-bold">{activeTower1.vendor || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-0.5">
                    <span>Bandwidth</span>
                    <span className="text-amber-400 font-bold">{activeTower1.bandwidth || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-0.5">
                    <span>Antenna scheme</span>
                    <span className="text-white font-semibold">{activeTower1.mimo || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-0.5">
                    <span>Duplex / Azimuth</span>
                    <span className="text-white font-semibold">{activeTower1.duplex || 'N/A'} / {activeTower1.azimuth}°</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-0.5">
                    <span>Carrier Aggreg.</span>
                    <span className="text-white font-semibold truncate max-w-[85px]" title={activeTower1.carrierAggregation}>{activeTower1.carrierAggregation || 'Disabled'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-white/40 pt-1 border-t border-white/5">
                  <span>Antenna coordinates</span>
                  <span>{activeTower1.lat.toFixed(5)}, {activeTower1.lng.toFixed(5)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SIM 2 INTEGRATED DETAIL CARD */}
        {dualSimMode && (
          <div className="bg-slate-950 border border-white/5 rounded-xl shadow-xl hover:border-white/10 transition-colors relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 to-pink-500" />
            
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 border border-pink-500/20 font-bold font-mono text-sm">
                    S2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{sim2.operator}</h4>
                    <span className="text-[10px] font-mono text-white/40">MCC/MNC: {sim2.mcc}/{sim2.mnc}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {renderSimBars(sim2.bars)}
                  <span className={`text-[10px] font-sans font-medium px-2 py-0.5 rounded-full ${badgeColor(sim2.connectionState)}`}>
                    {sim2.connectionState}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 border-t border-white/5 pt-3">
                <div className="bg-slate-900/40 p-2 rounded-lg border border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-white/30 tracking-wider uppercase">RF SPECIFICATIONS</span>
                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50 font-sans">Generation</span>
                      <span className="text-pink-400 font-bold">{sim2.networkType}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50 font-sans">Cell ID</span>
                      <span className="text-white font-mono">{sim2.cellId}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50 font-sans">Physical PCI</span>
                      <span className="text-white font-mono">{sim2.pci}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50 font-sans">TAC / LAC</span>
                      <span className="text-white font-mono">{sim2.tac}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50 font-sans">Band Info</span>
                      <span className="text-amber-400 font-bold text-[10px] max-w-[100px] text-right truncate" title={sim2.band}>{sim2.band}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50 font-sans">ARFCN channel</span>
                      <span className="text-white font-mono">{sim2.earfcn}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/40 p-2 rounded-lg border border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-white/30 tracking-wider uppercase">SIGNAL LEVELS</span>
                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">RSRP</span>
                      <span className="text-white font-mono font-medium">{sim2.rsrp} dBm</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">SINR</span>
                      <span className="text-white font-mono font-medium">{sim2.sinr} dB</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">RSRQ</span>
                      <span className="text-white font-mono font-medium">{sim2.rsrq} dB</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">RSSI</span>
                      <span className="text-white font-mono font-medium">{sim2.rssi} dBm</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">T. Advance</span>
                      <span className="text-white font-mono font-medium">{sim2.timingAdvance} TA</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">Qual. Score</span>
                      <span className={`font-mono font-bold font-medium ${score2 >= 75 ? 'text-emerald-400' : score2 >= 50 ? 'text-cyan-400' : 'text-rose-400'}`}>{score2}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Serving Tower Coordinates */}
              {activeTower2 && (
                <div className="mt-3 bg-slate-950 border border-white/5 rounded-lg p-2.5 space-y-2">
                  <div className="text-[10.5px] font-mono font-bold text-pink-400 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <RadioTower className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                      <span>ACTIVE CELL CAPABILITY INFO</span>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold ${
                      activeTower2.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                      activeTower2.status === 'High Load' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/15' :
                      'bg-slate-500/10 text-slate-400 border border-white/10'
                    }`}>
                      {activeTower2.status || 'Active'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9.5px] font-mono text-white/60">
                    <div className="flex justify-between border-b border-white/5 pb-0.5">
                      <span>Base Station</span>
                      <span className="text-white font-bold">
                        {activeTower2.generation.includes('5G') ? 'gNodeB' : 'eNodeB'} #{activeTower2.gNodeBId || activeTower2.id}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-0.5">
                      <span>RF Vendor</span>
                      <span className="text-pink-300 font-bold">{activeTower2.vendor || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-0.5">
                      <span>Bandwidth</span>
                      <span className="text-amber-400 font-bold">{activeTower2.bandwidth || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-0.5">
                      <span>Antenna scheme</span>
                      <span className="text-white font-semibold">{activeTower2.mimo || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-0.5">
                      <span>Duplex / Azimuth</span>
                      <span className="text-white font-semibold">{activeTower2.duplex || 'N/A'} / {activeTower2.azimuth}°</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-0.5">
                      <span>Carrier Aggreg.</span>
                      <span className="text-white font-semibold truncate max-w-[85px]" title={activeTower2.carrierAggregation}>{activeTower2.carrierAggregation || 'Disabled'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-white/40 pt-1 border-t border-white/5">
                    <span>Antenna coordinates</span>
                    <span>{activeTower2.lat.toFixed(5)}, {activeTower2.lng.toFixed(5)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
