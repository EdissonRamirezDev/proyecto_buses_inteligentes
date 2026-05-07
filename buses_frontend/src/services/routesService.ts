import { httpBusiness } from './http';
import type { Route } from '../types/route.types';

export const getRoutes = async (): Promise<Route[]> => {
  const response = await httpBusiness.get<Route[]>('/routes');
  return response.data;
};

export const createRoute = async (data: Partial<Route>): Promise<Route> => {
  const response = await httpBusiness.post<Route>('/routes', data);
  return response.data;
};

export const updateRoute = async (id: string, data: Partial<Route>): Promise<Route> => {
  const response = await httpBusiness.patch<Route>(`/routes/${id}`, data);
  return response.data;
};

export const deleteRoute = async (id: string): Promise<void> => {
  await httpBusiness.delete(`/routes/${id}`);
};
