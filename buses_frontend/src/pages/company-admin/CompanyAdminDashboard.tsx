import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getBusinessAdminByUserId } from '../../services/businessAdminService';
import { getBuses, createBus, updateBus } from '../../services/busService';
import { getCompanyDrivers, createCompanyDriver, deleteCompanyDriver, updateCompanyDriver } from '../../services/companyDriverService';
import { getDrivers } from '../../services/driverService';
import { getIncidents, updateIncidentStatus } from '../../services/incidentsService';
import { getSchedules, createSchedule, deleteSchedule } from '../../services/schedulesService';
import { getRoutes } from '../../services/routesService';
import { getShifts } from '../../services/shiftService';
import type { Bus } from '../../types/bus.types';
import type { CompanyDriver } from '../../services/companyDriverService';
import type { Driver } from '../../types/driver.types';
import type { Incident } from '../../services/incidentsService';
import type { Schedule } from '../../types/schedule.types';
import type { Route } from '../../types/route.types';
import type { Shift } from '../../types/shift.types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

const CompanyAdminDashboard = () => {
  const { user, handleLogout } = useAuth();
  
  // Navigation State
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'incidentes' | 'programacion' | 'flota' | 'conductores' | 'reportes'>('dashboard');
  
  // Admin Context States
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState<string>('Mi Empresa');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Core Lists (Filtered by Company)
  const [buses, setBuses] = useState<Bus[]>([]);
  const [companyDrivers, setCompanyDrivers] = useState<CompanyDriver[]>([]);
  const [globalDrivers, setGlobalDrivers] = useState<Driver[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  // Selected Objects for Modals
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentComment, setIncidentComment] = useState('');
  const [newIncidentState, setNewIncidentState] = useState<string>('REPORTADO');
  const [isIncidentSubmitting, setIsIncidentSubmitting] = useState(false);
  
  // Create Bus Form States
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [busPlaca, setBusPlaca] = useState('');
  const [busModelo, setBusModelo] = useState('');
  const [busCapacidad, setBusCapacidad] = useState<number>(30);
  const [busStandingCap, setBusStandingCap] = useState<number>(15);
  const [busYear, setBusYear] = useState<number>(new Date().getFullYear());
  const [busInitialStatus, setBusInitialStatus] = useState<string>('available');
  const [isBusSubmitting, setIsBusSubmitting] = useState(false);
  
  // Create Schedule Form States
  const [isProgModalOpen, setIsProgModalOpen] = useState(false);
  const [progRouteId, setProgRouteId] = useState('');
  const [progBusId, setProgBusId] = useState<number | ''>('');
  const [progDriverId, setProgDriverId] = useState<number | ''>('');
  const [progFecha, setProgFecha] = useState(new Date().toISOString().split('T')[0]);
  const [progHora, setProgHora] = useState('08:00');
  const [progRecurrente, setProgRecurrente] = useState(false);
  const [progTipoRecurrencia, setProgTipoRecurrencia] = useState('Semanal');
  const [progTolerancia, setProgTolerancia] = useState<number>(5);
  const [isProgSubmitting, setIsProgSubmitting] = useState(false);
  
  // Filter States
  const [incFilterState, setIncFilterState] = useState<'TODOS' | 'REPORTADO' | 'EN_REVISION' | 'RESUELTO'>('TODOS');
  const [incFilterCategory, setIncFilterCategory] = useState<string>('TODOS');
  
  const [routeFilter, setRouteFilter] = useState<string>('TODAS');
  const [chartPeriod, setChartPeriod] = useState<'3m' | '6m' | '12m'>('6m');

  // Load Admin Profile and Core Data
  const loadCoreData = async () => {
    if (!user?.id) return;
    try {
      console.log('loadCoreData: Fetching admin profile for user.id:', user.id);
      const adminDetails = await getBusinessAdminByUserId(user.id);
      console.log('loadCoreData: getBusinessAdminByUserId response:', adminDetails);
      
      const companyIdResolved = adminDetails?.companyId || adminDetails?.company?.id;
      if (adminDetails && companyIdResolved) {
        setCompanyId(companyIdResolved);
        setCompanyName(adminDetails.company?.name || 'Mi Empresa');
        
        const companyIdFilter = companyIdResolved;

        // 2. Fetch all lists concurrently
        const [allBuses, allCompanyDrivers, allSystemDrivers, allIncidents, allSchedules, allRoutes, allShifts] = await Promise.all([
          getBuses(),
          getCompanyDrivers(),
          getDrivers(),
          getIncidents(),
          getSchedules(),
          getRoutes(),
          getShifts(),
        ]);

        console.log('loadCoreData: Fetched all lists concurrently.', {
          busesCount: allBuses.length,
          companyDriversCount: allCompanyDrivers.length,
          systemDriversCount: allSystemDrivers.length,
          incidentsCount: allIncidents.length,
          schedulesCount: allSchedules.length,
          routesCount: allRoutes.length,
          shiftsCount: allShifts.length,
        });

        // Filter Buses by Company
        const filteredBuses = allBuses.filter((b) => b.company?.id === companyIdFilter);
        setBuses(filteredBuses);

        // Filter Company Drivers
        const filteredCompanyDrivers = allCompanyDrivers.filter((cd) => cd.company?.id === companyIdFilter);
        setCompanyDrivers(filteredCompanyDrivers);
        
        // Filter Global Drivers that are NOT yet hired by this company
        const hiredDriverIds = new Set(filteredCompanyDrivers.map((cd) => cd.driver?.id).filter(Boolean));
        const unhiredDrivers = allSystemDrivers.filter((d) => d.id && !hiredDriverIds.has(d.id));
        setGlobalDrivers(unhiredDrivers);

        // Filter Incidents (related to buses belonging to this company)
        const busIds = new Set(filteredBuses.map((b) => b.id).filter(Boolean));
        const filteredIncidents = allIncidents.filter((inc) => 
          inc.incidentBuses?.some((ib) => ib.bus?.id !== undefined && busIds.has(Number(ib.bus.id)))
        );
        setIncidents(filteredIncidents);

        // Filter Schedules
        const filteredSchedules = allSchedules.filter((s) => s.bus?.id !== undefined && busIds.has(s.bus.id));
        setSchedules(filteredSchedules);

        setRoutes(allRoutes);
        
        // Filter Shifts
        const filteredShifts = allShifts.filter((s) => s.bus?.id !== undefined && busIds.has(s.bus.id));
        setShifts(filteredShifts);
      } else {
        console.warn('loadCoreData: No business admin association was found in ms-logic for user:', user);
        showToast('Atención: No tienes una empresa asociada a tu usuario de administrador.');
      }
    } catch (error) {
      console.error('Error loading Company Admin core data:', error);
      showToast('Error de conexión al cargar el panel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoreData();
  }, [user]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── INCIDENTS FLOWS ──
  const handleOpenIncidentModal = (inc: Incident) => {
    setSelectedIncident(inc);
    setNewIncidentState(inc.estado);
    setIncidentComment(inc.descripcion || '');
  };

  const handleUpdateIncident = async () => {
    if (!selectedIncident?.id) return;
    setIsIncidentSubmitting(true);
    try {
      await updateIncidentStatus(selectedIncident.id, newIncidentState);
      showToast(`Incidente actualizado a: ${newIncidentState}`);
      setSelectedIncident(null);
      await loadCoreData();
    } catch (err) {
      console.error(err);
      showToast('Error al actualizar el incidente.');
    } finally {
      setIsIncidentSubmitting(false);
    }
  };

  // ── BUS FLOTA FLOWS ──
  const handleRegisterBus = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleRegisterBus: Click event fired. Submitting form...', {
      placa: busPlaca,
      modelo: busModelo,
      capacidad: Number(busCapacidad) + Number(busStandingCap),
      estado: busInitialStatus,
      companyId: companyId
    });
    
    if (!companyId) {
      showToast('Error: Tu cuenta de administrador no tiene una empresa asociada asignada en el sistema. Contacta al Administrador de Sistema.');
      console.error('handleRegisterBus: Cannot register bus. companyId is null/falsy.');
      return;
    }
    
    setIsBusSubmitting(true);
    try {
      await createBus({
        placa: busPlaca.toUpperCase(),
        modelo: busModelo,
        capacidad: Number(busCapacidad) + Number(busStandingCap), // Total capacity
        estado: busInitialStatus,
        companyId: companyId
      });
      showToast('Bus registrado con éxito. QR Generado.');
      setIsBusModalOpen(false);
      // Reset form
      setBusPlaca(''); setBusModelo(''); setBusCapacidad(30); setBusStandingCap(15); setBusYear(new Date().getFullYear()); setBusInitialStatus('available');
      await loadCoreData();
    } catch (err: any) {
      console.error('handleRegisterBus error:', err);
      showToast(err.response?.data?.message || 'Error al registrar el bus. Intente de nuevo.');
    } finally {
      setIsBusSubmitting(false);
    }
  };

  // ── SHIFT SCHEDULING & VALIDATIONS FLOWS ──
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progRouteId || !progBusId || !progDriverId) {
      showToast('Por favor completa todos los campos.');
      return;
    }

    setIsProgSubmitting(true);
    try {
      // 1. Bus Collision Validation: Check if the selected bus already has a schedule at that date & time
      const isBusBusy = schedules.some((s) => 
        s.bus?.id === Number(progBusId) &&
        s.fecha === progFecha &&
        s.hora_salida === progHora &&
        s.estado?.toLowerCase() !== 'resuelto'
      );

      if (isBusBusy) {
        showToast('⚠️ Advertencia: El bus seleccionado ya se encuentra asignado a otra ruta en ese horario.');
        setIsProgSubmitting(false);
        return;
      }

      // 2. Driver active Shift Check: Check if driver has a registered shift covering that day/time
      const hasDriverShift = shifts.some((sh) =>
        sh.driver?.id === Number(progDriverId) &&
        sh.estado?.toLowerCase() === 'en_curso'
      );

      if (!hasDriverShift) {
        showToast('⚠️ Advertencia: El conductor seleccionado no cuenta con un turno activo/programado para ese horario.');
        setIsProgSubmitting(false);
        return;
      }

      // 3. Save Schedule to Database
      await createSchedule({
        fecha: progFecha,
        hora_salida: progHora,
        tolerancia_minutos: Number(progTolerancia),
        es_recurrente: progRecurrente,
        tipo_recurrencia: progRecurrente ? progTipoRecurrencia : 'ninguna',
        estado: 'programado',
        routeId: progRouteId,
        busId: Number(progBusId)
      });

      showToast('¡Servicio programado con éxito!');
      setIsProgModalOpen(false);
      // Reset
      setProgRouteId(''); setProgBusId(''); setProgDriverId(''); setProgFecha(new Date().toISOString().split('T')[0]); setProgHora('08:00'); setProgRecurrente(false);
      await loadCoreData();
    } catch (err) {
      console.error(err);
      showToast('Error al registrar la programación.');
    } finally {
      setIsProgSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta programación?')) return;
    try {
      await deleteSchedule(id);
      showToast('Programación eliminada con éxito.');
      await loadCoreData();
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar la programación.');
    }
  };

  // ── DRIVERS FLOWS ──
  const handleHireDriver = async (driverId: number) => {
    if (!companyId) return;
    try {
      await createCompanyDriver({
        companyId,
        driverId
      });
      showToast('Conductor vinculado con éxito a tu flota.');
      await loadCoreData();
    } catch (err) {
      console.error(err);
      showToast('Error al vincular al conductor.');
    }
  };

  const handleToggleDriverStatus = async (id: number, currentStatus?: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateCompanyDriver(id, { status: nextStatus });
      showToast(`Conductor marcado como: ${nextStatus === 'ACTIVE' ? 'Disponible' : 'No disponible'}`);
      await loadCoreData();
    } catch (err) {
      console.error(err);
      showToast('Error al modificar el estado.');
    }
  };

  const handleFireDriver = async (id: number) => {
    if (!confirm('¿Deseas desvincular a este conductor de la flota de tu empresa?')) return;
    try {
      await deleteCompanyDriver(id);
      showToast('Conductor desvinculado con éxito.');
      await loadCoreData();
    } catch (err) {
      console.error(err);
      showToast('Error al desvincular al conductor.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando panel de administrador de empresa..." />;
  }

  // INCIDENTS FILTERS
  const filteredIncidentList = incidents.filter((inc) => {
    const matchesState = incFilterState === 'TODOS' || inc.estado === incFilterState;
    const matchesCat = incFilterCategory === 'TODOS' || inc.categoria === incFilterCategory;
    return matchesState && matchesCat;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans transition-colors duration-200">
      
      {/* ── TOPBAR ── */}
      <header className="h-16 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between px-6 z-40 sticky top-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-sm block tracking-wide">Buses Inteligentes</span>
            <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase mt-0.5 inline-block">admin-empresa</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => showToast('Notificaciones al día')} className="p-2 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition" title="Notificaciones">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-xs shadow">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* ── LAYOUT CONTAINER ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ── SIDEBAR ── */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between p-4 flex-shrink-0">
          <div className="space-y-6">
            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/60">
              <p className="font-bold text-xs text-white truncate">{user?.name || 'Administrador'}</p>
              <p className="text-[10px] text-blue-400 font-mono mt-1 uppercase">Empresa</p>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{companyName}</p>
            </div>

            {/* Navigation links */}
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-mono tracking-widest text-slate-600 px-3 block">General</span>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <i className="ti ti-layout-dashboard text-base"></i>Dashboard
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] uppercase font-mono tracking-widest text-slate-600 px-3 block">Operación</span>
              
              <button
                onClick={() => setCurrentTab('incidentes')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentTab === 'incidentes'
                    ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <i className="ti ti-alert-triangle text-base"></i>Incidentes
                {incidents.filter(i => i.estado === 'REPORTADO').length > 0 && (
                  <span className="ml-auto font-mono text-[9px] bg-rose-950 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/25">
                    {incidents.filter(i => i.estado === 'REPORTADO').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setCurrentTab('programacion')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentTab === 'programacion'
                    ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <i className="ti ti-calendar-event text-base"></i>Programación
              </button>

              <button
                onClick={() => setCurrentTab('flota')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentTab === 'flota'
                    ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <i className="ti ti-bus text-base"></i>Flota (Buses)
              </button>

              <button
                onClick={() => setCurrentTab('conductores')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentTab === 'conductores'
                    ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <i className="ti ti-users text-base"></i>Conductores
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] uppercase font-mono tracking-widest text-slate-600 px-3 block">Analítica</span>
              <button
                onClick={() => setCurrentTab('reportes')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentTab === 'reportes'
                    ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <i className="ti ti-chart-bar text-base"></i>Reportes de Negocio
              </button>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-xl text-xs font-semibold transition">
            <i className="ti ti-logout text-base"></i>Cerrar Sesión
          </button>
        </aside>

        {/* ── MAIN WORKSPACE ── */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-900/40">
          
          {/* ═══════ TAB: DASHBOARD ═══════ */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Panel de Flota</h1>
                  <p className="text-xs text-slate-400 mt-1">{companyName} · Control operativo global</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-800 transition">
                  <span className="text-[10px] text-slate-500 font-mono tracking-wide block uppercase">Buses en Flota</span>
                  <span className="text-3xl font-extrabold text-blue-400 mt-2 block font-mono">{buses.length}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Vehículos de pasajeros</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-800 transition">
                  <span className="text-[10px] text-slate-500 font-mono tracking-wide block uppercase">Conductores</span>
                  <span className="text-3xl font-extrabold text-emerald-400 mt-2 block font-mono">
                    {companyDrivers.filter(cd => cd.status === 'ACTIVE').length}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Activos de {companyDrivers.length} contratados</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-800 transition">
                  <span className="text-[10px] text-slate-500 font-mono tracking-wide block uppercase">Incidentes Activos</span>
                  <span className="text-3xl font-extrabold text-amber-400 mt-2 block font-mono">
                    {incidents.filter((i) => i.estado !== 'RESUELTO').length}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Requieren gestión</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-800 transition">
                  <span className="text-[10px] text-slate-500 font-mono tracking-wide block uppercase">Servicios Hoy</span>
                  <span className="text-3xl font-extrabold text-purple-400 mt-2 block font-mono">{schedules.length}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Rutas programadas</span>
                </div>
              </div>

              {/* Grid split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Daily shifts */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-3">
                    <h3 className="font-bold text-xs uppercase font-mono tracking-wide text-slate-300 flex items-center gap-2">
                      <i className="ti ti-calendar-event"></i> Asignaciones del Día
                    </h3>
                    <button onClick={() => setCurrentTab('programacion')} className="text-xs text-blue-400 font-semibold hover:underline">Gestionar</button>
                  </div>

                  {schedules.length > 0 ? (
                    <div className="space-y-3">
                      {schedules.slice(0, 4).map((s) => (
                        <div key={s.id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/40 flex justify-between items-center gap-3">
                          <div>
                            <p className="text-sm font-bold text-white">{s.route?.codigo} — {s.route?.nombre}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Bus: {s.bus?.placa} · Salida: {s.hora_salida} · Tolerancia: ±{s.tolerancia_minutos} min
                            </p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            s.estado === 'programado' ? 'bg-blue-950 text-blue-400 border border-blue-500/25' :
                            s.estado === 'en_curso' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/25' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {s.estado}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p className="text-sm">No hay servicios programados hoy.</p>
                    </div>
                  )}
                </div>

                {/* Recents Incidents */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-3">
                    <h3 className="font-bold text-xs uppercase font-mono tracking-wide text-slate-300 flex items-center gap-2">
                      <i className="ti ti-alert-triangle"></i> Novedades en Flota
                    </h3>
                    <button onClick={() => setCurrentTab('incidentes')} className="text-xs text-blue-400 font-semibold hover:underline">Ver Todos</button>
                  </div>

                  {incidents.length > 0 ? (
                    <div className="space-y-3">
                      {incidents.slice(0, 3).map((inc) => (
                        <div key={inc.id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/40 flex justify-between items-center gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🚨</span>
                            <div>
                              <p className="text-sm font-semibold text-white truncate max-w-[200px] capitalize">{inc.type.toLowerCase()} — {inc.description.slice(0, 20)}...</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Fecha: {new Date(inc.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                            inc.severity === 'BAJO' ? 'bg-blue-950 text-blue-400 border border-blue-500/25' :
                            inc.severity === 'MEDIO' ? 'bg-amber-950 text-amber-400 border border-amber-500/25' : 'bg-rose-950 text-rose-400 border border-rose-500/25'
                          }`}>
                            {inc.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p className="text-sm">Sin reportes pendientes.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ═══════ TAB: INCIDENTES ═══════ */}
          {currentTab === 'incidentes' && (
            <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Centro de Novedades de la Flota</h1>
                  <p className="text-xs text-slate-400 mt-1">Supervisión, trazabilidad y resolución de incidentes reportados por conductores.</p>
                </div>
              </div>

              {/* Incidents filters */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">Estado:</span>
                  {(['TODOS', 'REPORTADO', 'EN_REVISION', 'RESUELTO'] as any[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => setIncFilterState(st)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold border transition ${
                        incFilterState === st
                          ? 'bg-blue-600/15 border-blue-500/40 text-blue-400'
                          : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono">Tipo:</span>
                  <select
                    value={incFilterCategory}
                    onChange={(e) => setIncFilterCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none"
                  >
                    <option value="TODOS">Todos los tipos</option>
                    <option value="MECANICO">Mecánico</option>
                    <option value="ACCIDENTE">Accidente</option>
                    <option value="RETRASO">Retraso</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>

              {/* Incident list display */}
              <div className="space-y-3">
                {filteredIncidentList.length > 0 ? (
                  filteredIncidentList.map((inc) => (
                    <div key={inc.id} className="p-5 bg-slate-950 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-800 transition">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          inc.type === 'MECANICO' ? 'bg-orange-950/20 text-orange-400' :
                          inc.type === 'ACCIDENTE' ? 'bg-red-950/20 text-red-400' : 'bg-blue-950/20 text-blue-400'
                        }`}>
                          <span className="text-xl">🚨</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white capitalize">{inc.type.toLowerCase()}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                              inc.severity === 'BAJO' ? 'bg-blue-950 text-blue-400 border border-blue-500/25' :
                              inc.severity === 'MEDIO' ? 'bg-amber-950 text-amber-400 border border-amber-500/25' :
                              inc.severity === 'ALTA' ? 'bg-orange-950 text-orange-400 border border-orange-500/25' : 'bg-rose-950 text-rose-400 border border-rose-500/25'
                            }`}>
                              {inc.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-2 leading-relaxed">{inc.description}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-3">
                            Reportado: {new Date(inc.date).toLocaleString()} · GPS: Armenia, Col
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 flex-shrink-0 w-full md:w-auto border-t md:border-t-0 border-slate-900 pt-3 md:pt-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          inc.estado === 'REPORTADO' ? 'bg-rose-950 text-rose-400 border border-rose-500/25' :
                          inc.estado === 'EN_REVISION' ? 'bg-amber-950 text-amber-400 border border-amber-500/25' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/25'
                        }`}>
                          {inc.estado}
                        </span>
                        
                        <button
                          onClick={() => handleOpenIncidentModal(inc)}
                          className="w-full md:w-auto px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                        >
                          Gestionar Caso
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-950 p-10 rounded-2xl border border-slate-800/80 text-center text-slate-500">
                    <p className="text-sm">No se encontraron incidentes que coincidan con los filtros.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ TAB: PROGRAMACION ═══════ */}
          {currentTab === 'programacion' && (
            <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Programación de Servicios</h1>
                  <p className="text-xs text-slate-400 mt-1">Asignación de buses a rutas para operar de forma planificada.</p>
                </div>
                <button
                  onClick={() => setIsProgModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-blue-600/10 flex items-center gap-2"
                >
                  <i className="ti ti-plus"></i> Nueva Programación
                </button>
              </div>

              {/* Table list */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/50">
                        <th className="text-[10px] text-slate-500 font-mono uppercase tracking-wider p-4">Hora salida</th>
                        <th className="text-[10px] text-slate-500 font-mono uppercase tracking-wider p-4">Ruta</th>
                        <th className="text-[10px] text-slate-500 font-mono uppercase tracking-wider p-4">Bus</th>
                        <th className="text-[10px] text-slate-500 font-mono uppercase tracking-wider p-4">Tolerancia</th>
                        <th className="text-[10px] text-slate-500 font-mono uppercase tracking-wider p-4">Recurrencia</th>
                        <th className="text-[10px] text-slate-500 font-mono uppercase tracking-wider p-4">Estado</th>
                        <th className="text-[10px] text-slate-500 font-mono uppercase tracking-wider p-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {schedules.length > 0 ? (
                        schedules.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-900/30">
                            <td className="p-4 font-mono font-medium text-xs text-slate-300">{s.hora_salida}</td>
                            <td className="p-4 text-xs font-bold text-white">
                              {s.route?.codigo} — {s.route?.nombre}
                            </td>
                            <td className="p-4 font-mono text-xs text-slate-300">{s.bus?.placa}</td>
                            <td className="p-4 font-mono text-xs text-slate-400">±{s.tolerancia_minutos} min</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-blue-950 text-blue-400">
                                {s.es_recurrente ? s.tipo_recurrencia : 'única'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                                s.estado === 'programado' ? 'bg-blue-950 text-blue-400' : 'bg-emerald-950 text-emerald-400'
                              }`}>
                                {s.estado}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDeleteSchedule(s.id)}
                                className="p-1 text-slate-500 hover:text-red-400 transition"
                                title="Eliminar"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center p-10 text-slate-500 text-sm">
                            No hay asignaciones programadas. ¡Crea una nueva!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ TAB: FLOTA ═══════ */}
          {currentTab === 'flota' && (
            <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Administración de Buses</h1>
                  <p className="text-xs text-slate-400 mt-1">Control de flota, estados operativos e identificadores digitales QR únicos.</p>
                </div>
                <button
                  onClick={() => setIsBusModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-blue-600/10 flex items-center gap-2"
                >
                  <i className="ti ti-plus"></i> Registrar Vehículo
                </button>
              </div>

              {/* Fleet grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {buses.length > 0 ? (
                  buses.map((bus) => (
                    <div key={bus.id} className="bg-slate-950 border border-slate-800/80 rounded-3xl p-5 hover:border-slate-800 transition flex flex-col justify-between min-h-[220px]">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <p className="font-mono text-base font-bold text-white tracking-wider">{bus.placa}</p>
                           <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            bus.estado?.toLowerCase().includes('available') || bus.estado?.toLowerCase().includes('operativo') ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/25' :
                            bus.estado?.toLowerCase().includes('maintenance') || bus.estado?.toLowerCase().includes('mantenimiento') ? 'bg-amber-950 text-amber-400 border border-amber-500/25' : 'bg-rose-950 text-rose-400 border border-rose-500/25'
                          }`}>
                            {bus.estado === 'available' ? 'Operativo' : bus.estado === 'maintenance' ? 'Mantenimiento' : bus.estado === 'out of service' ? 'Fuera de Servicio' : bus.estado}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{bus.modelo || 'Mercedes-Benz Volksbus'}</p>
                        
                        <div className="flex gap-8 mt-4">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono block">Capacidad</span>
                            <span className="text-sm font-bold text-slate-300 font-mono mt-0.5">{bus.capacidad || 45} pas.</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-end justify-between mt-6 pt-4 border-t border-slate-900/60">
                        {/* Auto-generated QR code */}
                        <div className="bg-white p-1 rounded-lg flex items-center justify-center shadow-sm" title="Escanear QR de Identificación del Bus">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=BUS:${bus.placa}`}
                            alt="Bus QR ID"
                            className="w-12 h-12"
                          />
                        </div>
                        
                        <button
                          onClick={() => showToast('Módulo de edición en desarrollo')}
                          className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full bg-slate-950 p-10 rounded-2xl border border-slate-800/80 text-center text-slate-500">
                    <p className="text-sm">No cuentas con vehículos registrados en tu flota.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ TAB: CONDUCTORES ═══════ */}
          {currentTab === 'conductores' && (
            <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Gestión de Conductores</h1>
                  <p className="text-xs text-slate-400 mt-1">Vincula, habilita y desvincula conductores para la flota de tu empresa.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Active Drivers */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
                    <h3 className="font-bold text-xs uppercase font-mono tracking-wide text-slate-300 mb-4 pb-2 border-b border-slate-900">
                      Personal Contratado ({companyDrivers.length})
                    </h3>

                    <div className="divide-y divide-slate-900">
                      {companyDrivers.length > 0 ? (
                        companyDrivers.map((cd) => (
                          <div key={cd.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {cd.driver?.name} {cd.driver?.last_name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Licencia: {cd.driver?.licencia || 'A3-Federal'} · Email: {cd.driver?.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleDriverStatus(cd.id!, cd.status)}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono border transition ${
                                  cd.status === 'ACTIVE'
                                    ? 'bg-emerald-950 border-emerald-500/20 text-emerald-400'
                                    : 'bg-slate-900 border-slate-800 text-slate-500'
                                }`}
                              >
                                {cd.status === 'ACTIVE' ? 'Disponible' : 'Inactivo'}
                              </button>
                              
                              <button
                                onClick={() => handleFireDriver(cd.id!)}
                                className="p-1.5 bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/20 rounded-xl transition"
                                title="Desvincular"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <p className="text-sm">No tienes conductores contratados en tu empresa.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hire New Drivers catalog */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 h-fit">
                  <h3 className="font-bold text-xs uppercase font-mono tracking-wide text-slate-300 mb-4 pb-2 border-b border-slate-900">
                    Contratar de la Bolsa de Conductores ({globalDrivers.length})
                  </h3>

                  <div className="divide-y divide-slate-900 space-y-3">
                    {globalDrivers.length > 0 ? (
                      globalDrivers.map((d) => (
                        <div key={d.id} className="pt-3 first:pt-0 flex flex-col justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-white">{d.name} {d.last_name}</p>
                            <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">Email: {d.email}</p>
                          </div>
                          <button
                            onClick={() => handleHireDriver(d.id!)}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] py-2 rounded-xl transition shadow"
                          >
                            Contratar Conductor
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 py-4">No hay conductores libres disponibles en la bolsa de trabajo en este momento.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ═══════ TAB: REPORTES ═══════ */}
          {currentTab === 'reportes' && (
            <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Reportes y Analítica</h1>
                  <p className="text-xs text-slate-400 mt-1">Evolución financiera de ventas por canal, demografía y tendencias de incidentes.</p>
                </div>
              </div>

              {/* Chart 1: Bar chart grouped SVG for monthly income */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xs uppercase font-mono tracking-wide text-slate-300 flex items-center gap-2">
                    <i className="ti ti-chart-bar"></i> Evolución de Ingresos Mensuales por Método de Pago
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => setChartPeriod('3m')} className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono border ${chartPeriod === '3m' ? 'bg-blue-600/15 border-blue-500/40 text-blue-400' : 'border-slate-800 text-slate-500'}`}>3m</button>
                    <button onClick={() => setChartPeriod('6m')} className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono border ${chartPeriod === '6m' ? 'bg-blue-600/15 border-blue-500/40 text-blue-400' : 'border-slate-800 text-slate-500'}`}>6m</button>
                    <button onClick={() => setChartPeriod('12m')} className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono border ${chartPeriod === '12m' ? 'bg-blue-600/15 border-blue-500/40 text-blue-400' : 'border-slate-800 text-slate-500'}`}>12m</button>
                  </div>
                </div>

                <div className="w-full overflow-hidden">
                  {/* responsive pure SVG bar graph */}
                  <svg viewBox="0 0 600 200" className="w-full h-48">
                    {/* Gridlines */}
                    <line x1="40" y1="20" x2="580" y2="20" stroke="#1e293b" strokeWidth="0.5" />
                    <line x1="40" y1="60" x2="580" y2="60" stroke="#1e293b" strokeWidth="0.5" />
                    <line x1="40" y1="100" x2="580" y2="100" stroke="#1e293b" strokeWidth="0.5" />
                    <line x1="40" y1="140" x2="580" y2="140" stroke="#1e293b" strokeWidth="0.5" />
                    <line x1="40" y1="170" x2="580" y2="170" stroke="#334155" strokeWidth="1" />

                    {/* Y-axis values */}
                    <text x="10" y="25" fill="#64748b" fontSize="9" fontFamily="monospace">$50M</text>
                    <text x="10" y="65" fill="#64748b" fontSize="9" fontFamily="monospace">$30M</text>
                    <text x="10" y="105" fill="#64748b" fontSize="9" fontFamily="monospace">$20M</text>
                    <text x="10" y="145" fill="#64748b" fontSize="9" fontFamily="monospace">$10M</text>
                    <text x="20" y="174" fill="#64748b" fontSize="9" fontFamily="monospace">$0</text>

                    {/* Grouped Bars: Jan, Feb, Mar, Apr, May, Jun */}
                    {/* Jan */}
                    <g transform="translate(60, 0)">
                      <rect x="0" y="90" width="8" height="80" fill="#4F8EF7" rx="1" />
                      <rect x="10" y="110" width="8" height="60" fill="#34D399" rx="1" />
                      <rect x="20" y="120" width="8" height="50" fill="#FBBF24" rx="1" />
                      <rect x="30" y="150" width="8" height="20" fill="#A78BFA" rx="1" />
                      <text x="20" y="188" fill="#64748b" fontSize="10" textAnchor="middle">Ene</text>
                    </g>
                    {/* Feb */}
                    <g transform="translate(150, 0)">
                      <rect x="0" y="80" width="8" height="90" fill="#4F8EF7" rx="1" />
                      <rect x="10" y="100" width="8" height="70" fill="#34D399" rx="1" />
                      <rect x="20" y="115" width="8" height="55" fill="#FBBF24" rx="1" />
                      <rect x="30" y="145" width="8" height="25" fill="#A78BFA" rx="1" />
                      <text x="20" y="188" fill="#64748b" fontSize="10" textAnchor="middle">Feb</text>
                    </g>
                    {/* Mar */}
                    <g transform="translate(240, 0)">
                      <rect x="0" y="70" width="8" height="100" fill="#4F8EF7" rx="1" />
                      <rect x="10" y="90" width="8" height="80" fill="#34D399" rx="1" />
                      <rect x="20" y="105" width="8" height="65" fill="#FBBF24" rx="1" />
                      <rect x="30" y="140" width="8" height="30" fill="#A78BFA" rx="1" />
                      <text x="20" y="188" fill="#64748b" fontSize="10" textAnchor="middle">Mar</text>
                    </g>
                    {/* Apr */}
                    <g transform="translate(330, 0)">
                      <rect x="0" y="60" width="8" height="110" fill="#4F8EF7" rx="1" />
                      <rect x="10" y="85" width="8" height="85" fill="#34D399" rx="1" />
                      <rect x="20" y="95" width="8" height="75" fill="#FBBF24" rx="1" />
                      <rect x="30" y="130" width="8" height="40" fill="#A78BFA" rx="1" />
                      <text x="20" y="188" fill="#64748b" fontSize="10" textAnchor="middle">Abr</text>
                    </g>
                    {/* May */}
                    <g transform="translate(420, 0)">
                      <rect x="0" y="50" width="8" height="120" fill="#4F8EF7" rx="1" />
                      <rect x="10" y="70" width="8" height="100" fill="#34D399" rx="1" />
                      <rect x="20" y="80" width="8" height="90" fill="#FBBF24" rx="1" />
                      <rect x="30" y="120" width="8" height="50" fill="#A78BFA" rx="1" />
                      <text x="20" y="188" fill="#64748b" fontSize="10" textAnchor="middle">May</text>
                    </g>
                    {/* Jun */}
                    <g transform="translate(510, 0)">
                      <rect x="0" y="40" width="8" height="130" fill="#4F8EF7" rx="1" />
                      <rect x="10" y="60" width="8" height="110" fill="#34D399" rx="1" />
                      <rect x="20" y="75" width="8" height="95" fill="#FBBF24" rx="1" />
                      <rect x="30" y="115" width="8" height="55" fill="#A78BFA" rx="1" />
                      <text x="20" y="188" fill="#64748b" fontSize="10" textAnchor="middle">Jun</text>
                    </g>
                  </svg>
                </div>

                <div className="flex flex-wrap gap-4 mt-4 border-t border-slate-900 pt-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span>
                    <span>T. Débito ($48.2M)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm"></span>
                    <span>T. Crédito ($36.5M)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm"></span>
                    <span>T. Inteligente ($24.8M)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-purple-400 rounded-sm"></span>
                    <span>Efectivo ($12.1M)</span>
                  </div>
                </div>
              </div>

              {/* Grid 2 report */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Age Circular Donut */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
                  <h3 className="font-bold text-xs uppercase font-mono tracking-wide text-slate-300 mb-6 flex items-center gap-2">
                    <i className="ti ti-chart-pie"></i> Demografía y Edad de Pasajeros
                  </h3>

                  <div className="flex items-center justify-around gap-6 flex-wrap">
                    {/* SVG circular donut chart */}
                    <div className="relative w-36 h-36 flex-shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        {/* Gray base circle */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1e293b" strokeWidth="3" />
                        
                        {/* Slice 1: Jóvenes 32% */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#4F8EF7" strokeWidth="3"
                          strokeDasharray="32 68" strokeDashoffset="0" />
                        {/* Slice 2: Adultos Jóvenes 28% */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#34D399" strokeWidth="3"
                          strokeDasharray="28 72" strokeDashoffset="-32" />
                        {/* Slice 3: Adultos 22% */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#FBBF24" strokeWidth="3"
                          strokeDasharray="22 78" strokeDashoffset="-60" />
                        {/* Slice 4: Mayores 11% */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#A78BFA" strokeWidth="3"
                          strokeDasharray="11 89" strokeDashoffset="-82" />
                        {/* Slice 5: Menores 7% */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F87171" strokeWidth="3"
                          strokeDasharray="7 93" strokeDashoffset="-93" />
                      </svg>
                      {/* Inside center text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-bold text-white font-mono leading-none">3,241</span>
                        <span className="text-[9px] text-slate-500 font-mono mt-1">pasajeros</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2.5 text-xs text-slate-400 min-w-[200px]">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>Jóvenes (18-25)</span>
                        <strong className="text-white font-mono">32%</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>Adulto Joven (26-40)</span>
                        <strong className="text-white font-mono">28%</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-amber-400 rounded-full"></span>Adultos (41-60)</span>
                        <strong className="text-white font-mono">22%</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-purple-400 rounded-full"></span>Mayores (60+)</span>
                        <strong className="text-white font-mono">11%</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-rose-400 rounded-full"></span>Menores (0-17)</span>
                        <strong className="text-white font-mono">7%</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Incidents Trend Line SVG */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
                  <h3 className="font-bold text-xs uppercase font-mono tracking-wide text-slate-300 mb-6 flex items-center gap-2">
                    <i className="ti ti-trending-up"></i> Tendencias de Incidentes Anuales
                  </h3>

                  <div className="w-full">
                    {/* SVG Line Graph */}
                    <svg viewBox="0 0 400 120" className="w-full h-32">
                      <line x1="20" y1="10" x2="380" y2="10" stroke="#1e293b" strokeWidth="0.5" />
                      <line x1="20" y1="50" x2="380" y2="50" stroke="#1e293b" strokeWidth="0.5" />
                      <line x1="20" y1="90" x2="380" y2="90" stroke="#1e293b" strokeWidth="0.5" />
                      <line x1="20" y1="110" x2="380" y2="110" stroke="#334155" strokeWidth="1" />

                      {/* Line 1: Mecanicos (Rose) */}
                      <path d="M20,90 Q80,50 140,80 T260,30 T380,60" fill="none" stroke="#F87171" strokeWidth="2.5" />
                      <circle cx="20" cy="90" r="3.5" fill="#F87171" />
                      <circle cx="140" cy="80" r="3.5" fill="#F87171" />
                      <circle cx="260" cy="30" r="3.5" fill="#F87171" />
                      <circle cx="380" cy="60" r="3.5" fill="#F87171" />

                      {/* Line 2: Accidentes (Amber) */}
                      <path d="M20,110 Q80,90 140,100 T260,70 T380,85" fill="none" stroke="#FBBF24" strokeWidth="2" />
                      <circle cx="20" cy="110" r="3" fill="#FBBF24" />
                      <circle cx="140" cy="100" r="3" fill="#FBBF24" />
                      <circle cx="260" cy="70" r="3" fill="#FBBF24" />
                      <circle cx="380" cy="85" r="3" fill="#FBBF24" />
                    </svg>

                    <div className="flex gap-4 mt-3 justify-center text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-0.5 bg-rose-400 inline-block"></span>
                        <span>Mecánicos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-0.5 bg-amber-400 inline-block"></span>
                        <span>Accidentes</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── MODAL: GESTIONAR INCIDENTE ── */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="text-rose-500">🚨</span>
                Gestionar Reporte de Incidente
              </h3>
              <button onClick={() => setSelectedIncident(null)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition">
                <i className="ti ti-x text-lg"></i>
              </button>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/60 text-xs space-y-2 mb-4 font-mono">
              <div className="grid grid-cols-2 gap-y-2">
                <div><span className="text-slate-500">Categoría:</span> <span className="font-bold text-slate-300 capitalize">{selectedIncident.type.toLowerCase()}</span></div>
                <div><span className="text-slate-500">Gravedad:</span> <span className="font-bold text-slate-300">{selectedIncident.severity}</span></div>
                <div><span className="text-slate-500">Conductor:</span> <span className="font-bold text-slate-300">{selectedIncident.shift?.driver?.nombres || 'Pérez'}</span></div>
                <div><span className="text-slate-500">Bus:</span> <span className="font-bold text-slate-300">{selectedIncident.shift?.bus?.placa || 'DEF-456'}</span></div>
                <div className="col-span-2"><span className="text-slate-500">Fecha:</span> <span className="font-bold text-slate-300">{new Date(selectedIncident.date).toLocaleString()}</span></div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción del Conductor</span>
                <p className="text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-slate-800/40 leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              {selectedIncident.incidentBuses?.[0]?.photos?.[0] && (
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Evidencia Fotográfica</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedIncident.incidentBuses[0].photos.map((ph) => (
                      <div key={ph.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-800 flex-shrink-0 shadow">
                        {/* Using static preview, if URL is invalid mock it */}
                        <img
                          src={ph.url_imagen || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150'}
                          alt="Evidencia"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <hr className="border-slate-900" />

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cambiar Estado</label>
                <select
                  value={newIncidentState}
                  onChange={(e) => setNewIncidentState(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-300 font-medium"
                >
                  <option value="REPORTADO">Reportado (Pendiente)</option>
                  <option value="EN_REVISION">En Revisión</option>
                  <option value="RESUELTO">Resuelto (Cerrar caso)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Observaciones de Seguimiento</label>
                <textarea
                  value={incidentComment}
                  onChange={(e) => setIncidentComment(e.target.value)}
                  rows={2}
                  placeholder="Detalles sobre asistencia mecánica enviada, repuesto reparado, etc."
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-300"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-900/60">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="flex-1 p-3 border border-slate-800 hover:bg-slate-900 text-slate-400 font-bold rounded-xl text-sm transition"
                disabled={isIncidentSubmitting}
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleUpdateIncident}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
                disabled={isIncidentSubmitting}
              >
                {isIncidentSubmitting ? 'Guardando...' : 'Aplicar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REGISTRAR BUS ── */}
      {isBusModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form onSubmit={handleRegisterBus} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <i className="ti ti-bus text-blue-500 text-base"></i>
                Registrar Nuevo Bus en Flota
              </h3>
              <button type="button" onClick={() => setIsBusModalOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition">
                <i className="ti ti-x text-lg"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Placa del Bus</label>
                  <input
                    required
                    type="text"
                    placeholder="ABC-123"
                    value={busPlaca}
                    onChange={(e) => setBusPlaca(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Modelo / Chasis</label>
                  <input
                    required
                    type="text"
                    placeholder="Volksbus OF-1721"
                    value={busModelo}
                    onChange={(e) => setBusModelo(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sentados</label>
                  <input
                    required
                    type="number"
                    value={busCapacidad}
                    onChange={(e) => setBusCapacidad(Number(e.target.value))}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">De Pie</label>
                  <input
                    required
                    type="number"
                    value={busStandingCap}
                    onChange={(e) => setBusStandingCap(Number(e.target.value))}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Año Fab.</label>
                  <input
                    required
                    type="number"
                    value={busYear}
                    onChange={(e) => setBusYear(Number(e.target.value))}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estado Inicial</label>
                <select
                  value={busInitialStatus}
                  onChange={(e) => setBusInitialStatus(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-300 font-medium"
                >
                  <option value="available">Operativo (Habilitado)</option>
                  <option value="maintenance">Mantenimiento Preventivo</option>
                  <option value="out of service">Fuera de Servicio</option>
                </select>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/40 text-[10px] text-slate-500 leading-normal flex items-start gap-2.5">
                <i className="ti ti-info-circle text-sm text-blue-400 flex-shrink-0"></i>
                <span>El sistema autogenerará un código de identificación QR único vinculado a la placa para colocar en los paraderos y buses físicamente.</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsBusModalOpen(false)}
                className="flex-1 p-3 border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold rounded-xl text-sm transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
                disabled={isBusSubmitting}
              >
                {isBusSubmitting ? 'Guardando...' : 'Registrar Bus'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: NUEVA PROGRAMACIÓN ── */}
      {isProgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCreateSchedule} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <i className="ti ti-calendar-plus text-blue-500 text-base"></i>
                Programar Asignación de Ruta
              </h3>
              <button type="button" onClick={() => setIsProgModalOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition">
                <i className="ti ti-x text-lg"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ruta Operativa</label>
                  <select
                    required
                    value={progRouteId}
                    onChange={(e) => setProgRouteId(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-300 font-medium"
                  >
                    <option value="">Selecciona...</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>{r.codigo} — {r.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bus</label>
                  <select
                    required
                    value={progBusId}
                    onChange={(e) => setProgBusId(Number(e.target.value))}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-300 font-medium"
                  >
                    <option value="">Selecciona...</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.placa} ({b.estado === 'available' ? 'Operativo' : b.estado === 'maintenance' ? 'Mantenimiento' : b.estado === 'out of service' ? 'Fuera de Servicio' : b.estado})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha</label>
                  <input
                    required
                    type="date"
                    value={progFecha}
                    onChange={(e) => setProgFecha(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hora de Salida</label>
                  <input
                    required
                    type="text"
                    placeholder="08:00"
                    value={progHora}
                    onChange={(e) => setProgHora(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Conductor</label>
                <select
                  required
                  value={progDriverId}
                  onChange={(e) => setProgDriverId(Number(e.target.value))}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-300 font-medium"
                >
                  <option value="">Selecciona...</option>
                  {companyDrivers.map((cd) => (
                    <option key={cd.id} value={cd.driver?.id}>{cd.driver?.name} {cd.driver?.last_name} ({cd.status === 'ACTIVE' ? 'Disponible' : 'Inactivo'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <input
                      type="checkbox"
                      checked={progRecurrente}
                      onChange={(e) => setProgRecurrente(e.target.checked)}
                      className="w-4 h-4 bg-slate-900 rounded"
                    />
                    ¿Es Recurrente?
                  </label>
                  
                  {progRecurrente && (
                    <select
                      value={progTipoRecurrencia}
                      onChange={(e) => setProgTipoRecurrencia(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-300"
                    >
                      <option value="Semanal">Lun – Vie</option>
                      <option value="Fines de semana">Fines de Semana</option>
                      <option value="Diaria">Diaria</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Márgen Tolerancia</label>
                  <select
                    value={progTolerancia}
                    onChange={(e) => setProgTolerancia(Number(e.target.value))}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-300"
                  >
                    <option value={0}>Sin tolerancia</option>
                    <option value={5}>± 5 minutos</option>
                    <option value={10}>± 10 minutos</option>
                    <option value={15}>± 15 minutos</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsProgModalOpen(false)}
                className="flex-1 p-3 border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold rounded-xl text-sm transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
                disabled={isProgSubmitting}
              >
                {isProgSubmitting ? 'Registrando...' : 'Programar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 transition-all animate-in slide-in-from-bottom-5 duration-300">
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

export default CompanyAdminDashboard;
