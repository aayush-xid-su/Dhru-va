import React from 'react';
import { AppSettings, CellTower } from '../types';
import { 
  Settings, HelpCircle, Shield, Wifi, Database, 
  Map, Palette, Lock, Sliders, Info, Server 
} from 'lucide-react';

interface SettingsTabProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  towers: CellTower[];
  operator1: string;
  setOperator1: (op: string) => void;
  operator2: string;
  setOperator2: (op: string) => void;
  lockCellId1: number | undefined;
  setLockCellId1: (id: number | undefined) => void;
  lockCellId2: number | undefined;
  setLockCellId2: (id: number | undefined) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  setSettings,
  towers,
  operator1,
  setOperator1,
  operator2,
  setOperator2,
  lockCellId1,
  setLockCellId1,
  lockCellId2,
  setLockCellId2
}) => {
  
  // Custom helper mapping theme values 
  const themeAccentHex = {
    cyan: '#22d3ee',
    emerald: '#34d399',
    amber: '#fbbf24',
    rose: '#fb7185',
    slate: '#cbd5e1',
    indigo: '#818cf8'
  }[settings.themeColor as 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo'] || '#22d3ee';

  const accentBorder = {
    cyan: 'border-cyan-500/20 ring-cyan-500/40',
    emerald: 'border-emerald-500/20 ring-emerald-500/40',
    amber: 'border-amber-500/20 ring-amber-500/40',
    rose: 'border-rose-500/20 ring-rose-500/40',
    slate: 'border-slate-500/20 ring-slate-500/40',
    indigo: 'border-indigo-500/20 ring-indigo-500/40'
  }[settings.themeColor as 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo'] || 'border-cyan-500/20 ring-cyan-500/40';

  const accentText = {
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    slate: 'text-slate-400',
    indigo: 'text-indigo-400'
  }[settings.themeColor as 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo'] || 'text-cyan-400';

  // Extract candidate towers formatted by operator to lock cell arrays
  const op1Towers = towers.filter(t => t.operator === operator1);
  const op2Towers = towers.filter(t => t.operator === operator2);

  return (
    <div className="space-y-4 pb-12 font-sans text-xs text-white" id="drona-settings-root">
      
      {/* HEADER BANNER GENERAL EQUIPMENT OVERVIEW */}
      <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Settings className={`w-4 h-4 ${accentText}`} />
          <h3 className="text-sm font-bold text-white tracking-widest uppercase font-sans">SPECTRAL EQUIPMENT CONTROLLER</h3>
        </div>
        <p className="text-white/50 leading-relaxed font-sans leading-relaxed">
          Configure physical cellular testing params, simulator routing limits, theme overlays, automatic logging, and telecom frequency overrides. Modify parameters below to immediately calibrate live analysis panels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CORE TELECOM PREFERENCES PANEL */}
        <div className="bg-slate-950 border border-white/5 rounded-xl p-4 shadow-lg space-y-3.5">
          <h4 className="text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-1.5 border-b border-white/5 pb-2 text-white/80">
            <Sliders className="w-4 h-4 text-cyan-400" /> CALIBRATIONS & TESTING
          </h4>

          <div className="space-y-3 font-sans">
            {/* T1. Refresh rates */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-white/95 block leading-tight">Refresh Rate</span>
                <span className="text-[10px] text-white/45">Rate of telemetry refreshes</span>
              </div>
              <select
                value={settings.refreshRate}
                onChange={(e) => setSettings(prev => ({ ...prev, refreshRate: Number(e.target.value) }))}
                className="bg-slate-900 border border-white/10 px-3 py-1.5 rounded-lg text-white font-mono focus:outline-none focus:ring-1 focus:border-cyan-500/60 text-xs cursor-pointer select-none"
              >
                <option value={1000}>1.0s (Real-time)</option>
                <option value={3000}>3.0s (Moderate)</option>
                <option value={5000}>5.0s (Telemetry-Safe)</option>
              </select>
            </div>

            {/* T2. Auto-logging toggle */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-white/95 block leading-tight">Auto Logging</span>
                <span className="text-[10px] text-white/45">Write telemetry updates to Room DB</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.isAutoLogging}
                  onChange={(e) => setSettings(prev => ({ ...prev, isAutoLogging: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-200 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>

            {/* T3. Simulation speed settings */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-white/95 block leading-tight">Drive Simulation speed</span>
                <span className="text-[10px] text-white/45">Velocity multiplier during auto-drive: {settings.simulationSpeed} km/h</span>
              </div>
              <input
                type="range"
                min={10}
                max={150}
                step={10}
                value={settings.simulationSpeed}
                onChange={(e) => setSettings(prev => ({ ...prev, simulationSpeed: Number(e.target.value) }))}
                className="w-24 accent-cyan-400 cursor-pointer h-1.5"
              />
            </div>

            {/* T4. Notification alarm system */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-white/95 block leading-tight">Critical Beep Alerts</span>
                <span className="text-[10px] text-white/45">Audio notification triggers on handover</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.notificationAlerts}
                  onChange={(e) => setSettings(prev => ({ ...prev, notificationAlerts: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-200 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
              </label>
            </div>

            {/* T4.5 Dual SIM mode toggle */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-white/95 block leading-tight">Dual SIM Diagnostic Mode</span>
                <span className="text-[10px] text-white/45">Analyze second socket/eSIM status telemetry</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.dualSimMode}
                  onChange={(e) => setSettings(prev => ({ ...prev, dualSimMode: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className={`w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-200 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500`} />
              </label>
            </div>

            {/* T5. Theme palette configuration */}
            <div className="flex justify-between items-center pt-1 border-t border-white/5">
              <div>
                <span className="text-xs font-semibold text-white/95 block leading-tight">Equipment Accent Theme</span>
                <span className="text-[10px] text-white/45">Update terminal color overlays</span>
              </div>
              <div className="flex gap-1.5 flex-wrap max-w-[120px]">
                {(['cyan', 'emerald', 'amber', 'rose', 'indigo', 'slate'] as const).map(color => (
                  <button
                    key={color}
                    onClick={() => setSettings(prev => ({ ...prev, themeColor: color }))}
                    className={`w-4.5 h-4.5 rounded-full ring-offset-2 ring-offset-slate-950 transition hover:scale-110 cursor-pointer ${
                      settings.themeColor === color ? 'ring-2 ring-white scale-110' : 'opacity-65'
                    }`}
                    style={{
                      backgroundColor: {
                        cyan: '#06b6d4',
                        emerald: '#10b981',
                        amber: '#f59e0b',
                        rose: '#f43f5e',
                        slate: '#475569',
                        indigo: '#6366f1'
                      }[color]
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* CORE TELECOM CHANNEL CARRIER OVERRIDES */}
        <div className="bg-slate-950 border border-white/5 rounded-xl p-4 shadow-lg space-y-3.5">
          <h4 className="text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-1.5 border-b border-white/5 pb-2 text-white/80">
            <Server className="w-4 h-4 text-pink-400" /> CARRIER OVERRIDES & SPECTRUM LOCKS
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-sans">
            
            {/* SIM 1 OVERRIDES */}
            <div className="space-y-3.5 border-r border-white/5 pr-0 sm:pr-3.5">
              <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">SIMCARD 1 CAPABILITIES</div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 block">OPERATOR IDENTITY</label>
                <select
                  value={operator1}
                  onChange={(e) => {
                    setOperator1(e.target.value);
                    setLockCellId1(undefined); // Reset active cells locks
                  }}
                  className="w-full bg-slate-900 border border-white/10 px-2 py-1.5 rounded text-white text-[11px]"
                >
                  <option value="Jio">Jio (5G SA / 4G LTE)</option>
                  <option value="Airtel">Airtel (5G / 4G LTE)</option>
                  <option value="Vi">Vi (4G LTE / 3G)</option>
                  <option value="BSNL">BSNL (4G LTE / 3G / 2G)</option>
                </select>
              </div>

              {/* Physical PCI Lock */}
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 block flex items-center gap-1">
                  <Lock className="w-3 h-3 text-cyan-400" />
                  CELL TOWER PCI LOCK
                </label>
                <select
                  value={lockCellId1 || 'auto'}
                  onChange={(e) => setLockCellId1(e.target.value === 'auto' ? undefined : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 px-2 py-1.5 rounded text-white text-[10px] font-mono"
                >
                  <option value="auto">Auto Crossover (Strongest)</option>
                  {op1Towers.map(t => (
                    <option key={t.id} value={t.id}>
                      Cell #{t.id} - PCI {t.pci} ({t.generation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SIM 2 OVERRIDES */}
            <div className="space-y-3.5">
              <div className="text-[10px] font-mono text-pink-400 font-bold uppercase tracking-wider">SIMCARD 2 CAPABILITIES</div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 block">OPERATOR IDENTITY</label>
                <select
                  value={operator2}
                  onChange={(e) => {
                    setOperator2(e.target.value);
                    setLockCellId2(undefined); // Reset locks
                  }}
                  className="w-full bg-slate-900 border border-white/10 px-2 py-1.5 rounded text-white text-[11px]"
                >
                  <option value="Airtel">Airtel (5G / 4G LTE)</option>
                  <option value="Jio">Jio (5G SA / 4G LTE)</option>
                  <option value="Vi">Vi (4G LTE / 3G)</option>
                  <option value="BSNL">BSNL (4G LTE / 3G / 2G)</option>
                </select>
              </div>

              {/* Physical PCI Lock */}
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 block flex items-center gap-1">
                  <Lock className="w-3 h-3 text-pink-400" />
                  CELL TOWER PCI LOCK
                </label>
                <select
                  value={lockCellId2 || 'auto'}
                  onChange={(e) => setLockCellId2(e.target.value === 'auto' ? undefined : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 px-2 py-1.5 rounded text-white text-[10px] font-mono"
                >
                  <option value="auto">Auto Crossover (Strongest)</option>
                  {op2Towers.map(t => (
                    <option key={t.id} value={t.id}>
                      Cell #{t.id} - PCI {t.pci} ({t.generation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* QUICK SYSTEM CONSOLE INFOPRINT */}
      <div className="bg-slate-900/45 border border-white/5 rounded-xl p-3 flex gap-2.5 items-start">
        <Info className="w-4.5 h-4.5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1 font-sans">
          <span className="font-bold text-white leading-tight block">PHYSICAL EQUIPMENT STANDARDS</span>
          <p className="text-[10px] text-white/50 leading-relaxed max-w-xl">
            This receiver layout models Android Telephony structures including <b>CellInfoLte</b>, <b>CellInfoNr</b>, and <b>CellSignalStrengthLte/Nr</b>. Changing simulation properties shifts values mapped under downstream diagnostic area charts dynamically. Use cell-locks to isolate carrier performance bands.
          </p>
        </div>
      </div>

    </div>
  );
};
