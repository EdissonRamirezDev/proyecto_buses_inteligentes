import type { Ticket } from './ticket.types';
import type { Node } from './node.types';

export interface HistoryEntry {
  id: string;
  fecha_hora: string;
  ticket?: Ticket;
  node?: Node;
}
