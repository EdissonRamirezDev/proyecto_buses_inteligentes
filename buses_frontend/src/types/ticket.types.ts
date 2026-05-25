import type { Citizen } from './citizen.types';
import type { Schedule } from './schedule.types';

export interface Ticket {
  id: string;
  codigo_qr: string;
  estado: string; // 'activo' | 'usado' | 'completado' | 'cancelado'
  precio_pagado: number;
  fecha_compra?: string;
  fecha_fin?: string;
  citizen?: Citizen;
  schedule?: Schedule;
}

export interface TripDetails {
  ticket: Ticket & {
    history?: any[];
  };
  driver: {
    id: number;
    name: string;
    last_name: string;
    license?: string;
  } | null;
  totalDurationMinutes: number | null;
}

