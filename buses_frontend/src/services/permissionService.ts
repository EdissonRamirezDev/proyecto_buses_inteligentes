import { httpSecurity } from './http'
import type { Permission } from '../types/role.types'

// HU-ENTR-1-001, HU-ENTR-1-003
export const getPermissions = async (): Promise<Permission[]> => {
  const response = await httpSecurity.get<Permission[]>('/api/permissions')
  return response.data
}

export const getPermissionById = async (id: string): Promise<Permission> => {
  const response = await httpSecurity.get<Permission>(`/api/permissions/${id}`)
  return response.data
}

export const createPermission = async (data: Partial<Permission>): Promise<Permission> => {
  const response = await httpSecurity.post<Permission>('/api/permissions', data)
  return response.data
}

export const updatePermission = async (id: string, data: Partial<Permission>): Promise<Permission> => {
  const response = await httpSecurity.put<Permission>(`/api/permissions/${id}`, data)
  return response.data
}

export const deletePermission = async (id: string): Promise<void> => {
  await httpSecurity.delete(`/api/permissions/${id}`)
}

// Asigna un permiso a un rol — HU-ENTR-1-003
export const addPermissionToRole = async (
  roleId: string,
  permissionId: string
): Promise<void> => {
  await httpSecurity.post(`/api/role-permissions/role/${roleId}/permission/${permissionId}`)
}

// Elimina un permiso de un rol
export const removePermissionFromRole = async (
  rolePermissionId: string
): Promise<void> => {
  await httpSecurity.delete(`/api/role-permissions/${rolePermissionId}`)
}

// Obtiene todos los permisos de un rol — HU-ENTR-1-003
export const getPermissionsByRole = async (roleId: string): Promise<Permission[]> => {
  const response = await httpSecurity.get<any[]>(`/api/role-permissions/role/${roleId}`)
  // Mapeamos para devolver solo el objeto Permission contenido en RolePermission
  return response.data.map(rp => rp.permission)
}

// Sincroniza los permisos de un rol (Sobrescribe)
export const syncRolePermissions = async (roleId: string, permissionIds: string[]): Promise<void> => {
  await httpSecurity.post(`/api/role-permissions/role/${roleId}/sync`, permissionIds)
}