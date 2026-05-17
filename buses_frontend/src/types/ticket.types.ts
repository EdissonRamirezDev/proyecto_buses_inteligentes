import type { Citizen } from './citizen.types';
import type { Schedule } from './schedule.types';

export interface Ticket {
  id: string;
  codigo_qr: string;
  estado: string; // 'activo' | 'usado' | 'cancelado'
  precio_pagado: number;
  fecha_compra?: string;
  citizen?: Citizen;
  schedule?: Schedule;
}
