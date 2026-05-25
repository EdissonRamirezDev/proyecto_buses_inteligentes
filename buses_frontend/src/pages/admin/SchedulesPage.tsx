import React, { useEffect, useState } from 'react';
import { getSchedules, createSchedule, deleteSchedule } from '../../services/schedulesService';
import { getRoutes } from '../../services/routesService';
import { getBuses } from '../../services/busService';
import type { Schedule } from '../../types/schedule.types';
import type { Route } from '../../types/route.types';
import type { Bus } from '../../types/bus.types';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

const SchedulesPage = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('timeline');
  const [timelineDate, setTimelineDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    routeId: '',
    busId: 0,
    fecha: timelineDate,
    hora_salida: '',
    es_recurrente: false,
    tipo_recurrencia: 'diaria',
    tolerancia_minutos: 5
  });

  const fetchData = async () => {
    try {
      const [scheds, rts, bss] = await Promise.all([getSchedules(), getRoutes(), getBuses()]);
      setSchedules(scheds);
      setRoutes(rts);
      setBuses(bss);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.routeId || !formData.busId) {
      setFormError('Selecciona una ruta y un bus.');
      return;
    }

    const routeNodes = routes.find((r) => r.id === formData.routeId)?.nodes?.length ?? 0;
    if (routeNodes > 0 && routeNodes < 3) {
      setFormError('La ruta debe tener al menos 3 paraderos para programar un servicio.');
      return;
    }

    try {
      await createSchedule(formData);
      setIsCreating(false);
      fetchData();
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string | string[] } } };
      const raw = axiosErr.response?.data?.message;
      const message = Array.isArray(raw)
        ? raw.join(', ')
        : raw || 'No se pudo crear la programación. Revisa los datos e intenta de nuevo.';
      setFormError(message);
      console.error('Error creating schedule:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar programación?')) {
      try {
        await deleteSchedule(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  // Helper para Timeline
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const getPositionStyle = (hora_salida: string, routeId?: string) => {
    const [hh, mm] = hora_salida.split(':').map(Number);
    const percentage = ((hh * 60 + mm) / (24 * 60)) * 100;
    
    // Calculate route duration if possible
    let durationMins = 60; // default 1 hr
    if (routeId) {
      const route = routes.find(r => r.id === routeId);
      if (route && route.nodes) {
        const totalTime = route.nodes.reduce((acc: number, n: any) => acc + (n.tiempo_estimado || 0), 0);
        if (totalTime > 0) durationMins = totalTime;
      }
    }
    const widthPercentage = (durationMins / (24 * 60)) * 100;

    return {
      left: `${percentage}%`,
      width: `${Math.max(widthPercentage, 2)}%` // min width 2%
    };
  };

  const schedulesForTimeline = schedules.filter(s => s.fecha === timelineDate);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-300 hover:text-white">
            ← Volver
          </Button>
          <h1 className="text-3xl font-bold text-white">Programación Operativa</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button 
            onClick={() => setViewMode('timeline')} 
            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === 'timeline' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            Vista Calendario
          </button>
          <button 
            onClick={() => setViewMode('table')} 
            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            Vista Tabla
          </button>
        </div>

        <Button onClick={() => setIsCreating(!isCreating)} className="bg-blue-600">
          {isCreating ? 'Cancelar' : 'Nueva Programación'}
        </Button>
      </div>

      {isCreating && (
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl mb-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Crear Programación de Ruta</h2>
          <p className="text-sm text-slate-400 mb-4">
            Antes de programar, el bus debe tener un <strong className="text-slate-300">turno con conductor</strong> activo
            que cubra la fecha y hora de salida.{' '}
            <a href="/admin/shifts" className="text-blue-400 underline hover:text-blue-300">
              Crear turno aquí
            </a>
            .
          </p>
          {formError && (
            <div className="mb-4 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300">Ruta Destino</label>
              <select required onChange={e => setFormData({...formData, routeId: e.target.value})} className="mt-1 block w-full rounded-lg bg-slate-700 border-slate-600 text-white p-3">
                <option value="">Seleccione una ruta...</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.codigo} - {r.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Bus Asignado</label>
              <select required onChange={e => setFormData({...formData, busId: Number(e.target.value)})} className="mt-1 block w-full rounded-lg bg-slate-700 border-slate-600 text-white p-3">
                <option value="">Seleccione un bus...</option>
                {buses.map(b => <option key={b.id} value={b.id}>{b.placa} ({b.modelo})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Fecha de Inicio</label>
              <input type="date" value={formData.fecha} required onChange={e => setFormData({...formData, fecha: e.target.value})} className="mt-1 block w-full rounded-lg bg-slate-700 border-slate-600 text-white p-3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Hora de Salida</label>
              <input type="time" required onChange={e => setFormData({...formData, hora_salida: e.target.value})} className="mt-1 block w-full rounded-lg bg-slate-700 border-slate-600 text-white p-3" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={formData.es_recurrente} onChange={e => setFormData({...formData, es_recurrente: e.target.checked})} className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600" id="recurrente" />
              <label htmlFor="recurrente" className="text-sm font-medium text-slate-300 cursor-pointer">¿Es Recurrente?</label>
            </div>
            {formData.es_recurrente && (
              <div>
                <select value={formData.tipo_recurrencia} onChange={e => setFormData({...formData, tipo_recurrencia: e.target.value})} className="block w-full rounded-lg bg-slate-700 border-slate-600 text-white p-3">
                  <option value="diaria">Diaria</option>
                  <option value="lunes-viernes">Lunes a Viernes</option>
                  <option value="fin-semana">Fines de Semana</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300">Tolerancia salida (± min)</label>
              <input
                type="number"
                min={0}
                max={30}
                value={formData.tolerancia_minutos}
                onChange={e => setFormData({ ...formData, tolerancia_minutos: Number(e.target.value) })}
                className="mt-1 block w-full rounded-lg bg-slate-700 border-slate-600 text-white p-3"
              />
            </div>
            <div className="lg:col-span-4">
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 mt-2">Guardar Programación</Button>
            </div>
          </form>
        </div>
      )}

      {viewMode === 'table' ? (
        <div className="bg-slate-800 shadow-2xl rounded-xl overflow-hidden border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha / Hora</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Ruta</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Vehículo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {schedules.map((sched) => (
                <tr key={sched.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-400">
                    {sched.fecha} <span className="text-slate-500">@</span> {sched.hora_salida}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {sched.route?.color_hex && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sched.route.color_hex }}></div>}
                      <div>
                        <div className="text-sm text-white font-bold">{sched.route?.codigo}</div>
                        <div className="text-xs text-slate-500">{sched.route?.nombre}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white font-bold">{sched.bus?.placa}</div>
                    <div className="text-xs text-slate-500">{sched.bus?.modelo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      sched.estado === 'programado' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'
                    }`}>
                      {sched.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(sched.id)} className="text-red-400 hover:text-red-300">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-300">Calendario Diario de Despachos</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400 font-bold uppercase">Fecha Visualizada:</label>
              <input 
                type="date" 
                value={timelineDate} 
                onChange={(e) => setTimelineDate(e.target.value)} 
                className="bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Header: Hours */}
              <div className="flex ml-40 border-b border-slate-700 pb-2 mb-2">
                {hours.map(h => (
                  <div key={h} className="flex-1 text-center text-xs text-slate-500 font-mono border-l border-slate-700/50">
                    {h.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Rows: Buses */}
              <div className="space-y-4">
                {buses.length === 0 && <div className="text-center text-slate-500 py-10">No hay buses registrados.</div>}
                
                {buses.map(bus => {
                  const busSchedules = schedulesForTimeline.filter(s => s.bus?.id === bus.id);
                  return (
                    <div key={bus.id} className="flex items-center relative h-14 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                      {/* Bus Info */}
                      <div className="w-40 shrink-0 p-3 bg-slate-800/80 rounded-l-lg border-r border-slate-700 h-full flex flex-col justify-center z-10 shadow-lg">
                        <div className="font-bold text-white text-sm">{bus.placa}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{bus.modelo}</div>
                      </div>

                      {/* Timeline Area */}
                      <div className="flex-1 relative h-full bg-grid-slate-800">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex">
                          {hours.map(h => (
                            <div key={h} className="flex-1 border-l border-slate-700/30 h-full"></div>
                          ))}
                        </div>

                        {/* Blocks */}
                        {busSchedules.map(sched => {
                          const style = getPositionStyle(sched.hora_salida, sched.route?.id);
                          const color = sched.route?.color_hex || '#3b82f6';
                          return (
                            <div 
                              key={sched.id} 
                              onClick={() => handleDelete(sched.id)}
                              className="absolute top-1/2 -translate-y-1/2 h-8 rounded shadow-lg flex items-center justify-center cursor-pointer group hover:z-20 transition-all hover:scale-105"
                              style={{ ...style, backgroundColor: color }}
                            >
                              <div className="px-2 text-[10px] font-bold text-white truncate drop-shadow-md">
                                {sched.hora_salida} - {sched.route?.codigo}
                              </div>

                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl pointer-events-none">
                                <div className="font-bold text-blue-400 mb-1">{sched.route?.nombre}</div>
                                <div>Salida: {sched.hora_salida}</div>
                                <div>Bus: {bus.placa}</div>
                                <div>Estado: <span className="uppercase text-[10px] bg-slate-700 px-1 rounded">{sched.estado}</span></div>
                                <div className="mt-2 text-red-400 font-bold">Haz clic para eliminar</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulesPage;
