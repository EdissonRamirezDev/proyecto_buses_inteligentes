import { useState } from 'react';
import * as busService from '../../services/busService';
import type { Bus } from '../../types/bus.types';
import BusList from '../../components/admin/BusList';
import Button from '../../components/common/Button';
import AdminHeader from '../../components/common/AdminHeader';
import Input from '../../components/common/Input';

type View = 'list' | 'form';

const BusesPage = () => {
  const [view, setView] = useState<View>('list');
  const [busToEdit, setBusToEdit] = useState<Bus | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form state
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [capacidad, setCapacidad] = useState<number>(40);
  const [estado, setEstado] = useState('available');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCreate = () => {
    setBusToEdit(null);
    setPlaca(''); setModelo(''); setCapacidad(40); setEstado('available');
    setFormError('');
    setView('form');
  };

  const handleEdit = (bus: Bus) => {
    setBusToEdit(bus);
    setPlaca(bus.placa || '');
    setModelo(bus.modelo || '');
    setCapacidad(bus.capacidad || 40);
    setEstado(bus.estado || 'activo');
    setFormError('');
    setView('form');
  };

  const handleCancel = () => {
    setView('list');
    setBusToEdit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = { placa, modelo, capacidad, estado };
      if (busToEdit?.id) {
        await busService.updateBus(busToEdit.id, data);
      } else {
        await busService.createBus(data);
      }
      setRefreshTrigger(prev => prev + 1);
      setView('list');
      setBusToEdit(null);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar el bus.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminHeader 
          title={view === 'form' ? (busToEdit ? 'Editando Bus' : 'Nuevo Bus') : 'Gestión de Buses'}
          subtitle={view === 'form' ? 'Completa los datos del vehículo' : 'Administra la flota de buses del sistema'}
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
              Nuevo Bus
            </Button>
          )}
        />
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          {view === 'list' ? (
            <BusList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {busToEdit ? `Editando: ${busToEdit.placa}` : 'Registrar nuevo bus'}
              </h2>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Placa"
                  placeholder="Ej: ABC-123"
                  required
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                />
                <Input
                  label="Modelo"
                  placeholder="Ej: Mercedes Benz O500"
                  required
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                />
                <Input
                  label="Capacidad (pasajeros)"
                  type="number"
                  min={1}
                  required
                  value={capacidad}
                  onChange={(e) => setCapacidad(Number(e.target.value))}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-2.5"
                  >
                    <option value="available">Activo</option>
                    <option value="maintenance">En Mantenimiento</option>
                    <option value="out of service">Fuera de Servicio</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" isLoading={saving}>
                    {busToEdit ? 'Actualizar Bus' : 'Crear Bus'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusesPage;
