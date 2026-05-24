import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'

/**
 * DashboardPage es la página principal después del login
 * Muestra accesos directos según el rol del usuario
 * HU-ENTR-1-009
 */
const DashboardPage = () => {
  const { user, handleLogout } = useAuth()
  const navigate = useNavigate()
  const roles = user?.roles?.map(r => r.name.toUpperCase()) || []
  const isAdmin = roles.includes('ADMIN_SISTEMA') || roles.includes('ADMIN')
  const isConductor = roles.includes('CONDUCTOR')
  const isCitizen = roles.includes('CIUDADANO')
  const isCompanyAdmin = roles.includes('ADMIN_EMPRESA') || roles.includes('ADMINISTRADOR_EMPRESA')

  useEffect(() => {
    if (user) {
      if (isCitizen && !isAdmin) {
        navigate('/citizen/dashboard', { replace: true })
      } else if (isConductor && !isAdmin) {
        navigate('/conductor/turno', { replace: true })
      } else if (isCompanyAdmin && !isAdmin) {
        navigate('/company-admin/dashboard', { replace: true })
      }
    }
  }, [user, isCitizen, isConductor, isCompanyAdmin, isAdmin, navigate])

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 italic">
                  {user?.name}
                </p>
                <div className="flex gap-1 justify-end">
                  {user?.roles?.map((r) => (
                    <span key={r.id} className="text-[10px] px-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
              >
                Mi perfil
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
              >
                🌓
              </Button>
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Hola, {user?.name} 
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tu panel de control personalizado según tus permisos
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Módulos Administrativos */}
          {isAdmin && (
            <>
              <DashboardCard
                to="/admin/users"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                title="Gestión de usuarios"
                description="Administra los usuarios de la plataforma"
                color="blue"
              />
              <DashboardCard
                to="/admin/roles"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                title="Roles y accesos"
                description="Configura roles y asigna permisos"
                color="purple"
              />
              <DashboardCard
                to="/admin/permissions"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                title="Catálogo de permisos"
                description="Gestiona todos los endpoints protegidos"
                color="red"
              />
              <DashboardCard
                to="/admin/user-roles"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                title="Historial de asignaciones"
                description="Audita quién tiene qué rol asignado"
                color="purple"
              />
              <DashboardCard
                to="/admin/companies"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                title="Gestión de empresas"
                description="Administra las empresas transportadoras"
                color="blue"
              />

            </>
          )}

          {/* Módulos Operativos */}
          {(isAdmin || roles.includes('OPERADOR')) && (
            <DashboardCard
              to="/admin/buses"
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
              title="Mi flota de buses"
              description="Gestiona vehículos y mantenimiento"
              color="green"
            />
          )}

          {/* Módulos Conductor */}
          {(isAdmin || isConductor) && (
              <DashboardCard
                to="/conductor/turno"
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Mi turno de conducción"
                description="Control de tiempos y recorridos"
                color="amber"
              />
            )}

          {/* Módulos Ciudadano */}
          {(isAdmin || isCitizen) && (
            <DashboardCard
              to="/citizen/dashboard"
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              title="Mi Panel Ciudadano"
              description="Saldo, viajes y mis boletos"
              color="indigo"
            />
          )}

          {/* Módulos Públicos / Generales */}
          <DashboardCard
            to="/admin/routes"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
            title="Gestión de Rutas"
            description="Administra rutas y asignación de nodos"
            color="teal"
          />
          <DashboardCard
            to="/admin/bus-stops"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            title="Gestión de Paraderos"
            description="Registra estaciones y paraderos en el mapa"
            color="blue"
          />
          <DashboardCard
            to="/admin/schedules"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            title="Programación Operativa"
            description="Asigna buses a rutas en fechas y horas"
            color="green"
          />
          <DashboardCard
            to="/admin/citizens"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            title="Gestión de Ciudadanos"
            description="Administra perfiles y recarga de billeteras"
            color="purple"
          />
          <DashboardCard
            to="/admin/tickets"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>}
            title="Venta de Boletos"
            description="Audita compras y valida códigos QR"
            color="teal"
          />
          <DashboardCard
            to="/admin/history"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            title="Historial de Viajes"
            description="Auditoría de escaneos y validaciones"
            color="indigo"
          />
          <DashboardCard
            to="/admin/wallet"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
            title="Billetera (Recargas)"
            description="Recargas y auditoría financiera"
            color="amber"
          />
          <DashboardCard
            to="/admin/incidents"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            title="Centro de Incidentes"
            description="Reportes operativos de la flota"
            color="red"
          />
          <DashboardCard
            to="/admin/analytics"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            title="Dashboard Analítico"
            description="Estadísticas y monitor en vivo"
            color="blue"
          />
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
  color: 'blue' | 'purple' | 'green' | 'amber' | 'teal' | 'red' | 'indigo'
}

const colorMap = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
}

const DashboardCard = ({ to, icon, title, description, color }: DashboardCardProps) => {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(to)}
      className="
        group block p-6 bg-white dark:bg-gray-800
        rounded-2xl border border-gray-200 dark:border-gray-700
        hover:border-blue-300 dark:hover:border-blue-600
        hover:shadow-md transition-all duration-200
        cursor-pointer
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
    </div>
  )
}

export default DashboardPage