import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store'


/**
 * ProtectedRoute protege rutas que requieren autenticación.
 *
 * El guard espera a _hasHydrated antes de tomar decisiones de navegación.
 * Esto evita el flash-to-login que ocurre cuando Zustand aún no ha
 * rehidratado isAuthenticated desde el localStorage (race condition).
 *
 * Flujo:
 * 1. _hasHydrated === false → spinner (Zustand aún rehidratando)
 * 2. isAuthenticated === false → redirige a /login
 * 3. Ciudadano sin perfil completo → redirige a /complete-profile
 * 4. isAuthenticated === true  → renderiza la ruta protegida
 */
const ProtectedRoute = () => {
  const hasHydrated = useAuthStore((state) => state._hasHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  // Esperar a que Zustand rehidrate el estado desde localStorage
  // Sin esta guarda, isAuthenticated es false en el primer render
  // y el router redirige al login incorrectamente
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" state={{ from: location.pathname, error: 'Sesión expirada o inválida' }} replace />
    )
  }

  // Verificar si el usuario es ciudadano y le falta completar el perfil
  // Solo redirige si NO estamos ya en /complete-profile (evitar loop)
  const isCiudadano = user?.roles?.some(
    r => r.name.toUpperCase() === 'CIUDADANO'
  ) ?? false
  const needsProfile = isCiudadano && user?.profileComplete === false

  if (needsProfile && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />
  }

  return <Outlet />
}

export default ProtectedRoute