import { httpSecurity } from './http'
import type { Role } from '../types/role.types'

// HU-ENTR-1-001
export const getRoles = async (): Promise<Role[]> => {
  const response = await httpSecurity.get<Role[]>('/roles')
  return response.data
}

export const getRoleById = async (id: string): Promise<Role> => {
  const response = await httpSecurity.get<Role>(`/roles/${id}`)
  return response.data
}

export const createRole = async (data: Partial<Role>): Promise<Role> => {
  const response = await httpSecurity.post<Role>('/roles', data)
  return response.data
}

export const updateRole = async (id: string, data: Partial<Role>): Promise<Role> => {
  const response = await httpSecurity.put<Role>(`/roles/${id}`, data)
  return response.data
}

export const deleteRole = async (id: string): Promise<void> => {
  await httpSecurity.delete(`/roles/${id}`)
}