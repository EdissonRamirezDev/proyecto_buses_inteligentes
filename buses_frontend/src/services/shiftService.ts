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
