import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useAuthStore } from '../store'
import { getToken, isTokenExpired, clearSession } from '../utils/tokenHelper'

// Define la forma del contexto
interface AuthContextType {
  isInitialized: boolean // true cuando ya se verificó la sesión al arrancar la app
}

// Crea el contexto con valor por defecto
const AuthContext = createContext<AuthContextType>({
  isInitialized: false,
})

interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider envuelve toda la app y se encarga de:
 * 1. Verificar si hay una sesión válida al arrancar
 * 2. Limpiar la sesión si el token está expirado
 * 3. Marcar cuando la inicialización terminó para evitar
 *    que el router redirija antes de saber si hay sesión
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { logout, setLoading } = useAuthStore()

  useEffect(() => {
    const initializeAuth = () => {
      setLoading(true)

      try {
        const token = getToken()

        // Si hay token pero está expirado, limpiamos la sesión
        if (token && isTokenExpired(token)) {
          clearSession()
          logout()
        }
        // Si no hay token simplemente no hay sesión activa, no es un error
      } catch {
        // Si algo falla al leer el localStorage, limpiamos por seguridad
        clearSession()
        logout()
      } finally {
        // Marcamos como inicializado independientemente del resultado
        // para que el router pueda tomar decisiones de navegación
        setIsInitialized(true)
        setLoading(false)
      }
    }

    initializeAuth()
  }, []) // Solo se ejecuta una vez al montar la app

  return (
    <AuthContext.Provider value={{ isInitialized }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para consumir el AuthContext
 * Uso: const { isInitialized } = useAuthContext()
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider')
  }
  return context
}