import { httpBusiness } from './http';

export interface ActiveBus {
  scheduleId: string;
  estado: string;
  hora_salida: string;
  tolerancia_minutos: number;
  busId: number;
  placa: string;
  latitude: number;
  longitude: number;
}

export const getActiveBuses = async (routeId: string): Promise<ActiveBus[]> => {
  try {
    const response = await httpBusiness.get<ActiveBus[]>(`/routes/${routeId}/active-buses`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching active buses for route ${routeId}:`, error);
    throw error;
  }
};
