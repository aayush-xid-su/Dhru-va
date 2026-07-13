import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppSettings, CellTower, GpsData, LogEntry, SimCellData } from './types';
import { generateCellTowers, getSimTelemetry } from './utils/telemetryGen';
import { dbStore } from './utils/db';
import { DashboardTab } from './components/DashboardTab';
import { MapTab } from './components/MapTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { LogsTab } from './components/LogsTab';
import { SettingsTab } from './components/SettingsTab';
import { 
  Signal, Map as MapIcon, BarChart2, Database, Settings as SettingsIcon, RadioTower, Wifi, Battery, MapPin 
} from 'lucide-react';

const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.2090;

export default function App() {
  // 1. Core State Definition
  const [gps, setGps] = useState<GpsData>({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    speed: 0,
    altitude: 45,
    accuracy: 8,
    heading: 90
  });

  const [towers, setTowers] = useState<CellTower[]>(() => {
    return generateCellTowers(DEFAULT_LAT, DEFAULT_LNG);
  });

  const [gpsSource, setGpsSource] = useState<'default' | 'ip' | 'hardware'>('default');
  const [gpsMessage, setGpsMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [settings, setSettings] = useState<AppSettings>({
    refreshRate: 1000,
    mapType: 'dark',
    isAutoLogging: true,
    themeColor: 'cyan',
    notificationAlerts: true,
    simulationSpeed: 40,
    simulationMode: 'real',
    dualSimMode: false
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'analytics' | 'logs' | 'settings'>('dashboard');
  const [logs, setLogs] = useState<LogEntry[]>(() => dbStore.getLogs());

  // Overridable Carrier settings for SIM cards
  const [operator1, setOperator1] = useState<string>('Jio');
  const [operator2, setOperator2] = useState<string>('Airtel');

  // Hard cell lock locks
  const [lockCellId1, setLockCellId1] = useState<number | undefined>(undefined);
  const [lockCellId2, setLockCellId2] = useState<number | undefined>(undefined);

  // Digital time and status bar helpers
  const [systemTime, setSystemTime] = useState<string>('12:00');
  const [batteryLevel, setBatteryLevel] = useState<number>(95);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [connectionType, setConnectionType] = useState<string>('WI-FI');
  const [connectionSpeed, setConnectionSpeed] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000 * 60);
    return () => clearInterval(clockInterval);
  }, []);

  // Hook into live native browser Battery API
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
        return () => {
          battery.removeEventListener('levelchange', updateBattery);
          battery.removeEventListener('chargingchange', updateBattery);
        };
      }).catch((e: any) => console.warn('Battery API failed', e));
    }
  }, []);

  // Hook into live native browser Connection API
  useEffect(() => {
    const updateConnection = () => {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        const rawType = conn.type || conn.effectiveType || 'online';
        if (rawType === 'wifi' || rawType === 'ethernet') {
          setConnectionType('WI-FI');
        } else if (rawType === 'cellular') {
          setConnectionType('MOBILE');
        } else {
          setConnectionType(rawType.toUpperCase());
        }
        if (conn.downlink) {
          setConnectionSpeed(`${conn.downlink} Mbps`);
        } else {
          setConnectionSpeed('');
        }
      } else {
        setConnectionType(navigator.onLine ? 'ONLINE' : 'OFFLINE');
        setConnectionSpeed('');
      }
    };

    updateConnection();
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      conn.addEventListener('change', updateConnection);
    }

    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      if (conn) {
        conn.removeEventListener('change', updateConnection);
      }
    };
  }, []);

  // ISP Carrier and Geolocation auto-detect via public IP lookup API
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.org) {
          const orgName = data.org;
          let calculatedOperator1 = 'Jio';
          let calculatedOperator2 = 'Airtel';
          
          if (/jio/i.test(orgName)) {
            calculatedOperator1 = 'Jio 5G';
            calculatedOperator2 = 'Airtel';
          } else if (/airtel/i.test(orgName) || /bharti/i.test(orgName)) {
            calculatedOperator1 = 'Airtel';
            calculatedOperator2 = 'Jio';
          } else if (/vodafone/i.test(orgName) || /idea/i.test(orgName) || /vi /i.test(orgName)) {
            calculatedOperator1 = 'Vi India';
            calculatedOperator2 = 'Jio';
          } else if (/bsnl/i.test(orgName)) {
            calculatedOperator1 = 'BSNL';
            calculatedOperator2 = 'Airtel';
          } else {
            // Pick a clean first word representing their actual ISP (e.g. Comcast, AT&T, Verizon, Charter, etc.)
            const firstWord = orgName.split(' ')[0].replace(/[^a-zA-Z0-9&-]/g, '');
            calculatedOperator1 = firstWord || 'Local Net';
            calculatedOperator2 = 'Airtel';
          }
          
          setOperator1(calculatedOperator1);
          setOperator2(calculatedOperator2);
        }
        
        // Match initial towers fallback location nicely if actual device GPS hasn't completed yet
        if (data && data.latitude && data.longitude) {
          setGpsSource(currentSource => {
            if (currentSource === 'default') {
              setGps(prev => ({
                ...prev,
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: 3500 // IP geolocation is coarse
              }));
              setTowers(generateCellTowers(data.latitude, data.longitude));
              return 'ip';
            }
            return currentSource;
          });
        }
      })
      .catch((err) => {
        console.warn('Network provider detection via IP geolocation failed: ', err);
      });
  }, []);

  const renderSimHeaderLogo = (sim: SimCellData, label: string, color: string) => {
    const rawOp = sim.operator || label;
    const cleanOp = rawOp.length > 14 ? rawOp.substring(0, 12) + '..' : rawOp;
    return (
      <div className={`flex items-center gap-[4px] font-mono text-[9.5px] ${color}`}>
        <span className="opacity-80 font-bold max-w-[80px] truncate" title={rawOp}>{cleanOp}:</span>
        <span className="font-semibold tracking-tight">{sim.networkType}</span>
        <div className="flex items-end gap-[1.5px] h-2.5 pb-[1px]">
          {[1, 2, 3, 4, 5].map(b => (
            <div 
              key={b} 
              className={`w-[1.5px] rounded-t-sm ${b <= sim.bars ? 'bg-current' : 'bg-white/20'}`}
              style={{ height: `${b * 1.5 + 2.5}px` }}
            />
          ))}
        </div>
      </div>
    );
  };

  // 2. Continuous real-time Geolocation tracking (watchPosition) if in 'real' simulation mode
  useEffect(() => {
    let watchId: number | null = null;

    if (settings.simulationMode === 'real' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const updatedGps = {
            latitude: lat,
            longitude: lng,
            speed: pos.coords.speed || 0,
            altitude: pos.coords.altitude || 18,
            accuracy: pos.coords.accuracy || 12,
            heading: pos.coords.heading || 45
          };
          
          setGps(updatedGps);
          setGpsSource(currentSource => {
            if (currentSource !== 'hardware') {
              setTowers(generateCellTowers(lat, lng));
              return 'hardware';
            }
            return currentSource;
          });

          // Check if user has moved significantly from current tower cluster (> 2km), regenerate
          setTowers(prev => {
            if (prev.length === 0) {
              return generateCellTowers(lat, lng);
            }
            const firstTower = prev[0];
            const dist = Math.sqrt((firstTower.lat - lat) ** 2 + (firstTower.lng - lng) ** 2) * 111; // distance in km
            if (dist > 2) {
              return generateCellTowers(lat, lng);
            }
            return prev;
          });
        },
        (err) => {
          console.warn("User geolocation permission denied/unresolved. Emulating New Delhi drive test area.", err);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [settings.simulationMode]);

  const requestLiveGps = () => {
    setGpsMessage({ text: 'Acquiring satellite lock...', type: 'info' });
    if (!navigator.geolocation) {
      setGpsMessage({ text: 'GPS Geolocation is not supported on this browser context.', type: 'error' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGps({
          latitude: lat,
          longitude: lng,
          speed: pos.coords.speed || 0,
          altitude: pos.coords.altitude || 18,
          accuracy: pos.coords.accuracy || 12,
          heading: pos.coords.heading || 45
        });
        setTowers(generateCellTowers(lat, lng));
        setGpsSource('hardware');
        setGpsMessage({ 
          text: `Exact Phone GPS lock established! Recalibrated towers around actual coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}.`, 
          type: 'success' 
        });
      },
      (err) => {
        console.warn('Geolocation trigger failed: ', err);
        let errorMsg = "Exact device position acquisition failed. Please enable location permissions.";
        if (err.code === 1) {
          errorMsg = "Location access denied. Please click the site settings option or open this app in a New Tab to allow GPS coordinates access.";
        } else if (err.code === 2) {
          errorMsg = "Browser cannot resolve physical satellite coordinates. Cell simulation offline.";
        } else if (err.code === 3) {
          errorMsg = "Satellite lock timed out. Try requesting again in open area.";
        }
        setGpsMessage({ text: errorMsg, type: 'error' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const snapToDeviceGps = (mapInstance?: any) => {
    setGpsMessage({ text: 'Acquiring satellite lock...', type: 'info' });
    if (!navigator.geolocation) {
      setGpsMessage({ text: 'GPS Geolocation is not supported on this browser context.', type: 'error' });
      if (mapInstance && mapInstance.setView) {
        mapInstance.setView([gps.latitude, gps.longitude], 16);
      }
      return;
    }

    // Turn off 'drive' mode so they don't drift away automatically
    setSettings(prev => ({ ...prev, simulationMode: 'real' }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGps({
          latitude: lat,
          longitude: lng,
          speed: pos.coords.speed || 0,
          altitude: pos.coords.altitude || 18,
          accuracy: pos.coords.accuracy || 12,
          heading: pos.coords.heading || 45
        });
        setTowers(generateCellTowers(lat, lng));
        setGpsSource('hardware');
        setGpsMessage({ 
          text: `Exact Phone GPS lock established! Recalibrated towers around actual coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}.`, 
          type: 'success' 
        });
        if (mapInstance && mapInstance.setView) {
          mapInstance.setView([lat, lng], 16);
        }
      },
      (err) => {
        console.warn('Geolocation trigger failed: ', err);
        let errorMsg = "Exact device position acquisition failed. Please enable location permissions.";
        if (err.code === 1) {
          errorMsg = "Location access denied. Please click the site settings option or open this app in a New Tab to allow GPS coordinates access.";
        } else if (err.code === 2) {
          errorMsg = "Browser cannot resolve physical satellite coordinates. Cell simulation offline.";
        } else if (err.code === 3) {
          errorMsg = "Satellite lock timed out. Try requesting again in open area.";
        }
        setGpsMessage({ text: errorMsg, type: 'error' });
        if (mapInstance && mapInstance.setView) {
          mapInstance.setView([gps.latitude, gps.longitude], 16);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // 3. Audio Synthesizer Beeps on handovers
  const playBeep = (freq = 600, duration = 0.08) => {
    if (!settings.notificationAlerts) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime); // keep volume subtle
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // browser muted autoplay, ignore
    }
  };

  // 4. Calculate Physical Telemetry properties on matching GPS updates
  const telemetry = useMemo(() => {
    const fadeNoise = Math.sin(Date.now() / 4000) * 0.4 + (Math.random() - 0.5) * 0.15;
    return getSimTelemetry(
      gps.latitude,
      gps.longitude,
      towers,
      operator1,
      operator2,
      fadeNoise,
      lockCellId1,
      lockCellId2
    );
  }, [gps.latitude, gps.longitude, towers, operator1, operator2, lockCellId1, lockCellId2]);

  // 5. Detect antenna handovers and trigger synthesized beep notifications
  const prevCellId1 = useRef<number | null>(null);
  const prevCellId2 = useRef<number | null>(null);

  useEffect(() => {
    const activeId1 = telemetry.sim1.cellId;
    if (prevCellId1.current !== null && prevCellId1.current !== activeId1 && activeId1 !== 0) {
      playBeep(700, 0.15); // high-pitch handover ring
    }
    prevCellId1.current = activeId1;
  }, [telemetry.sim1.cellId]);

  useEffect(() => {
    const activeId2 = telemetry.sim2.cellId;
    if (prevCellId2.current !== null && prevCellId2.current !== activeId2 && activeId2 !== 0) {
      playBeep(450, 0.15); // low-pitch handover ring
    }
    prevCellId2.current = activeId2;
  }, [telemetry.sim2.cellId]);

  // 6. Main Background Ticker Loop (Dynamic navigation pathing & Logging)
  useEffect(() => {
    const interval = setInterval(() => {
      // Advance coordinates during Simulated auto drive-test
      if (settings.simulationMode === 'drive') {
        setGps(prev => {
          const speedKmh = settings.simulationSpeed;
          const metersPerSec = (speedKmh * 1000) / 3600;
          const headingRad = (prev.heading * Math.PI) / 180;
          
          // lat shift: metersPerSec in degrees (~111111 meters per degree)
          const deltaLat = (metersPerSec * Math.cos(headingRad)) / 111111;
          const deltaLng = (metersPerSec * Math.sin(headingRad)) / (111111 * Math.cos((prev.latitude * Math.PI) / 180));

          // Increment heading slowly to make it curve on a nice continuous map path!
          const nextHeading = (prev.heading + 2) % 360;

          return {
            ...prev,
            latitude: prev.latitude + deltaLat,
            longitude: prev.longitude + deltaLng,
            speed: speedKmh,
            heading: nextHeading
          };
        });
      }

      // Perform background logging
      if (settings.isAutoLogging) {
        dbStore.saveLog(gps, telemetry.sim1, telemetry.sim2);
        setLogs(dbStore.getLogs());
      }

    }, settings.refreshRate);

    return () => clearInterval(interval);
  }, [
    settings.simulationMode, 
    settings.refreshRate, 
    settings.simulationSpeed, 
    settings.isAutoLogging, 
    gps, 
    telemetry
  ]);

  // Map theme Color styles
  const accentTextClass = {
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    slate: 'text-slate-400',
    indigo: 'text-indigo-400'
  }[settings.themeColor as 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo'] || 'text-cyan-400';

  const activeTabAccentClass = (tab: string) => {
    if (activeTab !== tab) return 'text-white/40 hover:text-white/70';
    
    return {
      cyan: 'text-cyan-400 border-t-2 border-cyan-400 bg-cyan-500/5',
      emerald: 'text-emerald-400 border-t-2 border-emerald-400 bg-emerald-500/5',
      amber: 'text-amber-400 border-t-2 border-amber-400 bg-amber-500/5',
      rose: 'text-rose-400 border-t-2 border-rose-400 bg-rose-500/5',
      slate: 'text-slate-300 border-t-2 border-slate-300 bg-slate-400/5',
      indigo: 'text-indigo-400 border-t-2 border-indigo-400 bg-indigo-500/5'
    }[settings.themeColor as 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo'] || 'text-cyan-400 border-t-2 border-cyan-400';
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            sim1={telemetry.sim1}
            sim2={telemetry.sim2}
            gps={gps}
            setGps={setGps}
            towers={towers}
            activeTower1={telemetry.servingTower1}
            activeTower2={telemetry.servingTower2}
            themeColor={settings.themeColor}
            dualSimMode={settings.dualSimMode}
          />
        );
      case 'map':
        return (
          <MapTab
            gps={gps}
            setGps={setGps}
            towers={towers}
            sim1={telemetry.sim1}
            sim2={telemetry.sim2}
            servingTower1={telemetry.servingTower1}
            servingTower2={telemetry.servingTower2}
            themeColor={settings.themeColor}
            simulationMode={settings.simulationMode}
            setSimulationMode={(mode) => setSettings(prev => ({ ...prev, simulationMode: mode }))}
            simulationSpeed={settings.simulationSpeed}
            onSnapToDeviceGps={snapToDeviceGps}
          />
        );
      case 'analytics':
        return (
          <AnalyticsTab
            logs={logs}
            sim1={telemetry.sim1}
            sim2={telemetry.sim2}
            themeColor={settings.themeColor}
          />
        );
      case 'logs':
        return (
          <LogsTab
            logs={logs}
            setLogs={setLogs}
            themeColor={settings.themeColor}
          />
        );
      case 'settings':
        return (
          <SettingsTab
            settings={settings}
            setSettings={setSettings}
            towers={towers}
            operator1={operator1}
            setOperator1={setOperator1}
            operator2={operator2}
            setOperator2={setOperator2}
            lockCellId1={lockCellId1}
            setLockCellId1={setLockCellId1}
            lockCellId2={lockCellId2}
            setLockCellId2={setLockCellId2}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col font-sans text-slate-100">
      
      {/* SYSTEM HEADER AND LIVE SIM INDICATORS STATUS BAR */}
      <header className="bg-slate-900 border-b border-white/5 px-4 md:px-6 py-2.5 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 select-none shadow-md z-50">
        
        {/* Logo and Status */}
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4">
          <div className="flex items-center gap-2">
            <RadioTower className={`w-5.5 h-5.5 ${accentTextClass} animate-pulse`} />
            <span className="font-extrabold text-lg text-white font-sans tracking-widest flex items-center gap-1.5 uppercase">
              ध्रु-VA <span className="text-[9px] font-mono border border-white/10 px-1.5 py-0.5 rounded text-white/60 bg-white/5 normal-case tracking-normal">v4.0</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="text-[8.5px] font-mono font-bold text-emerald-400 tracking-wider">RF_STREAM_LIVE</span>
          </div>
        </div>

        {/* Telemetry Hub Status Strip */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5 sm:gap-3 w-full sm:w-auto select-none">
          {/* SIM 1 Indicator */}
          {renderSimHeaderLogo(telemetry.sim1, 'S1', 'text-cyan-300 bg-cyan-400/5 border border-cyan-400/10 px-2 sm:px-2.5 py-1 rounded-lg shrink-0')}
          
          {/* SIM 2 Indicator */}
          {settings.dualSimMode && renderSimHeaderLogo(telemetry.sim2, 'S2', 'text-pink-300 bg-pink-400/5 border border-pink-400/10 px-2 sm:px-2.5 py-1 rounded-lg shrink-0')}

          <div className="h-4 w-[1px] bg-white/10 hidden md:block" />

          {/* System Hardware Logs and Clock */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-[9.5px] sm:text-[10px] font-mono text-white/70">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-white/5 border border-white/5 px-1.5 sm:px-2.5 py-1 rounded-lg shrink-0">
              <Wifi className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${connectionType === 'OFFLINE' ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
              <span className="uppercase font-bold text-white/90 text-[8.5px] sm:text-[9px]">{connectionType}</span>
              {connectionSpeed && <span className="text-[7.5px] sm:text-[8px] opacity-60">({connectionSpeed})</span>}
            </div>
            
            <div className="flex items-center gap-1 sm:gap-1.5 bg-white/5 border border-white/5 px-1.5 sm:px-2.5 py-1 rounded-lg shrink-0">
              <span className={`font-bold text-[8.5px] sm:text-[9.5px] ${batteryLevel < 20 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-white/90'}`}>{batteryLevel}%</span>
              <Battery className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isCharging ? 'text-amber-400 animate-bounce' : (batteryLevel < 20 ? 'text-rose-400' : 'text-emerald-400')}`} />
              {isCharging && <span className="text-[7px] text-amber-400 font-extrabold -ml-0.5" title="Charging">⚡</span>}
            </div>

            <div className="bg-slate-950 border border-white/10 px-1.5 sm:px-2.5 py-1 rounded-lg text-white font-bold tracking-wide text-[8.5px] sm:text-[10px] hidden min-[370px]:block shrink-0">
              {systemTime}
            </div>
          </div>
        </div>
      </header>

      {/* INNER TAB DISPLAYS */}
      <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-4 relative flex flex-col" id="app-main-content">
        {gpsMessage && (
          <div className={`mb-4 px-4 py-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono select-none ${
            gpsMessage.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
              : gpsMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
              : 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400 animate-pulse'
          }`}>
            <span className="flex items-center gap-2 text-left">
              <span className="w-1.5 h-1.5 bg-current rounded-full shrink-0" />
              {gpsMessage.text}
            </span>
            <button 
              onClick={() => setGpsMessage(null)}
              className="text-[10px] uppercase font-bold tracking-widest opacity-60 hover:opacity-100 cursor-pointer text-slate-100 px-2 py-1 hover:bg-white/10 rounded shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {gpsSource !== 'hardware' && (
          <div className="mb-4 bg-slate-900 border border-amber-500/20 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 shadow-lg relative overflow-hidden" id="gps-sync-card">
            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
            <div className="flex gap-2.5 items-start">
              <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="text-left">
                <span className="font-bold text-white text-xs block">🛰️ BROADCAST POSITION IN COARSE MODE ({gpsSource === 'ip' ? 'ISP CITY' : 'SIMULATED'})</span>
                <p className="text-[10px] text-white/50 leading-relaxed mt-0.5 max-w-xl font-sans">
                  We are rendering towers around generic Geo-IP coordinates: {gps.latitude.toFixed(4)}°, {gps.longitude.toFixed(4)}°. Click &quot;Sync Real Location&quot; to prompt direct satellite GPS access on your phone and map exact local cell site operators.
                </p>
              </div>
            </div>
            
            <button
              onClick={requestLiveGps}
              className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10.5px] uppercase tracking-wider hover:bg-amber-400 active:scale-95 transition cursor-pointer shrink-0 w-full sm:w-auto text-center"
            >
              📍 Sync Real Location
            </button>
          </div>
        )}

        {renderActiveTabContent()}
      </main>

      {/* BOTTOM NAV BAR BUTTONS */}
      <nav className="bg-slate-900 border-t border-white/5 px-4 py-1.5 flex justify-around items-center shrink-0 z-40 shadow-2xl relative w-full">
        <div className="max-w-7xl mx-auto w-full flex justify-around items-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 flex-1 cursor-pointer transition select-none ${activeTabAccentClass('dashboard')}`}
          >
            <Signal className="w-4 h-4 mb-0.5" />
            <span className="text-[9.5px] font-medium tracking-wide">Status</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center justify-center py-1 flex-1 cursor-pointer transition select-none ${activeTabAccentClass('map')}`}
          >
            <MapIcon className="w-4 h-4 mb-0.5" />
            <span className="text-[9.5px] font-medium tracking-wide">Live Map</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 flex-1 cursor-pointer transition select-none ${activeTabAccentClass('analytics')}`}
          >
            <BarChart2 className="w-4 h-4 mb-0.5" />
            <span className="text-[9.5px] font-medium tracking-wide">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center justify-center py-1 flex-1 cursor-pointer transition select-none ${activeTabAccentClass('logs')}`}
          >
            <Database className="w-4 h-4 mb-0.5" />
            <span className="text-[9.5px] font-medium tracking-wide">Room DB</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1 flex-1 cursor-pointer transition select-none ${activeTabAccentClass('settings')}`}
          >
            <SettingsIcon className="w-4 h-4 mb-0.5" />
            <span className="text-[9.5px] font-medium tracking-wide">Settings</span>
          </button>
        </div>
      </nav>

    </div>
  );
}
