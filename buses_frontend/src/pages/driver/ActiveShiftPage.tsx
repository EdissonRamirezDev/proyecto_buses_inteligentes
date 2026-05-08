import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import * as shiftService from '../../services/shiftService';
import type { Shift } from '../../types/shift.types';
import Button from '../../components/common/Button';
import IncidentReportForm from '../../components/driver/IncidentReportForm';
import AdminHeader from '../../components/common/AdminHeader';

const ActiveShiftPage = () => {
  const { user } = useAuth();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    const fetchActiveShift = async () => {
      if (!user?.email) return;
      try {
        const activeShift = await shiftService.getActiveShiftByEmail(user.email);
        setShift(activeShift);
      } catch (error) {
        console.error('Error fetching active shift:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveShift();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminHeader 
          title="Mi Turno Activo"
          subtitle="Control de conducción en tiempo real"
          showBack={true}
        />

        {!shift ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sin turno activo</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              No tienes una programación activa en este momento.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Info del Turno */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      Bus: {shift.bus?.placa}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Modelo: {shift.bus?.modelo} | Capacidad: {shift.bus?.capacidad}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                  {shift.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">Inicio</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {shift.fecha_inicio ? new Date(shift.fecha_inicio).toLocaleTimeString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">Fin estimado</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {shift.fecha_fin ? new Date(shift.fecha_fin).toLocaleTimeString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            {!showReportForm ? (
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setShowReportForm(true)}
                  className="
                    flex items-center justify-between p-5 bg-red-50 dark:bg-red-900/10 
                    border border-red-200 dark:border-red-900/30 rounded-2xl
                    hover:bg-red-100 dark:hover:bg-red-900/20 transition-all group
                  "
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-red-700 dark:text-red-400">Reportar Incidente</h4>
                      <p className="text-xs text-red-600/70 dark:text-red-400/70">Mecánico, accidente, retrasos, etc.</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span className="w-2 h-8 bg-red-500 rounded-full inline-block"></span>
                    Reporte de Incidente
                  </h3>
                </div>
                
                {reportSuccess ? (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">¡Reporte Enviado!</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">
                      El incidente ha sido registrado y el supervisor ha sido notificado si es necesario.
                    </p>
                    <Button variant="primary" onClick={() => {
                      setReportSuccess(false);
                      setShowReportForm(false);
                    }}>
                      Entendido
                    </Button>
                  </div>
                ) : (
                  <IncidentReportForm 
                    busId={shift.bus?.id || 0}
                    onSuccess={() => setReportSuccess(true)}
                    onCancel={() => setShowReportForm(false)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveShiftPage;
