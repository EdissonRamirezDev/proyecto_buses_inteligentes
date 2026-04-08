import { useEffect, useState } from 'react'
import * as roleService from '../../services/roleService'
import type { Role } from '../../types/role.types'
import Button from '../common/Button'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'

interface RoleListProps {
  onEdit: (role: Role) => void
  refreshTrigger: number
}

/**
 * RoleList muestra la tabla de roles del sistema
 * HU-ENTR-1-001
 */
const RoleList = ({ onEdit, refreshTrigger }: RoleListProps) => {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [roleUsageCount, setRoleUsageCount] = useState<number>(0)
  const [loadingUsage, setLoadingUsage] = useState(false)

  const loadRoles = async () => {
    try {
      setLoading(true)
      const data = await roleService.getRoles()
      setRoles(data)
    } catch {
      setError('Error al cargar los roles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [refreshTrigger])

  const handleDelete = async () => {
    if (!roleToDelete) return
    setIsDeleting(true)
    try {
      await roleService.deleteRole(roleToDelete.id)
      await loadRoles()
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(message ?? 'No se puede eliminar el rol porque tiene dependencias.')
    } finally {
      setIsDeleting(false)
      setRoleToDelete(null)
    }
  }

  const confirmDelete = async (role: Role) => {
    setRoleToDelete(role)
    setLoadingUsage(true)
    try {
      const count = await roleService.getRoleUsageCount(role.id)
      setRoleUsageCount(count)
    } catch {
      setRoleUsageCount(0)
    } finally {
      setLoadingUsage(false)
    }
  }

  if (loading) return <LoadingSpinner text="Cargando roles..." />

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No hay roles creados aún</p>
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
                Nombre
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                Descripción
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {roles.map((role) => (
              <tr
                key={role.id}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {role.name}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {role.description}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(role)}>
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => confirmDelete(role)}
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
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        title="Eliminar rol"
        confirmLabel="Eliminar"
        confirmVariant="danger"
        onConfirm={handleDelete}
        isConfirmLoading={isDeleting}
      >
        {loadingUsage ? (
          <div className="flex justify-center my-4">
            <LoadingSpinner text="Verificando dependencias..." />
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            ¿Estás seguro que quieres eliminar el rol{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {roleToDelete?.name}
            </span>? 
            {roleUsageCount > 0 ? (
              <span className="block mt-2 font-medium text-red-600 dark:text-red-400">
                Este rol está asignado a {roleUsageCount} {roleUsageCount === 1 ? 'usuario' : 'usuarios'}.
              </span>
            ) : (
              <span className="block mt-2">
                Esta acción no se puede deshacer.
              </span>
            )}
          </p>
        )}
      </Modal>
    </>
  )
}

export default RoleList