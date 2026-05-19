import React, { useEffect, useState } from 'react';
import { getRoutes, createRoute, deleteRoute, updateRoute } from '../../services/routesService';
import { getBusStops } from '../../services/busStopsService';
import { createNode, deleteNode, updateNode } from '../../services/nodesService';
import type { Route } from '../../types/route.types';
import type { BusStop } from '../../types/busStop.types';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMapEvents } from 'react-leaflet';
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

    if (!selectedRoute.inicio_lat) {
      await updateRoute(selectedRouteId, {
        inicio_lat: Number(busStop.latitud),
        inicio_lng: Number(busStop.longitud),
        inicio_nombre: busStop.nombre
      });
      fetchData();
      return;
    }

    if (isSettingEnd) {
      await updateRoute(selectedRouteId, {
        fin_lat: Number(busStop.latitud),
        fin_lng: Number(busStop.longitud),
        fin_nombre: busStop.nombre
      });
      setIsSettingEnd(false);
      fetchData();
      return;
    }

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

  // OSRM Map Routing with via_points support
  const [osrmPositions, setOsrmPositions] = useState<[number, number][]>([]);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [isSettingEnd, setIsSettingEnd] = useState(false);

  // Build the OSRM coordinate string intercalating via_points between stops
  const buildOSRMCoordinates = (route: Route): string => {
    const coords: string[] = [];
    if (route.inicio_lat && route.inicio_lng) {
      coords.push(`${Number(route.inicio_lng)},${Number(route.inicio_lat)}`);
      if (route.inicio_via_points && route.inicio_via_points.length > 0) {
        route.inicio_via_points.forEach((vp: [number, number]) => {
          coords.push(`${vp[1]},${vp[0]}`); // vp is [lat, lon], OSRM needs lon,lat
        });
      }
    }

    const nodes = route.nodes?.filter(n => n.busStop) || [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      coords.push(`${Number(node.busStop!.longitud)},${Number(node.busStop!.latitud)}`);
      // Add via_points for the segment AFTER this stop (before the next stop)
      if (node.via_points && node.via_points.length > 0) {
        node.via_points.forEach((vp: [number, number]) => {
          coords.push(`${vp[1]},${vp[0]}`); // vp is [lat, lon], OSRM needs lon,lat
        });
      }
    }

    if (route.fin_lat && route.fin_lng) {
      coords.push(`${Number(route.fin_lng)},${Number(route.fin_lat)}`);
    }

    return coords.join(';');
  };

  useEffect(() => {
    const fetchOSRM = async () => {
      if (!selectedRoute) return;
      const pointsCount = (selectedRoute.inicio_lat ? 1 : 0) + (selectedRoute.fin_lat ? 1 : 0) + (selectedRoute.nodes?.length || 0);
      if (pointsCount < 2) {
        setOsrmPositions([]);
        return;
      }
      setIsMapLoading(true);
      try {
        const coordinatesString = buildOSRMCoordinates(selectedRoute);
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes.length > 0) {
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
  }, [selectedRoute?.nodes, selectedRoute?.inicio_lat, selectedRoute?.fin_lat]);

  // Insert a new waypoint at a specific index (from dragging a ghost marker)
  const handleInsertWaypoint = async (nodeId: string, index: number, lat: number, lng: number) => {
    if (!selectedRoute?.nodes) return;
    const node = selectedRoute.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const currentViaPoints = node.via_points || [];
    const newViaPoints = [
      ...currentViaPoints.slice(0, index),
      [lat, lng] as [number, number],
      ...currentViaPoints.slice(index)
    ];

    try {
      await updateNode(node.id, { via_points: newViaPoints } as any);
      fetchData();
    } catch (error) {
      console.error('Error inserting waypoint:', error);
    }
  };

  const handleInsertWaypointInicio = async (index: number, lat: number, lng: number) => {
    if (!selectedRoute) return;
    const current = selectedRoute.inicio_via_points || [];
    const newViaPoints = [
      ...current.slice(0, index),
      [lat, lng] as [number, number],
      ...current.slice(index)
    ];
    try {
      await updateRoute(selectedRoute.id, { inicio_via_points: newViaPoints });
      fetchData();
    } catch (e) {}
  };

  // Handle dragging an existing waypoint to a new position
  const handleDragWaypoint = async (nodeId: string, waypointIndex: number, newLat: number, newLng: number) => {
    if (!selectedRoute?.nodes) return;
    const node = selectedRoute.nodes.find(n => n.id === nodeId);
    if (!node || !node.via_points) return;

    const newViaPoints = [...node.via_points];
    newViaPoints[waypointIndex] = [newLat, newLng];

    try {
      await updateNode(node.id, { via_points: newViaPoints } as any);
      fetchData();
    } catch (error) {
      console.error('Error updating waypoint:', error);
    }
  };

  const handleDragWaypointInicio = async (index: number, lat: number, lng: number) => {
    if (!selectedRoute) return;
    const current = [...(selectedRoute.inicio_via_points || [])];
    current[index] = [lat, lng];
    try {
      await updateRoute(selectedRoute.id, { inicio_via_points: current });
      fetchData();
    } catch (e) {}
  };

  // Handle deleting a specific waypoint
  const handleDeleteWaypoint = async (nodeId: string, waypointIndex: number) => {
    if (!selectedRoute?.nodes) return;
    const node = selectedRoute.nodes.find(n => n.id === nodeId);
    if (!node || !node.via_points) return;

    const newViaPoints = node.via_points.filter((_: [number, number], i: number) => i !== waypointIndex);

    try {
      await updateNode(node.id, { via_points: newViaPoints.length > 0 ? newViaPoints : null } as any);
      fetchData();
    } catch (error) {
      console.error('Error deleting waypoint:', error);
    }
  };

  const handleDeleteWaypointInicio = async (index: number) => {
    if (!selectedRoute) return;
    const current = (selectedRoute.inicio_via_points || []).filter((_, i) => i !== index);
    try {
      await updateRoute(selectedRoute.id, { inicio_via_points: current.length > 0 ? current : null } as any);
      fetchData();
    } catch (e) {}
  };

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        if (!selectedRoute) return;
        if (!selectedRoute.inicio_lat) {
           updateRoute(selectedRoute.id, {
             inicio_lat: e.latlng.lat,
             inicio_lng: e.latlng.lng,
             inicio_nombre: 'Origen Geográfico (Mapa)'
           }).then(() => fetchData());
        } else if (isSettingEnd) {
           updateRoute(selectedRoute.id, {
             fin_lat: e.latlng.lat,
             fin_lng: e.latlng.lng,
             fin_nombre: 'Destino Geográfico (Mapa)'
           }).then(() => {
             setIsSettingEnd(false);
             fetchData();
           });
        }
      },
    });
    return null;
  };


  // Waypoint icon
  const waypointIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [20, 33],
    iconAnchor: [10, 33],
    popupAnchor: [1, -28],
    shadowSize: [33, 33],
  });

  // Ghost icon for midpoints
  const ghostIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [16, 26],
    iconAnchor: [8, 26],
    popupAnchor: [1, -22],
    shadowSize: [26, 26],
  });

  const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });

  const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });

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

                {/* Mode Banners */}
                {!selectedRoute.inicio_lat ? (
                  <div className="bg-green-600/20 border border-green-500 rounded-lg px-4 py-3">
                    <span className="text-green-400 text-lg mr-2">📍</span>
                    <span className="text-green-300 text-sm font-semibold">
                      Haz clic en el mapa o en un paradero para establecer el <strong>Origen de la Ruta</strong>.
                    </span>
                  </div>
                ) : isSettingEnd ? (
                  <div className="bg-red-600/20 border border-red-500 rounded-lg px-4 py-3 flex justify-between items-center">
                    <div>
                      <span className="text-red-400 text-lg mr-2">🏁</span>
                      <span className="text-red-300 text-sm font-semibold">
                        Haz clic en el mapa o en un paradero para establecer el <strong>Destino Final</strong>.
                      </span>
                    </div>
                    <Button variant="ghost" onClick={() => setIsSettingEnd(false)} className="text-red-300 hover:text-white px-2 py-1 text-xs">Cancelar</Button>
                  </div>
                ) : null}

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
                    <MapClickHandler />

                    {/* Start/End Markers */}
                    {selectedRoute.inicio_lat && selectedRoute.inicio_lng && (
                      <Marker position={[Number(selectedRoute.inicio_lat), Number(selectedRoute.inicio_lng)]} icon={startIcon}>
                        <Popup><strong className="text-green-600">Origen de Ruta</strong><br/>{selectedRoute.inicio_nombre}</Popup>
                      </Marker>
                    )}
                    {selectedRoute.fin_lat && selectedRoute.fin_lng && (
                      <Marker position={[Number(selectedRoute.fin_lat), Number(selectedRoute.fin_lng)]} icon={endIcon}>
                        <Popup><strong className="text-red-600">Destino de Ruta</strong><br/>{selectedRoute.fin_nombre}</Popup>
                      </Marker>
                    )}
                    
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
                          <Tooltip direction="top" offset={[0, -20]}>
                            <div className="font-bold text-slate-800">{stop.nombre}</div>
                            <div className="text-xs text-slate-500">{stop.sentido !== 'N/A' ? stop.sentido : 'Bidireccional'}</div>
                          </Tooltip>
                          <Popup className="dark-popup">
                            <strong className="text-slate-900">{stop.nombre}</strong><br/>
                            {isSelected ? <span className="text-green-600 font-bold">✓ En Ruta</span> : <span className="text-blue-600">Clic para agregar</span>}
                          </Popup>
                        </Marker>
                      );
                    })}

                    {/* Render draggable Waypoint markers (orange) */}
                    {selectedRoute.inicio_via_points && selectedRoute.inicio_via_points.map((vp: [number, number], vpIdx: number) => {
                      const nextStopName = selectedRoute.nodes && selectedRoute.nodes.length > 0 ? selectedRoute.nodes[0].busStop?.nombre : (selectedRoute.fin_nombre || 'Fin de ruta');
                      return (
                        <Marker
                          key={`inicio-wp-${vpIdx}`}
                          position={[vp[0], vp[1]]}
                          icon={waypointIcon}
                          draggable={true}
                          eventHandlers={{
                            dragend: (e) => {
                              const pos = e.target.getLatLng();
                              handleDragWaypointInicio(vpIdx, pos.lat, pos.lng);
                            },
                          }}
                        >
                          <Popup>
                            <div className="text-center">
                              <strong className="text-orange-600">Desvío Inicial #{vpIdx + 1}</strong><br/>
                              <span className="text-xs font-semibold text-slate-700">Conecta:</span><br/>
                              <span className="text-xs text-gray-600">{selectedRoute.inicio_nombre} ➔ {nextStopName}</span><br/>
                              <button
                                onClick={() => handleDeleteWaypointInicio(vpIdx)}
                                style={{ color: 'red', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px', fontSize: '12px', background: 'none', border: 'none' }}
                              >
                                🗑️ Eliminar desvío
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                    {selectedRoute.nodes?.filter(n => n.busStop).map((node, nodeIndex, nodesArray) => (
                      node.via_points && node.via_points.map((vp: [number, number], vpIdx: number) => {
                        const nextNode = nodesArray[nodeIndex + 1];
                        const nextStopName = nextNode?.busStop?.nombre || 'Fin de ruta';
                        return (
                          <Marker
                            key={`wp-${node.id}-${vpIdx}`}
                            position={[vp[0], vp[1]]}
                            icon={waypointIcon}
                            draggable={true}
                            eventHandlers={{
                              dragend: (e) => {
                                const marker = e.target;
                                const pos = marker.getLatLng();
                                handleDragWaypoint(node.id, vpIdx, pos.lat, pos.lng);
                              },
                            }}
                          >
                            <Popup>
                              <div className="text-center">
                                <strong className="text-orange-600">Desvío #{vpIdx + 1}</strong><br/>
                                <span className="text-xs font-semibold text-slate-700">Conecta:</span><br/>
                                <span className="text-xs text-gray-600">{node.busStop?.nombre} ➔ {nextStopName}</span><br/>
                              <button
                                onClick={() => handleDeleteWaypoint(node.id, vpIdx)}
                                style={{ color: 'red', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px', fontSize: '12px', background: 'none', border: 'none' }}
                              >
                                🗑️ Eliminar desvío
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                        );
                      })
                    ))}

                    {/* Render Ghost Markers (Midpoints) for drag-to-create */}
                    {selectedRoute.inicio_lat && selectedRoute.inicio_lng && (
                      (() => {
                        let endSegmentPoint: [number, number] | null = null;
                        if (selectedRoute.nodes && selectedRoute.nodes.length > 0) {
                          const firstNode = selectedRoute.nodes[0];
                          endSegmentPoint = [Number(firstNode.busStop!.latitud), Number(firstNode.busStop!.longitud)];
                        } else if (selectedRoute.fin_lat && selectedRoute.fin_lng) {
                          endSegmentPoint = [Number(selectedRoute.fin_lat), Number(selectedRoute.fin_lng)];
                        }
                        
                        if (!endSegmentPoint) return null;
                        
                        const points = [
                          [Number(selectedRoute.inicio_lat), Number(selectedRoute.inicio_lng)],
                          ...(selectedRoute.inicio_via_points || []),
                          endSegmentPoint
                        ];

                        return points.map((p, i) => {
                          if (i === points.length - 1) return null;
                          const nextP = points[i + 1];
                          const midLat = (p[0] + nextP[0]) / 2;
                          const midLng = (p[1] + nextP[1]) / 2;

                          return (
                            <Marker
                              key={`ghost-inicio-${i}`}
                              position={[midLat, midLng]}
                              icon={ghostIcon}
                              draggable={true}
                              opacity={0.6}
                              eventHandlers={{
                                dragend: (e) => {
                                  const marker = e.target;
                                  const pos = marker.getLatLng();
                                  handleInsertWaypointInicio(i, pos.lat, pos.lng);
                                }
                              }}
                            >
                              <Tooltip direction="top" offset={[0, -10]}>Arrastra para crear desvío inicial aquí</Tooltip>
                            </Marker>
                          );
                        });
                      })()
                    )}

                    {selectedRoute.nodes?.filter(n => n.busStop).map((node, nodeIndex, nodesArray) => {
                      // We need midpoints between this node and the next point
                      // The next point is either the next node, or the Fin point if this is the last node.
                      const nextNode = nodesArray[nodeIndex + 1];
                      let endSegmentPoint: [number, number] | null = null;
                      
                      if (nextNode && nextNode.busStop) {
                        endSegmentPoint = [Number(nextNode.busStop.latitud), Number(nextNode.busStop.longitud)];
                      } else if (selectedRoute.fin_lat && selectedRoute.fin_lng) {
                        endSegmentPoint = [Number(selectedRoute.fin_lat), Number(selectedRoute.fin_lng)];
                      }

                      if (!endSegmentPoint) return null;
                      
                      const points = [
                        [Number(node.busStop.latitud), Number(node.busStop.longitud)],
                        ...(node.via_points || []),
                        endSegmentPoint
                      ];

                      return points.map((p, i) => {
                        if (i === points.length - 1) return null;
                        const nextP = points[i + 1];
                        const midLat = (p[0] + nextP[0]) / 2;
                        const midLng = (p[1] + nextP[1]) / 2;

                        return (
                          <Marker
                            key={`ghost-${node.id}-${i}`}
                            position={[midLat, midLng]}
                            icon={ghostIcon}
                            draggable={true}
                            opacity={0.6}
                            eventHandlers={{
                              dragend: (e) => {
                                const marker = e.target;
                                const pos = marker.getLatLng();
                                handleInsertWaypoint(node.id, i, pos.lat, pos.lng);
                              }
                            }}
                          >
                            <Tooltip direction="top" offset={[0, -10]}>Arrastra para crear desvío aquí</Tooltip>
                          </Marker>
                        );
                      });
                    })}

                    {polylinePositions.length > 1 && <Polyline key={`${selectedRoute.id}-${selectedRoute.color_hex}`} positions={polylinePositions} color={selectedRoute.color_hex || "#3b82f6"} weight={5} opacity={0.8} />}
                  </MapContainer>
                </div>

                {/* Node Sequence List with Up/Down controls */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 max-h-[300px] overflow-y-auto space-y-2">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Orden de Recorrido</h3>
                    {selectedRoute.inicio_lat && !selectedRoute.fin_lat && (
                      <Button size="sm" onClick={() => setIsSettingEnd(!isSettingEnd)} className={isSettingEnd ? 'bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}>
                        {isSettingEnd ? 'Cancelar' : 'Establecer Fin de Ruta'}
                      </Button>
                    )}
                  </div>
                  
                  {/* Origin */}
                  {selectedRoute.inicio_lat && (
                    <div className="space-y-1">
                      <div className="bg-green-900/20 p-3 rounded-lg border border-green-800/40 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-xl">🟢</span>
                          <div>
                            <div className="text-sm font-bold text-green-400">Origen de Ruta</div>
                            <div className="text-xs text-green-500/70">{selectedRoute.inicio_nombre}</div>
                          </div>
                        </div>
                        <button onClick={() => updateRoute(selectedRoute.id, { inicio_lat: undefined, inicio_lng: undefined }).then(() => fetchData())} className="text-red-400 hover:text-red-300 text-xs font-bold bg-red-400/10 px-2 py-1 rounded">Quitar</button>
                      </div>
                      
                      {/* Show via_points for the initial segment */}
                      {selectedRoute.inicio_via_points && selectedRoute.inicio_via_points.length > 0 && (
                        <div className="ml-10 space-y-1">
                          {selectedRoute.inicio_via_points.map((vp: [number, number], vpIdx: number) => (
                            <div key={`inicio-vp-${vpIdx}`} className="bg-orange-900/20 border border-orange-800/40 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-orange-400">📍</span>
                                <span className="text-orange-300 font-medium">Desvío Inicial #{vpIdx + 1}</span>
                                <span className="text-slate-500">({vp[0].toFixed(5)}, {vp[1].toFixed(5)})</span>
                              </div>
                              <button 
                                onClick={() => handleDeleteWaypointInicio(vpIdx)}
                                className="text-red-400 hover:text-red-300 font-bold"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRoute.nodes && selectedRoute.nodes.length > 0 ? (
                    selectedRoute.nodes.map((node, index) => (
                      <div key={node.id} className="space-y-1">
                        <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 flex items-center justify-between group">
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
                        {/* Show via_points for this node segment */}
                        {node.via_points && node.via_points.length > 0 && (
                          <div className="ml-10 space-y-1">
                            {node.via_points.map((vp: [number, number], vpIdx: number) => (
                              <div key={vpIdx} className="bg-orange-900/20 border border-orange-800/40 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-orange-400">📍</span>
                                  <span className="text-orange-300 font-medium">Desvío #{vpIdx + 1}</span>
                                  <span className="text-slate-500">({vp[0].toFixed(5)}, {vp[1].toFixed(5)})</span>
                                </div>
                                <button 
                                  onClick={() => handleDeleteWaypoint(node.id, vpIdx)}
                                  className="text-red-400 hover:text-red-300 font-bold"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-500 py-6">
                      Ruta vacía. Haz clic en los paraderos del mapa para agregarlos.
                    </div>
                  )}

                  {/* Destination */}
                  {selectedRoute.fin_lat && (
                    <div className="bg-red-900/20 p-3 rounded-lg border border-red-800/40 flex items-center justify-between mt-2">
                      <div className="flex items-center gap-4">
                        <span className="text-xl">🔴</span>
                        <div>
                          <div className="text-sm font-bold text-red-400">Destino de Ruta</div>
                          <div className="text-xs text-red-500/70">{selectedRoute.fin_nombre}</div>
                        </div>
                      </div>
                      <button onClick={() => updateRoute(selectedRoute.id, { fin_lat: undefined, fin_lng: undefined }).then(() => fetchData())} className="text-red-400 hover:text-red-300 text-xs font-bold bg-red-400/10 px-2 py-1 rounded">Quitar</button>
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
