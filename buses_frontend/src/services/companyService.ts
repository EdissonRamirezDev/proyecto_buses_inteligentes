import { httpBusiness } from './http';

export interface Company {
  id?: number;
  name: string;
  nit: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string;
}

export const getCompanies = async (): Promise<Company[]> => {
  const response = await httpBusiness.get<Company[]>('/companies');
  return response.data;
};

export const getCompanyById = async (id: number): Promise<Company> => {
  const response = await httpBusiness.get<Company>(`/companies/${id}`);
  return response.data;
};

export const createCompany = async (data: Partial<Company>): Promise<Company> => {
  const response = await httpBusiness.post<Company>('/companies', data);
  return response.data;
};

export const updateCompany = async (id: number, data: Partial<Company>): Promise<Company> => {
  const response = await httpBusiness.patch<Company>(`/companies/${id}`, data);
  return response.data;
};

export const deleteCompany = async (id: number): Promise<void> => {
  await httpBusiness.delete(`/companies/${id}`);
};
