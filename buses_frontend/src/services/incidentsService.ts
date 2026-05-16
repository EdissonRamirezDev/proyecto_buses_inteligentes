import { httpBusiness } from './http';

export interface Photo {
  id: string;
  url_imagen: string;
  fecha_captura: string;
}

export interface IncidentBus {
  id: string;
  nivel_gravedad: number;
  bus?: { id: string; placa: string };
  photos: Photo[];
}

export interface Incident {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: 'MECANICO' | 'ACCIDENTE' | 'CONGESTION' | 'PASAJERO' | 'OTRO';
  estado: 'REPORTADO' | 'EN_REVISION' | 'RESUELTO';
  fecha_reporte: string;
  shift?: { 
    id: string; 
    driver?: { nombres: string; apellidos: string };
    bus?: { placa: string };
  };
  incidentBuses: IncidentBus[];
}

export const getIncidents = async (): Promise<Incident[]> => {
  const response = await httpBusiness.get<Incident[]>('/incidents');
  return response.data;
};

export const createIncident = async (data: { titulo: string, descripcion: string, categoria: string, shiftId: string, busId?: string, photos?: string[] }): Promise<Incident> => {
  const response = await httpBusiness.post<Incident>('/incidents', data);
  return response.data;
};

export const updateIncidentStatus = async (id: string, estado: string): Promise<Incident> => {
  const response = await httpBusiness.patch<Incident>(`/incidents/${id}`, { estado });
  return response.data;
};
