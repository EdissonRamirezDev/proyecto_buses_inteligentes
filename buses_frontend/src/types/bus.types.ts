export interface Bus {
  id?: number;
  placa?: string;
  modelo?: string;
  capacidad?: number;
  estado?: string;
  companyId?: number;
  company?: {
    id: number;
    name: string;
    nit?: string;
  };
}

