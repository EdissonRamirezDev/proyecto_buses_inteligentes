import { httpBusiness } from './http';
import type { HistoryEntry, ScanResponse } from '../types/history.types';

export const getHistory = async (): Promise<HistoryEntry[]> => {
  const response = await httpBusiness.get<HistoryEntry[]>('/history');
  return response.data;
};

export const scanTicket = async (ticketId: string, nodeId: string, tipo_validacion: 'ENTRADA' | 'SALIDA'): Promise<ScanResponse> => {
  const response = await httpBusiness.post<ScanResponse>('/history/scan', { ticketId, nodeId, tipo_validacion });
  return response.data;
};

export const deleteHistoryEntry = async (id: string): Promise<void> => {
  await httpBusiness.delete(`/history/${id}`);
};

