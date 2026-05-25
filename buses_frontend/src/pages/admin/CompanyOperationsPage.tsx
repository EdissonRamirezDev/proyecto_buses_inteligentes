import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCompanies, type Company } from '../../services/companyService';
import { getBuses, updateBus } from '../../services/busService';
import { getShifts } from '../../services/shiftService';
import { getSchedules } from '../../services/schedulesService';
import AdminHeader from '../../components/common/AdminHeader';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  canAssignBusToCompany,
  getBusAssignmentBlockReason,
} from '../../utils/companyOperationsUtils';

const CompanyOperationsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const companyIdParam = searchParams.get('companyId');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState(companyIdParam || '');
  const [buses, setBuses] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [assignBusId, setAssignBusId] = useState('');

  const selectedCompany = companies.find((c) => String(c.id) === companyId);
  const numericCompanyId = Number(companyId);

  const companyBusIds = useMemo(
    () => new Set(buses.filter((b) => b.company?.id === numericCompanyId).map((b) => b.id)),
    [buses, numericCompanyId],
  );

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, b, sh, sc] = await Promise.all([
        getCompanies(),
        getBuses(),
        getShifts(),
        getSchedules(),
      ]);
      setCompanies(c);
      setBuses(b);
      setShifts(sh);
      setSchedules(sc);
    } catch {
      setMsg('Error al cargar datos de operación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (companyId) {
      setSearchParams({ companyId });
    }
  }, [companyId, setSearchParams]);

  const companyBuses = buses.filter((b) => b.company?.id === numericCompanyId);

  const assignableBuses = useMemo(() => {
    return buses.filter((b) => {
      if (!b.id) return false;
      if (b.company?.id === numericCompanyId) return false;
      return canAssignBusToCompany(b.id, schedules, shifts);
    });
  }, [buses, schedules, shifts, numericCompanyId]);

  const companyShifts = shifts.filter((s) => s.bus?.id && companyBusIds.has(s.bus.id));
  const companySchedules = schedules.filter((s) => s.bus?.id && companyBusIds.has(s.bus.id));

  const blockLabel = (busId: number) => {
    const reason = getBusAssignmentBlockReason(busId, schedules, shifts);
    if (reason === 'schedule') return ' · programación activa';
    if (reason === 'shift') return ' · turno activo';
    return '';
  };

  const handleAssignBus = async () => {
    if (!companyId || !assignBusId) return;
    const busId = Number(assignBusId);
    if (!canAssignBusToCompany(busId, schedules, shifts)) {
      setMsg('Este bus no se puede asignar: tiene programación o turno activo.');
      return;
    }
    try {
      await updateBus(busId, { companyId: numericCompanyId });
      setMsg('Bus asignado a la empresa. Los conductores se vinculan desde el panel de administrador de empresa.');
      setAssignBusId('');
      await loadAll();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'No se pudo asignar el bus.');
    }
  };

  const handleUnassignBus = async (busId: number) => {
    if (!confirm('¿Quitar este bus de la flota de la empresa?')) return;
    if (!canAssignBusToCompany(busId, schedules, shifts)) {
      setMsg('No se puede quitar: el bus tiene programación o turno activo.');
      return;
    }
    try {
      await updateBus(busId, { companyId: null as unknown as number });
      setMsg('Bus desvinculado de la empresa.');
      await loadAll();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'No se pudo desvincular el bus.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner text="Cargando operación por empresa..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <AdminHeader
          title="Operación por empresa"
          subtitle="Asigna buses a la flota de una empresa (sin programaciones ni turnos activos)"
          showBack
          onBack={() => navigate('/admin/companies')}
        />

        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-100 space-y-2">
          <p>
            <strong>Modelo recomendado:</strong> la <em>empresa</em> es dueña del bus (flota).
            El <em>conductor</em> se asigna por <strong>turnos</strong> y las <strong>rutas</strong> por{' '}
            <strong>programaciones</strong> — no desde esta pantalla.
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Para contratar conductores use el dashboard del administrador de empresa. Un bus con turno o
            servicio programado no puede cambiar de empresa hasta cancelar o finalizar esas operaciones.
          </p>
        </div>

        {msg && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
            {msg}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Empresa a gestionar
          </label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full max-w-md p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="">Seleccione empresa...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (NIT {c.nit})
              </option>
            ))}
          </select>
        </div>

        {!companyId ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Elija una empresa para ver su flota y asignar buses disponibles.
          </p>
        ) : (
          <div className="space-y-6">
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              <h2 className="font-bold text-gray-900 dark:text-white">
                Flota — {selectedCompany?.name}
              </h2>
              <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300 max-h-48 overflow-y-auto">
                {companyBuses.length === 0 ? (
                  <li>Sin buses en esta empresa. Registre vehículos desde el panel de empresa o asigne uno libre abajo.</li>
                ) : (
                  companyBuses.map((b) => {
                    const blocked = b.id ? !canAssignBusToCompany(b.id, schedules, shifts) : false;
                    return (
                      <li key={b.id} className="flex justify-between items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                        <span>
                          {b.placa} · {b.modelo} · cap. {b.capacidad}
                          {blocked && (
                            <span className="text-amber-600 dark:text-amber-400 text-xs block">
                              Operación activa{blockLabel(b.id)}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          disabled={blocked}
                          onClick={() => b.id && handleUnassignBus(b.id)}
                          className="text-xs text-red-600 hover:underline disabled:opacity-40 disabled:no-underline"
                          title={blocked ? 'Finalice programación/turno antes de quitar' : 'Quitar de la empresa'}
                        >
                          Quitar
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-xs text-gray-500 mb-2">
                  Solo buses sin programación &quot;programado&quot; ni turno en curso:
                </p>
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={assignBusId}
                    onChange={(e) => setAssignBusId(e.target.value)}
                    className="flex-1 min-w-[200px] p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600"
                  >
                    <option value="">Bus disponible para asignar...</option>
                    {assignableBuses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.placa}
                        {b.company?.name ? ` (actualmente: ${b.company.name})` : ' (sin empresa)'}
                      </option>
                    ))}
                  </select>
                  <Button onClick={handleAssignBus} disabled={!assignBusId}>
                    Asignar a empresa
                  </Button>
                </div>
                {assignableBuses.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    No hay buses libres. Cree uno nuevo en administrador de empresa o libere programaciones/turnos.
                  </p>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => navigate('/admin/buses')}>
                  Ver todos los buses
                </Button>
                <Button variant="secondary" onClick={() => navigate('/company-admin/dashboard')}>
                  Panel admin. empresa (conductores)
                </Button>
              </div>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h2 className="font-bold text-gray-900 dark:text-white">Operación vigente</h2>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => navigate('/admin/shifts')}>
                    Turnos
                  </Button>
                  <Button variant="secondary" onClick={() => navigate('/admin/schedules')}>
                    Programaciones
                  </Button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Turnos en buses de la empresa ({companyShifts.length})
                  </h3>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-300 max-h-32 overflow-y-auto">
                    {companyShifts.length === 0 ? (
                      <li className="text-gray-500">Sin turnos</li>
                    ) : (
                      companyShifts.map((s) => (
                        <li key={s.id}>
                          Bus {s.bus?.placa} · {s.estado}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Programaciones ({companySchedules.length})
                  </h3>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-300 max-h-32 overflow-y-auto">
                    {companySchedules.length === 0 ? (
                      <li className="text-gray-500">Sin programaciones</li>
                    ) : (
                      companySchedules.map((s) => (
                        <li key={s.id}>
                          {s.route?.nombre} · Bus {s.bus?.placa} · {s.fecha} {s.hora_salida} ({s.estado})
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyOperationsPage;
