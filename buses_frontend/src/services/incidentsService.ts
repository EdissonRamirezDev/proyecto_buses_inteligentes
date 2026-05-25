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

const mapIncident = (backendInc: any): Incident => {
  const busesInc = backendInc.busesIncidents || [];
  const incidentBusesMapped = busesInc.map((bi: any) => ({
    id: bi.id?.toString() || '',
    nivel_gravedad: bi.latitude ? 1 : 0,
    bus: bi.bus ? { id: bi.bus.id?.toString(), placa: bi.bus.placa } : undefined,
    photos: (bi.photos || []).map((p: any) => ({
      id: p.id?.toString() || '',
      url_imagen: p.url || '',
      fecha_captura: p.uploadedAt || ''
    }))
  }));

  // Mapear estado
  let estadoMapped = backendInc.state || 'REPORTADO';
  if (estadoMapped === 'ABIERTO') {
    estadoMapped = 'REPORTADO';
  }

  return {
    id: backendInc.id?.toString() || '',
    titulo: backendInc.type || '',
    descripcion: backendInc.description || '',
    categoria: backendInc.type || 'OTRO',
    estado: estadoMapped as any,
    fecha_reporte: backendInc.date || '',
    
    // Mantener campos nativos del backend para compatibilidad del panel de empresa
    type: backendInc.type || '',
    severity: backendInc.severity || '',
    description: backendInc.description || '',
    date: backendInc.date || '',
    state: backendInc.state || '',
    
    incidentBuses: incidentBusesMapped
  } as any;
};

export const getIncidents = async (): Promise<Incident[]> => {
  const response = await httpBusiness.get<any[]>('/incidents');
  return response.data.map(mapIncident);
};

export const createIncident = async (data: { titulo: string, descripcion: string, categoria: string, shiftId: string, busId?: string, photos?: string[] }): Promise<Incident> => {
  const response = await httpBusiness.post<any>('/incidents', {
    type: data.categoria || 'OTRO',
    severity: 'MEDIO',
    description: data.descripcion || '',
    date: new Date().toISOString(),
    state: 'REPORTADO'
  });
  return mapIncident(response.data);
};

export const updateIncidentStatus = async (id: string, estado: string): Promise<Incident> => {
  const response = await httpBusiness.patch<any>(`/incidents/${id}`, { state: estado });
  return mapIncident(response.data);
};
