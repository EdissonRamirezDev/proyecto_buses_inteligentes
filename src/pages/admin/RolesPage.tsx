import { useState } from 'react'
import type { Role } from '../../types/role.types'
import RoleList from '../../components/admin/RoleList'
import RoleForm from '../../components/admin/RoleForm'
import Button from '../../components/common/Button'

type View = 'list' | 'form'

/**
 * RolesPage orquesta la gestión completa de roles
 * Alterna entre la lista y el formulario de creación/edición
 * HU-ENTR-1-001, HU-ENTR-1-003
 */
const RolesPage = () => {
  const [view, setView] = useState<View>('list')
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null)

  // Cada vez que sube este número RoleList recarga los datos
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreate = () => {
    setRoleToEdit(null)
    setView('form')
  }

  const handleEdit = (role: Role) => {
    setRoleToEdit(role)
    setView('form')
  }

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
    setView('list')
    setRoleToEdit(null)
  }

  const handleCancel = () => {
    setView('list')
    setRoleToEdit(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Gestión de roles
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Crea y configura roles con permisos específicos
            </p>
          </div>
          {view === 'list' && (
            <Button onClick={handleCreate} leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }>
              Nuevo rol
            </Button>
          )}
        </div>

        {/* Card contenedor */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">

          {view === 'list' ? (
            <RoleList
              onEdit={handleEdit}
              refreshTrigger={refreshTrigger}
            />
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {roleToEdit ? `Editando: ${roleToEdit.nombre}` : 'Nuevo rol'}
              </h2>
              <RoleForm
                roleToEdit={roleToEdit}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RolesPage