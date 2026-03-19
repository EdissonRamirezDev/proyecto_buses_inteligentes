import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store'
import { useAuthContext } from '../context/AuthContext'

interface ProtectedRouteProps {
  allowedRoles?: string[]
}

/**
 * ProtectedRoute protege rutas que requieren autenticación
 * Maneja tres casos:
 * 1. App todavía inicializando → muestra spinner
 * 2. Usuario no autenticado → redirige a /login
 * 3. Usuario sin el rol requerido → redirige a /forbidden
 * 4. Usuario autenticado con rol correcto → renderiza la ruta
 */
const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isInitialized } = useAuthContext()
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasRole = useAuthStore((state) => state.hasRole)

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" state={{ from: location.pathname }} replace />
    )
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some((role) => hasRole(role))
    if (!hasRequiredRole) {
      return <Navigate to="/forbidden" replace />
    }
  }

  return <Outlet />
}

export default ProtectedRoute