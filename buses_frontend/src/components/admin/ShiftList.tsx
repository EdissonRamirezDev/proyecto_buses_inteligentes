import { useEffect, useState, useMemo } from 'react';
import * as shiftService from '../../services/shiftService';
import type { Shift } from '../../types/shift.types';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';

const ShiftList = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await shiftService.getShifts();
      setShifts(data);
    } catch {
      setError('Error al cargar las programaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!shiftToDelete?.id) return;
    setIsDeleting(true);
    try {
      await shiftService.deleteShift(shiftToDelete.id);
      await loadData();
    } catch {
      setError('Error al eliminar la programación');
    } finally {
      setIsDeleting(false);
      setShiftToDelete(null);
    }
  };

  const filteredShifts = useMemo(() => {
    if (!searchQuery.trim()) return shifts;
    const q = searchQuery.toLowerCase();
    return shifts.filter(
      (s) =>
        s.bus?.placa?.toLowerCase().includes(q) ||
        s.driver?.name?.toLowerCase().includes(q) ||
        s.driver?.last_name?.toLowerCase().includes(q)
    );
  }, [shifts, searchQuery]);

  if (loading) return <LoadingSpinner text="Cargando programaciones..." />;

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar por placa o conductor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
          {filteredShifts.length} programación{filteredShifts.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {filteredShifts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'No se encontraron programaciones con ese filtro'
              : 'No hay programaciones registradas'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Bus</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Conductor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Inicio</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Fin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredShifts.map((shift) => (
                <tr key={shift.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{shift.bus?.placa || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {shift.driver ? `${shift.driver.name} ${shift.driver.last_name}` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(shift.fecha_inicio)}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(shift.fecha_fin)}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {shift.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="danger" size="sm" onClick={() => setShiftToDelete(shift)}>
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
        isOpen={!!shiftToDelete}
        onClose={() => setShiftToDelete(null)}
        title="Eliminar Programación"
        confirmLabel="Eliminar"
        confirmVariant="danger"
        onConfirm={handleDelete}
        isConfirmLoading={isDeleting}
      >
        <p className="text-gray-600 dark:text-gray-400">
          ¿Estás seguro de que deseas eliminar permanentemente la programación del bus{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">{shiftToDelete?.bus?.placa}</span>?
        </p>
      </Modal>
    </div>
  );
};

export default ShiftList;
