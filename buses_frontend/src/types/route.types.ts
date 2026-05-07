export interface Route {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  tarifa: number;
  color_hex?: string;
  is_active?: boolean;
  nodes?: any[];
}
