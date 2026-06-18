import { useState } from 'react'
import type { User } from '../../types/user.types'
import UserList from '../../components/admin/UserList'
import UserRoleAssign from '../../components/admin/UserRoleAssign'
import Modal from '../../components/common/Modal'
import UserForm from '../../components/admin/UserForm'
import Button from '../../components/common/Button'
import AdminHeader from '../../components/common/AdminHeader'
import * as userService from '../../services/userService'
import * as personService from '../../services/personService'

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

  const [isSyncing, setIsSyncing] = useState(false)

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
    setUserToAssign(null)
    setUserToEdit(null)
    setShowCreateForm(false)
  }

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true)
      const users = await userService.getUsers()
      for (const u of users) {
        const nameParts = u.name ? u.name.split(' ') : ['Usuario', 'Sistema']
        const name = nameParts[0]
        const lastName = nameParts.slice(1).join(' ') || 'Sistema'
        await personService.syncPerson({
          userId: u.id,
          name,
          lastName,
          email: u.email,
        })
      }
      alert(`¡Éxito! Se sincronizaron ${users.length} usuarios con la base de datos de chat/mensajes.`)
    } catch (error) {
      console.error('Error sincronizando usuarios:', error)
      alert('Hubo un error al sincronizar los usuarios.')
    } finally {
      setIsSyncing(false)
    }
  }

  const isFormOpen = showCreateForm || !!userToEdit

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <AdminHeader 
          title={isFormOpen ? (userToEdit ? "Editando Usuario" : "Nuevo Usuario") : "Gestión de Usuarios"}
          subtitle="Administra usuarios y asigna roles del sistema"
          showBack={isFormOpen}
          onBack={() => {
            setUserToEdit(null)
            setShowCreateForm(false)
          }}
          action={!isFormOpen && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleSyncAll}
                isLoading={isSyncing}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
              >
                Sincronizar Todos
              </Button>
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
            </div>
          )}
        />

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