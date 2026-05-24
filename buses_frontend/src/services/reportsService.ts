import { httpBusiness } from './http';

export const getAgeDistribution = async (rutaId?: string, fechaInicio?: string, fechaFin?: string) => {
  const params: any = {};
  if (rutaId) params.rutaId = rutaId;
  if (fechaInicio) params.fechaInicio = fechaInicio;
  if (fechaFin) params.fechaFin = fechaFin;
  const response = await httpBusiness.get('/reports/ages', { params });
  return response.data;
};

export const getRevenueByMethod = async (meses: number = 6) => {
  const response = await httpBusiness.get('/reports/revenue', { params: { meses } });
  return response.data;
};

export const getIncidentTrends = async (empresaId?: string, meses: number = 3) => {
  const params: any = { meses };
  if (empresaId) params.empresaId = empresaId;
  const response = await httpBusiness.get('/reports/incidents-trend', { params });
  return response.data;
};
