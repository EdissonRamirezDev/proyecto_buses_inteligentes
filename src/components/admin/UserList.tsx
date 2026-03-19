import { useEffect, useState } from 'react'
import { fetchUsers, searchUsers } from '../../controllers/userController'
import type { User } from '../../types/user.types'
import Button from '../common/Button'
import Input from '../common/Input'
import LoadingSpinner from '../common/LoadingSpinner'

interface UserListProps {
  onAssignRoles: (user: User) => void
  onEdit: (user: User) => void  // ← agregar esta línea
  refreshTrigger: number
}

/**
 * UserList muestra la tabla de usuarios
 * Usa name y email — coincide con User.java del backend
 * HU-ENTR-1-002
 */
const UserList = ({ onAssignRoles, onEdit, refreshTrigger }: UserListProps) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUsers(setUsers, setLoading, setError)
  }, [refreshTrigger])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim() === '') {
      fetchUsers(setUsers, setLoading, setError)
      return
    }
    await searchUsers(query, setUsers, setError)
  }

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
      <Input
        placeholder="Buscar por nombre o email..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        leftIcon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />

      {users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
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
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
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
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span
                            key={role.id}
                            className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          >
                            {role.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Sin roles
                        </span>
                      )}
                    </div>
                  </td>
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
                        Asignar roles
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default UserList