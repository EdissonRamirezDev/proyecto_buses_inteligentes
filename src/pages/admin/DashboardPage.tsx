import { useAuth } from '../../hooks/useAuth'
import { useRoleCheck } from '../../hooks/usePermissions'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button'

/**
 * DashboardPage es la página principal después del login
 * Muestra accesos directos según el rol del usuario
 * HU-ENTR-1-009
 */
const DashboardPage = () => {
  const { user, handleLogout } = useAuth()
  const { isAdminSistema, isAdminEmpresa, isConductor, isCiudadano } = useRoleCheck()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                Buses Inteligentes
              </span>
            </div>

            {/* Usuario y logout */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.roles?.map((r) => r.name).join(', ')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Saludo */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Hola, {user?.name} 
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Selecciona una opción para comenzar
          </p>
        </div>

        {/* Tarjetas de acceso según rol */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Solo Administrador Sistema */}
          {isAdminSistema && (
            <>
              <DashboardCard
                to="/admin/roles"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
                title="Gestión de roles"
                description="Crea y configura roles con permisos específicos"
                color="blue"
              />
              <DashboardCard
                to="/admin/users"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
                title="Gestión de usuarios"
                description="Administra usuarios y asigna roles"
                color="purple"
              />
            </>
          )}

          {/* Administrador Empresa */}
          {isAdminEmpresa && (
            <DashboardCard
              to="/admin/buses"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              }
              title="Mi flota"
              description="Gestiona los buses de tu empresa"
              color="green"
            />
          )}

          {/* Conductor */}
          {isConductor && (
            <DashboardCard
              to="/conductor/turno"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Mi turno"
              description="Inicia o finaliza tu turno de conducción"
              color="amber"
            />
          )}

          {/* Ciudadano */}
          {isCiudadano && (
            <DashboardCard
              to="/rutas"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
              title="Ver rutas"
              description="Consulta rutas y paraderos disponibles"
              color="teal"
            />
          )}

          {/* Si no tiene ningún rol muestra mensaje */}
          {!isAdminSistema && !isAdminEmpresa && !isConductor && !isCiudadano && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No tienes módulos disponibles. Contacta al administrador para que te asigne un rol.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── Componente interno de tarjeta ───────────────────────────────────────────

interface DashboardCardProps {
  to: string
  icon: React.ReactNode
  title: string
  description: string
  color: 'blue' | 'purple' | 'green' | 'amber' | 'teal' | 'red'
}

const colorMap = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
}

const DashboardCard = ({ to, icon, title, description, color }: DashboardCardProps) => {
  return (
    <Link
      to={to}
      className="
        group block p-6 bg-white dark:bg-gray-800
        rounded-2xl border border-gray-200 dark:border-gray-700
        hover:border-blue-300 dark:hover:border-blue-600
        hover:shadow-md transition-all duration-200
      "
    >
      <div className={`inline-flex p-3 rounded-xl mb-4 ${colorMap[color]}`}>
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {description}
      </p>
    </Link>
  )
}

export default DashboardPage