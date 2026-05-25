import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { findCitizenByUserId } from '../../services/citizensService';
import { getAvailableSchedulesForCitizen } from '../../services/schedulesService';
import { purchaseTicket } from '../../services/ticketsService';
import type { Citizen } from '../../types/citizen.types';
import type { Schedule } from '../../types/schedule.types';
import Button from '../../components/common/Button';

const CitizenPurchasePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      const [myCitizen, schedulesData] = await Promise.all([
        user?.id ? findCitizenByUserId(user.id) : Promise.resolve(undefined),
        getAvailableSchedulesForCitizen(),
      ]);
      if (myCitizen) {
        setCitizen(myCitizen);
      }
      setSchedules(schedulesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setErrorMsg('No se pudieron cargar los datos de compra. Inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
  const ticketPrice = selectedSchedule ? Number(selectedSchedule.route?.tarifa || 0) : 0;
  const currentBalance = citizen ? Number(citizen.saldo) : 0;
  const remainingBalance = currentBalance - ticketPrice;

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizen) {
      setErrorMsg('No tienes un perfil de ciudadano asociado.');
      return;
    }
    if (!selectedScheduleId) {
      setErrorMsg('Por favor selecciona una programación/viaje.');
      return;
    }
    if (currentBalance < ticketPrice) {
      setErrorMsg('Saldo insuficiente. Por favor recarga tu billetera.');
      return;
    }

    setIsPurchasing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await purchaseTicket(citizen.id, selectedScheduleId);
      setSuccessMsg('¡Boleto comprado exitosamente! Redirigiendo a tu panel...');
      setTimeout(() => {
        navigate('/citizen/dashboard');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al comprar el boleto.');
      setIsPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🎟️ Comprar Boleto
          </h1>
          <Button variant="ghost" onClick={() => navigate('/citizen/dashboard')} className="text-slate-400 hover:text-white">
            Cancelar
          </Button>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg text-sm font-semibold">
            ❌ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 bg-emerald-950/50 border border-emerald-500 text-emerald-300 p-3 rounded-lg text-sm font-semibold">
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handlePurchase} className="space-y-6">
          {/* User info & wallet balance */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-400">Comprador</p>
            <p className="font-semibold text-white mb-2">{citizen?.nombres} {citizen?.apellidos}</p>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">Saldo actual</span>
              <span className="font-bold text-emerald-400">${currentBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Trip selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Selecciona tu Viaje</label>
            <select
              required
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Seleccionar programación --</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fecha} a las {s.hora_salida} — {s.route?.nombre} (${Number(s.route?.tarifa || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Pricing summary */}
          {selectedSchedule && (
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tarifa de ruta:</span>
                <span className="font-semibold text-white">${ticketPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-800">
                <span className="text-slate-400">Saldo estimado restante:</span>
                <span className={`font-bold ${remainingBalance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  ${remainingBalance.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isPurchasing || (selectedScheduleId ? remainingBalance < 0 : false)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/35"
          >
            {isPurchasing ? 'Procesando Compra...' : 'Confirmar Compra'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CitizenPurchasePage;
