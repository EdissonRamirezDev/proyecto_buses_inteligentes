import { httpBusiness } from './http';

export interface FleetBusIncident {
  type: string;
  severity: string;
  description: string;
}

export interface LiveFleetBus {
  id: number;
  placa: string;
  latitude: number;
  longitude: number;
  estado: 'normal' | 'incidente';
  ocupacion: number;
  capacidad: number;
  alerta_ocupacion: boolean;
  incidentes: FleetBusIncident[];
}

export interface LiveFleetStatusResponse {
  totalPassengers: number;
  buses: LiveFleetBus[];
}

export const getLiveFleetStatus = async (): Promise<LiveFleetStatusResponse> => {
  const response = await httpBusiness.get<LiveFleetStatusResponse>('/buses/fleet/live');
  return response.data;
};

export const simulateTraffic = async (): Promise<any> => {
  const response = await httpBusiness.post('/buses/fleet/simulate-traffic');
  return response.data;
};

export const resetSimulation = async (): Promise<any> => {
  const response = await httpBusiness.post('/buses/fleet/reset-simulation');
  return response.data;
};
