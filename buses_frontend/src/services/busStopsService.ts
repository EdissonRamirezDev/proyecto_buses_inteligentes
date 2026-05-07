import { httpBusiness } from './http';
import type { BusStop } from '../types/busStop.types';

export const getBusStops = async (): Promise<BusStop[]> => {
  const response = await httpBusiness.get<BusStop[]>('/bus-stops');
  return response.data;
};

export const createBusStop = async (data: Partial<BusStop>): Promise<BusStop> => {
  const response = await httpBusiness.post<BusStop>('/bus-stops', data);
  return response.data;
};

export const updateBusStop = async (id: string, data: Partial<BusStop>): Promise<BusStop> => {
  const response = await httpBusiness.patch<BusStop>(`/bus-stops/${id}`, data);
  return response.data;
};

export const deleteBusStop = async (id: string): Promise<void> => {
  await httpBusiness.delete(`/bus-stops/${id}`);
};
