import { useEffect, useState } from 'react';
import { getRoutes } from '../../services/routesService';
import type { Route } from '../../types/route.types';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CitizenRoutes = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [osrmPositions, setOsrmPositions] = useState<[number, number][]>([]);
  const [isMapLoading, setIsMapLoading] = useState(false);

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
  }, []);

  const getRouteNodes = (route: Route) => {
    const nodes = (route as any).nodes || [];
    return nodes.sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0));
  };

  const getPolylinePositions = (route: Route): [number, number][] => {
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
          // Add via_points for the segment AFTER this stop (before the next stop)
          if (node.via_points && node.via_points.length > 0 && i < nodes.length - 1) {
            node.via_points.forEach((vp: [number, number]) => {
              coords.push(`${vp[1]},${vp[0]}`); // vp is [lat, lon], OSRM needs lon,lat
            });
          }
        }
        const coordinatesString = coords.join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes.length > 0) {
          // OSRM returns [lon, lat], Leaflet needs [lat, lon]
          const mappedPositions = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          setOsrmPositions(mappedPositions);
        } else {
          setOsrmPositions([]);
        }
      } catch (error) {
        console.error('Error fetching OSRM:', error);
        setOsrmPositions([]);
      } finally {
        setIsMapLoading(false);
      }
    };

    if (selectedRoute) {
      fetchOSRM();
    } else {
      setOsrmPositions([]);
    }
  }, [selectedRoute]);

  const polylinePositions: [number, number][] = osrmPositions.length > 0 
    ? osrmPositions 
    : (selectedRoute ? getPolylinePositions(selectedRoute) : []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Rutas Disponibles</h1>
            <p className="text-blue-200 text-sm">Consulta las rutas de transporte público activas</p>
          </div>
          <Button onClick={() => navigate('/citizen/dashboard')} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm">
            ← Mi Panel
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de rutas */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-bold text-slate-300 mb-2">{routes.length} rutas activas</h2>
            {routes.map(route => (
              <div 
                key={route.id}
                onClick={() => setSelectedRoute(route)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedRoute?.id === route.id 
                    ? 'bg-indigo-900/50 border-indigo-500 shadow-lg shadow-indigo-500/20' 
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: (route as any).color_hex || '#3b82f6' }}></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{route.nombre}</h3>
                    <p className="text-xs text-slate-400">{(route as any).descripcion || 'Sin descripción'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold text-lg">${Number((route as any).tarifa || 0).toLocaleString()}</span>
                    <p className="text-xs text-slate-500">{getRouteNodes(route).length} paradas</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mapa */}
          <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden relative" style={{ height: '500px' }}>
            {selectedRoute ? (
              <>
                {isMapLoading && (
                  <div className="absolute inset-0 bg-slate-900/60 z-[1000] flex items-center justify-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
                      <span className="text-white font-bold text-sm">Calculando recorrido por avenidas...</span>
                    </div>
                  </div>
                )}
                <MapContainer
                  center={getPolylinePositions(selectedRoute)[0] || [4.6097, -74.0817]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CartoDB'
                  />
                  {/* Dibujar la ruta con calles reales */}
                  {polylinePositions.length > 1 && (
                    <Polyline
                      positions={polylinePositions}
                      color={(selectedRoute as any).color_hex || '#3b82f6'}
                      weight={5}
                      opacity={0.8}
                    />
                  )}
                  {/* Markers de paradas */}
                  {getRouteNodes(selectedRoute).map((node: any, idx: number) => (
                    node.busStop?.latitud && (
                      <Marker key={node.id || idx} position={[Number(node.busStop.latitud), Number(node.busStop.longitud)]}>
                        <Popup>
                          <div className="text-center text-slate-850">
                            <strong>{node.busStop.nombre}</strong><br/>
                            <span className="text-xs text-gray-500">Parada #{idx + 1} — {node.busStop.tipo}</span>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}
                </MapContainer>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Selecciona una ruta para ver su recorrido en el mapa
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenRoutes;
