import { useState } from 'react';
import * as driverService from '../../services/driverService';
import type { Driver } from '../../types/driver.types';
import DriverList from '../../components/admin/DriverList';
import Button from '../../components/common/Button';
import AdminHeader from '../../components/common/AdminHeader';
import Input from '../../components/common/Input';

type View = 'list' | 'form';

const DriversPage = () => {
  const [view, setView] = useState<View>('list');
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [license, setLicense] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('activo');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCreate = () => {
    setDriverToEdit(null);
    setName(''); setLastName(''); setLicense(''); setPhone(''); setEmail(''); setStatus('activo');
    setFormError('');
    setView('form');
  };

  const handleEdit = (driver: Driver) => {
    setDriverToEdit(driver);
    setName(driver.name || '');
    setLastName(driver.last_name || '');
    setLicense(driver.license || '');
    setPhone(driver.phone || '');
    setEmail(driver.email || '');
    setStatus(driver.status || 'activo');
    setFormError('');
    setView('form');
  };

  const handleCancel = () => {
    setView('list');
    setDriverToEdit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = { name, last_name: lastName, license, phone, email, status };
      if (driverToEdit?.id) {
        await driverService.updateDriver(driverToEdit.id, data);
      } else {
        await driverService.createDriver(data);
      }
      setRefreshTrigger(prev => prev + 1);
      setView('list');
      setDriverToEdit(null);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar el conductor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminHeader 
          title={view === 'form' ? (driverToEdit ? 'Editando Conductor' : 'Nuevo Conductor') : 'Gestión de Conductores'}
          subtitle={view === 'form' ? 'Completa los datos del conductor' : 'Administra los conductores registrados en el sistema'}
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
              Nuevo Conductor
            </Button>
          )}
        />
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          {view === 'list' ? (
            <DriverList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {driverToEdit ? `Editando: ${driverToEdit.name} ${driverToEdit.last_name}` : 'Registrar nuevo conductor'}
              </h2>
              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nombre" placeholder="Ej: Juan" required value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Apellido" placeholder="Ej: Pérez" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <Input label="Licencia de Conducir" placeholder="Ej: B1-123456" required value={license} onChange={(e) => setLicense(e.target.value)} />
                <Input label="Teléfono" placeholder="Ej: 3001234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input label="Email" type="email" placeholder="Ej: juan@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-2.5">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="suspendido">Suspendido</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="secondary" onClick={handleCancel} disabled={saving}>Cancelar</Button>
                  <Button type="submit" isLoading={saving}>{driverToEdit ? 'Actualizar Conductor' : 'Crear Conductor'}</Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriversPage;
