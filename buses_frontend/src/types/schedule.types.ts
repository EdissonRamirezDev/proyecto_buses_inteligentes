import type { Route } from './route.types';
import type { Bus } from './bus.types';

export interface Schedule {
  id: string;
  fecha: string;
  hora_salida: string;
  tolerancia_minutos: number;
  es_recurrente: boolean;
  tipo_recurrencia: string;
  estado: string;
  route?: Route;
  bus?: Bus;
}
