import * as roleService from '../services/roleService'
import * as permissionService from '../services/permissionService'
import type { Role, Permission } from '../types/role.types'

// HU-ENTR-1-001
export const fetchRoles = async (
  setRoles: (roles: Role[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string) => void
): Promise<void> => {
  try {
    setLoading(true)
    const roles = await roleService.getRoles()
    setRoles(roles)
  } catch {
    setError('Error al cargar los roles.')
  } finally {
    setLoading(false)
  }
}

export const fetchPermissions = async (
  setPermissions: (permissions: Permission[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string) => void
): Promise<void> => {
  try {
    setLoading(true)
    const permissions = await permissionService.getPermissions()
    setPermissions(permissions)
  } catch {
    setError('Error al cargar los permisos.')
  } finally {
    setLoading(false)
  }
}

// HU-ENTR-1-001
// Crea el rol y luego asigna los permisos seleccionados uno por uno
export const createRole = async (
  name: string,
  description: string,
  permissionIds: string[],
  setRoles: (roles: Role[]) => void,
  setError: (error: string) => void,
  onSuccess: () => void
): Promise<void> => {
  try {
    // Paso 1 — crear el rol
    const newRole = await roleService.createRole({ name, description })

    // Paso 2 — asignar cada permiso seleccionado al rol recién creado
    await Promise.all(
      permissionIds.map((permissionId) =>
        permissionService.addPermissionToRole(newRole.id, permissionId)
      )
    )

    // Paso 3 — refrescar la lista
    const roles = await roleService.getRoles()
    setRoles(roles)
    onSuccess()
  } catch (error: any) {
    const message = error.response?.data?.message
    setError(message ?? 'Error al crear el rol.')
  }
}

// HU-ENTR-1-001
export const updateRole = async (
  id: string,
  name: string,
  description: string,
  setRoles: (roles: Role[]) => void,
  setError: (error: string) => void,
  onSuccess: () => void
): Promise<void> => {
  try {
    await roleService.updateRole(id, { name, description })
    const roles = await roleService.getRoles()
    setRoles(roles)
    onSuccess()
  } catch (error: any) {
    const message = error.response?.data?.message
    setError(message ?? 'Error al actualizar el rol.')
  }
}

// HU-ENTR-1-001
export const deleteRole = async (
  id: string,
  setRoles: (roles: Role[]) => void,
  setError: (error: string) => void
): Promise<void> => {
  try {
    await roleService.deleteRole(id)
    const roles = await roleService.getRoles()
    setRoles(roles)
  } catch (error: any) {
    const message = error.response?.data?.message
    setError(message ?? 'No se puede eliminar el rol porque tiene usuarios asignados.')
  }
}

// HU-ENTR-1-003
export const syncRolePermissions = async (
  roleId: string,
  currentPermissionIds: string[],
  newPermissionIds: string[],
  setError: (error: string) => void,
  onSuccess: () => void
): Promise<void> => {
  try {
    const toAdd = newPermissionIds.filter(
      (id) => !currentPermissionIds.includes(id)
    )

    const toRemove = currentPermissionIds.filter(
      (id) => !newPermissionIds.includes(id)
    )

    await Promise.all([
      ...toAdd.map((permissionId) =>
        permissionService.addPermissionToRole(roleId, permissionId)
      ),
      ...toRemove.map((rolePermissionId) =>
        permissionService.removePermissionFromRole(rolePermissionId)
      ),
    ])

    onSuccess()
  } catch {
    setError('Error al actualizar los permisos del rol.')
  }
}