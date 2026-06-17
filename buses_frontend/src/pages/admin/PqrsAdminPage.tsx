import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { getAllPqrs, updatePqrsStatus, type PqrsData } from '../../services/pqrsService';

const PqrsAdminPage = () => {
  const navigate = useNavigate();
  const [pqrsList, setPqrsList] = useState<PqrsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPqrs, setSelectedPqrs] = useState<PqrsData | null>(null);
  
  // Modal State
  const [nuevoEstado, setNuevoEstado] = useState('En revisión');
  const [respuesta, setRespuesta] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getAllPqrs();
      setPqrsList(data);
    } catch (error) {
      console.error('Error fetching PQRS:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (pqrs: PqrsData) => {
    setSelectedPqrs(pqrs);
    setNuevoEstado(pqrs.estado);
    setRespuesta(pqrs.respuesta || '');
  };

  const handleSaveStatus = async () => {
    if (!selectedPqrs) return;
    setIsSaving(true);
    try {
      await updatePqrsStatus(selectedPqrs.id, {
        estado: nuevoEstado,
        respuesta: respuesta.trim() || undefined
      });
      // Cerrar modal y recargar
      setSelectedPqrs(null);
      await loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al guardar el estado.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Resuelto': return 'bg-green-900/50 text-green-400 border-green-700/50';
      case 'En proceso': return 'bg-blue-900/50 text-blue-400 border-blue-700/50';
      case 'En revisión': return 'bg-amber-900/50 text-amber-400 border-amber-700/50';
      default: return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Gestión de PQRS</h1>
            <p className="text-slate-400 mt-2">Bandeja de entrada de Peticiones, Quejas, Reclamos y Sugerencias.</p>
          </div>
          <Button onClick={() => navigate('/dashboard')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700">
            ← Volver al Panel
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                    <th className="p-4 font-semibold">Radicado</th>
                    <th className="p-4 font-semibold">Tipo</th>
                    <th className="p-4 font-semibold">Categoría</th>
                    <th className="p-4 font-semibold">Ciudadano</th>
                    <th className="p-4 font-semibold">Fecha</th>
                    <th className="p-4 font-semibold">Estado</th>
                    <th className="p-4 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {pqrsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No hay PQRS registrados en el sistema.
                      </td>
                    </tr>
                  ) : (
                    pqrsList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-indigo-400 text-sm">{item.radicado || 'Pendiente...'}</span>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs">{item.tipo}</span>
                        </td>
                        <td className="p-4 text-sm text-slate-300">{item.categoria}</td>
                        <td className="p-4 text-sm text-slate-400">{item.email}</td>
                        <td className="p-4 text-sm text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.estado)}`}>
                            {item.estado}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button onClick={() => handleOpenModal(item)} className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 border border-indigo-600/30 px-4 py-2 text-sm">
                            Gestionar
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Gestión */}
      {selectedPqrs && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Gestionar PQRS</h2>
                <p className="text-sm font-mono text-indigo-400 mt-1">{selectedPqrs.radicado}</p>
              </div>
              <button onClick={() => setSelectedPqrs(null)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Información del ciudadano */}
              <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-900/30 p-4 rounded-xl border border-slate-700/50">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Contacto</p>
                  <p className="text-sm text-slate-300 font-medium">{selectedPqrs.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Fecha Radicación</p>
                  <p className="text-sm text-slate-300 font-medium">{new Date(selectedPqrs.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Tipo</p>
                  <p className="text-sm text-slate-300 font-medium">{selectedPqrs.tipo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Categoría</p>
                  <p className="text-sm text-slate-300 font-medium">{selectedPqrs.categoria}</p>
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-6">
                <p className="text-xs text-slate-500 uppercase mb-2">Descripción del Reporte</p>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedPqrs.descripcion}
                </div>
              </div>

              {/* Fotos (Evidencia) */}
              {selectedPqrs.fotos && selectedPqrs.fotos.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs text-slate-500 uppercase mb-2">Evidencia Adjunta</p>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {selectedPqrs.fotos.map((fotoUrl, idx) => (
                      <div key={idx} className="flex-shrink-0 w-32 h-32 rounded-lg border border-slate-600 overflow-hidden bg-black">
                        {fotoUrl.startsWith('data:image') ? (
                          <img src={fotoUrl} alt={`Evidencia ${idx}`} className="w-full h-full object-contain" />
                        ) : (
                          <a href={fotoUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center h-full text-indigo-400 hover:text-indigo-300 text-sm underline p-2 text-center">Ver Archivo</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <hr className="border-slate-700 my-6" />

              {/* Zona de Acción */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-4">Acción y Respuesta Oficial</h3>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Cambiar Estado</label>
                    <select 
                      value={nuevoEstado} 
                      onChange={(e) => setNuevoEstado(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Recibido">Recibido</option>
                      <option value="En revisión">En revisión (Tomar caso)</option>
                      <option value="En proceso">En proceso</option>
                      <option value="Resuelto">Resuelto (Cerrar caso)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                      Cambiar de estado enviará una notificación al usuario por correo automáticamente.
                    </p>
                  </div>
                  
                  <div className="w-full md:w-2/3">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Respuesta (Para el ciudadano)</label>
                    <textarea 
                      rows={4} 
                      value={respuesta} 
                      onChange={(e) => setRespuesta(e.target.value)}
                      placeholder="Escribe la resolución del caso. El ciudadano recibirá este texto en su correo..."
                      className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-6 border-t border-slate-700 flex justify-end gap-4">
              <Button onClick={() => setSelectedPqrs(null)} className="bg-slate-700 hover:bg-slate-600 text-white">
                Cancelar
              </Button>
              <Button onClick={handleSaveStatus} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8">
                {isSaving ? 'Guardando...' : 'Guardar y Notificar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PqrsAdminPage;
