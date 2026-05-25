import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncidents, updateIncident, resolvePhotoPublicUrl, type Incident } from '../../services/incidentsService';
import * as incidentService from '../../services/incidentService';
import { getBuses } from '../../services/busService';
import type { Bus } from '../../types/bus.types';
import type { IncidentType, IncidentSeverity } from '../../types/incident.types';
import Button from '../../components/common/Button';

const KANBAN_STATES = [
  { key: 'ABIERTO', label: '🚨 Pendientes' },
  { key: 'EN_REVISION', label: '👀 En Revisión' },
  { key: 'RESUELTO', label: '✅ Resueltos' },
] as const;

const IncidentsPage = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('MECANICO');
  const [severity, setSeverity] = useState('MEDIO');
  const [description, setDescription] = useState('');
  const [busId, setBusId] = useState('');
  const [buses, setBuses] = useState<Bus[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchIncidents();
    getBuses().then(setBuses).catch(() => setBuses([]));
  }, []);

  const fetchIncidents = async () => {
    try {
      setIncidents(await getIncidents());
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsedBusId = Number(busId);
    if (!parsedBusId) {
      setFormError('Selecciona un bus de la lista.');
      return;
    }
    try {
      const incident = await incidentService.createIncident({
        type: type as IncidentType,
        severity: severity as IncidentSeverity,
        description,
        date: new Date().toISOString(),
        state: 'ABIERTO',
      });
      if (!incident.id) throw new Error('No se recibió el ID del incidente.');
      await incidentService.createBusesIncident({
        latitude: 4.5339,
        longitude: -75.6811,
        reportDate: new Date().toISOString(),
        busId: parsedBusId,
        incidentId: Number(incident.id),
      });
      setIsModalOpen(false);
      setDescription('');
      setBusId('');
      fetchIncidents();
    } catch (error: unknown) {
      const axiosErr = error as { response?: { status?: number; data?: { message?: string | string[] } } };
      const raw = axiosErr.response?.data?.message;
      const message = Array.isArray(raw)
        ? raw.join(', ')
        : raw ||
          (axiosErr.response?.status === 404
            ? 'Bus o incidente no encontrado. Verifica que el bus exista en el sistema.'
            : 'Error al crear el incidente.');
      setFormError(message);
      console.error('Error creating incident:', error);
    }
  };

  const handleUpdateStatus = async (id: number, nuevoEstado: string) => {
    try {
      await updateIncident(id, { state: nuevoEstado });
      fetchIncidents();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate('/dashboard')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700">
            ← Volver
          </Button>
          <h1 className="text-3xl font-bold text-white">Centro de Incidentes</h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700">
          + Reportar Incidente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {KANBAN_STATES.map(({ key, label }) => (
          <div key={key} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-300 border-b border-slate-700 pb-2 flex justify-between">
              {label}
              <span className="bg-slate-700 text-sm px-2 rounded-full">
                {incidents.filter((i) => i.state === key).length}
              </span>
            </h2>

            <div className="space-y-4">
              {incidents
                .filter((i) => i.state === key)
                .map((inc) => (
                  <div key={inc.id} className="bg-slate-800 p-4 rounded-lg border border-slate-600 shadow-md">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-900/50 text-orange-400">
                        {inc.type} · {inc.severity}
                      </span>
                      <span className="text-xs text-slate-500">{new Date(inc.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{inc.description}</p>
                    <p className="text-xs text-slate-500 mb-3">
                      Bus: {inc.busesIncidents?.[0]?.bus?.placa || 'N/A'}
                    </p>

                    {inc.busesIncidents?.[0]?.photos?.[0] && (
                      <img
                        src={resolvePhotoPublicUrl(inc.busesIncidents[0].photos![0].url)}
                        alt="Evidencia"
                        className="w-full h-32 object-cover rounded mb-3 border border-slate-700"
                      />
                    )}

                    <div className="flex gap-2 mt-2">
                      {key === 'ABIERTO' && (
                        <button
                          onClick={() => handleUpdateStatus(inc.id, 'EN_REVISION')}
                          className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded w-full"
                        >
                          Revisar
                        </button>
                      )}
                      {key === 'EN_REVISION' && (
                        <button
                          onClick={() => handleUpdateStatus(inc.id, 'RESUELTO')}
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded w-full"
                        >
                          Resolver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-white">Reportar Nuevo Incidente</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-500/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white">
                  <option value="MECANICO">Mecánico</option>
                  <option value="ACCIDENTE">Accidente</option>
                  <option value="RETRASO">Retraso</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Gravedad</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white">
                  <option value="BAJO">Bajo</option>
                  <option value="MEDIO">Medio</option>
                  <option value="ALTA">Alta</option>
                  <option value="CRITICA">Crítica</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Bus</label>
                <select
                  required
                  value={busId}
                  onChange={(e) => setBusId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                >
                  <option value="">Seleccione un bus...</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.placa} — {b.modelo} (ID {b.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Descripción</label>
                <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-600 hover:bg-slate-500">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-500">
                  Emitir Reporte
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentsPage;
