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
  const response = await httpSecurity.post<LoginResponse>('/api/public/login', {
    email: data.email,
    password: data.password,
  })
  return response.data
}

// HU-ENTR-1-007 — el backend usa POST /api/public/register para crear usuarios con auto-login
export const register = async (data: RegisterRequest): Promise<LoginResponse> => {
  const response = await httpSecurity.post<LoginResponse>('/api/public/register', {
    name: data.name,
    email: data.email,
    password: data.password,
  })
  return response.data
}

// HU-ENTR-1-012
export const verifyTwoFactor = async (data: TwoFactorRequest): Promise<LoginResponse> => {
  const response = await httpSecurity.post<LoginResponse>('/api/public/security/2fa/verify', data)
  return response.data
}

export const resendTwoFactorCode = async (email: string): Promise<void> => {
  await httpSecurity.post('/api/public/security/2fa/resend', { email })
}

// HU-ENTR-1-013
export const forgotPassword = async (data: ForgotPasswordRequest): Promise<void> => {
  await httpSecurity.post('/api/public/security/forgot-password', data)
}

export const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
  await httpSecurity.post('/api/public/security/reset-password', data)
}

// HU-ENTR-1-004, HU-ENTR-1-005, HU-ENTR-1-006
export const oauthLogin = async (data: OAuthProvider): Promise<LoginResponse> => {
  const response = await httpSecurity.post<LoginResponse>('/api/public/auth/oauth', data)
  return response.data
}

export const logout = async (): Promise<void> => {
  await httpSecurity.post('/api/public/security/logout')
}

// OAuth provider linking
export const linkOAuthProvider = async (userId: string, provider: string, token: string): Promise<{ message?: string; error?: string }> => {
  const response = await httpSecurity.post(`/api/users/${userId}/oauth/link`, { provider, token })
  return response.data
}

export const unlinkOAuthProvider = async (userId: string, provider: string): Promise<{ message?: string; error?: string }> => {
  const response = await httpSecurity.delete(`/api/users/${userId}/oauth/${provider}`)
  return response.data
}

// Profile completion (citizen address requirement)
export const completeProfile = async (userId: string, data: { address: string; phone?: string }): Promise<{ message?: string; error?: string; profileComplete?: boolean }> => {
  const response = await httpSecurity.post(`/api/users/${userId}/complete-profile`, data)
  return response.data
}