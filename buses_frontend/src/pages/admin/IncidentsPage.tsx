import React, { useState, useEffect } from 'react';
import { getIncidents, createIncident, updateIncidentStatus } from '../../services/incidentsService';
import type { Incident } from '../../services/incidentsService';
import { getShifts } from '../../services/shiftService'; // Asumiendo que existe o lo crearemos
import { httpBusiness } from '../../services/http';
import Button from '../../components/common/Button';

const IncidentsPage = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('MECANICO');
  const [shiftId, setShiftId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  
  useEffect(() => {
    fetchIncidents();
    fetchShifts();
  }, []);

  const fetchIncidents = async () => {
    try {
      const data = await getIncidents();
      setIncidents(data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await httpBusiness.get('/shifts');
      setShifts(response.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createIncident({
        titulo,
        descripcion,
        categoria,
        shiftId,
        photos: photoUrl ? [photoUrl] : undefined
      });
      setIsModalOpen(false);
      fetchIncidents();
      // Reset form
      setTitulo(''); setDescripcion(''); setCategoria('MECANICO'); setShiftId(''); setPhotoUrl('');
    } catch (error) {
      console.error('Error creating incident:', error);
      alert('Error al crear el incidente');
    }
  };

  const handleUpdateStatus = async (id: string, nuevoEstado: string) => {
    try {
      await updateIncidentStatus(id, nuevoEstado);
      fetchIncidents();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Centro de Incidentes</h1>
        <Button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700">
          + Reportar Incidente
        </Button>
      </div>

      {/* Kanban Board Simple */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['REPORTADO', 'EN_REVISION', 'RESUELTO'].map(estado => (
          <div key={estado} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-300 border-b border-slate-700 pb-2 flex justify-between">
              {estado === 'REPORTADO' ? '🚨 Nuevos' : estado === 'EN_REVISION' ? '👀 En Revisión' : '✅ Resueltos'}
              <span className="bg-slate-700 text-sm px-2 rounded-full">{incidents.filter(i => i.estado === estado).length}</span>
            </h2>
            
            <div className="space-y-4">
              {incidents.filter(i => i.estado === estado).map(inc => (
                <div key={inc.id} className="bg-slate-800 p-4 rounded-lg border border-slate-600 shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      inc.categoria === 'MECANICO' ? 'bg-orange-900/50 text-orange-400' :
                      inc.categoria === 'ACCIDENTE' ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'
                    }`}>
                      {inc.categoria}
                    </span>
                    <span className="text-xs text-slate-500">{new Date(inc.fecha_reporte).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-white mb-1">{inc.titulo}</h3>
                  <p className="text-sm text-slate-400 mb-3">{inc.descripcion}</p>
                  
                  {inc.shift && (
                    <div className="text-xs text-slate-500 mb-3">
                      Bus: {inc.shift.bus?.placa || 'N/A'} <br/>
                      Cond: {inc.shift.driver?.nombres}
                    </div>
                  )}

                  {inc.incidentBuses?.[0]?.photos?.[0] && (
                    <img src={inc.incidentBuses[0].photos[0].url_imagen} alt="Incidente" className="w-full h-32 object-cover rounded mb-3 border border-slate-700" />
                  )}

                  <div className="flex gap-2 mt-2">
                    {estado === 'REPORTADO' && (
                      <button onClick={() => handleUpdateStatus(inc.id, 'EN_REVISION')} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded w-full transition">Revisar</button>
                    )}
                    {estado === 'EN_REVISION' && (
                      <button onClick={() => handleUpdateStatus(inc.id, 'RESUELTO')} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded w-full transition">Resolver</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Reportar Incidente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-white">Reportar Nuevo Incidente</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Título</label>
                <input required type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Categoría</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white">
                  <option value="MECANICO">Fallo Mecánico</option>
                  <option value="ACCIDENTE">Accidente</option>
                  <option value="CONGESTION">Congestión / Retraso</option>
                  <option value="PASAJERO">Problema con Pasajero</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Turno Afectado</label>
                <select required value={shiftId} onChange={e => setShiftId(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white">
                  <option value="">Seleccione un turno...</option>
                  {shifts.map(s => (
                    <option key={s.id} value={s.id}>Turno {s.id} - Bus {s.bus?.placa}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">URL Foto Evidencia (Opcional)</label>
                <input type="text" placeholder="https://..." value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Descripción</label>
                <textarea required rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-600 hover:bg-slate-500">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-500">Emitir Reporte</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentsPage;
