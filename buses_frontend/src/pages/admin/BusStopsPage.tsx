import React, { useEffect, useState } from 'react';
import { getBusStops, createBusStop, deleteBusStop } from '../../services/busStopsService';
import type { BusStop } from '../../types/busStop.types';
import Button from '../../components/common/Button';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

// Fix leaflet icon issue in react
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, onLocationSelect }: { position: L.LatLng | null, onLocationSelect: (pos: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
};

const BusStopsPage = () => {
  const navigate = useNavigate();
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', tipo: 'regular', sentido: 'N/A' });
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const fetchNeighborhood = async (lat: number, lng: number) => {
    setIsLocating(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      const barrio = data.address?.neighbourhood || data.address?.suburb || data.address?.village || data.address?.city_district;
      if (barrio) {
        setFormData(prev => ({ ...prev, nombre: `Paradero ${barrio}` }));
      }
    } catch (error) {
      console.error('Error fetching neighborhood:', error);
    } finally {
      setIsLocating(false);
    }
  };

  const handleLocationSelect = (latlng: L.LatLng) => {
    setPosition(latlng);
    fetchNeighborhood(latlng.lat, latlng.lng);
  };

  const fetchBusStops = async () => {
    try {
      const data = await getBusStops();
      setBusStops(data);
    } catch (error) {
      console.error('Error fetching bus stops:', error);
    }
  };

  useEffect(() => {
    fetchBusStops();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) {
      alert('Por favor selecciona una ubicación en el mapa.');
      return;
    }
    try {
      await createBusStop({
        nombre: formData.nombre,
        tipo: formData.tipo,
        sentido: formData.sentido,
        latitud: position.lat,
        longitud: position.lng,
      });
      setIsCreating(false);
      setFormData({ nombre: '', tipo: 'regular', sentido: 'N/A' });
      setPosition(null);
      fetchBusStops();
    } catch (error) {
      console.error('Error creating bus stop:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este paradero?')) {
      try {
        await deleteBusStop(id);
        fetchBusStops();
      } catch (error) {
        console.error('Error deleting bus stop:', error);
      }
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-300 hover:text-white">
            ← Volver
          </Button>
          <h1 className="text-3xl font-bold text-white">Gestión de Paraderos</h1>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="bg-blue-600">
          {isCreating ? 'Cancelar' : 'Nuevo Paradero'}
        </Button>
      </div>

      {isCreating && (
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl mb-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Registrar Nuevo Paradero (HU-ENTR-2-010)</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Nombre del Paradero</label>
                <input
                  type="text" required value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="mt-1 block w-full rounded-lg bg-slate-700 border-slate-600 text-white p-3 border"
                  placeholder="Ej: Estación Central"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Tipo de Paradero</label>
                <select
                  value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="mt-1 block w-full rounded-lg bg-slate-700 border-slate-600 text-white p-3 border"
                >
                  <option value="regular">Regular</option>
                  <option value="principal">Principal</option>
                  <option value="terminal">Terminal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Sentido</label>
                <select
                  value={formData.sentido} onChange={(e) => setFormData({ ...formData, sentido: e.target.value })}
                  className="mt-1 block w-full rounded-lg bg-slate-700 border-slate-600 text-white p-3 border"
                >
                  <option value="N/A">N/A (Bidireccional o Estación)</option>
                  <option value="Norte-Sur">Norte a Sur</option>
                  <option value="Sur-Norte">Sur a Norte</option>
                  <option value="Este-Oeste">Este a Oeste</option>
                  <option value="Oeste-Este">Oeste a Este</option>
                </select>
              </div>
              {position && (
                <div className="p-3 bg-blue-900/30 border border-blue-800 rounded-lg text-sm text-blue-300">
                  <p><strong>Ubicación capturada:</strong></p>
                  <p>Lat: {position.lat.toFixed(6)} | Lng: {position.lng.toFixed(6)}</p>
                  {isLocating && <p className="text-amber-400 mt-1 animate-pulse">Buscando barrio automáticamente...</p>}
                </div>
              )}
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Guardar Paradero</Button>
            </div>
            <div className="h-64 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
              <MapContainer center={[4.6097, -74.0817]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={position} onLocationSelect={handleLocationSelect} />
              </MapContainer>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-800 shadow-xl rounded-xl overflow-hidden border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Código</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo / Sentido</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Coordenadas</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {busStops.map((stop) => (
              <tr key={stop.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-blue-400">{stop.codigo}</td>
                <td className="px-6 py-4 text-sm text-white font-medium">{stop.nombre}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      stop.tipo === 'terminal' ? 'bg-purple-900 text-purple-300' : 
                      stop.tipo === 'principal' ? 'bg-amber-900 text-amber-300' : 'bg-slate-600 text-slate-300'
                    }`}>
                      {stop.tipo}
                    </span>
                    {stop.sentido && stop.sentido !== 'N/A' && (
                      <span className="text-[10px] text-slate-400 border border-slate-600 px-2 py-0.5 rounded">
                        {stop.sentido}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400 font-mono">{Number(stop.latitud).toFixed(4)}, {Number(stop.longitud).toFixed(4)}</td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <button onClick={() => handleDelete(stop.id)} className="text-red-400 hover:text-red-300">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BusStopsPage;
