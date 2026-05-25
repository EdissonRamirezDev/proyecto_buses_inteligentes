import type { Bus } from './bus.types';
import type { Driver } from './driver.types';

export interface Shift {
  id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: string;
  estado_base?: string;
  hora_inicio_real?: string | null;
  observaciones_inicio?: string | null;
  bus_status_inicio?: 'ok' | 'obs' | 'rev' | null;
  puede_iniciar?: boolean;
  gps_tracking_activo?: boolean;
  mensaje?: string;
  bus?: Bus;
  driver?: Driver;
}
