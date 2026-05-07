import { httpBusiness } from './http';
import type { Node } from '../types/node.types';

export const getNodes = async (): Promise<Node[]> => {
  const response = await httpBusiness.get<Node[]>('/nodes');
  return response.data;
};

export const createNode = async (data: Partial<Node> & { routeId: string; busStopId: string }): Promise<Node> => {
  const response = await httpBusiness.post<Node>('/nodes', data);
  return response.data;
};

export const deleteNode = async (id: string): Promise<void> => {
  await httpBusiness.delete(`/nodes/${id}`);
};

export const updateNode = async (id: string, data: Partial<Node>): Promise<Node> => {
  const response = await httpBusiness.patch<Node>(`/nodes/${id}`, data);
  return response.data;
};
