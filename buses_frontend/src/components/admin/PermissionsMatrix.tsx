import { useEffect, useState } from 'react'
import * as permissionService from '../../services/permissionService'
import { MODULES } from '../../utils/constants'
import type { Permission } from '../../types/role.types'

interface PermissionsMatrixProps {
  // IDs de los permisos actualmente seleccionados
  selectedPermissions: string[]
  // Se llama con el nuevo array de IDs cuando cambia la selección
  onChange: (permissionIds: string[]) => void
}

type Action = 'GET' | 'POST' | 'PUT' | 'DELETE'

const ACTIONS: { key: Action; label: string }[] = [
  { key: 'GET',    label: 'Leer' },
  { key: 'POST',   label: 'Crear' },
  { key: 'PUT',    label: 'Editar' },
  { key: 'DELETE', label: 'Eliminar' },
]

/**
 * PermissionsMatrix muestra una tabla de módulos x acciones HTTP
 * con checkboxes para asignar permisos granulares a un rol
 * Agrupa permisos por su campo 'model' y filtra por método HTTP
 * HU-ENTR-1-001, HU-ENTR-1-003
 */
const PermissionsMatrix = ({
  selectedPermissions,
  onChange,
}: PermissionsMatrixProps) => {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
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
    loadPermissions()
  }, [])

  // Obtiene los modelos únicos presentes en los permisos reales
  const models = [...new Set(permissions.map((p) => p.model))].sort()

  // Busca el permiso correspondiente a un modelo y método HTTP
  const findPermission = (model: string, method: Action): Permission | undefined =>
    permissions.find((p) => p.model === model && p.method === method)

  const isSelected = (permissionId: string): boolean =>
    selectedPermissions.includes(permissionId)

  const handleToggle = (permissionId: string) => {
    if (isSelected(permissionId)) {
      onChange(selectedPermissions.filter((id) => id !== permissionId))
    } else {
      onChange([...selectedPermissions, permissionId])
    }
  }

  const handleToggleModule = (model: string) => {
    const modulePermissions = ACTIONS.map((a) =>
      findPermission(model, a.key)
    ).filter(Boolean) as Permission[]

    const allSelected = modulePermissions.every((p) => isSelected(p.id))

    if (allSelected) {
      const moduleIds = modulePermissions.map((p) => p.id)
      onChange(selectedPermissions.filter((id) => !moduleIds.includes(id)))
    } else {
      const toAdd = modulePermissions
        .filter((p) => !isSelected(p.id))
        .map((p) => p.id)
      onChange([...selectedPermissions, ...toAdd])
    }
  }

  if (loading) {
    return (
      <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando permisos...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-48">
              Módulo
            </th>
            {ACTIONS.map((action) => (
              <th
                key={action.key}
                className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
              >
                {action.label}
              </th>
            ))}
            <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
              Todos
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {/* Fallback: si no hay permisos del backend, usa MODULES como placeholders */}
          {(models.length > 0 ? models : Object.values(MODULES)).map((model) => {
            const modulePermissions = ACTIONS.map((a) =>
              findPermission(model, a.key)
            ).filter(Boolean) as Permission[]

            const allSelected =
              modulePermissions.length > 0 &&
              modulePermissions.every((p) => isSelected(p.id))

            const someSelected = modulePermissions.some((p) =>
              isSelected(p.id)
            )

            return (
              <tr
                key={model}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {/* Nombre del módulo */}
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {model}
                  </span>
                </td>

                {/* Checkbox por método HTTP */}
                {ACTIONS.map((action) => {
                  const permission = findPermission(model, action.key)
                  return (
                    <td key={action.key} className="px-4 py-3 text-center">
                      {permission ? (
                        <input
                          type="checkbox"
                          checked={isSelected(permission.id)}
                          onChange={() => handleToggle(permission.id)}
                          className="
                            w-4 h-4 rounded border-gray-300
                            text-blue-600 cursor-pointer
                            focus:ring-blue-500 focus:ring-2
                            dark:border-gray-600 dark:bg-gray-700
                          "
                        />
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                  )
                })}

                {/* Checkbox para seleccionar todos en el módulo */}
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected
                    }}
                    onChange={() => handleToggleModule(model)}
                    className="
                      w-4 h-4 rounded border-gray-300
                      text-blue-600 cursor-pointer
                      focus:ring-blue-500 focus:ring-2
                      dark:border-gray-600 dark:bg-gray-700
                    "
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default PermissionsMatrix