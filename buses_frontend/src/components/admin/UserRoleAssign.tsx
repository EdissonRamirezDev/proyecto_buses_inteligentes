import { useEffect, useState } from 'react'
import * as roleService from '../../services/roleService'
import * as userRoleService from '../../services/userRoleService'
import type { User } from '../../types/user.types'
import type { Role } from '../../types/role.types'
import type { UserRole } from '../../types/userRole.types'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'

interface UserRoleAssignProps {
  user: User
  onSuccess: () => void
  onCancel: () => void
}

/**
 * UserRoleAssign maneja la asignación de roles a un usuario
 * Usa userRoleService para manejar la tabla intermedia
 * Asigna o quita un rol a la vez
 * HU-ENTR-1-002
 */
const UserRoleAssign = ({ user, onSuccess }: UserRoleAssignProps) => {
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])

  // Mapa de roleId → userRoleId para poder hacer DELETE
  const [userRoleMap, setUserRoleMap] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(true)
  const [loadingRoleId, setLoadingRoleId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Recarga los user-roles del usuario y reconstruye el mapa
  const reloadUserRoleMap = async () => {
    const userRoles = await userRoleService.getUserRolesByUserId(user.id)
    const map: Record<string, string> = {}
    userRoles.forEach((ur: UserRole) => {
      if (ur.role?.id && ur.id) {
        map[ur.role.id] = ur.id
      }
    })
    setUserRoleMap(map)
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [roles] = await Promise.all([
          roleService.getRoles(),
          reloadUserRoleMap(),
        ])
        setAvailableRoles(roles)
      } catch {
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user.id])

  const handleAssign = async (role: Role) => {
    setLoadingRoleId(role.id)
    setError('')
    try {
      await userRoleService.addRoleToUser(user.id, role.id)
      // Recarga el mapa para obtener el ID del nuevo registro
      await reloadUserRoleMap()
    } catch {
      setError(`Error al asignar el rol ${role.name}`)
    } finally {
      setLoadingRoleId(null)
    }
  }

  const handleRemove = async (role: Role) => {
    const userRoleId = userRoleMap[role.id]
    if (!userRoleId) return

    setLoadingRoleId(role.id)
    setError('')
    try {
      await userRoleService.removeRoleFromUser(userRoleId)
      // Actualiza el mapa local sin necesidad de recargar
      setUserRoleMap((prev) => {
        const updated = { ...prev }
        delete updated[role.id]
        return updated
      })
    } catch {
      setError(`Error al quitar el rol ${role.name}`)
    } finally {
      setLoadingRoleId(null)
    }
  }

  if (loading) return <LoadingSpinner text="Cargando roles..." />

  return (
    <div className="flex flex-col gap-4">

      {/* Info del usuario */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold shrink-0">
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.email}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Lista de roles */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Roles disponibles
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Asigna o quita un rol a la vez
        </p>

        <div className="flex flex-col gap-2 mt-1">
          {availableRoles.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No hay roles disponibles
            </p>
          )}

          {availableRoles.map((role) => {
            const isAssigned = role.id in userRoleMap
            const isThisLoading = loadingRoleId === role.id

            return (
              <div
                key={role.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-colors
                  ${isAssigned
                    ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {role.name}
                    </p>
                    {isAssigned && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        Asignado
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {role.description}
                    </p>
                  )}
                </div>

                <Button
                  size="sm"
                  variant={isAssigned ? 'danger' : 'primary'}
                  isLoading={isThisLoading}
                  disabled={loadingRoleId !== null && !isThisLoading}
                  onClick={() => isAssigned ? handleRemove(role) : handleAssign(role)}
                >
                  {isAssigned ? 'Quitar' : 'Asignar'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-end pt-2">
        <Button variant="secondary" onClick={onSuccess}>
          Cerrar
        </Button>
      </div>
    </div>
  )
}

export default UserRoleAssign