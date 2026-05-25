import { httpBusiness } from './http';
import type { Shift } from '../types/shift.types';

export const getShifts = async (): Promise<Shift[]> => {
  const response = await httpBusiness.get<Shift[]>('/shifts');
  return response.data;
};

export const getShiftById = async (id: number): Promise<Shift> => {
  const response = await httpBusiness.get<Shift>(`/shifts/${id}`);
  return response.data;
};

export const createShift = async (data: Partial<Shift>): Promise<Shift> => {
  const response = await httpBusiness.post<Shift>('/shifts', data);
  return response.data;
};

export const updateShift = async (id: number, data: Partial<Shift>): Promise<Shift> => {
  const response = await httpBusiness.patch<Shift>(`/shifts/${id}`, data);
  return response.data;
};

export const deleteShift = async (id: number): Promise<void> => {
  await httpBusiness.delete(`/shifts/${id}`);
};

export const getActiveShiftByEmail = async (email: string): Promise<Shift> => {
  const response = await httpBusiness.get<Shift>(`/shifts/active/${encodeURIComponent(email)}`);
  return response.data;
};

export const getStartableShiftsByEmail = async (email: string): Promise<Shift[]> => {
  const response = await httpBusiness.get<Shift[]>(`/shifts/startable/${encodeURIComponent(email)}`);
  return response.data;
};

export type StartShiftPayload = {
  busStatus: 'ok' | 'obs' | 'rev';
  observations?: string;
  driverEmail?: string;
};

export const startShift = async (id: number, data: StartShiftPayload): Promise<Shift> => {
  const response = await httpBusiness.post<Shift>(`/shifts/${id}/start`, data);
  return response.data;
};
