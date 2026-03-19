import { httpSecurity } from './http'
import type { User } from '../types/user.types'

// HU-ENTR-1-002
export const getUsers = async (): Promise<User[]> => {
  const response = await httpSecurity.get<User[]>('/users')
  return response.data
}

export const getUserById = async (id: string): Promise<User> => {
  const response = await httpSecurity.get<User>(`/users/${id}`)
  return response.data
}

export const createUser = async (data: Partial<User>): Promise<User> => {
  const response = await httpSecurity.post<User>('/users', data)
  return response.data
}

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  const response = await httpSecurity.put<User>(`/users/${id}`, data)
  return response.data
}

export const deleteUser = async (id: string): Promise<void> => {
  await httpSecurity.delete(`/users/${id}`)
}

// Asigna un rol a un usuario — HU-ENTR-1-002
export const addRoleToUser = async (
  userId: string,
  roleId: string
): Promise<void> => {
  await httpSecurity.post(`/user-role/user/${userId}/role/${roleId}`)
}

// Elimina un rol de un usuario
export const removeRoleFromUser = async (
  userRoleId: string
): Promise<void> => {
  await httpSecurity.delete(`/user-role/${userRoleId}`)
}

// Búsqueda local — el backend no tiene endpoint de búsqueda
// filtramos en el frontend después de traer todos los usuarios
export const searchUsers = async (query: string): Promise<User[]> => {
  const response = await httpSecurity.get<User[]>('/users')
  const users = response.data
  const q = query.toLowerCase()
  return users.filter(
    (u) =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
  )
}