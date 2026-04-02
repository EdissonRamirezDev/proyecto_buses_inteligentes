import { useEffect, useState, useMemo } from 'react'
import * as userRoleService from '../../services/userRoleService'
import type { UserRole } from '../../types/userRole.types'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Input from '../../components/common/Input'

type SortField = 'user' | 'role'
type SortOrder = 'asc' | 'desc'

/**
 * UserRolesPage muestra todos los registros de la tabla intermedia user_role
 * Permite filtrar por nombre de usuario o rol
 * Permite ordenar por usuario o rol
 * HU-ENTR-1-002
 */
const UserRolesPage = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('user')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  useEffect(() => {
    const loadUserRoles = async () => {
      setLoading(true)
      try {
        const data = await userRoleService.getAllUserRoles()
        setUserRoles(data)
      } catch {
        setError('Error al cargar las asignaciones de roles.')
      } finally {
        setLoading(false)
      }
    }

    loadUserRoles()
  }, [])

  // Maneja el ordenamiento — si se hace clic en la misma columna invierte el orden
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Filtra y ordena los datos en memoria — sin peticiones adicionales al backend
  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.toLowerCase()

    const filtered = userRoles.filter((ur) => {
      const userName = ur.user?.name?.toLowerCase() ?? ''
      const roleName = ur.role?.name?.toLowerCase() ?? ''
      return userName.includes(q) || roleName.includes(q)
    })

    return filtered.sort((a, b) => {
      const aVal = sortField === 'user'
        ? (a.user?.name ?? '')
        : (a.role?.name ?? '')
      const bVal = sortField === 'user'
        ? (b.user?.name ?? '')
        : (b.role?.name ?? '')

      const comparison = aVal.localeCompare(bVal)
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [userRoles, searchQuery, sortField, sortOrder])

  // Ícono de ordenamiento para los headers de la tabla
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Asignaciones de roles
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Todos los registros de usuario-rol del sistema
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">

          {loading ? (
            <LoadingSpinner text="Cargando asignaciones..." />
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">

              {/* Buscador */}
              <div className="flex items-center justify-between gap-4">
                <Input
                  placeholder="Filtrar por usuario o rol..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
                  {filteredAndSorted.length} registro{filteredAndSorted.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Tabla */}
              {filteredAndSorted.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? 'No se encontraron registros con ese filtro'
                      : 'No hay asignaciones de roles registradas'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        {/* Header ID */}
                        <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-16">
                          #
                        </th>

                        {/* Header Usuario — ordenable */}
                        <th
                          className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer select-none hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                          onClick={() => handleSort('user')}
                        >
                          <div className="flex items-center gap-2">
                            Usuario
                            <SortIcon field="user" />
                          </div>
                        </th>

                        {/* Header Rol — ordenable */}
                        <th
                          className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer select-none hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                          onClick={() => handleSort('role')}
                        >
                          <div className="flex items-center gap-2">
                            Rol
                            <SortIcon field="role" />
                          </div>
                        </th>

                        {/* Header Email */}
                        <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredAndSorted.map((ur, index) => (
                        <tr
                          key={ur.id}
                          className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          {/* Número de fila */}
                          <td className="px-4 py-3 text-gray-400 dark:text-gray-500">
                            {index + 1}
                          </td>

                          {/* Usuario */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs shrink-0">
                                {ur.user?.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {ur.user?.name ?? '—'}
                              </span>
                            </div>
                          </td>

                          {/* Rol */}
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
                              {ur.role?.name ?? '—'}
                            </span>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                            {ur.user?.email ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserRolesPage