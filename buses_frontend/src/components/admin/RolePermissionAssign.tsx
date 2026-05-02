import { useEffect, useState } from 'react'
import * as permissionService from '../../services/permissionService'
import type { Role } from '../../types/role.types'
import Button from '../common/Button'
import PermissionsMatrix from './PermissionsMatrix'

interface RolePermissionAssignProps {
  role: Role
  onSuccess: () => void
  onCancel: () => void
}

/**
 * RolePermissionAssign permite gestionar los permisos de un rol específico
 * Utiliza la matriz de permisos para una asignación granular
 * HU-ENTR-1-003
 */
const RolePermissionAssign = ({
  role,
  onSuccess,
  onCancel,
}: RolePermissionAssignProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCurrentPermissions = async () => {
      try {
        setLoading(true)
        const currentPermissions = await permissionService.getPermissionsByRole(role.id)
        setSelectedIds(currentPermissions.map((p) => p.id))
      } catch {
        setError('Error al cargar los permisos actuales del rol.')
      } finally {
        setLoading(false)
      }
    }
    loadCurrentPermissions()
  }, [role.id])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      await permissionService.syncRolePermissions(role.id, selectedIds)
      onSuccess()
    } catch {
      setError('Error al guardar los permisos.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Gestionar Permisos: {role.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecciona las acciones permitidas para cada módulo del sistema.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="mt-2 text-sm text-gray-500">Cargando permisos actuales...</p>
        </div>
      ) : (
        <PermissionsMatrix
          selectedPermissions={selectedIds}
          onChange={setSelectedIds}
        />
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          isLoading={saving}
          disabled={loading}
        >
          Guardar Permisos
        </Button>
      </div>
    </div>
  )
}

export default RolePermissionAssign
