import { useEffect, useState } from 'react'
import { fetchRoles } from '../../controllers/roleController'
import { assignRolesToUser } from '../../controllers/userController'
import type { User } from '../../types/user.types'
import type { Role } from '../../types/role.types'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'

interface UserRoleAssignProps {
  user: User
  onSuccess: () => void
  onCancel: () => void
}

/**
 * UserRoleAssign permite asignar roles a un usuario
 * Usa name — coincide con Role.java del backend
 * HU-ENTR-1-002
 */
const UserRoleAssign = ({ user, onSuccess, onCancel }: UserRoleAssignProps) => {
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [currentRoleIds] = useState<string[]>(
    user.roles?.map((r) => r.id) ?? []
  )
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    user.roles?.map((r) => r.id) ?? []
  )
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRoles(setAvailableRoles, setLoading, setError)
  }, [])

  const handleToggleRole = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter((id) => id !== roleId))
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId])
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    await assignRolesToUser(
      user.id,
      currentRoleIds,
      selectedRoleIds,
      setError,
      onSuccess
    )
    setIsSaving(false)
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

      {/* Roles disponibles */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Selecciona los roles para este usuario
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Los permisos se acumulan si se asignan múltiples roles
        </p>

        <div className="flex flex-col gap-2 mt-1">
          {availableRoles.length === 0 && !loading && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No hay roles disponibles
            </p>
          )}
          {availableRoles.map((role) => (
            <label
              key={role.id}
              className="
                flex items-start gap-3 p-3 rounded-lg cursor-pointer
                border border-gray-200 dark:border-gray-700
                hover:bg-gray-50 dark:hover:bg-gray-800
                transition-colors
              "
            >
              <input
                type="checkbox"
                checked={selectedRoleIds.includes(role.id)}
                onChange={() => handleToggleRole(role.id)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {role.name}
                </p>
                {role.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {role.description}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} isLoading={isSaving}>
          Guardar roles
        </Button>
      </div>
    </div>
  )
}

export default UserRoleAssign