import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import { createPqrs, getPqrsByRadicado, type PqrsData } from '../../services/pqrsService';

const CitizenPqrsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'crear' | 'consultar'>('crear');

  // Form State
  const [tipo, setTipo] = useState('Petición');
  const [categoria, setCategoria] = useState('Conductor');
  const [descripcion, setDescripcion] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [fotosBase64, setFotosBase64] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successRadicado, setSuccessRadicado] = useState<string | null>(null);

  // Consulta State
  const [searchRadicado, setSearchRadicado] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<PqrsData | null>(null);
  const [searchError, setSearchError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 3); // Max 3
    const newFotos: string[] = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          newFotos.push(reader.result as string);
          if (newFotos.length === files.length) {
            setFotosBase64(newFotos);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await createPqrs({
        tipo,
        categoria,
        descripcion,
        email,
        fotos: fotosBase64
      });
      setSuccessRadicado(result.radicado);
    } catch (error) {
      console.error('Error creando PQRS:', error);
      alert('Ocurrió un error al enviar su solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRadicado.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);
    try {
      const result = await getPqrsByRadicado(searchRadicado.trim());
      setSearchResult(result);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSearchError('No se encontró ningún PQRS con ese radicado.');
      } else {
        setSearchError('Error de conexión al consultar el estado.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-12">
      {/* Header Premium */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-10 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Centro de PQRS</h1>
            <p className="text-emerald-100 text-sm md:text-base opacity-90 mt-1 max-w-xl">
              Peticiones, Quejas, Reclamos y Sugerencias. Tu voz nos ayuda a mejorar el servicio de Buses Inteligentes.
            </p>
          </div>
          <Button onClick={() => navigate('/citizen/dashboard')} className="mt-4 md:mt-0 bg-white/20 hover:bg-white/30 backdrop-blur-md shadow-sm transition-all border border-white/20 text-white rounded-full px-6">
            ← Volver al Panel
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="flex bg-slate-800 p-1 rounded-2xl shadow-xl w-full max-w-md mx-auto mb-8 border border-slate-700">
          <button
            onClick={() => setActiveTab('crear')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'crear' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            ✉️ Radicar Nuevo
          </button>
          <button
            onClick={() => setActiveTab('consultar')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'consultar' ? 'bg-teal-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            🔍 Consultar Estado
          </button>
        </div>

        {/* Tab Content: Crear */}
        {activeTab === 'crear' && (
          <div className="bg-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-700/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {successRadicado ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-emerald-400 text-5xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">¡PQRS Radicado con Éxito!</h2>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Hemos recibido tu solicitud. Usa el siguiente número para hacer seguimiento a tu caso en cualquier momento.
                </p>
                <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-2xl inline-block mb-8">
                  <p className="text-sm text-slate-400 mb-1">Nº de Radicado</p>
                  <p className="text-3xl font-mono font-bold text-emerald-400 tracking-wider">{successRadicado}</p>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">Se ha enviado una confirmación a tu correo electrónico.</p>
                  <Button onClick={() => { setSuccessRadicado(null); setDescripcion(''); setFotosBase64([]); }} className="bg-slate-700 hover:bg-slate-600">
                    Radicar otro PQRS
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Tipo de Solicitud</label>
                    <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none">
                      <option value="Petición">Petición (Consulta general)</option>
                      <option value="Queja">Queja (Inconformidad con un empleado)</option>
                      <option value="Reclamo">Reclamo (Inconformidad con el servicio)</option>
                      <option value="Sugerencia">Sugerencia (Recomendación de mejora)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Categoría</label>
                    <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none">
                      <option value="Conductor">Comportamiento de Conductor</option>
                      <option value="Bus">Estado del Bus</option>
                      <option value="Ruta">Tiempos o Trayecto de la Ruta</option>
                      <option value="Tarjeta">Problemas con Tarjeta / Saldo</option>
                      <option value="Otro">Otro Asunto</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Correo Electrónico para Notificaciones
                  </label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="tucorreo@ejemplo.com" />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-medium text-slate-400">Descripción Detallada</label>
                    <span className={`text-xs font-mono ${descripcion.length > 480 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {descripcion.length}/500
                    </span>
                  </div>
                  <textarea required maxLength={500} rows={5} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none" placeholder="Describe los hechos con la mayor cantidad de detalles (fecha, hora, placa del bus, etc.)..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Adjuntar Evidencia (Fotos)</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-xl cursor-pointer bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-emerald-400">Haz clic para subir</span> o arrastra tus imágenes</p>
                        <p className="text-xs text-slate-500">PNG, JPG, GIF (Máx. 3 archivos)</p>
                      </div>
                      <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                  {fotosBase64.length > 0 && (
                    <div className="flex gap-4 mt-4">
                      {fotosBase64.map((b64, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-600">
                          <img src={b64} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full py-4 text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/50 rounded-xl transition-all transform hover:-translate-y-1">
                    {isSubmitting ? 'Radicando Solicitud...' : 'Enviar Solicitud'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab Content: Consultar */}
        {activeTab === 'consultar' && (
          <div className="bg-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-700/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Rastrear Solicitud</h2>
            
            <form onSubmit={handleSearch} className="flex gap-4 mb-10 max-w-lg mx-auto">
              <input 
                type="text" 
                value={searchRadicado} 
                onChange={(e) => setSearchRadicado(e.target.value.toUpperCase())}
                placeholder="Ej. PQRS-20260615-1234" 
                className="flex-1 bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all uppercase" 
              />
              <Button type="submit" disabled={isSearching} className="bg-teal-600 hover:bg-teal-500 px-8 rounded-xl font-bold">
                {isSearching ? 'Buscando...' : 'Buscar'}
              </Button>
            </form>

            {searchError && (
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-center">
                <p className="text-red-400">{searchError}</p>
              </div>
            )}

            {searchResult && (
              <div className="bg-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Número de Radicado</p>
                    <p className="text-xl font-mono font-bold text-teal-400">{searchResult.radicado}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Estado Actual</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                      searchResult.estado === 'Resuelto' ? 'bg-green-900/50 text-green-400 border-green-700/50' : 
                      searchResult.estado === 'En proceso' ? 'bg-blue-900/50 text-blue-400 border-blue-700/50' :
                      searchResult.estado === 'En revisión' ? 'bg-amber-900/50 text-amber-400 border-amber-700/50' :
                      'bg-slate-800 text-slate-300 border-slate-600'
                    }`}>
                      {searchResult.estado}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Timeline simplificado */}
                  <div className="relative mb-8 pt-2">
                    <div className="absolute top-5 left-8 right-8 h-1 bg-slate-700 -z-10 rounded-full"></div>
                    <div className="flex justify-between relative z-10">
                      {['Recibido', 'En revisión', 'En proceso', 'Resuelto'].map((step, idx) => {
                        const states = ['Recibido', 'En revisión', 'En proceso', 'Resuelto'];
                        const currentIndex = states.indexOf(searchResult.estado);
                        const isCompleted = idx <= currentIndex;
                        const isCurrent = idx === currentIndex;
                        
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-slate-900 mb-2 transition-all ${
                              isCurrent ? 'bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]' : 
                              isCompleted ? 'bg-teal-600' : 'bg-slate-700'
                            }`}>
                              {isCompleted && <span className="text-white text-xs font-bold">✓</span>}
                            </div>
                            <span className={`text-xs font-medium ${isCurrent ? 'text-teal-400' : isCompleted ? 'text-slate-300' : 'text-slate-600'}`}>
                              {step}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1">Detalle Reportado</h4>
                      <div className="bg-slate-800 p-4 rounded-xl">
                        <div className="flex gap-2 mb-2">
                          <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">{searchResult.tipo}</span>
                          <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">{searchResult.categoria}</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{searchResult.descripcion}</p>
                      </div>
                    </div>

                    {searchResult.respuesta && (
                      <div className="mt-6 animate-in fade-in">
                        <h4 className="text-xs text-teal-500 font-bold uppercase tracking-wider mb-1">Respuesta Oficial</h4>
                        <div className="bg-teal-900/20 border border-teal-500/30 p-5 rounded-xl">
                          <p className="text-teal-50 text-sm leading-relaxed">{searchResult.respuesta}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenPqrsPage;
