import { httpBusiness } from './http';
import type { Ticket, TripDetails } from '../types/ticket.types';

export const getTickets = async (): Promise<Ticket[]> => {
  const response = await httpBusiness.get<Ticket[]>('/tickets');
  return response.data;
};

export const purchaseTicket = async (citizenId: string, scheduleId: string): Promise<Ticket> => {
  const response = await httpBusiness.post<Ticket>('/tickets/purchase', { citizenId, scheduleId });
  return response.data;
};

export const deleteTicket = async (id: string): Promise<void> => {
  await httpBusiness.delete(`/tickets/${id}`);
};

export const getTripDetails = async (id: string): Promise<TripDetails> => {
  const response = await httpBusiness.get<TripDetails>(`/tickets/${id}/trip-details`);
  return response.data;
};

