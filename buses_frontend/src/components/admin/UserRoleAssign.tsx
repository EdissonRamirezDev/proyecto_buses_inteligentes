import { useEffect, useState } from 'react'
import * as roleService from '../../services/roleService'
import * as userRoleService from '../../services/userRoleService'
import * as personService from '../../services/personService'
import * as companyService from '../../services/companyService'
import * as businessAdminService from '../../services/businessAdminService'
import * as driverService from '../../services/driverService'
import type { User } from '../../types/user.types'
import type { Role } from '../../types/role.types'
import type { UserRole } from '../../types/userRole.types'
import type { Company } from '../../services/companyService'
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
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('')
  const [assignedCompany, setAssignedCompany] = useState<{ id: number; name: string } | null>(null)

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

    // Si tiene el rol de Administrador Empresa, buscar su asociación
    const companyAdminRole = availableRoles.find(r => r.name === 'Administrador Empresa')
    const hasCompanyAdmin = companyAdminRole && (companyAdminRole.id in map)
    
    if (hasCompanyAdmin || userRoles.some(ur => ur.role?.name === 'Administrador Empresa')) {
      const admin = await businessAdminService.getBusinessAdminByUserId(user.id)
      if (admin && admin.company) {
        setAssignedCompany({ id: admin.company.id, name: admin.company.name })
      } else {
        setAssignedCompany(null)
      }
    } else {
      setAssignedCompany(null)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [roles, companyList] = await Promise.all([
          roleService.getRoles(),
          companyService.getCompanies(),
        ])
        setAvailableRoles(roles)
        setCompanies(companyList)
        if (companyList.length > 0) {
          setSelectedCompanyId(companyList[0].id || '')
        }
      } catch {
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user.id])

  // Recargar la asociación de empresa cuando cambie el mapa de roles o se terminen de cargar
  useEffect(() => {
    if (availableRoles.length > 0) {
      reloadUserRoleMap()
    }
  }, [availableRoles])

  const handleAssign = async (role: Role) => {
    setLoadingRoleId(role.id)
    setError('')
    try {
      // Flujo especial para Administrador de Empresa
      if (role.name === 'Administrador Empresa') {
        if (!selectedCompanyId) {
          setError('Debes registrar y seleccionar una empresa antes de asignar este rol.')
          setLoadingRoleId(null)
          return
        }

        // 1. Sincronizar usuario a Persona en ms-logic
        const nameParts = user.name ? user.name.split(' ') : ['Usuario', 'Sistema']
        const name = nameParts[0]
        const lastName = nameParts.slice(1).join(' ') || 'Sistema'

        const person = await personService.syncPerson({
          userId: user.id,
          name,
          lastName,
          email: user.email,
        })

        // 2. Asignar rol en ms-security
        await userRoleService.addRoleToUser(user.id, role.id)

        // 3. Crear BusinessAdministrator en ms-logic
        await businessAdminService.createBusinessAdmin({
          personId: person.id,
          companyId: Number(selectedCompanyId),
        })
      } else if (role.name === 'Conductor') {
        // 1. Sincronizar usuario a Persona en ms-logic
        const nameParts = user.name ? user.name.split(' ') : ['Usuario', 'Sistema']
        const name = nameParts[0]
        const lastName = nameParts.slice(1).join(' ') || 'Sistema'

        const person = await personService.syncPerson({
          userId: user.id,
          name,
          lastName,
          email: user.email,
        })

        // 2. Asignar rol en ms-security
        await userRoleService.addRoleToUser(user.id, role.id)

        // 3. Crear Driver en ms-logic
        await driverService.createDriver({
          personId: person.id,
          name: person.name,
          last_name: person.lastName,
          license: 'A3-Federal',
          email: person.email || user.email || '',
          phone: person.phone || '',
          status: 'available'
        })
      } else {
        // Flujo normal para otros roles
        await userRoleService.addRoleToUser(user.id, role.id)
      }

      // Recarga el mapa para obtener el ID del nuevo registro
      await reloadUserRoleMap()
    } catch (err: any) {
      setError(err.response?.data?.message || `Error al asignar el rol ${role.name}`)
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
      // Flujo especial para Administrador de Empresa
      if (role.name === 'Administrador Empresa') {
        const admin = await businessAdminService.getBusinessAdminByUserId(user.id)
        if (admin && admin.person?.id) {
          // Eliminar BusinessAdministrator en ms-logic
          await businessAdminService.deleteBusinessAdminByPersonId(admin.person.id)
        }
      }

      // Quitar rol en ms-security
      await userRoleService.removeRoleFromUser(userRoleId)

      if (role.name === 'Conductor') {
        try {
          const allDrivers = await driverService.getDrivers()
          const currentDriver = allDrivers.find(d => d.person?.userId === user.id)
          if (currentDriver?.id) {
            await driverService.deleteDriver(currentDriver.id)
          }
        } catch (err) {
          console.warn('Failed to clean up driver record in logic database:', err)
        }
      }

      // Actualiza el mapa local y limpia la empresa asignada
      setUserRoleMap((prev) => {
        const updated = { ...prev }
        delete updated[role.id]
        return updated
      })
      if (role.name === 'Administrador Empresa') {
        setAssignedCompany(null)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Error al quitar el rol ${role.name}`)
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
            const isCompanyAdmin = role.name === 'Administrador Empresa'

            return (
              <div
                key={role.id}
                className={`
                  flex flex-col gap-3 p-3 rounded-lg border transition-colors
                  ${isAssigned
                    ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                <div className="flex items-center justify-between">
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

                {/* Contenido especial para Administrador de Empresa */}
                {isCompanyAdmin && (
                  <div className="mt-1 p-2 rounded bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 text-xs">
                    {isAssigned ? (
                      <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Empresa asignada: <strong className="font-semibold text-gray-900 dark:text-white">{assignedCompany?.name || 'Cargando asociación...'}</strong></span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <label className="block font-medium text-gray-700 dark:text-gray-300">
                          Selecciona la Empresa para administrar:
                        </label>
                        {companies.length === 0 ? (
                          <span className="text-red-500">No hay empresas registradas. Crea una en el panel de Empresas primero.</span>
                        ) : (
                          <select
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                            className="w-full text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-1.5"
                          >
                            {companies.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} (NIT: {c.nit})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                )}
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