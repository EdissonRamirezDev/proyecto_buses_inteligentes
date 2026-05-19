import React, { useEffect, useState } from 'react';
import { getCitizens, createCitizen, updateCitizen, deleteCitizen } from '../../services/citizensService';
import { getUsers } from '../../services/userService';
import type { Citizen } from '../../types/citizen.types';
import type { User } from '../../types/user.types';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

const CitizensPage = () => {
  const navigate = useNavigate();
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [securityUsers, setSecurityUsers] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCitizen, setEditingCitizen] = useState<Citizen | null>(null);
  const [formData, setFormData] = useState({ userId: '', nombres: '', apellidos: '', telefono: '', direccion: '', fecha_nacimiento: '' });
  const [rechargeData, setRechargeData] = useState<{ id: string; amount: number } | null>(null);

  const fetchData = async () => {
    try {
      const [cData, uData] = await Promise.all([getCitizens(), getUsers()]);
      setCitizens(cData);
      const ciudadanos = uData.filter(u => u.roles?.some(r => r.name.toUpperCase() === 'CIUDADANO'));
      setSecurityUsers(ciudadanos);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormData({ userId: '', nombres: '', apellidos: '', telefono: '', direccion: '', fecha_nacimiento: '' });
    setIsCreating(false);
    setEditingCitizen(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCitizen) {
        await updateCitizen(editingCitizen.id, formData);
      } else {
        await createCitizen(formData);
      }
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving citizen:', error);
    }
  };

  const handleEdit = (citizen: Citizen) => {
    setEditingCitizen(citizen);
    setFormData({
      userId: citizen.userId || '',
      nombres: citizen.nombres,
      apellidos: citizen.apellidos,
      telefono: citizen.telefono || '',
      direccion: citizen.direccion || '',
      fecha_nacimiento: citizen.fecha_nacimiento || ''
    });
    setIsCreating(true);
  };

  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = e.target.value;
    if (selectedUserId) {
      const user = securityUsers.find(u => u.id === selectedUserId);
      if (user) {
        const partes = user.name?.split(' ') || [''];
        setFormData({
          ...formData,
          userId: selectedUserId,
          nombres: partes[0] || '',
          apellidos: partes.slice(1).join(' ') || ''
        });
      }
    } else {
      setFormData({ ...formData, userId: '' });
    }
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeData) return;
    try {
      const citizen = citizens.find(c => c.id === rechargeData.id);
      if (citizen) {
        const newSaldo = Number(citizen.saldo) + Number(rechargeData.amount);
        await updateCitizen(rechargeData.id, { saldo: newSaldo });
        setRechargeData(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error recharging:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este perfil de ciudadano permanentemente?')) {
      try {
        await deleteCitizen(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting citizen:', error);
      }
    }
  };

  const getUserEmail = (userId: string | undefined) => {
    if (!userId) return null;
    return securityUsers.find(u => u.id === userId);
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-300 hover:text-white">
            ← Volver
          </Button>
          <h1 className="text-3xl font-bold text-white">Gestión de Ciudadanos</h1>
        </div>
        <Button onClick={() => { if (isCreating) { resetForm(); } else { setIsCreating(true); } }} className="bg-blue-600 hover:bg-blue-700">
          {isCreating ? 'Cancelar' : 'Nuevo Ciudadano'}
        </Button>
      </div>

      {isCreating && (
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl mb-6 border border-slate-700 animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">
            {editingCitizen ? `Editando: ${editingCitizen.nombres} ${editingCitizen.apellidos}` : 'Registrar Ciudadano (Perfil)'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!editingCitizen && (
              <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-amber-400 mb-1">Enlazar con Cuenta de Seguridad (Opcional)</label>
                 <select value={formData.userId} onChange={handleUserSelect} className="w-full bg-slate-700 border-amber-600/50 text-white rounded-lg p-3">
                   <option value="">-- Crear perfil independiente --</option>
                   {securityUsers.map(u => {
                     const isLinked = citizens.some(c => c.userId === u.id);
                     return (
                       <option key={u.id} value={u.id} disabled={isLinked}>
                         {u.name} ({u.email}) {isLinked ? '- Ya enlazado' : ''}
                       </option>
                     );
                   })}
                 </select>
              </div>
            )}
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Nombres</label>
               <input type="text" required value={formData.nombres} onChange={(e) => setFormData({ ...formData, nombres: e.target.value })} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3" />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Apellidos</label>
               <input type="text" required value={formData.apellidos} onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3" />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Teléfono</label>
               <input type="text" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3" />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Dirección (Residencia)</label>
               <input type="text" value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3" />
            </div>
            <div className="md:col-span-2">
               <label className="block text-sm font-medium text-slate-400 mb-1">Fecha de Nacimiento</label>
               <input type="date" value={formData.fecha_nacimiento} onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3" />
            </div>
            <Button type="submit" className="md:col-span-2 bg-green-600 hover:bg-green-700 mt-2">
              {editingCitizen ? 'Guardar Cambios' : 'Guardar Perfil'}
            </Button>
          </form>
        </div>
      )}

      {/* Modal de Recarga */}
      {rechargeData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl max-w-sm w-full">
            <h3 className="text-xl font-bold text-green-400 mb-2">Recargar Billetera</h3>
            <p className="text-slate-400 text-sm mb-4">Ingresa el monto a recargar para el usuario.</p>
            <form onSubmit={handleRecharge}>
              <div className="relative mb-4">
                <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
                <input 
                  type="number" min="1" required 
                  value={rechargeData.amount} 
                  onChange={e => setRechargeData({ ...rechargeData, amount: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 pl-8 text-xl font-mono" 
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" className="flex-1 text-slate-400" onClick={() => setRechargeData(null)}>Cancelar</Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">Recargar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-slate-800 shadow-xl rounded-xl overflow-hidden border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Ciudadano</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Cuenta</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Contacto</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Saldo Billetera</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {/* Lista combinada: Mostrar ciudadanos que ya tienen perfil + usuarios sin perfil */}
            {(() => {
              // 1. Mostrar los ciudadanos (que ya tienen perfil en ms-logic)
              const renderCitizens = citizens.map((citizen) => {
                const linkedUser = getUserEmail(citizen.userId);
                return (
                  <tr key={`citizen-${citizen.id}`} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-base">{citizen.nombres} {citizen.apellidos}</div>
                      <div className="text-xs text-slate-500 font-mono">ID: {citizen.id.split('-')[0]}...</div>
                    </td>
                    <td className="px-6 py-4">
                      {linkedUser ? (
                        <div>
                          <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-700/50 font-bold">🔗 Enlazado</span>
                          <div className="text-xs text-slate-500 mt-1 truncate max-w-[150px]">{linkedUser.email}</div>
                        </div>
                      ) : (
                        <span className="text-xs bg-amber-900/30 text-amber-400 px-2 py-1 rounded border border-amber-700/30">⚠️ Independiente</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-300">{citizen.telefono || 'Sin teléfono'}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{citizen.direccion || 'Sin dirección'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-bold text-green-400 bg-green-900/30 px-3 py-1 rounded border border-green-800/50">
                          ${Number(citizen.saldo).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => setRechargeData({ id: citizen.id, amount: 10000 })}
                          className="text-xs bg-slate-700 hover:bg-slate-600 text-white font-bold px-2 py-1 rounded"
                        >
                          + Recargar
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleEdit(citizen)} className="text-blue-400 hover:text-blue-300 font-medium text-sm">Editar</button>
                      <button onClick={() => handleDelete(citizen.id)} className="text-red-400 hover:text-red-300 font-medium text-sm">Eliminar</button>
                    </td>
                  </tr>
                );
              });

              // 2. Mostrar los usuarios de ms-security (con rol CIUDADANO) que NO tienen perfil en ms-logic
              const unlinkedUsers = securityUsers.filter(user => !citizens.some(c => c.userId === user.id));
              const renderUnlinkedUsers = unlinkedUsers.map(user => (
                <tr key={`user-${user.id}`} className="hover:bg-slate-700/30 transition-colors bg-red-900/10 border-l-4 border-red-500">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-400 text-base">{user.name}</div>
                    <div className="text-xs text-red-400 font-bold mt-1">⚠️ Requiere crear perfil</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 font-mono">
                      {user.email}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500 italic">No disponible</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500 italic">Sin billetera</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        const partes = user.name?.split(' ') || [''];
                        setFormData({
                          userId: user.id,
                          nombres: partes[0] || '',
                          apellidos: partes.slice(1).join(' ') || '',
                          telefono: '',
                          direccion: '',
                          fecha_nacimiento: ''
                        });
                        setIsCreating(true);
                        setEditingCitizen(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} 
                      className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md font-bold text-sm"
                    >
                      Crear Perfil
                    </button>
                  </td>
                </tr>
              ));

              const allRows = [...renderUnlinkedUsers, ...renderCitizens];
              return allRows.length > 0 ? allRows : <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay registros</td></tr>;
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CitizensPage;
