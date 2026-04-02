import { httpSecurity } from './http'
import type { User } from '../types/user.types'

// HU-ENTR-1-002
export const getUsers = async (): Promise<User[]> => {
  const response = await httpSecurity.get<User[]>('/api/users')
  return response.data
}

export const getUserById = async (id: string): Promise<User> => {
  const response = await httpSecurity.get<User>(`/api/users/${id}`)
  return response.data
}

export const createUser = async (data: Partial<User>): Promise<User> => {
  const response = await httpSecurity.post<User>('/api/users', data)
  return response.data
}

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  const response = await httpSecurity.put<User>(`/api/users/${id}`, data)
  return response.data
}

export const deleteUser = async (id: string): Promise<void> => {
  await httpSecurity.delete(`/api/users/${id}`)
}

// Búsqueda local — el backend no tiene endpoint de búsqueda
// filtramos en el frontend después de traer todos los usuarios
export const searchUsers = async (query: string): Promise<User[]> => {
  const response = await httpSecurity.get<User[]>('/api/users')
  const users = response.data
  const q = query.toLowerCase()
  return users.filter(
    (u) =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
  )
}