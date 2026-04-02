import { httpSecurity } from './http'
import type { UserRole } from '../types/userRole.types'

/**
 * Servicio para manejar la tabla intermedia user_role
 * Endpoints:
 * GET    /user-role                              → todos los registros
 * GET    /user-role/{id}                         → uno por ID
 * POST   /user-role/user/{userId}/role/{roleId}  → asignar rol a usuario
 * DELETE /user-role/{id}                         → quitar rol de usuario
 */

export const getAllUserRoles = async (): Promise<UserRole[]> => {
  const response = await httpSecurity.get<UserRole[]>('/api/user-role')
  return response.data
}

export const getUserRoleById = async (id: string): Promise<UserRole> => {
  const response = await httpSecurity.get<UserRole>(`/api/user-role/${id}`)
  return response.data
}

export const getUserRolesByUserId = async (userId: string): Promise<UserRole[]> => {
  const allUserRoles = await getAllUserRoles()
  return allUserRoles.filter((ur) => ur.user?.id === userId)
}

export const addRoleToUser = async (
  userId: string,
  roleId: string
): Promise<{ message: string }> => {
  const response = await httpSecurity.post<{ message: string }>(
    `/api/user-role/user/${userId}/role/${roleId}`
  )
  return response.data
}

export const removeRoleFromUser = async (userRoleId: string): Promise<void> => {
  await httpSecurity.delete(`/api/user-role/${userRoleId}`)
}