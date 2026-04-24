import { useState } from 'react'
import type { Role } from '../../types/role.types'
import RoleList from '../../components/admin/RoleList'
import RoleForm from '../../components/admin/RoleForm'
import RolePermissionAssign from '../../components/admin/RolePermissionAssign'
import Button from '../../components/common/Button'
import AdminHeader from '../../components/common/AdminHeader'

type View = 'list' | 'form' | 'permissions'

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

  const handleManagePermissions = (role: Role) => {
    setRoleToEdit(role)
    setView('permissions')
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
        <AdminHeader 
          title={
            view === 'form' 
              ? (roleToEdit ? "Editando Rol" : "Nuevo Rol") 
              : view === 'permissions'
              ? "Configurar Permisos"
              : "Gestión de Roles"
          }
          subtitle={
            view === 'permissions'
              ? `Asigna permisos granulares al rol ${roleToEdit?.name}`
              : "Crea y configura roles con permisos específicos"
          }
          showBack={view !== 'list'}
          onBack={handleCancel}
          action={view === 'list' && (
            <Button onClick={handleCreate} leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }>
              Nuevo rol
            </Button>
          )}
        />

        {/* Card contenedor */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">

          {view === 'list' && (
            <RoleList
              onEdit={handleEdit}
              onManagePermissions={handleManagePermissions}
              refreshTrigger={refreshTrigger}
            />
          )}

          {view === 'form' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {roleToEdit ? `Editando: ${roleToEdit.name}` : 'Nuevo rol'}
              </h2>
              <RoleForm
                roleToEdit={roleToEdit}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </>
          )}

          {view === 'permissions' && roleToEdit && (
            <RolePermissionAssign
              role={roleToEdit}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default RolesPage