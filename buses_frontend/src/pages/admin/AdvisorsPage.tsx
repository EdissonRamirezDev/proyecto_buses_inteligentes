import React, { useEffect, useState } from 'react';
import { getAdvisors, createAdvisor, updateAdvisor, deleteAdvisor } from '../../services/advisorsService';
import type { AdvisorData } from '../../services/advisorsService';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

const AdvisorsPage = () => {
  const navigate = useNavigate();
  const [advisors, setAdvisors] = useState<AdvisorData[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<AdvisorData | null>(null);
  const [formData, setFormData] = useState({ nombre: '', email: '', isActive: true });

  const fetchData = async () => {
    try {
      const data = await getAdvisors(false); // Fetch all (active and inactive) for admin
      setAdvisors(data);
    } catch (error) {
      console.error('Error fetching advisors:', error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormData({ nombre: '', email: '', isActive: true });
    setIsCreating(false);
    setEditingAdvisor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAdvisor && editingAdvisor.id) {
        await updateAdvisor(editingAdvisor.id, formData);
      } else {
        await createAdvisor(formData);
      }
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving advisor:', error);
    }
  };

  const handleEdit = (advisor: AdvisorData) => {
    setEditingAdvisor(advisor);
    setFormData({
      nombre: advisor.nombre,
      email: advisor.email,
      isActive: advisor.isActive ?? true
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este asesor permanentemente? (Recomendamos desactivarlo en su lugar)')) {
      try {
        await deleteAdvisor(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting advisor:', error);
      }
    }
  };

  const toggleStatus = async (advisor: AdvisorData) => {
    if (!advisor.id) return;
    try {
      await updateAdvisor(advisor.id, {
        nombre: advisor.nombre,
        email: advisor.email,
        isActive: !advisor.isActive
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling advisor status:', error);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-300 hover:text-white">
            ← Volver
          </Button>
          <h1 className="text-3xl font-bold text-white">Gestión de Asesores (Atención al Cliente)</h1>
        </div>
        <Button onClick={() => { if (isCreating) { resetForm(); } else { setIsCreating(true); } }} className="bg-blue-600 hover:bg-blue-700">
          {isCreating ? 'Cancelar' : 'Nuevo Asesor'}
        </Button>
      </div>

      {isCreating && (
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl mb-6 border border-slate-700 animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">
            {editingAdvisor ? `Editando: ${editingAdvisor.nombre}` : 'Registrar Nuevo Asesor'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Nombre Completo (Ej: Juan Pérez - Reclamos)</label>
               <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3" />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Correo Electrónico (El que usa en Google Calendar)</label>
               <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3" />
            </div>
            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 accent-blue-600" />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-300">Asesor Activo (Aparecerá en la App para los Ciudadanos)</label>
            </div>
            <Button type="submit" className="md:col-span-2 bg-green-600 hover:bg-green-700 mt-2">
              {editingAdvisor ? 'Guardar Cambios' : 'Registrar Asesor'}
            </Button>
          </form>
        </div>
      )}

      <div className="bg-slate-800 shadow-xl rounded-xl overflow-hidden border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Asesor</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Correo (Google Calendar)</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Estado</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {advisors.length > 0 ? advisors.map((advisor) => (
              <tr key={advisor.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-white text-base">{advisor.nombre}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-300 font-mono">{advisor.email}</span>
                </td>
                <td className="px-6 py-4">
                  {advisor.isActive ? (
                    <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded border border-green-700/50 font-bold">Activo</span>
                  ) : (
                    <span className="text-xs bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-700 font-bold">Inactivo</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => toggleStatus(advisor)} className="text-amber-400 hover:text-amber-300 font-medium text-sm">
                    {advisor.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => handleEdit(advisor)} className="text-blue-400 hover:text-blue-300 font-medium text-sm">Editar</button>
                  <button onClick={() => advisor.id && handleDelete(advisor.id)} className="text-red-400 hover:text-red-300 font-medium text-sm">Eliminar</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No hay asesores registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdvisorsPage;
