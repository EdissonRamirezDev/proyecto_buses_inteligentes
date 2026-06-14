import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDrivers } from '../../services/driverService';
import { getShifts, startShift } from '../../services/shiftService';
import { syncBusCapacity } from '../../services/busService';
import { getInbox } from '../../services/messageService';
import {
  findShiftStartableNow,
  formatShiftWindow,
  isShiftEnCurso,
  isShiftProgramado,
  isShiftWithinWindow,
  shiftEstadoBase,
} from '../../utils/shiftUtils';
import { getIncidents } from '../../services/incidentsService';
import type { Driver } from '../../types/driver.types';
import type { Shift } from '../../types/shift.types';
import type { Incident } from '../../services/incidentsService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import IncidentReportForm from '../../components/driver/IncidentReportForm';
import { httpBusiness } from '../../services/http';

const ConductorShift = () => {
  const { user, handleLogout } = useAuth();
  
  // Navigation State
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'turnos' | 'incidente'>('dashboard');
  
  // Data States
  const [driver, setDriver] = useState<Driver | null>(null);
  const [driverShifts, setDriverShifts] = useState<Shift[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [scheduledShift, setScheduledShift] = useState<Shift | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [isStartingShift, setIsStartingShift] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Modal Fields
  const [busStatus, setBusStatus] = useState<'ok' | 'obs' | 'rev'>('ok');
  const [busObservations, setBusObservations] = useState('');
  
  // GPS Telemetry State
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Date State
  const [currentDateTime, setCurrentDateTime] = useState('');
  
  // Interval Refs for Cleanup
  const gpsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load Initial Driver & Shift Data
  const loadData = async () => {
    if (!user?.email) return;
    try {
      const drivers = await getDrivers();
      const myDriver = drivers.find((d) => d.person?.email === user.email || d.email === user.email);
      
      if (myDriver) {
        setDriver(myDriver);
        
        if (user.id) {
          getInbox(user.id).then(inbox => {
            setUnreadMessages(inbox.filter(m => !m.leido).length);
          }).catch(console.error);
        }

        const allShifts = await getShifts();
        const myShifts = allShifts.filter((s) => s.driver?.id === myDriver.id);
        setDriverShifts(myShifts);
        
        const active = myShifts.find((s) => isShiftEnCurso(s.estado));
        setActiveShift(active || null);

        if (active) {
          setGpsActive(true);
        }

        const scheduled = findShiftStartableNow(myShifts);
        setScheduledShift(scheduled);

        // Load Incidents
        const allIncidents = await getIncidents();
        // Filter incidents related to the current driver's shifts
        const myIncidentList = allIncidents.filter((inc) => 
          inc.shift?.id !== undefined && myShifts.some((s) => String(s.id) === String(inc.shift?.id))
        );
        setIncidents(myIncidentList);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Real-time Date and Time updates
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      setCurrentDateTime(
        now.toLocaleDateString('es-CO', options).replace(/^\w/, (c) => c.toUpperCase())
      );
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  // Persist GPS Telemetry
  useEffect(() => {
    if (gpsActive && activeShift?.bus?.id) {
      // 1. Get initial position immediately
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setGpsCoords({ latitude, longitude });
          // Post to backend API
          httpBusiness.post('/gps', { latitude, longitude, bus_id: activeShift.bus?.id })
            .catch((err) => console.error('Error posting GPS:', err));
        },
        () => {
          // Fallback Armernia, Colombia coordinates
          const fallback = { latitude: 4.5389, longitude: -75.6683 };
          setGpsCoords(fallback);
          httpBusiness.post('/gps', { ...fallback, bus_id: activeShift.bus?.id })
            .catch((err) => console.error('Error posting fallback GPS:', err));
        }
      );

      // 2. Set interval to update every 15 seconds
      gpsIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setGpsCoords({ latitude, longitude });
            httpBusiness.post('/gps', { latitude, longitude, bus_id: activeShift.bus?.id })
              .catch((err) => console.error('Error posting GPS:', err));
          },
          () => {
            // Keep current or fallback
            setGpsCoords((prev) => prev || { latitude: 4.5389, longitude: -75.6683 });
          }
        );
      }, 15000);
    } else {
      if (gpsIntervalRef.current) {
        clearInterval(gpsIntervalRef.current);
        gpsIntervalRef.current = null;
      }
      setGpsCoords(null);
    }

    return () => {
      if (gpsIntervalRef.current) {
        clearInterval(gpsIntervalRef.current);
      }
    };
  }, [gpsActive, activeShift]);

  // Display Toast message Helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Start Shift Handler
  const handleConfirmStartShift = async () => {
    const targetShift = scheduledShift;
    if (!targetShift?.id || !targetShift?.bus?.id) {
      showToast('No hay un turno programado para la fecha y hora actual.');
      return;
    }

    if (!isShiftProgramado(targetShift.estado) || !isShiftWithinWindow(targetShift)) {
      showToast('Este turno no está dentro de su ventana programada. Verifica el horario con operaciones.');
      return;
    }

    if (busStatus === 'obs' && !busObservations.trim()) {
      showToast('Registra el detalle de las observaciones del bus.');
      return;
    }

    setIsStartingShift(true);
    try {
      const result = await startShift(targetShift.id, {
        busStatus,
        observations: busStatus === 'obs' ? busObservations.trim() : undefined,
        driverEmail: user?.email,
      });

      showToast(result.mensaje || '¡Turno iniciado correctamente! Telemetría GPS activada.');
      setShowStartModal(false);
      setBusStatus('ok');
      setBusObservations('');

      await loadData();
      setGpsActive(true);
    } catch (err: unknown) {
      console.error('Error starting shift:', err);
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join('. ') : msg;
      showToast(text || 'Error al iniciar el turno. Intenta nuevamente.');
    } finally {
      setIsStartingShift(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando panel del conductor..." />;
  }

  // Derived Values for Dashboard
  const driverName = driver?.person?.name || driver?.name;
  const driverLastName = driver?.person?.lastName || driver?.last_name;
  const initials = driverName && driverLastName
    ? `${driverName[0]}${driverLastName[0]}`.toUpperCase()
    : user?.email ? user.email.slice(0, 2).toUpperCase() : 'C';

  const completedShifts = driverShifts.filter((s) => {
    const base = shiftEstadoBase(s.estado);
    return base === 'completado' || base === 'finalizado';
  }).length;
  const incidentCount = incidents.length;
  const programadoFueraDeVentana = driverShifts.some(
    (s) => isShiftProgramado(s.estado) && !isShiftWithinWindow(s) && !activeShift,
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* ── Topbar ── */}
      <header className="sticky top-0 z-40 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between px-6 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-base block leading-none">Buses Inteligentes</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase mt-1 inline-block">Conductor</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => showToast('Notificaciones al día')}
            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition"
            title="Notificaciones"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-200 dark:border-emerald-800 shadow-sm">
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* ── Layout Container ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ── Sidebar ── */}
        <aside className="w-20 sm:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 transition-colors">
          <div className="space-y-6">
            {/* User Profile Info card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 hidden sm:block">
              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {driver ? `${driver.person?.name || driver.name} ${driver.person?.lastName || driver.last_name}` : user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                Conductor · {driver?.company?.nombre || 'Independiente'}
              </p>
            </div>

            {/* Navigation Navigation Section */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-500 px-3 hidden sm:block">Principal</span>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`w-full flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl text-sm font-medium transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              <button
                onClick={() => setCurrentTab('turnos')}
                className={`w-full flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl text-sm font-medium transition-all ${
                  currentTab === 'turnos'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Mis Turnos</span>
              </button>
            </div>

            {/* Operations Section */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-500 px-3 hidden sm:block">Operación</span>
              
              <button
                onClick={() => window.location.href = '/messages'}
                className="w-full flex items-center justify-between sm:justify-start gap-3 p-3 rounded-xl text-sm font-medium transition-all text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Mensajes</span>
                </div>
                {unreadMessages > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  if (!activeShift) {
                    showToast('Debes iniciar un turno para reportar un incidente.');
                    return;
                  }
                  setCurrentTab('incidente');
                }}
                className={`w-full flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl text-sm font-medium transition-all ${
                  currentTab === 'incidente'
                    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                } ${!activeShift ? 'opacity-55 cursor-not-allowed' : ''}`}
                title={!activeShift ? 'Requiere turno activo' : ''}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="hidden sm:inline">Reportar Incidente</span>
              </button>
            </div>
          </div>

          {/* Bottom Logout Area */}
          <div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center sm:justify-start gap-3 p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-sm font-medium transition"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* ── Main View Panel ── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-950/50">
          
          {/* ── TAB: DASHBOARD ── */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              
              {/* Header Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">{currentDateTime}</p>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">¡Buen día, {driver?.person?.name || driver?.name || 'Conductor'}!</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Resumen y estado de tu jornada laboral hoy.</p>
                </div>
                {(activeShift || scheduledShift)?.bus?.id && (
                  <button
                    type="button"
                    onClick={async () => {
                      const busId = (activeShift || scheduledShift)?.bus?.id;
                      if (!busId) return;
                      await syncBusCapacity(busId);
                      await loadData();
                      setToastMessage('Ocupación del bus actualizada');
                    }}
                    className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Actualizar ocupación
                  </button>
                )}
              </div>

              {/* Active Shift Active Banner */}
              {activeShift && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">Turno en curso y activo</h3>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-mono mt-0.5">
                        Bus: {activeShift.bus?.placa} · Inicio real:{' '}
                        {activeShift.hora_inicio_real
                          ? new Date(activeShift.hora_inicio_real).toLocaleString('es-CO', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '--:--'}{' '}
                        · Ventana: {formatShiftWindow(activeShift)} · GPS activo
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentTab('incidente')}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-rose-600/10"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Reportar Incidente
                  </button>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 transition shadow-sm hover:shadow">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estado del Turno</p>
                  <p className={`text-base font-bold mt-2 ${activeShift ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                    {activeShift ? 'En Curso' : 'Sin Iniciar'}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                    {activeShift ? 'GPS reportando' : 'GPS en espera'}
                  </p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 transition shadow-sm hover:shadow">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Turnos Completados</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{completedShifts}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">este mes</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 transition shadow-sm hover:shadow">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estimado Kilómetros</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {completedShifts * 125} km
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">estimación mensual</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 transition shadow-sm hover:shadow">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Incidentes Reportados</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{incidentCount}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">este mes</p>
                </div>
              </div>

              {/* Scheduled Turn Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full">
                      Asignación del Día
                    </span>
                    
                    {scheduledShift || activeShift ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-4">
                        <div>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Bus Asignado</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-1">
                            {(scheduledShift || activeShift)?.bus?.placa || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Capacidad del bus</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {(() => {
                              const bus = (scheduledShift || activeShift)?.bus;
                              const max = bus?.capacidad_max ?? bus?.capacidad ?? 0;
                              const libres = bus?.capacidad_disponible ?? bus?.capacidad ?? max;
                              const ocupados = bus?.capacidad_ocupados ?? Math.max(0, max - libres);
                              return `${libres} libres · ${ocupados}/${max} abordados`;
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">Horario programado</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {formatShiftWindow((scheduledShift || activeShift)!)}
                          </p>
                          {activeShift?.hora_inicio_real && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                              Inicio real: {new Date(activeShift.hora_inicio_real).toLocaleString('es-CO')}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Estado</p>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono mt-1 ${
                            activeShift 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' 
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                          }`}>
                            {activeShift ? 'EN CURSO' : 'PENDIENTE'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        {programadoFueraDeVentana
                          ? 'Tienes turno programado, pero aún no está dentro de la fecha/hora de inicio (o ya finalizó la ventana).'
                          : 'No tienes turnos programados para la fecha y hora actual.'}
                      </p>
                    )}
                  </div>

                  {!activeShift && scheduledShift && (
                    <button
                      onClick={() => setShowStartModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Iniciar Turno
                    </button>
                  )}
                </div>
              </div>

              {/* Recent Incident Report list */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Historial de Incidentes en tu Turno</h3>
                </div>

                {incidents.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {incidents.map((inc) => (
                      <div key={inc.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            inc.categoria === 'MECANICO' ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20' :
                            inc.categoria === 'ACCIDENTE' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20'
                          }`}>
                            <span className="text-lg">🚨</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{inc.categoria.toLowerCase()} — {inc.descripcion.slice(0, 30)}...</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              Reportado: {new Date(inc.fecha_reporte).toLocaleDateString('es-CO')} {new Date(inc.fecha_reporte).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          inc.estado === 'REPORTADO' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400' :
                          inc.estado === 'EN_REVISION' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}>
                          {inc.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                    <p className="text-sm">No has registrado incidentes en tu jornada.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: MIS TURNOS ── */}
          {currentTab === 'turnos' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Historial de Asignaciones</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Control de asistencia, horarios y kilómetros acumulados.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* List list */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Calendario de Turnos</h3>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Mayo / Junio 2026</span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {driverShifts.length > 0 ? (
                        driverShifts.map((s, index) => {
                          const dateObj = s.fecha_inicio ? new Date(s.fecha_inicio) : new Date();
                          const dia = dateObj.getDate();
                          const mes = dateObj.toLocaleString('es-CO', { month: 'short' });
                          return (
                            <div key={s.id || index} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center font-mono flex-shrink-0">
                                  <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">{mes}</span>
                                  <span className="text-base font-bold text-slate-800 dark:text-slate-200 leading-none mt-0.5">{dia}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Bus Placa: <span className="font-mono text-xs">{s.bus?.placa || 'N/A'}</span></p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {s.fecha_inicio ? new Date(s.fecha_inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '--:--'} - 
                                    {s.fecha_fin ? new Date(s.fecha_fin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono ${
                                isShiftEnCurso(s.estado)
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' 
                                  : shiftEstadoBase(s.estado) === 'completado' || shiftEstadoBase(s.estado) === 'finalizado'
                                  ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                              }`}>
                                {shiftEstadoBase(s.estado).toUpperCase() || '—'}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                          <p className="text-sm">No cuentas con asignaciones registradas.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar Summary */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Resumen de Actividades</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Asignaciones Totales</span>
                        <strong className="text-slate-900 dark:text-white">{driverShifts.length}</strong>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Horas Estimadas</span>
                        <strong className="text-slate-900 dark:text-white">{driverShifts.length * 8}h</strong>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Kilómetros</span>
                        <strong className="text-slate-900 dark:text-white">{driverShifts.length * 125} km</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Próxima Programación</h3>
                    {scheduledShift ? (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 font-mono text-xs">
                        <p className="font-bold text-slate-900 dark:text-white">Bus: {scheduledShift.bus?.placa}</p>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">{formatShiftWindow(scheduledShift)}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500">No hay programaciones futuras agendadas.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── TAB: INCIDENTE ── */}
          {currentTab === 'incidente' && activeShift && (
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Header Header */}
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reportar Incidente</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Formulario rápido de novedades. Se reportarán las coordenadas GPS y el bus asignado.</p>
              </div>

              {/* Status panels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 flex items-center gap-3">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Turno Activo</p>
                    <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-mono mt-0.5">Bus: {activeShift.bus?.placa}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Ubicación GPS</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {gpsCoords ? `${gpsCoords.latitude.toFixed(4)}° N, ${gpsCoords.longitude.toFixed(4)}° W` : 'Adquiriendo señal...'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold font-mono">
                    GPS ACTIVO
                  </span>
                </div>
              </div>

              {/* Incident Form Component Integration */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <IncidentReportForm
                  busId={activeShift.bus?.id || 0}
                  onSuccess={async () => {
                    showToast('Reporte de incidente enviado correctamente. Supervisor alertado.');
                    await loadData(); // Reload telemetry/lists
                    setCurrentTab('dashboard'); // Redirect to dashboard
                  }}
                  onCancel={() => setCurrentTab('dashboard')}
                />
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ── MODAL: INICIAR TURNO ── */}
      {showStartModal && scheduledShift && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl transition-all scale-100 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Iniciar Turno
              </h3>
              <button 
                onClick={() => setShowStartModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Shift Assignment Information info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-xs space-y-2 mb-4 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Bus Asignado:</span>
                <span className="font-bold text-slate-900 dark:text-white">{scheduledShift.bus?.placa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ventana programada:</span>
                <span className="font-bold text-slate-900 dark:text-white text-right max-w-[55%]">{formatShiftWindow(scheduledShift)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Modelo:</span>
                <span className="font-bold text-slate-900 dark:text-white">{scheduledShift.bus?.modelo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Empresa:</span>
                <span className="font-bold text-slate-900 dark:text-white">{driver?.company?.nombre || 'TransRápido'}</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Estado Inicial del Bus
                </label>
                <select
                  value={busStatus}
                  onChange={(e) => setBusStatus(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-900 dark:text-white font-medium"
                >
                  <option value="ok">Operativo — Sin Observaciones</option>
                  <option value="obs">Operativo — Con Observaciones</option>
                  <option value="rev">Requiere Revisión antes de Salir</option>
                </select>
              </div>

              {busStatus === 'obs' && (
                <div className="animate-in slide-in-from-top-2 duration-250">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Detalle de Observaciones
                  </label>
                  <textarea
                    value={busObservations}
                    onChange={(e) => setBusObservations(e.target.value)}
                    rows={2}
                    placeholder="Ej: espejo lateral izquierdo rayado, fisura en parabrisas..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Al iniciar el turno, se activará el rastreo de ubicación GPS en tu dispositivo.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                className="flex-1 p-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition"
                disabled={isStartingShift}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmStartShift}
                className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl text-sm transition shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2"
                disabled={isStartingShift}
              >
                {isStartingShift ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Iniciando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirmar Inicio
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all transform translate-y-0 opacity-100 animate-in slide-in-from-bottom-5 duration-300 border border-slate-800 dark:border-slate-200">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

export default ConductorShift;
