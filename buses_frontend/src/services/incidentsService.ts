import { httpBusiness } from './http';
import { API_BUSINESS_URL } from '../utils/constants';

export function resolvePhotoPublicUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const origin = (API_BUSINESS_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
}

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
      url_imagen: resolvePhotoPublicUrl(p.url),
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

export interface IncidentStats {
  total: number;
  resueltos: number;
  tasaResolucion: number;
  porTipo: Record<string, number>;
}

export const getIncidents = async (busId?: string, empresaId?: string): Promise<Incident[]> => {
  const params: Record<string, string> = {};
  if (busId) params.busId = busId;
  if (empresaId) params.empresaId = empresaId;
  const response = await httpBusiness.get<any[]>('/incidents', { params });
  return response.data.map(mapIncident);
};

export const getIncidentStats = async (
  busId?: string,
  empresaId?: string,
): Promise<IncidentStats> => {
  const params: Record<string, string> = {};
  if (busId) params.busId = busId;
  if (empresaId) params.empresaId = empresaId;
  const response = await httpBusiness.get<IncidentStats>('/incidents/stats', { params });
  return response.data;
};

export async function updateIncident(
  id: string | number,
  payload: string | { state?: string; followUpComment?: string },
): Promise<Incident> {
  const body = typeof payload === 'string' ? { state: payload } : payload;
  const response = await httpBusiness.patch<any>(`/incidents/${id}`, body);
  return mapIncident(response.data);
}

export async function updateIncidentStatus(id: string, estado: string): Promise<Incident> {
  return updateIncident(id, { state: estado });
}

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
