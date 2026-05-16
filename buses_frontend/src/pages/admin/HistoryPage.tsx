import React, { useEffect, useState } from 'react';
import { getHistory, scanTicket } from '../../services/historyService';
import { getTickets } from '../../services/ticketsService';
import { getRoutes } from '../../services/routesService';
import type { HistoryEntry } from '../../types/history.types';
import type { Ticket } from '../../types/ticket.types';
import type { Route } from '../../types/route.types';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  
  const [isScanning, setIsScanning] = useState(false);
  const [formData, setFormData] = useState<{ ticketId: string; nodeId: string; tipo_validacion: 'ENTRADA' | 'SALIDA' }>({ ticketId: '', nodeId: '', tipo_validacion: 'ENTRADA' });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      const [hData, tData, rData] = await Promise.all([getHistory(), getTickets(), getRoutes()]);
      setHistory(hData);
      setTickets(tData.filter(t => t.estado === 'activo' || t.estado === 'usado'));
      setRoutes(rData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      await scanTicket(formData.ticketId, formData.nodeId, formData.tipo_validacion);
      setSuccessMsg(`¡Validación exitosa! El boleto ha sido marcado como ${formData.tipo_validacion === 'ENTRADA' ? 'USADO' : 'COMPLETADO'}.`);
      setTimeout(() => {
        setIsScanning(false);
        setSuccessMsg('');
      }, 2000);
      fetchData();
    } catch (error: any) {
      console.error('Error al validar:', error);
      setErrorMsg(error.response?.data?.message || 'Error al validar el boleto');
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-300 hover:text-white">
            ← Volver
          </Button>
          <h1 className="text-3xl font-bold text-white">Historial de Validaciones</h1>
        </div>
        <Button onClick={() => setIsScanning(!isScanning)} className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/50 shadow-lg">
          {isScanning ? 'Cancelar' : 'Simular Escaneo en Bus'}
        </Button>
      </div>

      {isScanning && (
        <div className="bg-slate-800 p-6 rounded-xl shadow-2xl mb-6 border border-indigo-500/50 animate-in slide-in-from-top-4">
          <h2 className="text-xl font-bold mb-2 text-indigo-400">Punto de Validación (Scanner Simulador)</h2>
          <p className="text-sm text-slate-400 mb-6">Simula el momento en que un pasajero escanea su código QR al subir o bajar del bus.</p>
          
          {errorMsg && <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg text-sm">❌ {errorMsg}</div>}
          {successMsg && <div className="mb-4 bg-emerald-900/50 border border-emerald-500 text-emerald-200 p-3 rounded-lg text-sm">✅ {successMsg}</div>}

          <form onSubmit={handleScan} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
               <label className="block text-sm font-medium text-slate-300 mb-1">1. Tipo de Acción</label>
               <select required value={formData.tipo_validacion} onChange={e => setFormData({...formData, tipo_validacion: e.target.value as 'ENTRADA' | 'SALIDA'})} className="w-full bg-slate-900 border-slate-600 text-white rounded-lg p-3">
                 <option value="ENTRADA">Entrada (Abordaje)</option>
                 <option value="SALIDA">Salida (Descenso)</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-300 mb-1">2. Escanear Boleto (QR)</label>
               <select required value={formData.ticketId} onChange={e => setFormData({...formData, ticketId: e.target.value})} className="w-full bg-slate-900 border-slate-600 text-white rounded-lg p-3">
                 <option value="">Seleccione un boleto...</option>
                 {tickets.map(t => (
                   <option key={t.id} value={t.id}>{t.codigo_qr} - {t.citizen?.nombres} ({t.estado})</option>
                 ))}
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-300 mb-1">3. Punto de Validación (Nodo)</label>
               <select required value={formData.nodeId} onChange={e => setFormData({...formData, nodeId: e.target.value})} className="w-full bg-slate-900 border-slate-600 text-white rounded-lg p-3">
                 <option value="">Seleccione el paradero/nodo...</option>
                 {routes.map(route => (
                   <optgroup key={route.id} label={`Ruta: ${route.nombre}`}>
                     {route.nodes?.map(node => (
                       <option key={node.id} value={node.id}>
                         {node.busStop?.nombre || `Nodo ${node.orden}`}
                       </option>
                     ))}
                   </optgroup>
                 ))}
               </select>
            </div>
            <div className="md:col-span-3">
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 font-bold uppercase tracking-wider">
                Validar {formData.tipo_validacion}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-800 shadow-xl rounded-xl overflow-hidden border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha / Hora</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Pasajero</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Boleto (QR)</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Lugar de Escaneo</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Acción</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Ruta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {history.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No hay registros de validación</td></tr>
            ) : history.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                  {new Date(entry.fecha_hora).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-white font-bold">{entry.ticket?.citizen?.nombres} {entry.ticket?.citizen?.apellidos}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-emerald-400 text-xs bg-emerald-900/20 px-2 py-1 rounded border border-emerald-800/30">
                    {entry.ticket?.codigo_qr}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-indigo-300 font-medium">
                    {entry.node?.busStop?.nombre || `Nodo ${entry.node?.orden}`}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${entry.tipo_validacion === 'ENTRADA' ? 'bg-blue-900/50 text-blue-300' : 'bg-orange-900/50 text-orange-300'}`}>
                    {entry.tipo_validacion}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-slate-400 uppercase">{entry.node?.route?.nombre}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryPage;
