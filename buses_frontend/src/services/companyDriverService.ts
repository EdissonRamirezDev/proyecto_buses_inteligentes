import { httpBusiness } from './http';

export interface CompanyDriver {
  id?: number;
  assignedAt?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  company?: {
    id: number;
    name: string;
    nit: string;
  };
  driver?: {
    id: number;
    name: string;
    last_name: string;
    licencia: string;
    email: string;
  };
}

export const getCompanyDrivers = async (): Promise<CompanyDriver[]> => {
  const response = await httpBusiness.get<CompanyDriver[]>('/company-drivers');
  return response.data;
};

export const createCompanyDriver = async (data: { companyId: number; driverId: number; status?: 'ACTIVE' | 'INACTIVE' }): Promise<CompanyDriver> => {
  const response = await httpBusiness.post<CompanyDriver>('/company-drivers', data);
  return response.data;
};

export const updateCompanyDriver = async (id: number, data: { status: 'ACTIVE' | 'INACTIVE' }): Promise<CompanyDriver> => {
  const response = await httpBusiness.patch<CompanyDriver>(`/company-drivers/${id}`, data);
  return response.data;
};

export const deleteCompanyDriver = async (id: number): Promise<void> => {
  await httpBusiness.delete(`/company-drivers/${id}`);
};
