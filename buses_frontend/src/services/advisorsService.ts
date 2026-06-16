import { httpBusiness } from './http';

export interface AdvisorData {
  id?: string;
  nombre: string;
  email: string;
  isActive?: boolean;
}

export const getAdvisors = async (activeOnly?: boolean) => {
  const params = activeOnly ? { activeOnly: 'true' } : {};
  const response = await httpBusiness.get('/advisors', { params });
  return response.data;
};

export const createAdvisor = async (data: AdvisorData) => {
  const response = await httpBusiness.post('/advisors', data);
  return response.data;
};

export const updateAdvisor = async (id: string, data: AdvisorData) => {
  const response = await httpBusiness.put(`/advisors/${id}`, data);
  return response.data;
};

export const deleteAdvisor = async (id: string) => {
  const response = await httpBusiness.delete(`/advisors/${id}`);
  return response.data;
};
