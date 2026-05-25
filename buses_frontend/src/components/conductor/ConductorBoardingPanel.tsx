import { useEffect, useState } from 'react';
import { getActiveScheduleByBus } from '../../services/schedulesService';
import { boardAtStop, descendAtStop, type BoardingResult } from '../../services/ticketsService';
import { getRoutes } from '../../services/routesService';
import type { Schedule } from '../../types/schedule.types';
import Button from '../common/Button';

interface ConductorBoardingPanelProps {
  busId: number;
  onToast: (msg: string) => void;
  onCapacityChange?: (cap: { max: number; ocupados: number; disponibles: number }) => void;
}

const ConductorBoardingPanel = ({ busId, onToast, onCapacityChange }: ConductorBoardingPanelProps) => {
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [activeTicketId, setActiveTicketId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastMessage, setLastMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const schedule = await getActiveScheduleByBus(busId);
        setActiveSchedule(schedule);
        if (schedule?.route?.id) {
          const routes = await getRoutes();
          const route = routes.find((r) => r.id === schedule.route?.id);
          const sorted = (route as any)?.nodes?.sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0)) || [];
          setNodes(sorted);
          if (sorted[0]?.id) setSelectedNodeId(sorted[0].id);
        }
      } catch (e) {
        console.error(e);
        setActiveSchedule(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [busId]);

  const handleBoarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchedule?.id || !selectedNodeId || !citizenId.trim()) {
      onToast('Complete programación, paradero y ID del ciudadano');
      return;
    }
    setSubmitting(true);
    setLastMessage('');
    try {
      const result = await boardAtStop(citizenId.trim(), activeSchedule.id, selectedNodeId);
      const msg = result.mensaje || 'Abordaje exitoso';
      const saldo = result.saldoRestante != null ? ` — Saldo restante: $${Number(result.saldoRestante).toLocaleString()}` : '';
      const cap = result.capacidadBus
        ? ` — Ocupación: ${result.capacidadBus.ocupados}/${result.capacidadBus.max} (${result.capacidadBus.disponibles} libres)`
        : '';
      setLastMessage(`${msg}${saldo}${cap}`);
      onToast(`${msg}${saldo}${cap}`);
      if (result.capacidadBus) onCapacityChange?.(result.capacidadBus);
      if (result.ticket?.id) setActiveTicketId(result.ticket.id);
    } catch (err: any) {
      const text = err.response?.data?.message || 'Error en abordaje';
      setLastMessage(text);
      onToast(text);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDescent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || !selectedNodeId) {
      onToast('Indique el ID del boleto activo y el paradero de descenso');
      return;
    }
    setSubmitting(true);
    setLastMessage('');
    try {
      const result = await descendAtStop(activeTicketId, selectedNodeId) as BoardingResult;
      const cap = result.capacidadBus
        ? ` — Ocupación: ${result.capacidadBus.ocupados}/${result.capacidadBus.max} (${result.capacidadBus.disponibles} libres)`
        : '';
      setLastMessage((result.mensaje || 'Viaje completado') + cap);
      onToast((result.mensaje || 'Viaje completado - Gracias por usar nuestro servicio') + cap);
      if (result.capacidadBus) onCapacityChange?.(result.capacidadBus);
      setActiveTicketId('');
    } catch (err: any) {
      const text = err.response?.data?.message || 'Error en descenso';
      setLastMessage(text);
      onToast(text);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando programación activa del bus...</p>;
  }

  if (!activeSchedule) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-200">
        No hay programación activa para este bus en la fecha/hora actual.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
        <p><strong>Programación:</strong> {activeSchedule.route?.nombre || 'Ruta'} — {activeSchedule.hora_salida}</p>
        <p className="text-slate-500 mt-1">Bus en servicio · Valide abordajes y descensos en el paradero actual</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Paradero de validación</label>
        <select
          value={selectedNodeId}
          onChange={(e) => setSelectedNodeId(e.target.value)}
          className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
        >
          {nodes.map((n: any) => (
            <option key={n.id} value={n.id}>
              #{n.orden} — {n.busStop?.nombre || 'Paradero'}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleBoarding} className="space-y-3 p-4 border border-emerald-200 dark:border-emerald-800 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20">
        <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Abordaje (ENTRADA)</h3>
        <input
          type="text"
          placeholder="UUID del ciudadano"
          value={citizenId}
          onChange={(e) => setCitizenId(e.target.value)}
          className="w-full p-3 rounded-lg border text-sm"
          required
        />
        <Button type="submit" isLoading={submitting} className="w-full bg-emerald-600 hover:bg-emerald-500">
          Validar abordaje
        </Button>
      </form>

      <form onSubmit={handleDescent} className="space-y-3 p-4 border border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50/50 dark:bg-blue-950/20">
        <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Descenso (SALIDA)</h3>
        <input
          type="text"
          placeholder="ID del boleto en viaje (usado)"
          value={activeTicketId}
          onChange={(e) => setActiveTicketId(e.target.value)}
          className="w-full p-3 rounded-lg border text-sm"
          required
        />
        <Button type="submit" isLoading={submitting} className="w-full bg-blue-600 hover:bg-blue-500">
          Validar descenso
        </Button>
      </form>

      {lastMessage && (
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
          {lastMessage}
        </p>
      )}
    </div>
  );
};

export default ConductorBoardingPanel;
