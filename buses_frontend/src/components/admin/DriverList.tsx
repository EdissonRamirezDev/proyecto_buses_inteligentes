import { useEffect, useState, useMemo } from 'react';
import * as driverService from '../../services/driverService';
import type { Driver } from '../../types/driver.types';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';

const DriverList = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await driverService.getDrivers();
      setDrivers(data);
    } catch {
      setError('Error al cargar los conductores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!driverToDelete?.id) return;
    setIsDeleting(true);
    try {
      await driverService.deleteDriver(driverToDelete.id);
      await loadData();
    } catch {
      setError('Error al eliminar el conductor');
    } finally {
      setIsDeleting(false);
      setDriverToDelete(null);
    }
  };

  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return drivers;
    const q = searchQuery.toLowerCase();
    return drivers.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.last_name?.toLowerCase().includes(q) ||
        d.license?.toLowerCase().includes(q)
    );
  }, [drivers, searchQuery]);

  if (loading) return <LoadingSpinner text="Cargando conductores..." />;

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar por nombre, apellido o licencia..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
          {filteredDrivers.length} conductor{filteredDrivers.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {filteredDrivers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'No se encontraron conductores con ese filtro'
              : 'No hay conductores registrados'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Licencia</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{driver.name} {driver.last_name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{driver.license}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{driver.phone}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {driver.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="danger" size="sm" onClick={() => setDriverToDelete(driver)}>
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={!!driverToDelete}
        onClose={() => setDriverToDelete(null)}
        title="Eliminar Conductor"
        confirmLabel="Eliminar"
        confirmVariant="danger"
        onConfirm={handleDelete}
        isConfirmLoading={isDeleting}
      >
        <p className="text-gray-600 dark:text-gray-400">
          ¿Estás seguro de que deseas eliminar permanentemente a{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">{driverToDelete?.name} {driverToDelete?.last_name}</span>?
        </p>
      </Modal>
    </div>
  );
};

export default DriverList;
