export interface Bus {
  id?: number;
  placa?: string;
  modelo?: string;
  capacidad?: number;
  capacidad_max?: number;
  capacidad_ocupados?: number;
  capacidad_disponible?: number;
  estado?: string;
  companyId?: number | null;
  company?: {
    id: number;
    name: string;
    nit?: string;
  };
}

