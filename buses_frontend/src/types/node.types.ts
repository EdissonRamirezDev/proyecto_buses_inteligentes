import type { Route } from './route.types';
import type { BusStop } from './busStop.types';

export interface Node {
  id: string;
  orden: number;
  distancia_anterior: number;
  tiempo_estimado: number;
  route?: Route;
  busStop?: BusStop;
}
