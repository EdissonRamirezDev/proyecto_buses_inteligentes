import type { NavigateFunction } from 'react-router-dom'
import * as authService from '../services/authService'
import { setToken, setStoredUser, clearSession } from '../utils/tokenHelper'
import { useAuthStore } from '../store'
import type {
  LoginRequest,
  RegisterRequest,
  TwoFactorRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  OAuthProvider,
  User,
} from '../types/auth.types'

// HU-ENTR-1-008
export const handleLogin = async (
  data: LoginRequest,
  navigate: NavigateFunction,
  setError: (error: string) => void,
): Promise<void> => {
  try {
    const response = await authService.login(data)
    const { login, setRequires2FA } = useAuthStore.getState()

    if (response.requires2FA) {
      setRequires2FA(true, data.email)
      navigate('/2fa', { state: { email: data.email } })
      return
    }

    // Ahora el backend devuelve el usuario real
    const user: User = response.user ?? {
      id: '',
      name: data.email,
      email: data.email,
    }

    setToken(response.token)
    setStoredUser(user)
    login(user, response.token)
    navigate('/dashboard', { replace: true })
  } catch {
    setError('Email o contraseña incorrectos')
  }
}

// HU-ENTR-1-012
export const handleTwoFactor = async (
  data: TwoFactorRequest,
  navigate: NavigateFunction,
  setError: (error: string) => void,
  setAttemptsLeft: (attempts: number) => void
): Promise<void> => {
  try {
    const response = await authService.verifyTwoFactor(data)
    const { login } = useAuthStore.getState()

    const user: User = response.user ?? {
      id: '',
      name: data.email,
      email: data.email,
    }

    setToken(response.token)
    setStoredUser(user)
    login(user, response.token)
    navigate('/dashboard', { replace: true })
  } catch (error: any) {
    const attemptsLeft = error.response?.data?.attemptsLeft

    if (attemptsLeft !== undefined) {
      setAttemptsLeft(attemptsLeft)
    }

    if (attemptsLeft === 0) {
      clearSession()
      navigate('/login')
      return
    }

    setError(`Código incorrecto. Intentos restantes: ${attemptsLeft}`)
  }
}

// HU-ENTR-1-007
export const handleRegister = async (
  data: RegisterRequest,
  navigate: NavigateFunction,
  setError: (error: string) => void
): Promise<void> => {
  try {
    await authService.register(data)
    navigate('/login', {
      state: { message: 'Registro exitoso. Revisa tu email para confirmar tu cuenta.' }
    })
  } catch (error: any) {
    const message = error.response?.data?.message
    setError(message ?? 'Error al registrarse. Intenta de nuevo.')
  }
}

// HU-ENTR-1-013
export const handleForgotPassword = async (
  data: ForgotPasswordRequest,
  setSuccess: (value: boolean) => void
): Promise<void> => {
  try {
    await authService.forgotPassword(data)
    setSuccess(true)
  } catch {
    setSuccess(true)
  }
}

export const handleResetPassword = async (
  data: ResetPasswordRequest,
  navigate: NavigateFunction,
  setError: (error: string) => void
): Promise<void> => {
  try {
    await authService.resetPassword(data)
    navigate('/login', {
      state: { message: 'Contraseña actualizada exitosamente.' }
    })
  } catch (error: any) {
    const message = error.response?.data?.message
    setError(message ?? 'Error al restablecer la contraseña.')
  }
}

// HU-ENTR-1-004, HU-ENTR-1-005, HU-ENTR-1-006
export const handleOAuthLogin = async (
  data: OAuthProvider,
  navigate: NavigateFunction,
  setError: (error: string) => void
): Promise<void> => {
  try {
    const response = await authService.oauthLogin(data)
    const { login } = useAuthStore.getState()

    // Ahora el backend devuelve el usuario completo
    const user: User = response.user ?? {
      id: '',
      name: data.email ?? data.provider,
      email: data.email ?? '',
    }

    setToken(response.token)
    setStoredUser(user)
    login(user, response.token)
    navigate('/dashboard', { replace: true })
  } catch {
    setError(`Error al iniciar sesión con ${data.provider}. Intenta de nuevo.`)
  }
}

export const handleLogout = async (
  navigate: NavigateFunction
): Promise<void> => {
  try {
    await authService.logout()
  } finally {
    clearSession()
    navigate('/login')
  }
}