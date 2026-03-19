import { httpSecurity } from './http'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  TwoFactorRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  OAuthProvider,
} from '../types/auth.types'

// HU-ENTR-1-008
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await httpSecurity.post<LoginResponse>('/security/login', {
    email: data.email,
    password: data.password,
  })
  return response.data
}

// HU-ENTR-1-007 — el backend usa POST /users para crear usuarios
export const register = async (data: RegisterRequest): Promise<void> => {
  await httpSecurity.post('/users', {
    name: data.name,
    email: data.email,
    password: data.password,
  })
}

// HU-ENTR-1-012
export const verifyTwoFactor = async (data: TwoFactorRequest): Promise<LoginResponse> => {
  const response = await httpSecurity.post<LoginResponse>('/security/2fa/verify', data)
  return response.data
}

export const resendTwoFactorCode = async (email: string): Promise<void> => {
  await httpSecurity.post('/security/2fa/resend', { email })
}

// HU-ENTR-1-013
export const forgotPassword = async (data: ForgotPasswordRequest): Promise<void> => {
  await httpSecurity.post('/security/forgot-password', data)
}

export const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
  await httpSecurity.post('/security/reset-password', data)
}

// HU-ENTR-1-004, HU-ENTR-1-005, HU-ENTR-1-006
export const oauthLogin = async (data: OAuthProvider): Promise<LoginResponse> => {
  const response = await httpSecurity.post<LoginResponse>('/security/auth/oauth', data)
  return response.data
}

export const logout = async (): Promise<void> => {
  await httpSecurity.post('/security/logout')
}