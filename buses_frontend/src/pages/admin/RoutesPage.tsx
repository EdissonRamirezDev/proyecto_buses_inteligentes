import React, { useEffect, useState } from 'react';
import { getRoutes, createRoute, deleteRoute } from '../../services/routesService';
import { getBusStops } from '../../services/busStopsService';
import { createNode, deleteNode, updateNode } from '../../services/nodesService';
import type { Route } from '../../types/route.types';
import type { BusStop } from '../../types/busStop.types';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 1000); // meters
};

const RoutesPage = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', tarifa: 0, color_hex: '#3b82f6' });
  
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const selectedRoute = routes.find(r => r.id === selectedRouteId);

  const fetchData = async () => {
    try {
      const [routesData, stopsData] = await Promise.all([getRoutes(), getBusStops()]);
      setRoutes(routesData);
      setBusStops(stopsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalTime = selectedRoute?.nodes?.reduce((acc, n) => acc + n.tiempo_estimado, 0) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRoute(formData);
      setIsCreating(false);
      setFormData({ nombre: '', descripcion: '', tarifa: 0, color_hex: '#3b82f6' });
      fetchData();
    } catch (error) {
      console.error('Error creating route:', error);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (window.confirm('¿Eliminar esta ruta y todos sus paraderos asociados?')) {
      try {
        await deleteRoute(routeId);
        if (selectedRouteId === routeId) setSelectedRouteId(null);
        fetchData();
      } catch (error) {
        console.error('Error deleting route:', error);
      }
    }
  };

  const handleMapMarkerClick = async (busStop: BusStop) => {
    if (!selectedRouteId || !selectedRoute) return;

    // Check if stop is already in route
    if (selectedRoute.nodes?.some(n => n.busStop?.id === busStop.id)) {
      alert('El paradero ya es parte de la ruta');
      return;
    }

    const currentNodes = selectedRoute.nodes || [];
    const orden = currentNodes.length + 1;
    let distancia = 0;
    let tiempo = 2; // Default 2 mins

    if (currentNodes.length > 0) {
      const lastNode = currentNodes[currentNodes.length - 1];
      if (lastNode.busStop) {
        distancia = calculateDistance(
          Number(lastNode.busStop.latitud), Number(lastNode.busStop.longitud),
          Number(busStop.latitud), Number(busStop.longitud)
        );
        // Estimate time: assume 20km/h average speed in city = 333 m/min
        tiempo = Math.max(1, Math.round(distancia / 333));
      }
    }

    try {
      await createNode({
        routeId: selectedRouteId,
        busStopId: busStop.id,
        orden: orden,
        distancia_anterior: distancia,
        tiempo_estimado: tiempo
      });
      fetchData();
    } catch (error) {
      console.error('Error adding node:', error);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (window.confirm('¿Remover este paradero de la ruta?')) {
      try {
        await deleteNode(nodeId);
        fetchData();
      } catch (error) {
        console.error('Error removing node:', error);
      }
    }
  };

  const handleSwapOrder = async (nodeIndex: number, direction: 'up' | 'down') => {
    if (!selectedRoute || !selectedRoute.nodes) return;
    const nodes = [...selectedRoute.nodes];
    const swapIndex = direction === 'up' ? nodeIndex - 1 : nodeIndex + 1;
    
    if (swapIndex < 0 || swapIndex >= nodes.length) return;

    const nodeA = nodes[nodeIndex];
    const nodeB = nodes[swapIndex];
    const orderA = nodeA.orden;
    const orderB = nodeB.orden;

    try {
      // Optimizacion: Para no complicar el backend con un endpoint swap,
      // actualizamos ambos nodos por separado.
      await updateNode(nodeA.id, { orden: orderB });
      await updateNode(nodeB.id, { orden: orderA });
      fetchData();
    } catch (error) {
      console.error('Error reordering nodes:', error);
    }
  };

  // OSRM Map Routing
  const [osrmPositions, setOsrmPositions] = useState<[number, number][]>([]);
  const [isMapLoading, setIsMapLoading] = useState(false);

  useEffect(() => {
    const fetchOSRM = async () => {
      const nodes = selectedRoute?.nodes?.filter(n => n.busStop) || [];
      if (nodes.length < 2) {
        setOsrmPositions([]);
        return;
      }
      setIsMapLoading(true);
      try {
        const coordinatesString = nodes.map(n => `${Number(n.busStop!.longitud)},${Number(n.busStop!.latitud)}`).join(';');
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

    fetchOSRM();
  }, [selectedRoute?.nodes]);

  // Fallback to straight lines if OSRM fails or has < 2 nodes
  const polylinePositions: [number, number][] = osrmPositions.length > 0 
    ? osrmPositions 
    : (selectedRoute?.nodes?.filter(n => n.busStop)?.map(n => [Number(n.busStop!.latitud), Number(n.busStop!.longitud)]) || []);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-300 hover:text-white">
            ← Volver
          </Button>
          <h1 className="text-3xl font-bold text-white">Gestión de Rutas UX+</h1>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="bg-blue-600 hover:bg-blue-700">
          {isCreating ? 'Cancelar' : 'Nueva Ruta'}
        </Button>
      </div>

      {isCreating && (
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl mb-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Registrar Nueva Ruta (Color Personalizado)</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" placeholder="Nombre" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="bg-slate-700 border-slate-600 text-white rounded-lg p-3" />
            <input type="number" placeholder="Tarifa" min="0" required value={formData.tarifa} onChange={(e) => setFormData({ ...formData, tarifa: Number(e.target.value) })} className="bg-slate-700 border-slate-600 text-white rounded-lg p-3" />
            <input type="text" placeholder="Descripción" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="bg-slate-700 border-slate-600 text-white rounded-lg p-3" />
            <div className="flex items-center gap-2 bg-slate-700 p-3 rounded-lg border-slate-600">
               <label className="text-sm font-medium">Color</label>
               <input type="color" value={formData.color_hex} onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })} className="bg-transparent border-0 h-8 w-full cursor-pointer" />
            </div>
            <Button type="submit" className="md:col-span-4 bg-green-600 hover:bg-green-700 mt-2">Crear Ruta</Button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Route List */}
        <div className="lg:col-span-4 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 bg-slate-700/50 border-b border-slate-700 font-bold text-slate-300 uppercase text-xs tracking-wider">Listado de Rutas</div>
          <div className="divide-y divide-slate-700 overflow-y-auto max-h-[600px]">
            {routes.map((route) => (
              <div key={route.id} onClick={() => setSelectedRouteId(route.id)} 
                   className={`p-4 cursor-pointer transition-all hover:bg-slate-700/80 ${selectedRouteId === route.id ? 'bg-slate-700 border-l-4' : ''}`}
                   style={selectedRouteId === route.id ? { borderColor: route.color_hex || '#3b82f6' } : {}}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color_hex || '#3b82f6' }}></div>
                    <div>
                      <div className="text-lg font-bold text-white">{route.codigo}</div>
                      <div className="text-sm text-slate-400">{route.nombre}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-blue-400 font-mono">${route.tarifa}</div>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteRoute(route.id); }} className="text-xs text-red-500 hover:text-red-400 font-bold p-1">Eliminar</button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 flex justify-between ml-5">
                  <span>{route.nodes?.length || 0} Paraderos</span>
                  {route.nodes && route.nodes.length < 3 && <span className="text-amber-500 font-bold">Incompleta (Min 3)</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Node Management & Map */}
        <div className="lg:col-span-8 space-y-6">
          {selectedRoute ? (
            <>
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedRoute.color_hex || '#3b82f6' }}></div>
                      Secuencia: {selectedRoute.nombre}
                    </h2>
                    <p className="text-slate-400 text-sm">Tiempo total estimado: <span className="text-green-400 font-bold">{totalTime} min</span></p>
                    <p className="text-amber-400 text-xs mt-1 animate-pulse">
                      💡 Haz clic en los paraderos grises del mapa para agregarlos automáticamente a la ruta.
                    </p>
                  </div>
                </div>

                {/* Interactive Map */}
                <div className="h-[400px] rounded-xl overflow-hidden border border-slate-700 relative">
                  {isMapLoading && (
                    <div className="absolute inset-0 bg-slate-900/50 z-[1000] flex items-center justify-center backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                        <span className="text-white font-bold text-sm">Calculando trazado OSRM...</span>
                      </div>
                    </div>
                  )}
                  <MapContainer center={[4.6097, -74.0817]} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    {/* Render All Bus Stops (Clickable to add) */}
                    {busStops.map((stop) => {
                      const isSelected = selectedRoute.nodes?.some(n => n.busStop?.id === stop.id);
                      const iconUrl = isSelected ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png' 
                                                 : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png';
                      const customIcon = new L.Icon({
                        iconUrl: iconUrl,
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                      });

                      return (
                        <Marker 
                          key={stop.id} 
                          position={[Number(stop.latitud), Number(stop.longitud)]}
                          icon={customIcon}
                          eventHandlers={{ click: () => handleMapMarkerClick(stop) }}
                        >
                          <Popup className="dark-popup">
                            <strong className="text-slate-900">{stop.nombre}</strong><br/>
                            {isSelected ? <span className="text-green-600 font-bold">✓ En Ruta</span> : <span className="text-blue-600">Clic para agregar</span>}
                          </Popup>
                        </Marker>
                      );
                    })}

                    {polylinePositions.length > 1 && <Polyline positions={polylinePositions} color={selectedRoute.color_hex || "#3b82f6"} weight={5} opacity={0.8} />}
                  </MapContainer>
                </div>

                {/* Node Sequence List with Up/Down controls */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 max-h-[300px] overflow-y-auto space-y-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Orden de Recorrido</h3>
                  {selectedRoute.nodes && selectedRoute.nodes.length > 0 ? (
                    selectedRoute.nodes.map((node, index) => (
                      <div key={node.id} className="bg-slate-800 p-3 rounded-lg border border-slate-600 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <span className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg" style={{ backgroundColor: selectedRoute.color_hex || '#3b82f6' }}>
                            {node.orden}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-white">{node.busStop?.nombre}</div>
                            <div className="text-xs text-slate-400">Distancia: {node.distancia_anterior}m • Tiempo: {node.tiempo_estimado} min</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex flex-col">
                            <button onClick={() => handleSwapOrder(index, 'up')} disabled={index === 0} className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-2">
                              ▲
                            </button>
                            <button onClick={() => handleSwapOrder(index, 'down')} disabled={index === selectedRoute.nodes!.length - 1} className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-2">
                              ▼
                            </button>
                          </div>
                          <button onClick={() => handleDeleteNode(node.id)} className="text-red-400 hover:text-red-300 ml-2 p-2 bg-red-400/10 rounded">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-500 py-6">
                      Ruta vacía. Haz clic en los paraderos del mapa para agregarlos.
                    </div>
                  )}
                </div>

              </div>
            </>
          ) : (
            <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 border-dashed text-center text-slate-500 flex flex-col items-center justify-center h-[500px]">
               <svg className="w-20 h-20 mx-auto mb-6 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
               </svg>
               <h3 className="text-2xl font-bold text-slate-400 mb-2">Ninguna ruta seleccionada</h3>
               <p className="text-lg">Selecciona o crea una ruta para visualizar su mapa interactivo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutesPage;
