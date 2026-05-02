import { httpBusiness } from './http';
import type { Bus } from '../types/bus.types';

export const getBuses = async (): Promise<Bus[]> => {
  const response = await httpBusiness.get<Bus[]>('/buses');
  return response.data;
};

export const getBusById = async (id: number): Promise<Bus> => {
  const response = await httpBusiness.get<Bus>(`/buses/${id}`);
  return response.data;
};

export const createBus = async (data: Partial<Bus>): Promise<Bus> => {
  const response = await httpBusiness.post<Bus>('/buses', data);
  return response.data;
};

export const updateBus = async (id: number, data: Partial<Bus>): Promise<Bus> => {
  const response = await httpBusiness.patch<Bus>(`/buses/${id}`, data);
  return response.data;
};

export const deleteBus = async (id: number): Promise<void> => {
  await httpBusiness.delete(`/buses/${id}`);
};
