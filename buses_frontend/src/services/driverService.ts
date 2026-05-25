import { httpBusiness } from './http';
import type { Driver } from '../types/driver.types';
import { mapDriverFromApi } from '../utils/driverUtils';

export const getDrivers = async (): Promise<Driver[]> => {
  const response = await httpBusiness.get<Driver[]>('/drivers');
  return response.data.map(mapDriverFromApi);
};

export const getDriverById = async (id: number): Promise<Driver> => {
  const response = await httpBusiness.get<Driver>(`/drivers/${id}`);
  return response.data;
};

export const createDriver = async (data: {
  name: string;
  last_name: string;
  license: string;
  email?: string;
  phone?: string;
  status?: string;
}): Promise<Driver> => {
  const response = await httpBusiness.post<Driver>('/drivers', data);
  return mapDriverFromApi(response.data);
};

export const updateDriver = async (id: number, data: Partial<Driver>): Promise<Driver> => {
  const response = await httpBusiness.patch<Driver>(`/drivers/${id}`, data);
  return response.data;
};

export const deleteDriver = async (id: number): Promise<void> => {
  await httpBusiness.delete(`/drivers/${id}`);
};
