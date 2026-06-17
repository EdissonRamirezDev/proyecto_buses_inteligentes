import { httpBusiness } from './http';

export interface CreatePqrsData {
  tipo: string;
  categoria: string;
  descripcion: string;
  email: string;
  fotos?: string[];
}

export interface PqrsData extends CreatePqrsData {
  id: string;
  radicado: string;
  estado: string;
  respuesta?: string;
  createdAt: string;
  updatedAt: string;
}

export const createPqrs = async (data: CreatePqrsData): Promise<PqrsData> => {
  const response = await httpBusiness.post('/pqrs', data);
  return response.data;
};

export const getPqrsByRadicado = async (radicado: string): Promise<PqrsData> => {
  const response = await httpBusiness.get(`/pqrs/consulta/${radicado}`);
  return response.data;
};

export const getAllPqrs = async (): Promise<PqrsData[]> => {
  const response = await httpBusiness.get('/pqrs');
  return response.data;
};

export const updatePqrsStatus = async (id: string, data: { estado: string, respuesta?: string }): Promise<PqrsData> => {
  const response = await httpBusiness.put(`/pqrs/${id}/estado`, data);
  return response.data;
};
