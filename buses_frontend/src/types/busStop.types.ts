export interface BusStop {
  id: string;
  codigo: string;
  nombre: string;
  latitud: number;
  longitud: number;
  sentido?: string;
}
