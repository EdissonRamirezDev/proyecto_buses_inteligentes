import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store';
import { getCitizens } from '../../services/citizensService';
import { getTransactions } from '../../services/walletService';
import type { WalletTransaction } from '../../services/walletService';
import { getTickets } from '../../services/ticketsService';
import { httpBusiness } from '../../services/http';
import type { Citizen } from '../../types/citizen.types';
import type { Ticket } from '../../types/ticket.types';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

const CitizenDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Buscar el perfil citizen vinculado a este userId
        const citizens = await getCitizens();
        const myCitizen = citizens.find(c => c.userId === user?.id);
        
        if (myCitizen) {
          setCitizen(myCitizen);
          const [txs, tkts] = await Promise.all([
            getTransactions(myCitizen.id),
            getTickets()
          ]);
          setTransactions(txs);
          // Filtrar solo los boletos de este ciudadano
          setTickets(tkts.filter((t: any) => t.citizen?.id === myCitizen.id));
        }
      } catch (error) {
        console.error('Error loading citizen data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const activeTickets = tickets.filter(t => t.estado === 'activo');
  const usedTickets = tickets.filter(t => t.estado === 'usado' || t.estado === 'completado');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm">Bienvenido de vuelta,</p>
              <h1 className="text-3xl font-bold text-white">{citizen?.nombres} {citizen?.apellidos}</h1>
            </div>
            <Button onClick={() => navigate('/dashboard')} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm">
              ← Panel General
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-6">
        {/* Cards de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Saldo */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <p className="text-slate-400 text-sm mb-1">Saldo Disponible</p>
            <p className="text-4xl font-bold text-emerald-400">${Number(citizen?.saldo || 0).toLocaleString()}</p>
            <Button onClick={() => navigate('/admin/wallet')} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-sm">
              Recargar Billetera
            </Button>
          </div>

          {/* Boletos Activos */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <p className="text-slate-400 text-sm mb-1">Boletos Activos</p>
            <p className="text-4xl font-bold text-blue-400">{activeTickets.length}</p>
            <p className="text-xs text-slate-500 mt-2">Listos para usar en tu próximo viaje</p>
          </div>

          {/* Viajes Realizados */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <p className="text-slate-400 text-sm mb-1">Viajes Completados</p>
            <p className="text-4xl font-bold text-purple-400">{usedTickets.length}</p>
            <p className="text-xs text-slate-500 mt-2">En total desde tu registro</p>
          </div>
        </div>

        {/* Sección de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Últimos Movimientos */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Últimos Movimientos</h2>
            </div>
            <div className="divide-y divide-slate-700">
              {transactions.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Sin movimientos recientes</p>
              ) : transactions.slice(0, 5).map(tx => (
                <div key={tx.id} className="px-4 py-3 flex justify-between items-center">
                  <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      tx.tipo === 'RECARGA' ? 'bg-emerald-900/50 text-emerald-400' :
                      tx.tipo === 'COMPRA_BOLETO' ? 'bg-blue-900/50 text-blue-400' : 'bg-orange-900/50 text-orange-400'
                    }`}>
                      {tx.tipo}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{new Date(tx.fecha_transaccion).toLocaleString()}</p>
                  </div>
                  <span className={`font-bold ${tx.tipo === 'RECARGA' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.tipo === 'RECARGA' ? '+' : '-'}${Number(tx.monto).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mis Boletos */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Mis Boletos</h2>
            </div>
            <div className="divide-y divide-slate-700">
              {tickets.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No tienes boletos aún</p>
              ) : tickets.slice(0, 6).map(t => (
                <div key={t.id} className="px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-white font-medium">
                      {(t as any).schedule?.route?.nombre || 'Ruta desconocida'}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(t.fecha_compra || '').toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    t.estado === 'activo' ? 'bg-emerald-900/50 text-emerald-400' :
                    t.estado === 'usado' ? 'bg-blue-900/50 text-blue-400' :
                    t.estado === 'completado' ? 'bg-purple-900/50 text-purple-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {t.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="mt-8 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => navigate('/citizen/routes')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-center transition">
            <span className="text-2xl">🗺️</span>
            <p className="text-sm text-slate-300 mt-2">Ver Rutas</p>
          </button>
          <button onClick={() => navigate('/admin/tickets')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-center transition">
            <span className="text-2xl">🎟️</span>
            <p className="text-sm text-slate-300 mt-2">Comprar Boleto</p>
          </button>
          <button onClick={() => navigate('/admin/wallet')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-center transition">
            <span className="text-2xl">💳</span>
            <p className="text-sm text-slate-300 mt-2">Recargar</p>
          </button>
          <button onClick={() => navigate('/profile')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-center transition">
            <span className="text-2xl">👤</span>
            <p className="text-sm text-slate-300 mt-2">Mi Perfil</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
