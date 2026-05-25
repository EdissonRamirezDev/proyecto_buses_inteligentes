import type { Ticket } from './ticket.types';
import type { Node } from './node.types';

export interface HistoryEntry {
  id: string;
  fecha_hora: string;
  tipo_validacion: 'ENTRADA' | 'SALIDA';
  ticket?: Ticket;
  node?: Node;
}

export interface BusCapacitySnapshot {
  max: number;
  ocupados: number;
  disponibles: number;
}

export interface ScanResponse {
  history: HistoryEntry;
  mensaje: string;
  saldoRestante: number | null;
  fecha_fin: string | null;
  capacidadBus?: BusCapacitySnapshot | null;
}

