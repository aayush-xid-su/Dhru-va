import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CellTower, SimCellData, GpsData } from '../types';
import { Navigation, Radio, Compass, MapPin } from 'lucide-react';
import { getDistance } from '../utils/telemetryGen';

interface MiniMapProps {
  gps: GpsData;
  setGps: React.Dispatch<React.SetStateAction<GpsData>>;
  towers: CellTower[];
  sim1: SimCellData;
  sim2: SimCellData;
  servingTower1: CellTower | null;
  servingTower2: CellTower | null;
  themeColor: string;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  gps,
  setGps,
  towers,
  sim1,
  sim2,
  servingTower1,
  servingTower2,
  themeColor
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const towerMarkersRef = useRef<{ [key: number]: L.Marker }>({});
  const linesRef = useRef<L.Polyline[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);

  const [mapType, setMapType] = useState<'streets' | 'satellite' | 'dark'>('dark');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [gps.latitude, gps.longitude],
      zoom: 15,
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

    // Initial user marker with custom HTML avatar
    const userIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
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

    // Make user marker draggable so user can walk-test signals
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
        longitude: position.lng
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

  // Update tower markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear existing tower markers
    Object.values(towerMarkersRef.current).forEach(marker => {
      map.removeLayer(marker);
    });
    towerMarkersRef.current = {};

