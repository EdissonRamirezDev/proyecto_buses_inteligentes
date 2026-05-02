import { httpBusiness } from './http';
import type { Driver } from '../types/driver.types';

export const getDrivers = async (): Promise<Driver[]> => {
  const response = await httpBusiness.get<Driver[]>('/drivers');
  return response.data;
};

export const getDriverById = async (id: number): Promise<Driver> => {
  const response = await httpBusiness.get<Driver>(`/drivers/${id}`);
  return response.data;
};

export const createDriver = async (data: Partial<Driver>): Promise<Driver> => {
  const response = await httpBusiness.post<Driver>('/drivers', data);
  return response.data;
};

export const updateDriver = async (id: number, data: Partial<Driver>): Promise<Driver> => {
  const response = await httpBusiness.patch<Driver>(`/drivers/${id}`, data);
  return response.data;
};

export const deleteDriver = async (id: number): Promise<void> => {
  await httpBusiness.delete(`/drivers/${id}`);
};
