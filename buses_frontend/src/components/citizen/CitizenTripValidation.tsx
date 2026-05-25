import { useEffect, useState } from 'react';
import { boardAtStop, descendAtStop } from '../../services/ticketsService';
import type { Ticket } from '../../types/ticket.types';
import Button from '../common/Button';

interface Props {
  citizenId: string;
  tickets: Ticket[];
  onDone: () => void;
  onToast: (msg: string) => void;
}

const CitizenTripValidation = ({ citizenId, tickets, onDone, onToast }: Props) => {
  const inTrip = tickets.find((t) => t.estado === 'usado');
  const pending = tickets.find((t) => t.estado === 'activo');

  const target = inTrip || pending;
  const [nodeId, setNodeId] = useState('');
  const [loading, setLoading] = useState(false);

  const nodes =
    (target?.schedule as any)?.route?.nodes
      ?.filter((n: any) => n.busStop)
      ?.sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0)) || [];

  useEffect(() => {
    if (nodes[0]?.id) setNodeId(nodes[0].id);
  }, [target?.id]);

  if (!target) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-sm text-slate-400">
        No tienes boletos activos ni viajes en curso. Compra un boleto primero.
      </div>
    );
  }

  const handleBoard = async () => {
    if (!target.schedule?.id || !nodeId) return;
    setLoading(true);
    try {
      const result = await boardAtStop(citizenId, target.schedule.id, nodeId);
      const saldo =
        result.saldoRestante != null
          ? ` Saldo restante: $${Number(result.saldoRestante).toLocaleString()}`
          : '';
      onToast(`${result.mensaje || 'Abordaje exitoso'}${saldo}`);
      onDone();
    } catch (err: any) {
      onToast(err.response?.data?.message || 'No se pudo registrar el abordaje');
    } finally {
      setLoading(false);
    }
  };

  const handleDescend = async () => {
    if (!target.id || !nodeId) return;
    setLoading(true);
    try {
      const result = await descendAtStop(target.id, nodeId);
      onToast(result.mensaje || 'Viaje completado - Gracias por usar nuestro servicio');
      onDone();
    } catch (err: any) {
      onToast(err.response?.data?.message || 'No se pudo registrar el descenso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="font-bold text-white">Validar viaje en paradero</h3>
        <p className="text-xs text-slate-400 mt-1">
          {inTrip
            ? 'Boleto en viaje — registra tu descenso'
            : 'Boleto activo — valida abordaje y genera registro en el paradero'}
        </p>
      </div>

      <div className="text-sm text-slate-300 space-y-1">
        <p>
          <span className="text-slate-500">Ruta:</span>{' '}
          {(target.schedule as any)?.route?.nombre || '—'}
        </p>
        <p>
          <span className="text-slate-500">Bus:</span>{' '}
          {(target.schedule as any)?.bus?.placa || '—'}
        </p>
        <p>
          <span className="text-slate-500">Estado:</span> {target.estado}
        </p>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Paradero</label>
        <select
          value={nodeId}
          onChange={(e) => setNodeId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm"
        >
          {nodes.map((n: any) => (
            <option key={n.id} value={n.id}>
              {n.busStop?.nombre || `Paradero ${n.orden}`}
            </option>
          ))}
        </select>
      </div>

      {inTrip ? (
        <Button
          onClick={handleDescend}
          disabled={loading || !nodeId}
          className="w-full bg-red-600 hover:bg-red-500"
          isLoading={loading}
        >
          Registrar descenso
        </Button>
      ) : (
        <Button
          onClick={handleBoard}
          disabled={loading || !nodeId}
          className="w-full bg-emerald-600 hover:bg-emerald-500"
          isLoading={loading}
        >
          Validar abordaje
        </Button>
      )}
    </div>
  );
};

export default CitizenTripValidation;
