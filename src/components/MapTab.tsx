import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { CellTower, SimCellData, GpsData } from '../types';
import { MapPin, Navigation, Eye, Play, Square, Route, Radio, RefreshCw, Target, Info } from 'lucide-react';
import { getDistance } from '../utils/telemetryGen';

// Renders the intersection point of two circles. 
// Uses standard flat 2D coordinate geometry as towers are within <1.5 km of the user.
export function getCircleIntersections(
  lat1: number, lng1: number, r1: number,
  lat2: number, lng2: number, r2: number
): [number, number][] {
  const d = Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);
  
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
    return [];
  }
  
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const hSquare = r1 * r1 - a * a;
  const h = Math.sqrt(hSquare < 0 ? 0 : hSquare);
  
  const lat3 = lat1 + (a / d) * (lat2 - lat1);
  const lng3 = lng1 + (a / d) * (lng2 - lng1);
  
  const offsetLat = (h / d) * (lng2 - lng1);
  const offsetLng = (h / d) * (lat2 - lat1);
  
  const p1: [number, number] = [lat3 - offsetLat, lng3 + offsetLng];
  const p2: [number, number] = [lat3 + offsetLat, lng3 - offsetLng];
  
  return [p1, p2];
}

interface MapTabProps {
  gps: GpsData;
  setGps: React.Dispatch<React.SetStateAction<GpsData>>;
  towers: CellTower[];
  sim1: SimCellData;
  sim2: SimCellData;
  servingTower1: CellTower | null;
  servingTower2: CellTower | null;
  themeColor: string;
  simulationMode: 'real' | 'drive';
  setSimulationMode: (mode: 'real' | 'drive') => void;
  simulationSpeed: number; // km/h
  onSnapToDeviceGps: (mapInstance?: L.Map) => void;
}

