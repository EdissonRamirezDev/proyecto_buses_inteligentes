import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { useAuthActions } from '../store/authSlice'
import * as authService from '../services/authService'
import { setToken, setStoredUser, clearSession } from '../utils/tokenHelper'
import type {
  LoginRequest,
  RegisterRequest,
  TwoFactorRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  OAuthProvider,
  User,
} from '../types/auth.types'

/**
 * useAuth es el hook principal de autenticación
 * Centraliza toda la lógica de sesiones, login, logout y registro (refactorizado sin controllers)
 *
 * Uso: const { handleLogin, handleLogout, isAuthenticated, user } = useAuth()
 */
export const useAuth = () => {
  const navigate = useNavigate()

  // Estado del store global
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const requires2FA = useAuthStore((state) => state.requires2FA)
  
  const { login, logout: logoutStore } = useAuthActions()
  const setRequires2FA = useAuthStore((state) => state.setRequires2FA)

  // Estado local del hook
  const [error, setError] = useState<string>('')
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState<boolean>(false)

  const handleLogin = async (data: LoginRequest) => {
    setError('')
    try {
      const response = await authService.login(data)

      if (response.requires2FA) {
        setRequires2FA(true, data.email)
        navigate('/2fa', { state: { email: data.email } })
        return
      }

      const loggedUser: User = response.user ?? {
        id: '',
        name: data.email,
        email: data.email,
      }

      setToken(response.token)
      setStoredUser(loggedUser)
      login(loggedUser, response.token)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Email o contraseña incorrectos')
    }
  }

  const handleTwoFactor = async (data: TwoFactorRequest) => {
    setError('')
    try {
      const response = await authService.verifyTwoFactor(data)

      const loggedUser: User = response.user ?? {
        id: '',
        name: data.email,
        email: data.email,
      }

      setToken(response.token)
      setStoredUser(loggedUser)
      login(loggedUser, response.token)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const remainingAttempts = err.response?.data?.attemptsLeft

      if (remainingAttempts !== undefined) {
        setAttemptsLeft(remainingAttempts)
      }

      if (remainingAttempts === 0) {
        clearSession()
        navigate('/login')
        return
      }

      setError(`Código incorrecto. Intentos restantes: ${remainingAttempts ?? attemptsLeft}`)
    }
  }

  const handleRegister = async (data: RegisterRequest) => {
    setError('')
    try {
      const response = await authService.register(data)
      
      const loggedUser: User = response.user ?? {
        id: '',
        name: data.name,
        email: data.email,
      }

      setToken(response.token)
      setStoredUser(loggedUser)
      login(loggedUser, response.token)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(message ?? 'Error al registrarse. Intenta de nuevo.')
    }
  }

  const handleForgotPassword = async (data: ForgotPasswordRequest) => {
    setForgotPasswordSuccess(false)
    try {
      await authService.forgotPassword(data)
      setForgotPasswordSuccess(true)
    } catch {
      setForgotPasswordSuccess(true) // Always true to avoid account scraping
    }
  }

  const handleResetPassword = async (data: ResetPasswordRequest) => {
    setError('')
    try {
      await authService.resetPassword(data)
      navigate('/login', {
        state: { message: 'Contraseña actualizada exitosamente.' }
      })
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(message ?? 'Error al restablecer la contraseña.')
    }
  }

  const handleOAuthLogin = async (data: OAuthProvider) => {
    setError('')
    try {
      const response = await authService.oauthLogin(data)

      const loggedUser: User = response.user ?? {
        id: '',
        name: data.email ?? data.provider,
        email: data.email ?? '',
      }

      setToken(response.token)
      setStoredUser(loggedUser)
      login(loggedUser, response.token)
      navigate('/dashboard', { replace: true })
    } catch {
      setError(`Error al iniciar sesión con ${data.provider}. Intenta de nuevo.`)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // Ignore logout errors
    } finally {
      clearSession()
      logoutStore()
      navigate('/login')
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    requires2FA,
    attemptsLeft,
    forgotPasswordSuccess,
    handleLogin,
    handleTwoFactor,
    handleRegister,
    handleForgotPassword,
    handleResetPassword,
    handleOAuthLogin,
    handleLogout,
  }
}