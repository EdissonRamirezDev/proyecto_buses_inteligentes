import { httpBusiness } from './http';
import type { Incident, BusesIncident } from '../types/incident.types';

export const createIncident = async (data: Partial<Incident>): Promise<Incident> => {
  const response = await httpBusiness.post<Incident>('/incidents', data);
  return response.data;
};

export const createBusesIncident = async (data: {
  latitude: number;
  longitude: number;
  reportDate: string;
  busId: number;
  incidentId: number;
}): Promise<BusesIncident> => {
  const response = await httpBusiness.post<BusesIncident>('/buses-incidents', data);
  return response.data;
};

export const createPhoto = async (data: { url: string; busIncidentId: number }): Promise<void> => {
  await httpBusiness.post('/photos', data);
};
