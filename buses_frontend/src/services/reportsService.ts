import { httpBusiness } from './http';

export const getAgeDistribution = async () => {
  const response = await httpBusiness.get('/reports/ages');
  return response.data;
};

export const getRevenueByMethod = async () => {
  const response = await httpBusiness.get('/reports/revenue');
  return response.data;
};
