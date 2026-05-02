import { useState } from 'react'
import type { Permission } from '../../types/role.types'
import PermissionList from '../../components/admin/PermissionList'
import PermissionForm from '../../components/admin/PermissionForm'
import Button from '../../components/common/Button'
import AdminHeader from '../../components/common/AdminHeader'

type View = 'list' | 'form'

/**
 * PermissionsPage orquesta la gestión completa de permisos
 * Alterna entre la lista y el formulario de creación/edición
 */
const PermissionsPage = () => {
  const [view, setView] = useState<View>('list')
  const [permissionToEdit, setPermissionToEdit] = useState<Permission | null>(null)

  // Cada vez que sube este número PermissionList recarga los datos
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreate = () => {
    setPermissionToEdit(null)
    setView('form')
  }

  const handleEdit = (permission: Permission) => {
    setPermissionToEdit(permission)
    setView('form')
  }

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
    setView('list')
    setPermissionToEdit(null)
  }

  const handleCancel = () => {
    setView('list')
    setPermissionToEdit(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <AdminHeader 
          title={view === 'form' ? (permissionToEdit ? "Editando Permiso" : "Nuevo Permiso") : "Gestión de Permisos"}
          subtitle="Crea y configura permisos base del sistema"
          showBack={view === 'form'}
          onBack={handleCancel}
          action={view === 'list' && (
            <Button onClick={handleCreate} leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }>
              Nuevo permiso
            </Button>
          )}
        />

        {/* Card contenedor */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">

          {view === 'list' ? (
            <PermissionList
              onEdit={handleEdit}
              refreshTrigger={refreshTrigger}
            />
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {permissionToEdit ? `Editando: ${permissionToEdit.url}` : 'Nuevo permiso'}
              </h2>
              <PermissionForm
                permissionToEdit={permissionToEdit}
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

export default PermissionsPage
