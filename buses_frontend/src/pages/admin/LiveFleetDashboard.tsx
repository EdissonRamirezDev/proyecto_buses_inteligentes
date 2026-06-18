import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../../components/common/AdminHeader';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLiveFleetStatus, simulateTraffic, resetSimulation } from '../../services/fleetService';
import type { LiveFleetStatusResponse, LiveFleetBus } from '../../services/fleetService';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// A component to auto-fit bounds
const CenterMap = ({ buses }: { buses: LiveFleetBus[] }) => {
  const map = useMap();
  useEffect(() => {
    if (buses.length > 0) {
      const bounds = L.latLngBounds(buses.map(b => [b.latitude, b.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, []); 
  return null;
};

const LiveFleetDashboard = () => {
  const navigate = useNavigate();
  const [fleetData, setFleetData] = useState<LiveFleetStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [simulating, setSimulating] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  const mapRef = useRef<L.Map | null>(null);

  const fetchFleetData = async () => {
    try {
      const data = await getLiveFleetStatus();
      setFleetData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching fleet status', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateTraffic = async () => {
    setSimulating(true);
    try {
      await simulateTraffic();
      await fetchFleetData();
    } catch (error) {
      console.error('Error simulating traffic', error);
    } finally {
      setSimulating(false);
    }
  };

  const handleResetSimulation = async () => {
    setResetting(true);
    try {
      await resetSimulation();
      await fetchFleetData();
    } catch (error) {
      console.error('Error resetting simulation', error);
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
    const interval = setInterval(fetchFleetData, 30000); // 30 seconds polling
    return () => clearInterval(interval);
  }, []);

  const handleZoomToBus = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16, { animate: true });
    }
  };

  const getMarkerIcon = (bus: LiveFleetBus) => {
    const isIncident = bus.estado === 'incidente';
    const isFull = bus.alerta_ocupacion;
    
    let markerColor = 'bg-emerald-500'; 
    let borderColor = 'border-emerald-700';
    let ringColor = 'ring-emerald-400';
    let shadowColor = 'rgba(16, 185, 129, 0.6)';
    
    if (isIncident) {
      markerColor = 'bg-rose-600';
      borderColor = 'border-rose-800';
      ringColor = 'ring-rose-500';
      shadowColor = 'rgba(225, 29, 72, 0.8)';
    } else if (isFull) {
      markerColor = 'bg-amber-500';
      borderColor = 'border-amber-700';
      ringColor = 'ring-amber-400';
      shadowColor = 'rgba(245, 158, 11, 0.6)';
    }

    const html = `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${markerColor} ${borderColor} shadow-lg" style="box-shadow: 0 0 10px ${shadowColor}">
        <span class="text-white text-xs font-bold">🚌</span>
        <div class="absolute -top-1 -right-1 flex h-3 w-3">
          ${(isIncident || isFull) ? `<span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${ringColor}"></span>` : ''}
          <span class="relative inline-flex rounded-full h-3 w-3 ${isIncident ? 'bg-rose-500' : isFull ? 'bg-amber-500' : 'bg-emerald-500'} border border-white"></span>
        </div>
        <div class="absolute -bottom-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-[9px] font-bold px-1 rounded shadow border border-gray-300 dark:border-gray-600 whitespace-nowrap">
          ${bus.placa}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-fleet-marker',
      html,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  const incidentsList = fleetData?.buses.filter(b => b.estado === 'incidente') || [];
  const fullBusesList = fleetData?.buses.filter(b => b.alerta_ocupacion) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 w-full py-4 space-y-4 flex-1 flex flex-col">
        <AdminHeader
          title="Panel de Control en Vivo"
          subtitle="Monitoreo de la flota en tiempo real y detección de incidentes"
          showBack
          onBack={() => navigate('/dashboard')}
        />

        <div className="flex flex-wrap justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 gap-4">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Buses Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{fleetData?.buses.length || 0}</p>
            </div>
            <div className="border-l border-gray-200 dark:border-gray-700 pl-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Pasajeros en Tránsito</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{fleetData?.totalPassengers || 0}</p>
            </div>
            <div className="border-l border-gray-200 dark:border-gray-700 pl-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Incidentes Activos</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{incidentsList.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateTraffic}
              disabled={simulating || resetting}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-indigo-500/25 flex items-center gap-1.5 disabled:opacity-50"
            >
              {simulating ? 'Simulando...' : '⚡ Simular Tráfico'}
            </button>
            <button
              onClick={handleResetSimulation}
              disabled={simulating || resetting}
              className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {resetting ? 'Restableciendo...' : '♻️ Restablecer'}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Actualizado: {lastUpdate.toLocaleTimeString()}
            </span>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              En Vivo
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-[500px]">
          {/* Map Column */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative min-h-[400px]">
            {!loading && fleetData ? (
              <MapContainer 
                center={[4.6097, -74.0817]} 
                zoom={12} 
                style={{ height: '100%', width: '100%', zIndex: 10 }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">Carto</a>'
                />
                <CenterMap buses={fleetData.buses} />
                
                {fleetData.buses.map(bus => (
                  <Marker 
                    key={bus.id} 
                    position={[bus.latitude, bus.longitude]}
                    icon={getMarkerIcon(bus)}
                  >
                    <Popup>
                      <div className="p-1 min-w-[150px]">
                        <h3 className="font-bold text-lg border-b pb-1 mb-2">Bus {bus.placa}</h3>
                        <p className="text-sm mb-1"><strong>Ocupación:</strong> {bus.ocupacion} / {bus.capacidad}</p>
                        {bus.estado === 'incidente' && (
                          <div className="mt-2 bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded text-xs">
                            <strong>Incidentes:</strong>
                            <ul className="list-disc pl-4 mt-1">
                              {bus.incidentes.map((inc, idx) => (
                                <li key={idx}>{inc.type} ({inc.severity})</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400">Cargando mapa en vivo...</span>
              </div>
            )}
          </div>

          {/* Sidebar Alerts Column */}
          <div className="w-full md:w-80 flex flex-col gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
                ⚠️ Incidentes Activos
              </h3>
              <div className="mt-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {incidentsList.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center italic mt-4">Sin incidentes reportados</p>
                ) : (
                  incidentsList.map(bus => (
                    <div key={bus.id} className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors" onClick={() => handleZoomToBus(bus.latitude, bus.longitude)}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-rose-700 dark:text-rose-400 text-sm">Bus {bus.placa}</span>
                        <span className="text-xs bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded">Prioridad</span>
                      </div>
                      <div className="text-xs text-rose-600 dark:text-rose-300">
                        {bus.incidentes[0]?.type}: {bus.incidentes[0]?.description}
                      </div>
                      <div className="mt-2 text-[10px] text-rose-500 dark:text-rose-400 text-right">Click para ver en mapa</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex-1 flex flex-col max-h-[300px]">
              <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
                🚍 Alertas de Ocupación
              </h3>
              <div className="mt-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {fullBusesList.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center italic mt-4">Flota operando con capacidad normal</p>
                ) : (
                  fullBusesList.map(bus => (
                    <div key={bus.id} className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors" onClick={() => handleZoomToBus(bus.latitude, bus.longitude)}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">Bus {bus.placa}</span>
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-300 flex justify-between">
                        <span>Ocupación Máxima:</span>
                        <span className="font-bold">{bus.ocupacion} / {bus.capacidad} pax</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFleetDashboard;
