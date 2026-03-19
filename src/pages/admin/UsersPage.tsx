import { useState } from 'react'
import type { User } from '../../types/user.types'
import UserList from '../../components/admin/UserList'
import UserRoleAssign from '../../components/admin/UserRoleAssign'
import Modal from '../../components/common/Modal'
import UserForm from '../../components/admin/UserForm'
import Button from '../../components/common/Button'

/**
 * UsersPage orquesta la gestión de usuarios
 * Muestra la lista y abre el modal de asignación de roles
 * HU-ENTR-1-002
 */
const UsersPage = () => {
  const [userToAssign, setUserToAssign] = useState<User | null>(null)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
    setUserToAssign(null)
    setUserToEdit(null)
    setShowCreateForm(false)
  }

  const isFormOpen = showCreateForm || !!userToEdit

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Gestión de usuarios
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Administra usuarios y asigna roles del sistema
            </p>
          </div>
          {!isFormOpen && (
            <Button
              onClick={() => setShowCreateForm(true)}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Nuevo usuario
            </Button>
          )}
        </div>

        {/* Card contenedor */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          {isFormOpen ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {userToEdit ? `Editando: ${userToEdit.name}` : 'Nuevo usuario'}
              </h2>
              <UserForm
                userToEdit={userToEdit}
                onSuccess={handleSuccess}
                onCancel={() => {
                  setUserToEdit(null)
                  setShowCreateForm(false)
                }}
              />
            </>
          ) : (
            <UserList
              onAssignRoles={(user) => setUserToAssign(user)}
              onEdit={(user) => setUserToEdit(user)}
              refreshTrigger={refreshTrigger}
            />
          )}
        </div>
      </div>

      {/* Modal de asignación de roles */}
      <Modal
        isOpen={!!userToAssign}
        onClose={() => setUserToAssign(null)}
        title="Asignar roles"
        size="md"
      >
        {userToAssign && (
          <UserRoleAssign
            user={userToAssign}
            onSuccess={handleSuccess}
            onCancel={() => setUserToAssign(null)}
          />
        )}
      </Modal>
    </div>
  )
}

export default UsersPage