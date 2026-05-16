import { httpBusiness } from './http';
import type { HistoryEntry } from '../types/history.types';

export const getHistory = async (): Promise<HistoryEntry[]> => {
  const response = await httpBusiness.get<HistoryEntry[]>('/history');
  return response.data;
};

export const scanTicket = async (ticketId: string, nodeId: string): Promise<HistoryEntry> => {
  const response = await httpBusiness.post<HistoryEntry>('/history/scan', { ticketId, nodeId });
  return response.data;
};

export const deleteHistoryEntry = async (id: string): Promise<void> => {
  await httpBusiness.delete(`/history/${id}`);
};
