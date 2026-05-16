import { useState, useEffect } from 'react';
import * as shiftService from '../../services/shiftService';
import * as busService from '../../services/busService';
import * as driverService from '../../services/driverService';
import type { Shift } from '../../types/shift.types';
import type { Bus } from '../../types/bus.types';
import type { Driver } from '../../types/driver.types';
import ShiftList from '../../components/admin/ShiftList';
import Button from '../../components/common/Button';
import AdminHeader from '../../components/common/AdminHeader';
import Input from '../../components/common/Input';

type View = 'list' | 'form';

const ShiftsPage = () => {
  const [view, setView] = useState<View>('list');
  const [shiftToEdit, setShiftToEdit] = useState<Shift | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [busId, setBusId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estado, setEstado] = useState('programado');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    busService.getBuses().then(setBuses).catch(() => {});
    driverService.getDrivers().then(setDrivers).catch(() => {});
  }, []);

  const handleCreate = () => {
    setShiftToEdit(null);
    setBusId(''); setDriverId(''); setFechaInicio(''); setFechaFin(''); setEstado('programado');
    setFormError('');
    setView('form');
  };

  const handleEdit = (shift: Shift) => {
    setShiftToEdit(shift);
    setBusId(shift.bus?.id?.toString() || '');
    setDriverId(shift.driver?.id?.toString() || '');
    setFechaInicio(shift.fecha_inicio || '');
    setFechaFin(shift.fecha_fin || '');
    setEstado(shift.estado || 'programado');
    setFormError('');
    setView('form');
  };

  const handleCancel = () => {
    setView('list');
    setShiftToEdit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data: any = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado,
        bus: { id: Number(busId) },
        driver: { id: Number(driverId) },
      };
      if (shiftToEdit?.id) {
        await shiftService.updateShift(shiftToEdit.id, data);
      } else {
        await shiftService.createShift(data);
      }
      setRefreshTrigger(prev => prev + 1);
      setView('list');
      setShiftToEdit(null);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar el turno.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminHeader 
          title={view === 'form' ? (shiftToEdit ? 'Editando Turno' : 'Nuevo Turno') : 'Gestión de Turnos'}
          subtitle={view === 'form' ? 'Asigna un conductor a un bus en un período' : 'Administra los turnos y programaciones de los conductores y buses'}
          showBack={view === 'form'}
          onBack={handleCancel}
          action={view === 'list' && (
            <Button
              onClick={handleCreate}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Nuevo Turno
            </Button>
          )}
        />
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          {view === 'list' ? (
            <ShiftList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {shiftToEdit ? 'Editando turno' : 'Programar nuevo turno'}
              </h2>
              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bus</label>
                  <select required value={busId} onChange={(e) => setBusId(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-2.5">
                    <option value="">Seleccione un bus...</option>
                    {buses.map(b => (
                      <option key={b.id} value={b.id}>{b.placa} - {b.modelo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conductor</label>
                  <select required value={driverId} onChange={(e) => setDriverId(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-2.5">
                    <option value="">Seleccione un conductor...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} {d.last_name} ({d.license})</option>
                    ))}
                  </select>
                </div>
                <Input label="Fecha/Hora Inicio" type="datetime-local" required value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                <Input label="Fecha/Hora Fin" type="datetime-local" required value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-2.5">
                    <option value="programado">Programado</option>
                    <option value="en_curso">En Curso</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="secondary" onClick={handleCancel} disabled={saving}>Cancelar</Button>
                  <Button type="submit" isLoading={saving}>{shiftToEdit ? 'Actualizar Turno' : 'Crear Turno'}</Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftsPage;
