import { useEffect, useState, useMemo } from 'react'
import * as userService from '../../services/userService'
import * as userRoleService from '../../services/userRoleService'
import type { User } from '../../types/user.types'
import type { UserRole } from '../../types/userRole.types'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'

interface UserListProps {
  onAssignRoles: (user: User) => void
  onEdit: (user: User) => void
  refreshTrigger: number
}

/**
 * UserList muestra la tabla de usuarios con sus roles
 * Hace dos llamadas en paralelo:
 * 1. GET /users → lista de usuarios
 * 2. GET /user-role → todos los registros de la tabla intermedia
 * Construye un mapa userId → UserRole[] para mostrar
 * los roles de cada usuario sin peticiones adicionales
 * HU-ENTR-1-002
 */
const UserList = ({ onAssignRoles, onEdit, refreshTrigger }: UserListProps) => {
  const [users, setUsers] = useState<User[]>([])
  const [userRolesMap, setUserRolesMap] = useState<Record<string, UserRole[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        // Ambas peticiones en paralelo — más eficiente que secuencial
        const [usersData, allUserRoles] = await Promise.all([
          userService.getUsers(),
          userRoleService.getAllUserRoles(),
        ])

        setUsers(usersData)

        // Construye el mapa userId → UserRole[]
        // Clave: userId, Valor: array de registros UserRole de ese usuario
        const map: Record<string, UserRole[]> = {}
        allUserRoles.forEach((ur: UserRole) => {
          const userId = ur.user?.id
          if (!userId) return
          if (!map[userId]) map[userId] = []
          map[userId].push(ur)
        })

        setUserRolesMap(map)
      } catch {
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [refreshTrigger])

  const handleDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      await userService.deleteUser(userToDelete.id)
      // Recargar datos y roles sin tocar props
      const [usersData, allUserRoles] = await Promise.all([
        userService.getUsers(),
        userRoleService.getAllUserRoles(),
      ])

      setUsers(usersData)
      const map: Record<string, UserRole[]> = {}
      allUserRoles.forEach((ur: UserRole) => {
        const userId = ur.user?.id
        if (!userId) return
        if (!map[userId]) map[userId] = []
        map[userId].push(ur)
      })
      setUserRolesMap(map)
    } catch {
      setError('Error al eliminar el usuario')
    } finally {
      setIsDeleting(false)
      setUserToDelete(null)
    }
  }

  // Filtra usuarios en memoria — sin peticiones adicionales al backend
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const q = searchQuery.toLowerCase()
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    )
  }, [users, searchQuery])

  if (loading) return <LoadingSpinner text="Cargando usuarios..." />

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Buscador y contador */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar por nombre o email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
          {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tabla */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'No se encontraron usuarios con ese filtro'
              : 'No hay usuarios registrados'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  Usuario
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  Roles
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => {
                // Obtiene los roles del usuario desde el mapa
                // Si no tiene roles asignados devuelve array vacío
                const userRoles = userRolesMap[user.id] ?? []

                return (
                  <tr
                    key={user.id}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {/* Avatar y nombre */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {user.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {user.email}
                    </td>

                    {/* Roles desde el mapa — sin peticiones adicionales */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {userRoles.length > 0 ? (
                          userRoles.map((ur) => (
                            <span
                              key={ur.id}
                              className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                            >
                              {ur.role?.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            Sin roles
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(user)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAssignRoles(user)}
                        >
                          Roles
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setUserToDelete(user)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Eliminar usuario"
        confirmLabel="Eliminar"
        confirmVariant="danger"
        onConfirm={handleDelete}
        isConfirmLoading={isDeleting}
      >
        <p className="text-gray-600 dark:text-gray-400">
          ¿Estás seguro de que deseas eliminar permanentemente al usuario{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {userToDelete?.name}
          </span>
          ? 
          <span className="block mt-2">Esta acción no se puede deshacer y borrará permanentemente sus accesos al sistema.</span>
        </p>
      </Modal>
    </div>
  )
}

export default UserList