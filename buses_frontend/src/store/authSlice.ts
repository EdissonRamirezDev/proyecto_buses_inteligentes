import { useAuthStore } from './index'
import { useShallow } from 'zustand/react/shallow'

export const useUser = () => useAuthStore((state) => state.user)

export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated)

export const useAuthLoading = () =>
  useAuthStore((state) => state.isLoading)

export const useAuthActions = () =>
  useAuthStore(
    useShallow((state) => ({
      login: state.login,
      logout: state.logout,
      setUser: state.setUser,
      setToken: state.setToken,
      setLoading: state.setLoading,
    }))
  )
