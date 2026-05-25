import { httpBusiness } from './http';
import type { Ticket, TripDetails } from '../types/ticket.types';

export const getTickets = async (): Promise<Ticket[]> => {
  const response = await httpBusiness.get<Ticket[]>('/tickets');
  return response.data;
};

export const getActiveTicketsForCitizen = async (citizenId: string): Promise<Ticket[]> => {
  const response = await httpBusiness.get<Ticket[]>(`/tickets/citizen/${citizenId}/active`);
  return response.data;
};

export const purchaseTicket = async (citizenId: string, scheduleId: string): Promise<Ticket> => {
  const response = await httpBusiness.post<Ticket>('/tickets/purchase', { citizenId, scheduleId });
  return response.data;
};

export interface BoardingResult {
  ticket: Ticket;
  mensaje: string;
  saldoRestante?: number;
  history?: unknown;
  capacidadBus?: { max: number; ocupados: number; disponibles: number } | null;
}

export const boardAtStop = async (
  citizenId: string,
  scheduleId: string,
  nodeId: string,
  citizenPaymentMethodId?: string,
): Promise<BoardingResult> => {
  const response = await httpBusiness.post<BoardingResult>('/tickets/board-at-stop', {
    citizenId,
    scheduleId,
    nodeId,
    citizenPaymentMethodId,
  });
  return response.data;
};

export const descendAtStop = async (ticketId: string, nodeId: string) => {
  const response = await httpBusiness.post<{
    mensaje: string;
    capacidadBus?: { max: number; ocupados: number; disponibles: number } | null;
  }>('/tickets/descend-at-stop', { ticketId, nodeId });
  return response.data;
};

export const deleteTicket = async (id: string): Promise<void> => {
  await httpBusiness.delete(`/tickets/${id}`);
};

export const getTripDetails = async (id: string): Promise<TripDetails> => {
  const response = await httpBusiness.get<TripDetails>(`/tickets/${id}/trip-details`);
  const data = response.data;
  const raw = data.driver as TripDetails['driver'] & { person?: { name?: string; lastName?: string } };
  if (raw && (!raw.name || !raw.last_name) && raw.person) {
    data.driver = {
      id: raw.id,
      name: raw.name || raw.person.name || '',
      last_name: raw.last_name || raw.person.lastName || '',
      license: raw.license,
    };
  }
  return data;
};

