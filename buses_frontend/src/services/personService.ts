import { httpBusiness } from './http';

export interface Person {
  id: string;
  userId: string;
  name: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export const syncPerson = async (data: {
  userId: string;
  name: string;
  lastName: string;
  email?: string;
  phone?: string;
}): Promise<Person> => {
  const response = await httpBusiness.post<Person>('/persons/sync', data);
  return response.data;
};
