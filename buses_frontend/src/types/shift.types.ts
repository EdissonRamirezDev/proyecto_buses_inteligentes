import type { Bus } from './bus.types';
import type { Driver } from './driver.types';

export interface Shift {
  id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: string;
  bus?: Bus;
  driver?: Driver;
}
