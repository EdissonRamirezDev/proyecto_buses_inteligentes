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
  _hasHydrated: boolean  // true cuando Zustand terminó de rehidratar desde localStorage

  setUser: (user: User) => void
  setToken: (token: string) => void
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setRequires2FA: (value: boolean, email?: string) => void
  setHasHydrated: (value: boolean) => void
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
    (set) => ({
      user: isValidSession ? getStoredUser() : null,
      token: isValidSession ? savedToken : null,
      isAuthenticated: isValidSession,
      isLoading: false,
      requires2FA: false,
      twoFactorEmail: '',
      _hasHydrated: false,

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

      setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),
    }),
    {
      name: 'buses_auth_store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Se llama cuando Zustand termina de leer el localStorage
        // Es el momento seguro para que el router tome decisiones
        state?.setHasHydrated(true)
      },
    }
  )
)