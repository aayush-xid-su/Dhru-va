import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { SimCellData, LogEntry } from '../types';
import { Activity, ShieldAlert, Zap, TrendingUp, Award, Radio, RefreshCw } from 'lucide-react';
import { calculateSignalQualityScore, getSignalAnalysisSummary } from '../utils/telemetryGen';
import { dbStore } from '../utils/db';

interface AnalyticsTabProps {
  logs: LogEntry[];
  sim1: SimCellData;
  sim2: SimCellData;
  themeColor: string;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  logs,
  sim1,
  sim2,
  themeColor
}) => {
  // Compute analytics based on the logs database
  const stats = useMemo(() => {
    return dbStore.getAnalytics(logs);
  }, [logs]);

  // Map theme colors to CSS hex colors for Recharts
  const themeHexColor = {
    cyan: '#22d3ee',
    emerald: '#34d399',
    amber: '#fbbf24',
    rose: '#fb7185',
    slate: '#cbd5e1',
    indigo: '#818cf8'
  }[themeColor as 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo'] || '#22d3ee';

  const score1 = calculateSignalQualityScore(sim1.rsrp, sim1.sinr);
  const score2 = calculateSignalQualityScore(sim2.rsrp, sim2.sinr);
  const summary1 = getSignalAnalysisSummary(score1);
  const summary2 = getSignalAnalysisSummary(score2);

  // Generate real-time graph array from logged history entries
  const rfHistoryData = useMemo(() => {
    if (logs.length === 0) {
      // Build dummy historical array so charts are never blank on first startup
      const data = [];
      const now = Date.now();
      for (let i = 14; i >= 0; i--) {
        data.push({
          time: new Date(now - i * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          SIM1_RSRP: -90 + Math.round(Math.sin(i / 1.5) * 8),
          SIM2_RSRP: -95 + Math.round(Math.cos(i / 1.3) * 6),
          SIM1_SINR: 12 + Math.round(Math.sin(i / 2) * 5),
          SIM2_SINR: 8 + Math.round(Math.cos(i) * 3)
        });
      }
      return data;
    }

    // Capture the last 20 logged entries and reverse them for correct chronological order
    return [...logs].slice(0, 20).reverse().map(l => ({
      time: new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      SIM1_RSRP: l.sim1Rsetup.rsrp,
      SIM2_RSRP: l.sim2Rsetup.rsrp,
      SIM1_SINR: l.sim1Rsetup.sinr,
      SIM2_SINR: l.sim2Rsetup.sinr
    }));
  }, [logs]);

  // Build Operator and Gen mock files if logs contain only one item to display beautiful Pies
  const generationPieData = useMemo(() => {
    if (stats.generationData.length === 0) {
      return [
        { name: '5G SA', value: 40, color: '#10b981' },
         { name: '5G NSA', value: 25, color: '#14b8a6' },
        { name: '4G LTE', value: 30, color: '#06b6d4' },
        { name: '3G / 2G', value: 5, color: '#64748b' }
      ];
    }
    const colors = ['#10b981', '#14b8a6', '#06b6d4', '#818cf8', '#fbbf24', '#f43f5e'];
    return stats.generationData.map((g, idx) => ({
      name: g.name,
      value: g.value,
      color: colors[idx % colors.length]
    }));
  }, [stats]);

  const operatorPieData = useMemo(() => {
    if (stats.operatorShare.length === 0) {
      return [
        { name: 'Jio', value: 50, color: '#22d3ee' },
        { name: 'Airtel', value: 50, color: '#ec4899' }
      ];
    }
    const colors = ['#22d3ee', '#ec4899', '#f59e0b', '#10b981', '#a855f7'];
    return stats.operatorShare.map((o, idx) => ({
      name: o.name,
      value: o.value,
      color: colors[idx % colors.length]
    }));
  }, [stats]);

  // Average parameters for performance table cards
  const scoreBadgeBg = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 65) return 'text-cyan-400 bg-cyan-700/10 border-cyan-500/20';
    if (score >= 45) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="space-y-4 pb-12 overflow-x-hidden" id="drona-analytics-root">
      
      {/* CO-PILOT AI CELLULAR SCANNER SUMMARY */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 shadow-xl">
        <h3 className="text-xs font-bold text-white/50 font-mono tracking-widest uppercase flex items-center gap-2 mb-2">
          <Award className="w-4 h-4 text-amber-400" /> 
          CELLULAR SERVICE QUALITY RATING
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="space-y-2 pb-4 md:pb-0">
            <div className="flex justify-between items-center pr-0 md:pr-4">
              <span className="text-xs text-white/70 font-semibold">{sim1.operator} (SIM 1)</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${scoreBadgeBg(score1)}`}>
                Score: {score1}/100 - {summary1.text}
              </span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed pr-0 md:pr-4 font-sans leading-relaxed">
              {summary1.desc}
            </p>
          </div>

          <div className="space-y-2 pt-4 md:pt-0 pl-0 md:pl-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/70 font-semibold">{sim2.operator} (SIM 2)</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${scoreBadgeBg(score2)}`}>
                Score: {score2}/100 - {summary2.text}
              </span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed font-sans leading-relaxed">
              {summary2.desc}
            </p>
          </div>
        </div>
      </div>

      {/* METRIC TREND GRAPHICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* RSRP RSRQ SIGNAL STRENGTH STREAMING TRENDS */}
        <div className="bg-slate-950 border border-white/5 rounded-xl p-4 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-white tracking-widest uppercase font-mono">RSRP RF POWER LOG (LAST 20s)</h4>
            </div>
            <span className="text-[10px] font-mono text-white/40">Y-axis: dBm | X-axis: Time</span>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rfHistoryData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSim1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSim2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={9} />
                <YAxis domain={[-130, -50]} stroke="rgba(255,255,255,0.3)" fontSize={9} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '10px' }}
                />
                <Area type="monotone" name={`${sim1.operator} RSRP`} dataKey="SIM1_RSRP" stroke="#22d3ee" fillOpacity={1} fill="url(#colorSim1)" strokeWidth={2} />
                <Area type="monotone" name={`${sim2.operator} RSRP`} dataKey="SIM2_RSRP" stroke="#f472b6" fillOpacity={1} fill="url(#colorSim2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SINR INTERFERENCE LOGS STREAM */}
        <div className="bg-slate-950 border border-white/5 rounded-xl p-4 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white tracking-widest uppercase font-mono">SINR INTERFERENCE LEVEL LOG (dB)</h4>
            </div>
            <span className="text-[10px] font-mono text-white/40">Y-axis: dB | X-axis: Time</span>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rfHistoryData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSinr1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSinr2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={9} />
                <YAxis domain={[-10, 35]} stroke="rgba(255,255,255,0.3)" fontSize={9} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '10px' }}
                />
                <Area type="monotone" name={`${sim1.operator} SINR`} dataKey="SIM1_SINR" stroke="#22d3ee" fillOpacity={1} fill="url(#colorSinr1)" strokeWidth={1.5} />
                <Area type="monotone" name={`${sim2.operator} SINR`} dataKey="SIM2_SINR" stroke="#10b981" fillOpacity={1} fill="url(#colorSinr2)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* PIE CHARTING MODULES (Carrier & Generation Ratios) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* NETWORK GENERATIONS SUMMARY DONUT */}
        <div className="bg-slate-950 border border-white/5 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <h4 className="text-xs font-bold text-white tracking-widest uppercase font-mono mb-3 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-yellow-400" /> NETWORK COVERAGE COMPOSITION
          </h4>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="h-[140px] w-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={generationPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {generationPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-2 w-full">
              {generationPieData.map((e, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                    <span className="text-white/60 font-sans">{e.name} Network</span>
                  </div>
                  <span className="text-white font-mono font-bold">{e.value}% Share</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TOWER HANDOVER & HISTORIC SPEED ANALYSIS */}
        <div className="bg-slate-950 border border-white/5 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <h4 className="text-xs font-bold text-white tracking-widest uppercase font-mono mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-400" /> FIELD DRIVE CRITICAL TELEMETRY
          </h4>

          <div className="grid grid-cols-2 gap-3 flex-1 pt-1.5">
            <div className="bg-slate-900/50 p-2.5 rounded-lg border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">CELL HANDOVERS</span>
              <div className="my-1.5">
                <span className="text-2xl font-bold font-mono text-pink-400">{stats.totalHandovers}</span>
                <span className="text-[10px] text-white/40 block leading-tight font-sans mt-0.5">Automated signal switches during test drive</span>
              </div>
            </div>

            <div className="bg-slate-900/50 p-2.5 rounded-lg border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">MAX RECORDED SPEED</span>
              <div className="my-1.5">
                <span className="text-2xl font-bold font-mono text-cyan-400">{stats.speedStats.max}</span>
                <span className="text-xs text-white/50 ml-1 font-mono">km/h</span>
                <span className="text-[10px] text-white/40 block leading-tight font-sans mt-0.5">Average driving speed: {stats.speedStats.avg} km/h</span>
              </div>
            </div>

            <div className="bg-slate-900/50 p-2.5 rounded-lg border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">AVG RSRP SINCE START</span>
              <div className="my-1.5">
                <span className="text-xl font-bold font-mono text-emerald-400">{stats.avgRsrp1}</span>
                <span className="text-[10px] text-white/50 ml-0.5 font-mono">dBm</span>
                <span className="text-[10px] text-white/40 block leading-tight font-mono mt-0.5">AVG SINR: {stats.avgSinr1} dB</span>
              </div>
            </div>

            <div className="bg-slate-900/50 p-2.5 rounded-lg border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">VIRTUAL DATABASE POINTS</span>
              <div className="my-1.5">
                <span className="text-2xl font-bold font-mono text-yellow-400">{logs.length}</span>
                <span className="text-white/40 text-[10px] block leading-tight font-sans mt-0.5">Saved telecom records in Room DB</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
