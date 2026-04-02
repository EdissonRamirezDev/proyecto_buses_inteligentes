import { useEffect, useState } from 'react'
import * as permissionService from '../../services/permissionService'
import type { Permission } from '../../types/role.types'
import Button from '../common/Button'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'

interface PermissionListProps {
  onEdit: (permission: Permission) => void
  refreshTrigger: number
}

/**
 * PermissionList muestra la tabla de permisos del sistema
 */
const PermissionList = ({ onEdit, refreshTrigger }: PermissionListProps) => {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadPermissions = async () => {
    try {
      setLoading(true)
      const data = await permissionService.getPermissions()
      setPermissions(data)
    } catch {
      setError('Error al cargar los permisos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions()
  }, [refreshTrigger])

  const handleDelete = async () => {
    if (!permissionToDelete) return
    setIsDeleting(true)
    try {
      await permissionService.deletePermission(permissionToDelete.id)
      await loadPermissions()
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(message ?? 'No se puede eliminar el permiso porque está asignado a un rol.')
    } finally {
      setIsDeleting(false)
      setPermissionToDelete(null)
    }
  }

  if (loading) return <LoadingSpinner text="Cargando permisos..." />

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (permissions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No hay permisos creados aún</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                URL
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                Method
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                Modelo
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {permissions.map((permission) => (
              <tr
                key={permission.id}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {permission.url}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {permission.method}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {permission.model}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(permission)}>
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPermissionToDelete(permission)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!permissionToDelete}
        onClose={() => setPermissionToDelete(null)}
        title="Eliminar permiso"
        confirmLabel="Eliminar"
        confirmVariant="danger"
        onConfirm={handleDelete}
        isConfirmLoading={isDeleting}
      >
        <p className="text-gray-600 dark:text-gray-400">
          ¿Estás seguro de eliminar el permiso para{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {permissionToDelete?.method} {permissionToDelete?.url}
          </span>
          ? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  )
}

export default PermissionList
