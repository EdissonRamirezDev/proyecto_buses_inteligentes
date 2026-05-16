import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store';
import { getDrivers } from '../../services/driverService';
import { getShifts } from '../../services/shiftService';
import type { Driver } from '../../types/driver.types';
import type { Shift } from '../../types/shift.types';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ConductorShift = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const drivers = await getDrivers();
        // Asumiendo que el email o el nombre vincula al usuario con el conductor
        // En una implementación real, ms-security y ms-logic deberían compartir el mismo UUID de usuario
        const myDriver = drivers.find(d => d.email === user?.email);
        
        if (myDriver) {
          setDriver(myDriver);
          const shifts = await getShifts();
          // Buscar turno activo para este conductor
          const myShift = shifts.find(s => s.driver?.id === myDriver.id && s.estado === 'en_curso');
          setActiveShift(myShift || null);
        }
      } catch (error) {
        console.error('Error loading driver data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner text="Cargando información del turno..." />;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mi Turno de Trabajo</h1>
            <p className="text-gray-400">Conductor: {driver?.name} {driver?.last_name}</p>
          </div>
          <Button onClick={() => navigate('/dashboard')} variant="secondary">
            Volver al Panel
          </Button>
        </div>

        {activeShift ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-blue-500">🚌</span> Información del Bus
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Placa:</span>
                  <span className="font-bold">{activeShift.bus?.placa}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Modelo:</span>
                  <span>{activeShift.bus?.modelo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Capacidad:</span>
                  <span>{activeShift.bus?.capacidad} pasajeros</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-green-500">⏰</span> Horario de Turno
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Inició:</span>
                  <span>{new Date(activeShift.fecha_inicio || '').toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Finaliza:</span>
                  <span>{new Date(activeShift.fecha_fin || '').toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estado:</span>
                  <span className="px-2 py-0.5 rounded-full bg-green-900 text-green-300 text-xs uppercase font-bold">
                    {activeShift.estado}
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-gradient-to-r from-red-900/40 to-orange-900/40 p-8 rounded-2xl border border-red-700/50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-red-100">¿Algún problema en la vía?</h3>
                <p className="text-red-200/70">Reporta accidentes, fallas mecánicas o retrasos inmediatamente.</p>
              </div>
              <Button 
                onClick={() => navigate('/admin/incidents')} 
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 text-lg shadow-lg shadow-red-600/20"
              >
                🚨 REPORTAR INCIDENTE
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 p-12 rounded-2xl border border-gray-700 text-center shadow-xl">
            <div className="text-6xl mb-4">💤</div>
            <h2 className="text-2xl font-bold mb-2">No tienes turnos activos</h2>
            <p className="text-gray-400 mb-6">Actualmente no tienes un bus asignado en servicio.</p>
            <Button onClick={() => navigate('/dashboard')}>Ir al Dashboard</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConductorShift;
