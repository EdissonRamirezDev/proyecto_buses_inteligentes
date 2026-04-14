export interface LoginRequest {
  email: string
  password: string
  recaptchaToken: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginResponse {
  token: string
  user?: User
  requires2FA?: boolean
}

export interface TwoFactorRequest {
  email: string
  code: string
}

export interface ForgotPasswordRequest {
  email: string
  recaptchaToken: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

// Coincide exactamente con User.java del backend
export interface User {
  id: string
  name: string
  email: string
  password?: string  // opcional — nunca se muestra en el frontend
  roles?: Role[]     // no viene del backend, lo construimos en el frontend
  linkedProviders?: string[]
  hasPassword?: boolean
  profileComplete?: boolean
}

export interface OAuthProvider {
  provider: 'google' | 'microsoft' | 'github'
  token: string
  email?: string
}

import type { Role } from './role.types'