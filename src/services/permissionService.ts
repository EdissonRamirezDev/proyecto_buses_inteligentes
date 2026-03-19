import { httpSecurity } from './http'
import type { Permission } from '../types/role.types'

// HU-ENTR-1-001, HU-ENTR-1-003
export const getPermissions = async (): Promise<Permission[]> => {
  const response = await httpSecurity.get<Permission[]>('/permissions')
  return response.data
}

export const getPermissionById = async (id: string): Promise<Permission> => {
  const response = await httpSecurity.get<Permission>(`/permissions/${id}`)
  return response.data
}

export const createPermission = async (data: Partial<Permission>): Promise<Permission> => {
  const response = await httpSecurity.post<Permission>('/permissions', data)
  return response.data
}

export const updatePermission = async (id: string, data: Partial<Permission>): Promise<Permission> => {
  const response = await httpSecurity.put<Permission>(`/permissions/${id}`, data)
  return response.data
}

export const deletePermission = async (id: string): Promise<void> => {
  await httpSecurity.delete(`/permissions/${id}`)
}

// Asigna un permiso a un rol — HU-ENTR-1-003
export const addPermissionToRole = async (
  roleId: string,
  permissionId: string
): Promise<void> => {
  await httpSecurity.post(`/role-permissions/role/${roleId}/permission/${permissionId}`)
}

// Elimina un permiso de un rol
export const removePermissionFromRole = async (
  rolePermissionId: string
): Promise<void> => {
  await httpSecurity.delete(`/role-permissions/${rolePermissionId}`)
}