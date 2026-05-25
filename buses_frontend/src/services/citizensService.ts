import { httpBusiness } from './http';
import type { Citizen } from '../types/citizen.types';
import { getCitizenUserId } from '../types/citizen.types';

export const getCitizens = async (): Promise<Citizen[]> => {
  const response = await httpBusiness.get<Citizen[]>('/citizens');
  return response.data;
};

export const findCitizenByUserId = async (userId: string): Promise<Citizen | undefined> => {
  const citizens = await getCitizens();
  return citizens.find((c) => getCitizenUserId(c) === userId);
};

export const createCitizen = async (data: Omit<Citizen, 'id' | 'saldo'>): Promise<Citizen> => {
  const response = await httpBusiness.post<Citizen>('/citizens', data);
  return response.data;
};

export const updateCitizen = async (id: string, data: Partial<Citizen>): Promise<Citizen> => {
  const response = await httpBusiness.patch<Citizen>(`/citizens/${id}`, data);
  return response.data;
};

export const deleteCitizen = async (id: string): Promise<void> => {
  await httpBusiness.delete(`/citizens/${id}`);
};
