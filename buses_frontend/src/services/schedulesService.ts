import { httpBusiness } from './http';
import type { Schedule } from '../types/schedule.types';

export const getSchedules = async (): Promise<Schedule[]> => {
  const response = await httpBusiness.get<Schedule[]>('/schedules');
  return response.data;
};

export const createSchedule = async (data: Partial<Schedule> & { routeId: string; busId: number }): Promise<Schedule> => {
  const response = await httpBusiness.post<Schedule>('/schedules', data);
  return response.data;
};

export const updateSchedule = async (id: string, data: Partial<Schedule>): Promise<Schedule> => {
  const response = await httpBusiness.patch<Schedule>(`/schedules/${id}`, data);
  return response.data;
};

export const deleteSchedule = async (id: string): Promise<void> => {
  await httpBusiness.delete(`/schedules/${id}`);
};
