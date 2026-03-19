import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { useAuthActions, useAuthPermissions } from '../store/authSlice'
import * as authController from '../controllers/authController'
import type {
  LoginRequest,
  RegisterRequest,
  TwoFactorRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  OAuthProvider,
} from '../types/auth.types'

/**
 * useAuth es el hook principal de autenticación
 * Centraliza toda la lógica que los componentes necesitan
 * para manejar sesiones, login, logout y registro
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
  const { logout: logoutStore } = useAuthActions()
  const { hasRole, hasPermission } = useAuthPermissions()

  // Estado local del hook — todos los useState van aquí arriba
  const [error, setError] = useState<string>('')
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState<boolean>(false)

  /**
   * Inicia sesión con email y contraseña
   * Si el backend requiere 2FA activa el flujo de verificación
   */
  const handleLogin = async (data: LoginRequest) => {
    setError('')
    await authController.handleLogin(
      data,
      navigate,
      setError
    )
  }

  /**
   * Verifica el código de segundo factor
   * Después de 3 intentos fallidos redirige al login
   */
  const handleTwoFactor = async (data: TwoFactorRequest) => {
    setError('')
    await authController.handleTwoFactor(
      data,
      navigate,
      setError,
      setAttemptsLeft
    )
  }

  /**
   * Registra un nuevo usuario en el sistema
   * Redirige al login con mensaje de confirmación
   */
  const handleRegister = async (data: RegisterRequest) => {
    setError('')
    await authController.handleRegister(data, navigate, setError)
  }

  /**
   * Solicita recuperación de contraseña
   * Siempre muestra éxito por seguridad (HU-ENTR-1-013)
   */
  const handleForgotPassword = async (data: ForgotPasswordRequest) => {
    setForgotPasswordSuccess(false)
    await authController.handleForgotPassword(data, setForgotPasswordSuccess)
  }

  /**
   * Restablece la contraseña con el token del email
   */
  const handleResetPassword = async (data: ResetPasswordRequest) => {
    setError('')
    await authController.handleResetPassword(data, navigate, setError)
  }

  /**
   * Inicia sesión con proveedor OAuth
   * Soporta Google, Microsoft y GitHub
   */
  const handleOAuthLogin = async (data: OAuthProvider) => {
    setError('')
    await authController.handleOAuthLogin(data, navigate, setError)
  }

  /**
   * Cierra la sesión activa y redirige al login
   */
  const handleLogout = async () => {
    await authController.handleLogout(navigate)
    logoutStore()
  }

  return {
    // Estado
    user,
    isAuthenticated,
    isLoading,
    error,
    requires2FA,
    attemptsLeft,
    forgotPasswordSuccess,

    // Acciones
    handleLogin,
    handleTwoFactor,
    handleRegister,
    handleForgotPassword,
    handleResetPassword,
    handleOAuthLogin,
    handleLogout,

    // Verificadores
    hasRole,
    hasPermission,
  }
}