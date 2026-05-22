import { httpBusiness } from './http';

export interface BusinessAdministrator {
  id?: string;
  personId: string;
  companyId: number;
  person?: {
    id: string;
    userId: string;
    name: string;
    email: string;
  };
  company?: {
    id: number;
    name: string;
  };
}

export const createBusinessAdmin = async (data: { personId: string; companyId: number }): Promise<BusinessAdministrator> => {
  const response = await httpBusiness.post<BusinessAdministrator>('/business-administrator', data);
  return response.data;
};

export const getBusinessAdminByPersonId = async (personId: string): Promise<BusinessAdministrator | null> => {
  try {
    const response = await httpBusiness.get<BusinessAdministrator>(`/business-administrator/person/${personId}`);
    return response.data;
  } catch {
    return null;
  }
};

export const getBusinessAdminByUserId = async (userId: string): Promise<BusinessAdministrator | null> => {
  try {
    const response = await httpBusiness.get<BusinessAdministrator>(`/business-administrator/user/${userId}`);
    return response.data;
  } catch {
    return null;
  }
};

export const deleteBusinessAdminByPersonId = async (personId: string): Promise<void> => {
  await httpBusiness.delete(`/business-administrator/person/${personId}`);
};
