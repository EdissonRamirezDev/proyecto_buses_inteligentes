import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/auth.types'
import { TOKEN_KEY, USER_KEY } from '../utils/constants'
import { getStoredUser, clearSession, isTokenExpired } from '../utils/tokenHelper'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  requires2FA: boolean
  twoFactorEmail: string

  setUser: (user: User) => void
  setToken: (token: string) => void
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setRequires2FA: (value: boolean, email?: string) => void
  hasRole: (role: string) => boolean
  hasPermission: (module: string, action: string) => boolean
}

// Lee el token directamente del localStorage con la clave correcta
// NO usa getToken() aquí porque Zustand aún no ha rehidratado
const savedToken = localStorage.getItem(TOKEN_KEY)
const isValidSession = savedToken ? !isTokenExpired(savedToken) : false

if (savedToken && !isValidSession) {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: isValidSession ? getStoredUser() : null,
      token: isValidSession ? savedToken : null,
      isAuthenticated: isValidSession,
      isLoading: false,
      requires2FA: false,
      twoFactorEmail: '',

      setUser: (user: User) => set({ user }),
      setToken: (token: string) => set({ token }),

      login: (user: User, token: string) =>
        set({
          user,
          token,
          isAuthenticated: true,
          requires2FA: false,
          twoFactorEmail: '',
        }),

      logout: () => {
        clearSession()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          requires2FA: false,
          twoFactorEmail: '',
        })
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setRequires2FA: (value: boolean, email?: string) =>
        set({
          requires2FA: value,
          twoFactorEmail: email ?? '',
        }),

      hasRole: (role: string): boolean => {
        const { user } = get()
        if (!user) return false
        return user.roles?.some((r) => r.name === role) ?? false
      },

      hasPermission: (_module: string, _action: string): boolean => {
        const { user } = get()
        if (!user) return false
        return (user.roles?.length ?? 0) > 0
      },
    }),
    {
      // ← Clave diferente a TOKEN_KEY para que no colisionen
      name: 'buses_auth_store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)