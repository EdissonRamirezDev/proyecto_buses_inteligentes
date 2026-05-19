import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store';
import { getCitizens, createCitizen } from '../../services/citizensService';
import { getTransactions } from '../../services/walletService';
import type { WalletTransaction } from '../../services/walletService';
import { getTickets } from '../../services/ticketsService';
import type { Citizen } from '../../types/citizen.types';
import type { Ticket } from '../../types/ticket.types';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

const CitizenDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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
        } else if (user) {
          // Si no existe el perfil de ciudadano en ms-logic, lo auto-aprovisionamos en segundo plano
          try {
            const names = user.name ? user.name.split(' ') : ['Ciudadano'];
            const nombres = names[0];
            const apellidos = names.slice(1).join(' ') || 'Registrado';

            const newCitizen = await createCitizen({
              userId: user.id,
              nombres,
              apellidos,
              telefono: '',
              direccion: 'Sin dirección registrada',
              fecha_nacimiento: new Date().toISOString().split('T')[0]
            });
            setCitizen(newCitizen);
            setTransactions([]);
            setTickets([]);
          } catch (err) {
            console.error('Error auto-provisioning citizen profile:', err);
          }
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
            <Button onClick={() => { logout(); navigate('/login'); }} className="bg-red-600/80 hover:bg-red-700 text-white font-bold">
              Cerrar Sesión
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
            <Button onClick={() => navigate('/citizen/wallet')} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-sm">
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
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTicket(t)}
                  className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-700/50 transition-colors group"
                >
                  <div>
                    <p className="text-sm text-white font-medium group-hover:text-indigo-400 transition-colors">
                      {(t as any).schedule?.route?.nombre || 'Ruta desconocida'}
                    </p>
                    <p className="text-xs text-slate-500 flex gap-2 items-center mt-0.5">
                      <span>{new Date(t.fecha_compra || '').toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-indigo-400 group-hover:underline">Ver QR</span>
                    </p>
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
          <button onClick={() => navigate('/citizen/purchase')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-center transition">
            <span className="text-2xl">🎟️</span>
            <p className="text-sm text-slate-300 mt-2">Comprar Boleto</p>
          </button>
          <button onClick={() => navigate('/citizen/wallet')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-center transition">
            <span className="text-2xl">💳</span>
            <p className="text-sm text-slate-300 mt-2">Recargar</p>
          </button>
          <button onClick={() => navigate('/profile')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-center transition">
            <span className="text-2xl">👤</span>
            <p className="text-sm text-slate-300 mt-2">Mi Perfil</p>
          </button>
        </div>
      </div>

      {/* Modal de Boleto Digital */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative flex flex-col items-center">
            {/* Cabecera del ticket */}
            <div className="bg-indigo-600 w-full px-6 py-5 text-center relative">
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setSelectedTicket(null)} 
                  className="text-indigo-200 hover:text-white font-bold text-lg bg-black/20 hover:bg-black/30 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
              <span className="text-xs uppercase tracking-widest text-indigo-200 font-bold">Pase de Abordaje</span>
              <h3 className="text-xl font-bold text-white mt-1">
                {(selectedTicket as any).schedule?.route?.nombre || 'Ruta de Transporte'}
              </h3>
            </div>

            {/* Cuerpo del ticket (Información del viaje) */}
            <div className="w-full p-6 text-slate-300 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-xs uppercase block">Pasajero</span>
                  <span className="font-semibold text-white">{citizen?.nombres} {citizen?.apellidos}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase block">Precio Pagado</span>
                  <span className="font-semibold text-emerald-400">${Number(selectedTicket.precio_pagado).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-xs uppercase block">Fecha de Compra</span>
                  <span className="font-semibold text-white">
                    {new Date(selectedTicket.fecha_compra || '').toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase block">Hora de Salida</span>
                  <span className="font-semibold text-white">
                    {(selectedTicket as any).schedule?.hora_salida || 'Próximo'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-xs uppercase block">Estado</span>
                  <span className={`inline-block font-semibold px-2 py-0.5 rounded text-xs uppercase ${
                    selectedTicket.estado === 'activo' ? 'bg-emerald-900/50 text-emerald-400' :
                    selectedTicket.estado === 'usado' ? 'bg-blue-900/50 text-blue-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {selectedTicket.estado}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase block">Fecha Viaje</span>
                  <span className="font-semibold text-white">
                    {(selectedTicket as any).schedule?.fecha || 'Programada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Separador de ticket con estilo clásico */}
            <div className="w-full flex items-center justify-between px-1 relative">
              <div className="w-4 h-8 bg-slate-950 rounded-r-full -ml-3 border border-slate-700 border-l-0"></div>
              <div className="border-t-2 border-dashed border-slate-600 w-full mx-2"></div>
              <div className="w-4 h-8 bg-slate-950 rounded-l-full -mr-3 border border-slate-700 border-r-0"></div>
            </div>

            {/* Parte inferior: Código QR y Hash */}
            <div className="p-6 flex flex-col items-center w-full">
              <div className="bg-white p-3 rounded-2xl shadow-inner mb-4">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${selectedTicket.codigo_qr}&color=1e1b4b`} 
                  alt="Código QR del boleto"
                  className="w-44 h-44 object-contain"
                />
              </div>
              <span className="text-slate-400 text-xs uppercase block mb-1">Código de validación</span>
              <span className="font-mono text-white font-bold text-base tracking-wider bg-slate-900 px-4 py-1.5 rounded-lg border border-slate-700/80">
                {selectedTicket.codigo_qr}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
