import type { Bus } from './bus.types';

export type IncidentSeverity = 'BAJO' | 'MEDIO' | 'ALTA' | 'CRITICA';
export type IncidentType = 'MECANICO' | 'ACCIDENTE' | 'RETRASO' | 'OTRO';

export interface Incident {
  id?: number;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  date: string;
  state: string;
}

export interface BusesIncident {
  id?: number;
  latitude: number;
  longitude: number;
  reportDate: string;
  bus?: Bus;
  incident?: Incident;
}

export interface Photo {
  id?: number;
  url: string;
  uploadedAt: string;
}
