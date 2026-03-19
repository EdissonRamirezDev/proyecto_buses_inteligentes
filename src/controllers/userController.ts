import * as userService from '../services/userService'
import type { User } from '../types/user.types'

// HU-ENTR-1-002
export const fetchUsers = async (
  setUsers: (users: User[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string) => void
): Promise<void> => {
  try {
    setLoading(true)
    const users = await userService.getUsers()
    setUsers(users)
  } catch {
    setError('Error al cargar los usuarios.')
  } finally {
    setLoading(false)
  }
}

export const searchUsers = async (
  query: string,
  setUsers: (users: User[]) => void,
  setError: (error: string) => void
): Promise<void> => {
  try {
    const users = await userService.searchUsers(query)
    setUsers(users)
  } catch {
    setError('Error al buscar usuarios.')
  }
}

export const updateUser = async (
  id: string,
  data: Partial<User>,
  setUsers: (users: User[]) => void,
  setError: (error: string) => void,
  onSuccess: () => void
): Promise<void> => {
  try {
    await userService.updateUser(id, data)
    const users = await userService.getUsers()
    setUsers(users)
    onSuccess()
  } catch (error: any) {
    const message = error.response?.data?.message
    setError(message ?? 'Error al actualizar el usuario.')
  }
}

// HU-ENTR-1-002
// Asigna múltiples roles a un usuario
// El backend solo permite asignar de a uno por vez via /user-role/user/{userId}/role/{roleId}
// así que hacemos múltiples llamadas en paralelo
export const assignRolesToUser = async (
  userId: string,
  currentRoleIds: string[],   // roles que tiene actualmente el usuario
  newRoleIds: string[],       // roles seleccionados en el formulario
  setError: (error: string) => void,
  onSuccess: () => void
): Promise<void> => {
  try {
    // Roles a agregar — están en los nuevos pero no en los actuales
    const toAdd = newRoleIds.filter(
      (id) => !currentRoleIds.includes(id)
    )

    // Roles a eliminar — están en los actuales pero no en los nuevos
    const toRemove = currentRoleIds.filter(
      (id) => !newRoleIds.includes(id)
    )

    // Ejecuta ambas operaciones en paralelo
    await Promise.all([
      ...toAdd.map((roleId) =>
        userService.addRoleToUser(userId, roleId)
      ),
      ...toRemove.map((userRoleId) =>
        userService.removeRoleFromUser(userRoleId)
      ),
    ])

    onSuccess()
  } catch (error: any) {
    const message = error.response?.data?.message
    setError(message ?? 'Error al asignar roles al usuario.')
  }
}

export const createUser = async (
  data: Partial<User>,
  setUsers: (users: User[]) => void,
  setError: (error: string) => void,
  onSuccess: () => void
): Promise<void> => {
  try {
    await userService.createUser(data)
    const users = await userService.getUsers()
    setUsers(users)
    onSuccess()
  } catch (error: any) {
    const message = error.response?.data?.message
    setError(message ?? 'Error al crear el usuario.')
  }
}

export const deleteUser = async (
  id: string,
  setUsers: (users: User[]) => void,
  setError: (error: string) => void
): Promise<void> => {
  try {
    await userService.deleteUser(id)
    const users = await userService.getUsers()
    setUsers(users)
  } catch (error: any) {
    const message = error.response?.data?.message
    setError(message ?? 'Error al eliminar el usuario.')
  }
}