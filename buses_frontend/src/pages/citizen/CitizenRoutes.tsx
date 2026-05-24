import { useEffect, useState, useRef, useCallback } from 'react';
import { getRoutes } from '../../services/routesService';
import type { Route } from '../../types/route.types';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Memoized bus icon to prevent flickering/disappearing during animation renders
const busIcon = L.divIcon({
  className: 'simulated-bus-icon',
  html: '<div class="bus-marker-sim">🚌</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

// Fórmula de Haversine para calcular distancia en metros
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const φ1 = lat1 * Math.PI / 180; 
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
};

// Sonido de notificación premium usando Web Audio API (Ding-Dong)
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playNote(659.25, now, 0.5); // Mi (E5)
    playNote(523.25, now + 0.4, 0.8); // Do (C5)
  } catch (e) {
    console.error("No se pudo reproducir el sonido:", e);
  }
};

// Componente para actualizar el centro del mapa dinámicamente
function MapUpdater({ center, zoom }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
}

// Componente para capturar los clics del usuario en el mapa y simular ubicación
function MapEventsHandler({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

const CitizenRoutes = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [osrmPositions, setOsrmPositions] = useState<[number, number][]>([]);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);

  // Estados de Geolocalización
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [nearbyStops, setNearbyStops] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Nuevas Funcionalidades
  const [searchQuery, setSearchQuery] = useState('');
  const [walkingPositions, setWalkingPositions] = useState<[number, number][]>([]);
  const [selectedWalkingStop, setSelectedWalkingStop] = useState<any | null>(null);

  // Simulación de bus
  const [demoCountdown, setDemoCountdown] = useState<number | null>(null);
  const [demoActive, setDemoActive] = useState(false);
  const [simulatedBusPosition, setSimulatedBusPosition] = useState<[number, number] | null>(null);
  const [demoRouteName, setDemoRouteName] = useState('');
  const [demoStopName, setDemoStopName] = useState('');
  const [demoAlert, setDemoAlert] = useState<{title: string, message: string} | null>(null);
  const simIntervalRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    watchIdRef.current = watchId;
  }, [watchId]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRoutes();
        setRoutes(data);
        if (data.length > 0) setSelectedRoute(data[0]);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    load();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRouteNodes = (route: Route | null) => {
    if (!route) return [];
    const nodes = (route as any).nodes || [];
    return nodes.sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0));
  };

  const getPolylinePositions = (route: Route | null): [number, number][] => {
    if (!route) return [];
    return getRouteNodes(route)
      .filter((n: any) => n.busStop?.latitud && n.busStop?.longitud)
      .map((n: any) => [Number(n.busStop.latitud), Number(n.busStop.longitud)] as [number, number]);
  };

  useEffect(() => {
    const fetchOSRM = async () => {
      const nodes = getRouteNodes(selectedRoute || ({} as Route)).filter((n: any) => n.busStop);
      if (nodes.length < 2) {
        setOsrmPositions([]);
        return;
      }
      setIsMapLoading(true);
      try {
        const coords: string[] = [];
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          coords.push(`${Number(node.busStop!.longitud)},${Number(node.busStop!.latitud)}`);
          if (node.via_points && node.via_points.length > 0 && i < nodes.length - 1) {
            node.via_points.forEach((vp: [number, number]) => {
              coords.push(`${vp[1]},${vp[0]}`); 
            });
          }
        }
        const coordinatesString = coords.join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes.length > 0) {
          const mappedPositions = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          setOsrmPositions(mappedPositions);
          setRouteDuration(Math.round(data.routes[0].duration / 60));
        } else {
          setOsrmPositions([]);
          setRouteDuration(null);
        }
      } catch (error) {
        console.error('Error fetching OSRM:', error);
        setOsrmPositions([]);
        setRouteDuration(null);
      } finally {
        setIsMapLoading(false);
      }
    };

    if (selectedRoute) {
      fetchOSRM();
    } else {
      setOsrmPositions([]);
      setRouteDuration(null);
    }
  }, [selectedRoute]);

  const startWatching = (highAccuracy: boolean) => {
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
        setLocationError(null);
      },
      (error) => {
        console.error("WatchPosition error:", error);
        if (highAccuracy) {
          console.log("Fallo de alta precisión, reintentando con enableHighAccuracy: false...");
          startWatching(false);
        } else {
          setLocationError('No pudimos acceder a tu GPS. Permite el acceso o haz clic en el mapa.');
          setIsLocating(false);
        }
      },
      { 
        enableHighAccuracy: highAccuracy, 
        maximumAge: 30000, 
        timeout: highAccuracy ? 3000 : 8000 
      }
    );
    setWatchId(id);
  };

  const requestLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización.');
      setIsLocating(false);
      return;
    }

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    // Intentar una respuesta rápida, e inmediatamente después iniciar el seguimiento con ALTA PRECISIÓN
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
        startWatching(true); // Cambiado a true para forzar GPS real en lugar de IP
      },
      (err) => {
        console.warn("Intento rápido de ubicación falló/time-out, iniciando watchPosition de alta precisión...", err);
        startWatching(true); // Cambiado a true
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 3000 }
    );
  };

  const handleMapClick = (latlng: L.LatLng) => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setUserLocation({
      lat: latlng.lat,
      lng: latlng.lng
    });
    setLocationError(null);
    setIsLocating(false);
  };

  useEffect(() => {
    if (userLocation && routes.length > 0) {
      const uniqueStopsMap = new Map();
      
      routes.forEach((route: any) => {
        if (route.nodes) {
          route.nodes.forEach((node: any) => {
            if (node.busStop && node.busStop.latitud && node.busStop.longitud) {
              const stopId = node.busStop.id;
              if (!uniqueStopsMap.has(stopId)) {
                uniqueStopsMap.set(stopId, {
                  ...node.busStop,
                  routes: [route]
                });
              } else {
                const existing = uniqueStopsMap.get(stopId);
                if (!existing.routes.find((r: any) => r.id === route.id)) {
                  existing.routes.push(route);
                }
              }
            }
          });
        }
      });

      const stopsWithDistance = Array.from(uniqueStopsMap.values()).map(stop => {
        const distance = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          Number(stop.latitud), 
          Number(stop.longitud)
        );
        return { ...stop, distance };
      });

      stopsWithDistance.sort((a, b) => a.distance - b.distance);
      setNearbyStops(stopsWithDistance.slice(0, 5));
    }
  }, [userLocation, routes]);

  const drawWalkingPath = async (stop: any) => {
    if (!userLocation) return;
    if (selectedWalkingStop?.id === stop.id) {
      // Toggle off
      setSelectedWalkingStop(null);
      setWalkingPositions([]);
      return;
    }
    
    setSelectedWalkingStop(stop);
    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${userLocation.lng},${userLocation.lat};${stop.longitud},${stop.latitud}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.code === 'Ok' && data.routes.length > 0) {
        const mappedPositions = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        setWalkingPositions(mappedPositions);
      }
    } catch (error) {
      console.error('Error fetching walking OSRM:', error);
    }
  };

  const stopSimulation = useCallback(() => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setDemoActive(false);
    setDemoCountdown(null);
    setSimulatedBusPosition(null);
    setDemoRouteName('');
    setDemoStopName('');
    setDemoAlert(null);
  }, []);

  const startBusSimulation = useCallback((routeForSim: any, stopName: string, routeName: string) => {
    stopSimulation();
    const nodes = (routeForSim.nodes || []).filter((n: any) => n.busStop?.latitud && n.busStop?.longitud).sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0));
    if (nodes.length < 2) return;
    
    const positions: [number, number][] = nodes.map((n: any) => [Number(n.busStop.latitud), Number(n.busStop.longitud)]);
    
    // Interpolar más puntos para movimiento suave
    const interpolated: [number, number][] = [];
    for (let i = 0; i < positions.length - 1; i++) {
      const steps = 8;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        interpolated.push([
          positions[i][0] + (positions[i + 1][0] - positions[i][0]) * t,
          positions[i][1] + (positions[i + 1][1] - positions[i][1]) * t
        ]);
      }
    }
    interpolated.push(positions[positions.length - 1]);

    setDemoActive(true);
    setDemoRouteName(routeName);
    setDemoStopName(stopName);
    setSimulatedBusPosition(interpolated[0]);
    setSelectedRoute(routeForSim);

    const TOTAL_SECONDS = 10;
    setDemoCountdown(TOTAL_SECONDS);
    
    // Countdown
    let secsLeft = TOTAL_SECONDS;
    countdownRef.current = setInterval(() => {
      secsLeft--;
      setDemoCountdown(secsLeft);
      if (secsLeft <= 0) {
        clearInterval(countdownRef.current);
      }
    }, 1000);

    // Mover bus
    let idx = 0;
    const stepTime = (TOTAL_SECONDS * 1000) / interpolated.length;
    simIntervalRef.current = setInterval(() => {
      idx++;
      if (idx >= interpolated.length) {
        clearInterval(simIntervalRef.current);
        setSimulatedBusPosition(interpolated[interpolated.length - 1]);
        
        // Mostrar alerta en UI garantizada
        setDemoAlert({
          title: '¡Tu bus se acerca! 🚌',
          message: `El bus de la ruta ${routeName} está a unos 5 minutos de llegar al paradero ${stopName}. ¡Ve preparándote!`
        });

        playNotificationSound();

        // Intentar disparar notificación OS si tiene permisos
        if ("Notification" in window && Notification.permission === 'granted') {
          new Notification('¡Tu bus se acerca! 🚌', {
            body: `El bus de la ruta ${routeName} está a unos 5 minutos de llegar al paradero ${stopName}. ¡Ve preparándote!`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png'
          });
        }
        return;
      }
      setSimulatedBusPosition(interpolated[idx]);
    }, stepTime);
  }, [stopSimulation]);

  const scheduleNotification = (stopName: string, routeName: string, isSimulation: boolean = false, routeObj?: any) => {
    const startAction = () => {
      if (isSimulation && routeObj) {
        startBusSimulation(routeObj, stopName, routeName);
      } else if (isSimulation) {
        alert('[DEMO] No se pudo obtener la ruta para la simulación.');
      } else {
        alert(`Alarma configurada exitosamente. El sistema te notificará cuando el bus de la ruta ${routeName} esté a 5 minutos del paradero ${stopName}.`);
      }
    };

    if (!("Notification" in window)) {
      alert('Este navegador no soporta notificaciones de escritorio. Usaremos alertas en pantalla.');
      startAction();
      return;
    }

    if (Notification.permission === 'granted') {
      startAction();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(function (permission) {
        if (permission !== 'granted') {
          alert('Permiso de notificaciones denegado. Se usarán alertas en pantalla para la demostración.');
        }
        startAction();
      });
    } else {
      startAction();
    }
  };

  const polylinePositions: [number, number][] = osrmPositions.length > 0 
    ? osrmPositions 
    : (selectedRoute ? getPolylinePositions(selectedRoute) : []);

  const mapCenter = userLocation 
    ? [userLocation.lat, userLocation.lng] as [number, number]
    : (selectedRoute && getPolylinePositions(selectedRoute).length > 0
        ? getPolylinePositions(selectedRoute)[0] 
        : [4.6097, -74.0817] as [number, number]);

  const filteredRoutes = routes.filter(route => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (route.nombre.toLowerCase().includes(q)) return true;
    if ((route as any).descripcion?.toLowerCase().includes(q)) return true;
    const nodes = (route as any).nodes || [];
    return nodes.some((n: any) => n.busStop?.nombre.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-10">
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Rutas y Paraderos</h1>
            <p className="text-blue-100 text-sm opacity-90">Consulta rutas y encuentra tu paradero más cercano</p>
          </div>
          <Button onClick={() => navigate('/citizen/dashboard')} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm shadow-sm transition-all border border-white/10">
            ← Mi Panel
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            {/* Buscador de Paraderos (HU-ENTR-2-002) */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700/60 p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Paraderos Cercanos
              </h2>
              
              {!userLocation ? (
                <div className="relative z-10">
                  <p className="text-sm text-slate-300 mb-4 opacity-90">Activa tu ubicación para rastrear los buses más cerca de ti en tiempo real.</p>
                  <Button 
                    onClick={requestLocation} 
                    disabled={isLocating}
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white flex justify-center items-center gap-2 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 border border-indigo-400/20"
                  >
                    {isLocating ? (
                      <><div className="animate-spin h-5 w-5 border-2 border-white/60 border-t-white rounded-full"></div> Detectando ubicación...</>
                    ) : (
                      <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.071 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg> Usar mi ubicación en vivo</>
                    )}
                  </Button>
                  {locationError && <p className="text-rose-400 text-xs mt-3 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">{locationError}</p>}
                  <p className="text-[11px] text-slate-400 mt-3 text-center border-t border-slate-700/50 pt-3">
                    💡 <strong>Tip para PC / Pruebas:</strong> Haz clic en cualquier parte del mapa para fijar tu ubicación manualmente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mt-4 relative z-10">
                  <div className="flex justify-between items-center mb-1">
                    {watchId !== null ? (
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> GPS en Vivo Activo
                      </span>
                    ) : (
                      <span className="text-xs text-indigo-400 font-bold bg-indigo-500/15 px-3 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1.5">
                        📍 Ubicación fijada (Mapa)
                      </span>
                    )}
                    <button 
                      onClick={() => { 
                        if (watchId !== null) {
                          navigator.geolocation.clearWatch(watchId);
                        }
                        setUserLocation(null); 
                        setWatchId(null); 
                        setWalkingPositions([]); 
                        setSelectedWalkingStop(null); 
                      }} 
                      className="text-xs text-slate-400 hover:text-rose-400 transition-colors underline decoration-slate-600 hover:decoration-rose-400 underline-offset-2"
                    >
                      {watchId !== null ? 'Detener' : 'Limpiar'}
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                    {nearbyStops.length > 0 ? (
                      nearbyStops.map((stop, index) => (
                        <div key={stop.id} className="bg-slate-700/40 p-4 rounded-xl border border-slate-600/50 hover:border-indigo-500/40 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2">
                              <span className="flex items-center justify-center bg-slate-800 text-slate-400 w-5 h-5 rounded-full text-[10px] font-bold border border-slate-600 shrink-0 mt-0.5">{index + 1}</span>
                              <div>
                                <strong className="text-sm text-slate-100 leading-tight group-hover:text-indigo-300 transition-colors">{stop.nombre}</strong>
                                <button 
                                  onClick={() => drawWalkingPath(stop)}
                                  className={`block text-[11px] mt-1 hover:underline ${selectedWalkingStop?.id === stop.id ? 'text-emerald-400 font-bold' : 'text-indigo-400'}`}
                                >
                                  {selectedWalkingStop?.id === stop.id ? 'Ocultar ruta a pie' : '🗺️ Ver ruta a pie'}
                                </button>
                              </div>
                            </div>
                            <span className="text-xs text-slate-300 font-medium bg-slate-800 px-2 py-1 rounded-md shrink-0 border border-slate-700/50">
                              {stop.distance < 1000 ? `${Math.round(stop.distance)} m` : `${(stop.distance / 1000).toFixed(1)} km`}
                            </span>
                          </div>
                          
                          <div className="mt-3 pl-7 space-y-2">
                            {stop.routes.map((r: any) => (
                              <div key={r.id} className="flex items-center justify-between bg-slate-800/80 rounded-lg p-2 border border-slate-700">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedRoute(r); }}
                                  className="text-[11px] font-bold px-2 py-1 rounded-md text-white cursor-pointer hover:opacity-80 transition-all shadow-sm flex-1 text-left"
                                  style={{ backgroundColor: r.color_hex || '#3b82f6' }}
                                >
                                  🚌 {r.nombre}
                                </button>
                                
                                {/* Botones de Alarma y Simulación */}
                                <div className="flex gap-1 ml-2 items-center">
                                  <button 
                                    onClick={() => scheduleNotification(stop.nombre, r.nombre, false)}
                                    title="Notificar cuando el bus esté cerca"
                                    className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-amber-400 transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                  </button>
                                  <button 
                                    onClick={() => scheduleNotification(stop.nombre, r.nombre, true, r)}
                                    title="Simular llegada del bus (Demo)"
                                    disabled={demoActive}
                                    className={`p-1.5 rounded-md border transition-colors text-[10px] font-bold ${demoActive ? 'bg-slate-700 text-slate-500 border-slate-600 cursor-not-allowed' : 'bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border-indigo-500/30'}`}
                                  >
                                    Demo
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                        <p className="text-sm text-slate-400">No encontramos paraderos en tu área.</p>
                      </div>
                    )}
                  </div>

                  {/* Contador de simulación */}
                  {demoActive && demoCountdown !== null && (
                    <div className="mt-3 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 p-3 rounded-xl border border-indigo-500/40 animate-pulse-slow">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center">
                            <span className="text-lg font-black text-indigo-300">{demoCountdown}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-indigo-200">🚌 Simulando bus en ruta</p>
                          <p className="text-[10px] text-indigo-300/70 mt-0.5">{demoRouteName} → {demoStopName}</p>
                        </div>
                        <button onClick={stopSimulation} className="text-[10px] text-rose-400 hover:text-rose-300 underline">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lista de rutas */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 shadow-lg flex flex-col" style={{ maxHeight: '400px' }}>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-200 mb-3 flex items-center justify-between">
                  Directorio de Rutas
                  <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full font-medium">{filteredRoutes.length} resultados</span>
                </h2>
                
                {/* Buscador Destino */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="¿A dónde vas hoy? (Ej: Centro, Calle 100)"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 rounded-xl leading-5 bg-slate-900/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
                {filteredRoutes.map(route => (
                  <div 
                    key={route.id}
                    onClick={() => setSelectedRoute(route)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      selectedRoute?.id === route.id 
                        ? 'bg-indigo-900/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50' 
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ backgroundColor: (route as any).color_hex || '#3b82f6' }}></div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-sm ${selectedRoute?.id === route.id ? 'text-indigo-200' : 'text-slate-200'}`}>{route.nombre}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{(route as any).descripcion || 'Sin descripción'}</p>
                        {selectedRoute?.id === route.id && routeDuration !== null && (
                          <div className="mt-2 inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-md border border-indigo-500/30">
                            ⏱️ Tiempo estimado total: {routeDuration} min
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-emerald-400 font-bold block">${Number((route as any).tarifa || 0).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{getRouteNodes(route).length} paradas</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredRoutes.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-4">No se encontraron rutas para tu búsqueda.</p>
                )}
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden relative shadow-xl" style={{ height: '800px' }}>
            {isMapLoading && (
              <div className="absolute inset-0 bg-slate-900/70 z-[1000] flex items-center justify-center backdrop-blur-md">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                  <span className="text-white font-medium text-sm tracking-wide">Trazando recorrido...</span>
                </div>
              </div>
            )}
            <MapContainer
              center={mapCenter}
              zoom={14}
              style={{ height: '100%', width: '100%', zIndex: 10 }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; CartoDB'
              />
              <MapUpdater center={mapCenter} zoom={userLocation ? 15 : 14} />
              <MapEventsHandler onMapClick={handleMapClick} />

              {/* Dibujar la ruta de buses */}
              {polylinePositions.length > 1 && (
                <Polyline
                  positions={polylinePositions}
                  color={(selectedRoute as any)?.color_hex || '#3b82f6'}
                  weight={6}
                  opacity={0.85}
                />
              )}

              {/* Dibujar la ruta a pie (Walking Route) */}
              {walkingPositions.length > 1 && (
                <Polyline
                  positions={walkingPositions}
                  color="#10b981"
                  weight={4}
                  opacity={0.9}
                  dashArray="5, 10"
                  lineCap="round"
                />
              )}
              
              {/* Markers de paradas de la ruta seleccionada */}
              {selectedRoute && getRouteNodes(selectedRoute).map((node: any, idx: number) => (
                node.busStop?.latitud && (
                  <Marker key={node.id || idx} position={[Number(node.busStop.latitud), Number(node.busStop.longitud)]}>
                    <Popup className="custom-popup">
                      <div className="text-center p-1">
                        <strong className="text-slate-800 block text-sm mb-1">{node.busStop.nombre}</strong>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium border border-slate-200">
                          Parada #{idx + 1}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}

              {/* Bus simulado moviéndose */}
              {simulatedBusPosition && (
                <Marker 
                  position={simulatedBusPosition}
                  icon={busIcon}
                >
                  <Popup>
                    <div className="text-center text-sm font-bold text-orange-600">
                      🚌 Bus simulado - {demoRouteName}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Marker de ubicación actual del usuario */}
              {userLocation && (
                <CircleMarker 
                  center={[userLocation.lat, userLocation.lng]} 
                  radius={9} 
                  pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#3b82f6', fillOpacity: 0.9 }}
                >
                  <Popup>
                    <div className="text-center text-sm font-bold text-indigo-600">
                      Tu ubicación en vivo
                    </div>
                  </Popup>
                </CircleMarker>
              )}
              
              {/* Círculo de pulsación para el GPS */}
              {userLocation && (
                <CircleMarker 
                  center={[userLocation.lat, userLocation.lng]} 
                  radius={25} 
                  pathOptions={{ color: 'transparent', fillColor: '#3b82f6', fillOpacity: 0.15, className: 'pulse-animation' }}
                />
              )}
            </MapContainer>
            
            <style>{`
              .leaflet-container {
                font-family: inherit;
              }
              .custom-popup .leaflet-popup-content-wrapper {
                border-radius: 12px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
              }
              .custom-popup .leaflet-popup-tip {
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
              }
              .pulse-animation {
                animation: pulse 2s infinite;
              }
              @keyframes pulse {
                0% { stroke-width: 0; opacity: 0.5; }
                100% { stroke-width: 20px; opacity: 0; }
              }
              .simulated-bus-icon {
                background: none !important;
                border: none !important;
              }
              .bus-marker-sim {
                font-size: 28px;
                filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
                animation: busFloat 1s ease-in-out infinite alternate;
              }
              @keyframes busFloat {
                0% { transform: translateY(0px); }
                100% { transform: translateY(-4px); }
              }
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(30, 41, 59, 0.5);
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(71, 85, 105, 0.8);
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(100, 116, 139, 1);
              }
            `}</style>
          </div>
        </div>
      </div>

      {/* Modal de Alerta de Bus */}
      {demoAlert && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-indigo-500/50 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform animate-bounce-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
              <div className="text-5xl mb-3">🚌</div>
              <h3 className="text-xl font-bold text-white">{demoAlert.title}</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-slate-300 mb-6">{demoAlert.message}</p>
              <Button 
                onClick={stopSimulation}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/30"
              >
                Aceptar y Finalizar
              </Button>
            </div>
          </div>
          <style>{`
            .animate-bounce-in {
              animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes bounceIn {
              0% { transform: scale(0.8); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default CitizenRoutes;
