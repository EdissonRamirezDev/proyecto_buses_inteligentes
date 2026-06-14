import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AdminHeader from '../../components/common/AdminHeader';
import { calculateMassAlertRecipients, sendMassAlert, getMassAlertStats } from '../../services/messageService';
import type { MassAlertStats } from '../../services/messageService';

export default function MassAlertsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tab, setTab] = useState<'create' | 'history'>('create');
  
  // Create Alert State
  const [scope, setScope] = useState<'ALL' | 'ROUTE' | 'ZONE'>('ALL');
  const [scopeValue, setScopeValue] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [contenido, setContenido] = useState('');
  
  const [estimatedRecipients, setEstimatedRecipients] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [sending, setSending] = useState(false);
  
  // History State
  const [stats, setStats] = useState<MassAlertStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    if (tab === 'history') {
      loadStats();
    }
  }, [tab]);

  // Recalculate when scope changes
  useEffect(() => {
    handleCalculate();
  }, [scope, scopeValue]);

  const loadStats = async () => {
    if (!user?.id) return;
    setLoadingStats(true);
    try {
      const data = await getMassAlertStats(user.id);
      setStats(data);
    } catch (err) {
      console.error(err);
      showToast('❌ Error cargando estadísticas');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCalculate = async () => {
    if (!user?.id) return;
    setCalculating(true);
    try {
      const { count } = await calculateMassAlertRecipients(scope, scopeValue, user.id);
      setEstimatedRecipients(count);
    } catch (err) {
      setEstimatedRecipients(0);
    } finally {
      setCalculating(false);
    }
  };

  const handleSend = async () => {
    if (!contenido.trim()) return showToast('El mensaje no puede estar vacío');
    if (!user?.id) return showToast('Error de usuario');

    setSending(true);
    try {
      await sendMassAlert({
        emisor_id: user.id,
        contenido,
        scope,
        scopeValue: scopeValue || undefined,
        isUrgent,
        scheduledFor: scheduledFor || undefined,
      });
      showToast('✅ Alerta masiva creada correctamente');
      setContenido('');
      setScheduledFor('');
      setIsUrgent(false);
      setTab('history');
    } catch (err: any) {
      showToast(err.response?.data?.message || '❌ Error al enviar alerta masiva');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <AdminHeader
          title="Alertas Masivas"
          subtitle="Comunica emergencias o novedades a grandes grupos de usuarios"
          showBack
          onBack={() => navigate(-1)}
        />

        {toast && (
          <div className="fixed top-6 right-6 z-[9999] animate-slide-in bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl px-5 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 max-w-sm">
            {toast}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'create' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            📢 Crear Alerta
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'history' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            📊 Historial y Estadísticas
          </button>
        </div>

        {/* ── CREATE TAB ── */}
        {tab === 'create' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Config */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Alcance (Destinatarios)
                  </label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                  >
                    <option value="ALL">Todos los Usuarios</option>
                    <option value="ROUTE">Usuarios por Ruta</option>
                    <option value="ZONE">Usuarios por Zona (Paradero)</option>
                  </select>
                </div>

                {scope !== 'ALL' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Seleccionar {scope === 'ROUTE' ? 'Ruta' : 'Zona'}
                    </label>
                    <select
                      value={scopeValue}
                      onChange={(e) => setScopeValue(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                    >
                      <option value="">Seleccione una opción...</option>
                      {scope === 'ROUTE' ? (
                        <>
                          <option value="RUT-01">Ruta A1 (Centro - Norte)</option>
                          <option value="RUT-02">Ruta B2 (Sur - Oriente)</option>
                        </>
                      ) : (
                        <>
                          <option value="ZON-01">Zona Norte (Terminal)</option>
                          <option value="ZON-02">Zona Universitaria</option>
                        </>
                      )}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Nota: Prototipo usa rutas simuladas para el cálculo.</p>
                  </div>
                )}

                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium">
                    Destinatarios estimados:
                  </p>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {calculating ? '...' : (estimatedRecipients || 0)}
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="w-5 h-5 text-rose-600 bg-gray-100 border-gray-300 rounded focus:ring-rose-500"
                  />
                  <label htmlFor="urgent" className="text-sm font-semibold text-gray-900 dark:text-white">
                    🚨 Marcar como Urgente (Prioridad Alta)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Programar Envío (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">Si se deja en blanco, se enviará inmediatamente.</p>
                </div>
              </div>

              {/* Right Column: Message */}
              <div className="flex flex-col">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Contenido de la Alerta
                </label>
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  placeholder="Escribe el comunicado oficial aquí..."
                  className={`flex-1 w-full p-4 text-sm bg-gray-50 dark:bg-gray-900 border text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none ${isUrgent ? 'border-rose-300 dark:border-rose-700' : 'border-gray-300 dark:border-gray-600'}`}
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs font-medium ${contenido.length >= 450 ? 'text-rose-500' : 'text-gray-500'}`}>
                    {contenido.length}/500 caracteres
                  </span>
                  <button
                    onClick={handleSend}
                    disabled={sending || estimatedRecipients === 0 || !contenido.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-md"
                  >
                    {sending ? 'Procesando...' : (scheduledFor ? '🗓️ Programar Alerta' : '🚀 Enviar Ahora')}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div className="space-y-4">
            {loadingStats ? (
              <p className="text-center py-8 text-gray-500">Cargando historial...</p>
            ) : stats.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No has enviado alertas masivas aún.</p>
              </div>
            ) : (
              stats.map(alert => {
                const isScheduled = alert.scheduled_for && new Date(alert.scheduled_for).getTime() > Date.now();
                const readPercentage = alert.totalRecipients > 0 ? Math.round((alert.readCount / alert.totalRecipients) * 100) : 0;
                
                return (
                  <div key={alert.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition hover:shadow-md">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        {alert.is_urgent && <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Urgente</span>}
                        {isScheduled && <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Programada</span>}
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                          Alcance: {alert.scope}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {formatDate(alert.scheduled_for || alert.fecha_envio)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-4">{alert.contenido}</p>
                    
                    {/* Stats Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-600 dark:text-gray-400">Lecturas: {alert.readCount} de {alert.totalRecipients}</span>
                        <span className={readPercentage === 100 ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'}>{readPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-1000 ${readPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                          style={{ width: `${readPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
