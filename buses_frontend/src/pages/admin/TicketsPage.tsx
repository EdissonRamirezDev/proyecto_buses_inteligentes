import { useEffect, useState } from 'react';
import { getTickets, purchaseTicket, deleteTicket } from '../../services/ticketsService';
import { getCitizens, createCitizen } from '../../services/citizensService';
import { getSchedules } from '../../services/schedulesService';
import { getUsers } from '../../services/userService';
import { rechargeWallet } from '../../services/walletService';
import type { Ticket } from '../../types/ticket.types';
import type { Citizen } from '../../types/citizen.types';
import type { Schedule } from '../../types/schedule.types';
import type { User } from '../../types/user.types';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

type FilterState = 'todos' | 'activo' | 'usado' | 'cancelado';

const TicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [securityUsers, setSecurityUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filter, setFilter] = useState<FilterState>('todos');
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [formData, setFormData] = useState({ citizenId: '', scheduleId: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      const [tData, cData, sData, uData] = await Promise.all([
        getTickets(),
        getCitizens(),
        getSchedules(),
        getUsers().catch(() => [])
      ]);
      setTickets(tData);
      setCitizens(cData);
      setSchedules(sData);
      const ciudadanos = uData.filter(u => u.roles?.some(r => r.name.toUpperCase() === 'CIUDADANO'));
      setSecurityUsers(ciudadanos);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSimulatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let targetCitizenId = formData.citizenId;

      // Si el id seleccionado empieza con "user-", es una cuenta de seguridad sin perfil creado
      if (targetCitizenId.startsWith('user-')) {
        const userId = targetCitizenId.replace('user-', '');
        const secUser = securityUsers.find(u => u.id === userId);
        if (!secUser) throw new Error('Usuario de seguridad no encontrado');

        // Auto-crear el ciudadano en ms-logic
        const names = secUser.name ? secUser.name.split(' ') : ['Ciudadano'];
        const nombres = names[0];
        const apellidos = names.slice(1).join(' ') || 'Registrado';

        const newCitizen = await createCitizen({
          userId: secUser.id,
          nombres,
          apellidos,
          telefono: '',
          direccion: 'Sin dirección registrada',
          fecha_nacimiento: new Date().toISOString().split('T')[0]
        });

        // Aprovisionar saldo de simulación para que la compra no rebote
        await rechargeWallet(newCitizen.id, 20000, `SIM-${Math.floor(Math.random() * 1000000)}`);
        targetCitizenId = newCitizen.id;
      }

      await purchaseTicket(targetCitizenId, formData.scheduleId);
      setSuccessMsg('¡Boleto comprado con éxito! Se descontó el saldo.');
      setTimeout(() => { setIsSimulating(false); setSuccessMsg(''); }, 2000);
      fetchData();
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || error.message || 'Error desconocido al comprar boleto');
    }
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('¿Anular este boleto? Se devolverá el saldo al ciudadano.')) {
      try {
        await deleteTicket(id);
        fetchData();
      } catch (error) {
        console.error('Error cancelling ticket:', error);
      }
    }
  };

  const filteredTickets = filter === 'todos' ? tickets : tickets.filter(t => t.estado === filter);

  const estadoColor: Record<string, string> = {
    activo: 'bg-blue-900 text-blue-300',
    usado: 'bg-emerald-900 text-emerald-300',
    cancelado: 'bg-red-900 text-red-300',
  };

  const counts = {
    todos: tickets.length,
    activo: tickets.filter(t => t.estado === 'activo').length,
    usado: tickets.filter(t => t.estado === 'usado').length,
    cancelado: tickets.filter(t => t.estado === 'cancelado').length,
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-300 hover:text-white">
            ← Volver
          </Button>
          <h1 className="text-3xl font-bold text-white">Auditoría de Boletos</h1>
        </div>
        <Button onClick={() => setIsSimulating(!isSimulating)} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/50 shadow-lg">
          {isSimulating ? 'Cancelar Simulación' : 'Simular Compra de Boleto'}
        </Button>
      </div>

      {isSimulating && (
        <div className="bg-slate-800 p-6 rounded-xl shadow-2xl mb-6 border border-emerald-500/50 relative overflow-hidden animate-in slide-in-from-top-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none"></div>
          <h2 className="text-xl font-bold mb-2 text-emerald-400">Punto de Venta / Validador (Simulador)</h2>
          <p className="text-sm text-slate-400 mb-6">Prueba la lógica de negocio. Selecciona un ciudadano y un despacho; el sistema validará el saldo y generará el boleto.</p>
          
          {errorMsg && <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg text-sm font-bold">❌ {errorMsg}</div>}
          {successMsg && <div className="mb-4 bg-emerald-900/50 border border-emerald-500 text-emerald-200 p-3 rounded-lg text-sm font-bold">✅ {successMsg}</div>}

          <form onSubmit={handleSimulatePurchase} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-sm font-medium text-slate-300 mb-1">1. ¿Quién compra?</label>
               <select required value={formData.citizenId} onChange={e => setFormData({...formData, citizenId: e.target.value})} className="w-full bg-slate-900 border-slate-600 text-white rounded-lg p-3">
                 <option value="">Seleccione un ciudadano...</option>
                 {citizens.map(c => (
                   <option key={c.id} value={c.id}>{c.nombres} {c.apellidos} (Saldo: ${Number(c.saldo).toFixed(2)})</option>
                 ))}
                  {securityUsers.filter(u => !citizens.some(c => c.userId === u.id)).map(u => (
                    <option key={`user-${u.id}`} value={`user-${u.id}`}>⚠️ {u.name} ({u.email}) - Sin Perfil (Se auto-creará con $20k)</option>
                  ))}
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-300 mb-1">2. ¿Para qué viaje?</label>
               <select required value={formData.scheduleId} onChange={e => setFormData({...formData, scheduleId: e.target.value})} className="w-full bg-slate-900 border-slate-600 text-white rounded-lg p-3">
                 <option value="">Seleccione una programación...</option>
                 {schedules.map(s => (
                   <option key={s.id} value={s.id}>
                     {s.fecha} @ {s.hora_salida} - {s.route?.nombre} (Tarifa: ${Number(s.route?.tarifa || 0)})
                   </option>
                 ))}
               </select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 py-4 text-lg font-bold">PROCESAR COMPRA</Button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros por estado */}
      <div className="flex gap-2 mb-4">
        {(['todos', 'activo', 'usado', 'cancelado'] as FilterState[]).map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all ${
              filter === f 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="bg-slate-800 shadow-xl rounded-xl overflow-hidden border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Boleto (QR)</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Pasajero</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Ruta / Viaje</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Pago</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha Compra</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Estado</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredTickets.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No hay boletos con este filtro</td></tr>
            ) : filteredTickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-mono text-sm text-emerald-400 font-bold bg-emerald-900/30 px-2 py-1 rounded inline-block border border-emerald-800/50">
                    {ticket.codigo_qr}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-white font-bold">{ticket.citizen?.nombres}</div>
                  <div className="text-xs text-slate-500">{ticket.citizen?.apellidos}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-white">{ticket.schedule?.route?.codigo}</div>
                  <div className="text-xs text-slate-400">{ticket.schedule?.fecha} {ticket.schedule?.hora_salida}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-slate-300">${Number(ticket.precio_pagado).toFixed(2)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-slate-400 font-mono">
                    {ticket.fecha_compra ? new Date(ticket.fecha_compra).toLocaleString() : '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${estadoColor[ticket.estado] || 'bg-slate-700 text-slate-400'}`}>
                    {ticket.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {ticket.estado === 'activo' && (
                    <button onClick={() => handleCancel(ticket.id)} className="text-red-400 hover:text-red-300 font-medium text-sm">Anular</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketsPage;