export const MapTab: React.FC<MapTabProps> = ({
  gps,
  setGps,
  towers,
  sim1,
  sim2,
  servingTower1,
  servingTower2,
  themeColor,
  simulationMode,
  setSimulationMode,
  simulationSpeed,
  onSnapToDeviceGps
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const towerMarkersRef = useRef<{ [key: number]: L.Marker }>({});
  const linesRef = useRef<L.Polyline[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);
  const intersectionMarkersRef = useRef<L.Marker[]>([]);

  const [mapType, setMapType] = useState<'streets' | 'satellite' | 'dark'>('dark');
  const [showTowers, setShowTowers] = useState<boolean>(true);
  const [showCoverageCircle, setShowCoverageCircle] = useState<boolean>(true);
  const [showTowerLines, setShowTowerLines] = useState<boolean>(true);

  // trilateration demonstration state
  const [trilaterationStep, setTrilaterationStep] = useState<1 | 2 | 3>(3);
  const [labsOpen, setLabsOpen] = useState<boolean>(true);
  const [layersOpen, setLayersOpen] = useState<boolean>(false);

  const closestThree = useMemo(() => {
    return [...towers]
      .map(t => {
        const d = getDistance(gps.latitude, gps.longitude, t.lat, t.lng);
        return { ...t, distance: d };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [gps.latitude, gps.longitude, towers]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [gps.latitude, gps.longitude],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    mapRef.current = map;

    // Load Dark tile layer as default high-contrast theme
    const tileUrl = {
      streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    }[mapType];

    L.tileLayer(tileUrl, {
      maxZoom: 19,
    }).addTo(map);

    // Add Zoom Control at right/bottom
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial user marker with custom HTML avatar
    const userIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center" id="user-location-anchor">
          <div class="absolute w-8 h-8 rounded-full bg-blue-500/35 border border-blue-400 animate-ping"></div>
          <div class="relative w-4.5 h-4.5 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)] flex items-center justify-center">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      className: 'custom-user-pin',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Make user marker draggable so user can walk-test signals!
    const userMarker = L.marker([gps.latitude, gps.longitude], {
      icon: userIcon,
      draggable: true
    }).addTo(map);

    userMarker.on('drag', (e: L.LeafletEvent) => {
      const marker = e.target as L.Marker;
      const position = marker.getLatLng();
      setGps(prev => ({
        ...prev,
        latitude: position.lat,
        longitude: position.lng,
        speed: simulationMode === 'drive' ? simulationSpeed : 0
      }));
    });

    userMarkerRef.current = userMarker;

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map layer on mapType changes
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    // Remove existing tilelayers
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileUrl = {
      streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    }[mapType];

    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
  }, [mapType]);

  // Update tower markers and coverage lines
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear existing tower markers
    Object.values(towerMarkersRef.current).forEach(marker => {
      map.removeLayer(marker);
    });
    towerMarkersRef.current = {};

    if (showTowers) {
      towers.forEach(t => {
        const isServing1 = servingTower1 && t.id === servingTower1.id;
        const isServing2 = servingTower2 && t.id === servingTower2.id;
        
        let towerColorClass = 'bg-slate-700/80 border-slate-500';
        let animatePingElement = '';
        
        if (isServing1) {
          towerColorClass = 'bg-cyan-500 border-cyan-400 text-slate-950 scale-110';
          animatePingElement = '<div class="absolute w-10 h-10 rounded-full bg-cyan-400/25 border border-cyan-400 animate-pulse"></div>';
        } else if (isServing2) {
          towerColorClass = 'bg-pink-500 border-pink-400 text-slate-950 scale-110';
          animatePingElement = '<div class="absolute w-10 h-10 rounded-full bg-pink-400/25 border border-pink-400 animate-pulse"></div>';
        } else {
          // Standard candidate network markers
          if (t.generation === '5G SA') {
            towerColorClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
          } else if (t.generation === '5G NSA') {
            towerColorClass = 'bg-teal-500/20 border-teal-500 text-teal-400';
          } else {
            towerColorClass = 'bg-blue-500/20 border-blue-500 text-blue-400';
          }
        }

        const towerIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              ${animatePingElement}
              <div class="w-7 h-7 rounded-lg ${towerColorClass} border flex flex-col items-center justify-center shadow-lg transition-transform font-bold font-mono text-[9px]">
                <div class="-mb-0.5"><span class="text-[7px]">#</span>${t.id.toString().slice(-3)}</div>
                <div class="text-[7px] leading-tight opacity-90">${t.generation}</div>
              </div>
            </div>
          `,
          className: 'custom-tower-pin',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        // Add tower popup info
        const marker = L.marker([t.lat, t.lng], { icon: towerIcon })
          .bindPopup(`
            <div class="p-2.5 font-sans bg-slate-950 text-white rounded-xl text-xs select-none border border-white/15 shadow-2xl space-y-1.5 w-[210px]">
              <div class="flex items-center justify-between border-b border-white/10 pb-1 mb-1">
                <h4 class="font-bold text-cyan-400 leading-tight">${t.operator} Station</h4>
                <span class="text-[8px] px-1 py-0.5 rounded uppercase font-bold text-white ${
                  t.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' :
                  t.status === 'High Load' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-slate-500/20 text-slate-300'
                }">${t.status || 'Active'}</span>
              </div>
              <p class="text-[10px] text-white/80">ID: <b>${t.generation.includes('5G') ? 'gNodeB' : 'eNodeB'} #${t.gNodeBId || t.id}</b></p>
              <p class="text-[10px] text-white/80">Cell CID: <b>${t.id}</b> | PCI: <b>${t.pci}</b></p>
              <p class="text-[10px] text-white/85">Frequency: <b class="text-amber-450 text-[#fbbf24]">${t.band}</b></p>
              <p class="text-[10px] text-white/85">Bandwidth: <b>${t.bandwidth || 'N/A'}</b> (${t.duplex || 'FDD'})</p>
              <p class="text-[10px] text-white/85">MIMO Scheme: <b>${t.mimo || 'N/A'}</b></p>
              <p class="text-[10px] text-white/85">Hardware Vendor: <span class="text-cyan-300 font-bold">${t.vendor || 'Unknown'}</span></p>
              <div class="flex justify-between items-center text-[9px] text-white/55 border-t border-white/10 pt-1 mt-1 leading-none">
                <span>Azimuth: <b>${t.azimuth}°</b></span>
                <span>Tier: <b>${t.height}m</b></span>
              </div>
            </div>
          `, { closeButton: false })
          .addTo(map);

        towerMarkersRef.current[t.id] = marker;
      });
    }

    // Centering helper
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([gps.latitude, gps.longitude]);
    }
  }, [towers, servingTower1, servingTower2, showTowers, gps.latitude, gps.longitude]);

  // Handle Antenna Links and Coverage Circles update
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear existing physical lines
    linesRef.current.forEach(line => map.removeLayer(line));
    linesRef.current = [];

    // Clear coverage circular bounds
    circlesRef.current.forEach(circle => map.removeLayer(circle));
    circlesRef.current = [];

    // Clear intersection point markers
    intersectionMarkersRef.current.forEach(marker => map.removeLayer(marker));
    intersectionMarkersRef.current = [];

    // Select closest towers filtered by current trilateration experiment step
    const closestTowers = [...towers]
      .map(t => {
        const d = getDistance(gps.latitude, gps.longitude, t.lat, t.lng);
        return { ...t, distance: d };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, trilaterationStep);

    const colors = ['#22d3ee', '#f472b6', '#10b981']; // Cyan, Pink (Airtel), Emerald (Jio)
    const circleColors = ['#0891b2', '#db2777', '#059669'];

    closestTowers.forEach((tower, idx) => {
      // 1. Draw Active Tower Lines (Active Links)
      if (showTowerLines) {
        const line = L.polyline(
          [[gps.latitude, gps.longitude], [tower.lat, tower.lng]],
          {
            color: colors[idx % colors.length],
            weight: 2,
            dashArray: '5, 8',
            opacity: 0.8
          }
        ).addTo(map);
        linesRef.current.push(line);
      }

      // 2. Render coverage/ranging circle bounds
      if (showCoverageCircle) {
        const circle = L.circle([tower.lat, tower.lng], {
          radius: tower.distance,
          color: colors[idx % colors.length],
          fillColor: circleColors[idx % circleColors.length],
          fillOpacity: 0.03,
          weight: 1.5,
          dashArray: '3, 5'
        }).addTo(map);
        circlesRef.current.push(circle);
      }
    });

    // 3. Compute and render intersection points for Step 2
    if (trilaterationStep === 2 && closestTowers.length >= 2) {
      const t1 = closestTowers[0];
      const t2 = closestTowers[1];
      
      const r1 = Math.sqrt((gps.latitude - t1.lat) ** 2 + (gps.longitude - t1.lng) ** 2);
      const r2 = Math.sqrt((gps.latitude - t2.lat) ** 2 + (gps.longitude - t2.lng) ** 2);
      
      const intercepts = getCircleIntersections(
        t1.lat, t1.lng, r1,
        t2.lat, t2.lng, r2
      );
      
      intercepts.forEach((pt, i) => {
        const interceptIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 rounded-full bg-amber-500/35 border border-amber-400 animate-ping"></div>
              <div class="w-5 h-5 rounded-full bg-amber-500 border border-white flex items-center justify-center shadow-lg font-mono font-bold text-[8px] text-slate-950">
                ${String.fromCharCode(65 + i)}
              </div>
            </div>
          `,
          className: 'custom-intersection-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        
        const m = L.marker([pt[0], pt[1]], { icon: interceptIcon })
          .bindPopup(`
            <div class="p-1.5 font-sans bg-slate-950 text-white rounded text-[10px] select-none text-center leading-normal">
              <h5 class="font-bold text-amber-400">Intersection Ambiguity Point ${String.fromCharCode(65 + i)}</h5>
              <p class="text-white/80 mt-0.5">Could be the phone's position.</p>
              <p class="text-[9px] text-white/50">${pt[0].toFixed(5)}, ${pt[1].toFixed(5)}</p>
            </div>
          `, { closeButton: false })
          .addTo(map);
          
        intersectionMarkersRef.current.push(m);
      });
    }

    // 4. Render exact perfect triangulation lock for Step 3
    if (trilaterationStep === 3 && closestTowers.length >= 3) {
      const lockIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 rounded-full border-2 border-dashed border-emerald-400 animate-spin" style="animation-duration: 8s"></div>
            <div class="absolute w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500 animate-ping"></div>
            <div class="w-4.5 h-4.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center shadow-lg">
              <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        `,
        className: 'custom-lock-pin',
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });
      
      const m = L.marker([gps.latitude, gps.longitude], { icon: lockIcon })
        .bindPopup(`
          <div class="p-2 font-sans bg-slate-950 text-white rounded text-xs select-none max-w-[220px] leading-relaxed">
            <h5 class="font-bold text-emerald-400 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              TRILATERATION LOCK
            </h5>
            <p class="mt-1 text-[10px] text-white/80">
              With 3 circles active, overlapping mathematical bounds converge back at <b>exactly 1 coordinate</b>, resolving all space ambiguities.
            </p>
          </div>
        `, { closeButton: false })
        .addTo(map);
        
      intersectionMarkersRef.current.push(m);
    }

    // Mirror user marker positioning
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([gps.latitude, gps.longitude]);
    }
  }, [gps.latitude, gps.longitude, towers, showCoverageCircle, showTowerLines, trilaterationStep]);

  // Auto-center map target when position moves away from Delhi default to user's real hardware or IP location
  const hasAutoCentered = useRef<boolean>(false);
  useEffect(() => {
    if (mapRef.current) {
      const isDefaultDelhi = Math.abs(gps.latitude - 28.6139) < 0.0001 && Math.abs(gps.longitude - 77.2090) < 0.0001;
      if (!isDefaultDelhi && !hasAutoCentered.current) {
        mapRef.current.setView([gps.latitude, gps.longitude], 16);
        hasAutoCentered.current = true;
      }
    }
  }, [gps.latitude, gps.longitude]);

  // Center/Pan Map on GPS changes & sync to/acquire true device-level hardware GPS coordinates
  const centerMapUser = () => {
    if (mapRef.current) {
      onSnapToDeviceGps(mapRef.current);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden bg-slate-950 border border-white/5 relative" id="drona-map-container">
      
      {/* QUICK FLOATING CONTROL SHEETS */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-950/80 border border-white/10 p-2 sm:p-2.5 rounded-xl shadow-2xl backdrop-blur-md max-w-[calc(100vw-110px)] sm:max-w-xs space-y-2">
        <div className="flex justify-between items-center border-b border-white/5 pb-1.5 gap-2">
          <h3 className="text-[10px] sm:text-xs font-bold text-white tracking-wider font-sans flex items-center gap-1 truncate">
            <Route className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            DRIVETEST CONTROL
          </h3>
          <span className="text-[8px] sm:text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1 py-0.5 rounded leading-none shrink-0">
            {simulationMode === 'drive' ? 'DRIVING' : 'WALK'}
          </span>
        </div>
        
        <div className="space-y-1.5 align-middle">
          <div className="flex gap-1">
            <button
              onClick={() => setSimulationMode('drive')}
              className={`flex-1 flex items-center justify-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-medium font-sans cursor-pointer transition ${
                simulationMode === 'drive'
                  ? `bg-${themeColor}-500/20 text-${themeColor}-400 border-${themeColor}-500/40`
                  : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10'
              }`}
            >
              <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Auto Drive
            </button>
            <button
              onClick={() => setSimulationMode('real')}
              className={`flex-1 flex items-center justify-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-medium font-sans cursor-pointer transition ${
                simulationMode === 'real'
                  ? `bg-${themeColor}-500/20 text-${themeColor}-400 border-${themeColor}-500/40`
                  : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10'
              }`}
            >
              <Square className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Hand drag
            </button>
          </div>
          <p className="text-[8.5px] sm:text-[9px] text-white/40 leading-tight font-sans">
            * Drag the blue dot anywhere across the map to immediately test signal levels, RSRP loss, and trigger antenna crossovers.
          </p>
        </div>
      </div>

      {/* FLOATING MAP LAYERS / FILTER CONTROLS */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-1.5 font-sans">
        {/* Toggle Button for Mobile Screens */}
        <button
          onClick={() => setLayersOpen(!layersOpen)}
          className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950/90 border border-white/10 rounded-lg text-[9.5px] uppercase font-bold text-white shadow-2xl backdrop-blur-md cursor-pointer hover:bg-slate-900 border border-cyan-500/20"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Layers</span>
          <span className="text-[8px] tracking-wide font-bold bg-cyan-500/15 text-cyan-400 px-1 py-0.5 rounded leading-none ml-1">
            {layersOpen ? 'CLOSE' : 'OPEN'}
          </span>
        </button>

        {/* Configurations Panel overlay */}
        <div className={`${layersOpen ? 'flex' : 'hidden md:flex'} flex-col gap-2 bg-slate-950/95 border border-white/10 p-2.5 rounded-xl shadow-2xl backdrop-blur-md w-52 text-left`}>
          <div className="flex gap-1 border-b border-white/5 pb-1.5">
            {(['dark', 'streets', 'satellite'] as const).map(type => (
              <button
                key={type}
                onClick={() => setMapType(type)}
                className={`flex-1 py-0.5 rounded text-[9px] uppercase font-mono font-semibold tracking-wide transition capitalize select-none cursor-pointer ${
                  mapType === type 
                    ? 'bg-amber-400 text-slate-950 font-bold' 
                    : 'text-white/60 hover:text-white bg-white/5'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-1 mt-1 font-sans">
            <label className="flex items-center gap-1.5 text-[10px] text-white/70 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={showTowers}
                onChange={(e) => setShowTowers(e.target.checked)}
                className="w-3 h-3 rounded bg-slate-950 border-white/10 uppercase focus:ring-0"
              />
              Show Antenna Nodes
            </label>
            <label className="flex items-center gap-1.5 text-[10px] text-white/70 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={showCoverageCircle}
                onChange={(e) => setShowCoverageCircle(e.target.checked)}
                className="w-3 h-3 rounded bg-slate-950 border-white/10 uppercase focus:ring-0"
              />
              Show Coverage Grids
            </label>
            <label className="flex items-center gap-1.5 text-[10px] text-white/70 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={showTowerLines}
                onChange={(e) => setShowTowerLines(e.target.checked)}
                className="w-3 h-3 rounded bg-slate-950 border-white/10 uppercase focus:ring-0"
              />
              Show Active Links
            </label>
          </div>
        </div>
      </div>

      {/* TRILATERATION GEOLOCATION LAB PANEL */}
      {!labsOpen ? (
        <div 
          className="absolute bottom-16 left-3 z-[1000] bg-slate-950/90 border border-white/10 p-2 px-3 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 font-sans cursor-pointer flex items-center gap-2 hover:bg-slate-900"
          onClick={() => setLabsOpen(true)}
        >
          <Target className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Trilateration Lab</span>
          <span className="text-[8px] tracking-wide font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded leading-none">
            OPEN
          </span>
        </div>
      ) : (
        <div 
          className="absolute bottom-16 left-3 z-[1000] bg-slate-950/95 border border-white/10 p-2 sm:p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-[calc(100vw-24px)] w-[290px] sm:w-[330px] transition-all duration-300 font-sans space-y-2 sm:space-y-2.5"
          id="trilateration-lab-panel"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wider">TRILATERATION EXPERIMENT</span>
            </div>
            <button 
              onClick={() => setLabsOpen(false)}
              className="text-[9px] font-mono tracking-wider text-emerald-400/80 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded transition cursor-pointer select-none"
            >
              HIDE
            </button>
          </div>

          <p className="text-[10px] text-white/50 leading-relaxed font-sans">
            Trilateration is the algorithm used to calculate your phone's coordinate based on its physical distance (or delay) from surrounding cell centers.
          </p>

          {/* Steps */}
          <div className="space-y-1.5">
            {/* Step 1 */}
            <button
              onClick={() => setTrilaterationStep(1)}
              className={`w-full flex items-center justify-between text-left p-1.5 rounded-lg border text-[10px] transition cursor-pointer font-sans ${
                trilaterationStep === 1
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                  : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center font-mono font-bold text-[8px] ${trilaterationStep === 1 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-white'}`}>
                  1
                </span>
                <div>
                  <div className="font-semibold text-white/90">Single Tower (Radius)</div>
                  <div className="text-[8px] opacity-75 mt-0.5 max-w-[190px] leading-tight">Phone can be anywhere along the massive circle perimeter.</div>
                </div>
              </div>
              {closestThree[0] && <span className="font-mono text-[8px] font-bold text-cyan-400 bg-cyan-400/10 px-1 rounded">{Math.round(closestThree[0].distance)}m</span>}
            </button>

            {/* Step 2 */}
            <button
              onClick={() => setTrilaterationStep(2)}
              className={`w-full flex items-center justify-between text-left p-1.5 rounded-lg border text-[10px] transition cursor-pointer font-sans ${
                trilaterationStep === 2
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center font-mono font-bold text-[8px] ${trilaterationStep === 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-white'}`}>
                  2
                </span>
                <div>
                  <div className="font-semibold text-white/90">Two Towers (Intersections)</div>
                  <div className="text-[8px] opacity-75 mt-0.5 max-w-[190px] leading-tight">Narrowed down to exactly 2 intersection points (A & B).</div>
                </div>
              </div>
              {closestThree[1] && <span className="font-mono text-[8px] font-bold text-amber-400 bg-amber-400/10 px-1 rounded">{Math.round(closestThree[1].distance)}m</span>}
            </button>

            {/* Step 3 */}
            <button
              onClick={() => setTrilaterationStep(3)}
              className={`w-full flex items-center justify-between text-left p-1.5 rounded-lg border text-[10px] transition cursor-pointer font-sans ${
                trilaterationStep === 3
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center font-mono font-bold text-[8px] ${trilaterationStep === 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-white'}`}>
                  3
                </span>
                <div>
                  <div className="font-semibold text-white/90">Three Towers (Target Lock)</div>
                  <div className="text-[8px] opacity-75 mt-0.5 max-w-[190px] leading-tight">All circles converge perfectly at your exact phone coordinate.</div>
                </div>
              </div>
              {closestThree[2] && <span className="font-mono text-[8px] font-bold text-emerald-400 bg-emerald-400/10 px-1 rounded">{Math.round(closestThree[2].distance)}m</span>}
            </button>
          </div>

          {/* Distance Logs */}
          <div className="bg-slate-900 border border-white/5 p-1.5 rounded-lg space-y-1 font-mono text-[8.5px] text-white/70">
            <div className="text-white/40 border-b border-white/5 pb-1 flex justify-between font-bold">
              <span>ध्रु-VA CLOUD NODE</span>
              <span>CALCULATED DELAY METRICS</span>
            </div>
            {closestThree.map((t, idx) => {
              const active = idx < trilaterationStep;
              return (
                <div key={t.id} className={`flex justify-between items-center ${active ? 'text-white font-[500]' : 'text-white/20'}`}>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-sm ${active ? (idx === 0 ? 'bg-cyan-400' : idx === 1 ? 'bg-pink-400' : 'bg-emerald-400') : 'bg-slate-700'}`} />
                    <span>{t.operator} (ID: #{t.id.toString().slice(-3)})</span>
                  </div>
                  <div>{Math.round(t.distance)} meters</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BOTTOM CENTER MAP PAN REFRESHER */}
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2">
        <button
          onClick={centerMapUser}
          className="bg-slate-950/80 border border-white/10 p-2 rounded-xl text-white hover:bg-slate-900 shadow-2xl backdrop-blur-md cursor-pointer transition flex items-center justify-center"
          title="Center map on User"
        >
          <Navigation className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      {/* CORE LEAFLET MAP ELEMENT CONTROLLER WRAPPER */}
      <div className="w-full flex-1" ref={mapContainerRef} style={{ minHeight: '380px' }} />

      {/* FOOTER BAR TO EXPAND METRICS */}
      <div className="bg-slate-900/90 border-t border-white/5 p-3 flex justify-between items-center flex-wrap gap-2 truncate">
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-cyan-400" />
            <span className="text-white/60">SIM1 active SIM ({sim1.operator})</span>
            <span className="text-white">RSRP: {sim1.rsrp} dBm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-pink-400" />
            <span className="text-white/60">SIM2 active SIM ({sim2.operator})</span>
            <span className="text-white">RSRP: {sim2.rsrp} dBm</span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-white/40 flex items-center gap-2">
          <span>COORDS: {gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)}</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>DRIVE LOGGING ACTIVE</span>
          </div>
        </div>
      </div>

    </div>
  );
};