    towers.forEach(t => {
      const isServing1 = servingTower1 && t.id === servingTower1.id;
      const isServing2 = servingTower2 && t.id === servingTower2.id;
      
      let towerColorClass = 'bg-slate-700/80 border-slate-500';
      let animatePingElement = '';
      
      if (isServing1) {
        towerColorClass = 'bg-cyan-500 border-cyan-400 text-slate-950 scale-105';
        animatePingElement = '<div class="absolute w-8 h-8 rounded-full bg-cyan-400/20 border border-cyan-400 animate-pulse"></div>';
      } else if (isServing2) {
        towerColorClass = 'bg-pink-500 border-pink-400 text-slate-950 scale-105';
        animatePingElement = '<div class="absolute w-8 h-8 rounded-full bg-pink-400/20 border border-pink-400 animate-pulse"></div>';
      } else {
        if (t.generation === '5G SA') {
          towerColorClass = 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300';
        } else {
          towerColorClass = 'bg-blue-500/25 border-blue-500/50 text-blue-300';
        }
      }

      const towerIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            ${animatePingElement}
            <div class="w-6 h-6 rounded-md ${towerColorClass} border flex flex-col items-center justify-center shadow-md font-bold font-mono text-[8px]">
              <div>${t.id.toString().slice(-3)}</div>
            </div>
          </div>
        `,
        className: 'custom-tower-pin-mini',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([t.lat, t.lng], { icon: towerIcon })
        .bindPopup(`
          <div class="p-2 font-sans bg-slate-950 text-white rounded-lg text-xs leading-normal select-none">
            <h4 class="font-bold text-cyan-400 leading-tight">${t.operator} Node</h4>
            <p class="text-[10px] mt-0.5">ID: <b>${t.generation.includes('5G') ? 'gNodeB' : 'eNodeB'} #${t.gNodeBId || t.id}</b></p>
            <p class="text-[10px]">Freq: <b>${t.band}</b></p>
            <p class="text-[10px]">MIMO: <b>${t.mimo || 'N/A'}</b> | BW: <b>${t.bandwidth || 'N/A'}</b></p>
            <p class="text-[10px] text-cyan-300 font-semibold mt-0.5">Vendor: ${t.vendor || 'Unknown'}</p>
          </div>
        `, { closeButton: false })
        .addTo(map);

      towerMarkersRef.current[t.id] = marker;
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([gps.latitude, gps.longitude]);
    }
  }, [towers, servingTower1, servingTower2, gps.latitude, gps.longitude]);

  // Handle Antenna Links and Coverage Circles update
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear lines
    linesRef.current.forEach(line => map.removeLayer(line));
    linesRef.current = [];

    // Clear coverage circles
    circlesRef.current.forEach(circle => map.removeLayer(circle));
    circlesRef.current = [];

    // Select the 3 closest towers from the user for 3-tower ranging triangulation
    const closestTowers = [...towers]
      .map(t => {
        const d = getDistance(gps.latitude, gps.longitude, t.lat, t.lng);
        return { ...t, distance: d };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

    // Draw active connections and ranging circles
    const colors = ['#22d3ee', '#f472b6', '#10b981']; // Cyan, Pink (Airtel), Emerald (Jio)
    const circleColors = ['#0891b2', '#db2777', '#059669'];

    closestTowers.forEach((tower, idx) => {
      // Draw dotted propagation link
      const line = L.polyline(
        [[gps.latitude, gps.longitude], [tower.lat, tower.lng]],
        {
          color: colors[idx % colors.length],
          weight: 1.5,
          dashArray: '4, 6',
          opacity: 0.8
        }
      ).addTo(map);
      linesRef.current.push(line);

      // Draw exact ranging circle (triangulation bounds)
      const circle = L.circle([tower.lat, tower.lng], {
        radius: tower.distance,
        color: colors[idx % colors.length],
        fillColor: circleColors[idx % circleColors.length],
        fillOpacity: 0.02,
        weight: 1.2,
        dashArray: '3, 4'
      }).addTo(map);
      circlesRef.current.push(circle);
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([gps.latitude, gps.longitude]);
    }
  }, [gps.latitude, gps.longitude, towers]);

  // Auto-center map target when position moves away from Delhi default to user's real hardware or IP location
  const hasAutoCentered = useRef<boolean>(false);
  useEffect(() => {
    if (mapRef.current) {
      const isDefaultDelhi = Math.abs(gps.latitude - 28.6139) < 0.0001 && Math.abs(gps.longitude - 77.2090) < 0.0001;
      if (!isDefaultDelhi && !hasAutoCentered.current) {
        mapRef.current.setView([gps.latitude, gps.longitude], 15);
        hasAutoCentered.current = true;
      }
    }
  }, [gps.latitude, gps.longitude]);

  const centerMapUser = () => {
    if (mapRef.current) {
      mapRef.current.setView([gps.latitude, gps.longitude], 15);
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-white/5 bg-slate-900/50" h-72="true" style={{ height: '240px' }}>
      {/* Target Container element */}
      <div className="w-full h-full" ref={mapContainerRef} />

      {/* Floating Map Mode control */}
      <div className="absolute top-2 right-2 z-[1000] flex gap-1 bg-slate-950/70 py-1 px-1.5 rounded-lg border border-white/5 backdrop-blur-sm">
        {(['dark', 'streets', 'satellite'] as const).map(type => (
          <button
            key={type}
            onClick={() => setMapType(type)}
            className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-mono font-bold tracking-wider transition ${
              mapType === type 
                ? 'bg-amber-400 text-slate-950 font-extrabold' 
                : 'text-white/60 hover:text-white bg-white/5'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Floating GPS Recenter Pin */}
      <button
        onClick={centerMapUser}
        className="absolute bottom-2 left-2 z-[1000] bg-slate-950/80 border border-white/10 p-1.5 rounded-lg text-white hover:bg-slate-900 shadow-xl backdrop-blur-sm transition flex items-center justify-center cursor-pointer"
        title="Center map on User"
      >
        <Navigation className="w-3.5 h-3.5 text-cyan-400" />
      </button>

      {/* Quick guide label overlay */}
      <div className="absolute bottom-2 right-2 z-[1000] bg-slate-950/90 border border-white/10 px-2 py-0.5 rounded-md text-[8px] text-white/50 font-mono tracking-wide">
        * DRAG PIN TO WALK TEST
      </div>
    </div>
  );
};
