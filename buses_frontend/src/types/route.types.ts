export interface Route {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  tarifa: number;
  color_hex?: string;
  is_active?: boolean;
  nodes?: any[];

  inicio_lat?: number;
  inicio_lng?: number;
  inicio_nombre?: string;
  inicio_via_points?: [number, number][];
  fin_lat?: number;
  fin_lng?: number;
  fin_nombre?: string;
}
