import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { API_SECURITY_URL, API_BUSINESS_URL } from '../utils/constants'
import { getToken, clearSession, isTokenExpired } from '../utils/tokenHelper'

// Debug temporal — bórralo después
console.log('API_SECURITY_URL:', API_SECURITY_URL)
console.log('API_BUSINESS_URL:', API_BUSINESS_URL)

// Rutas públicas que no deben disparar redirección al login
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/2fa', '/oauth/callback']

const isPublicRoute = (): boolean => {
  return PUBLIC_ROUTES.some(route => window.location.pathname.startsWith(route))
}

const createHttpInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Interceptor de request
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken()
      console.log('Token:', token)
      console.log('URL:', config.url)
      console.log('BaseURL:', config.baseURL)

      if (token) {
        console.log('isTokenExpired:', isTokenExpired(token))
        // Solo redirige al login si el token expiró y NO estamos en una ruta pública
        if (isTokenExpired(token) && !isPublicRoute()) {
          clearSession()
          window.location.href = '/login'
          return Promise.reject(new Error('Token expirado'))
        }
        config.headers.Authorization = `Bearer ${token}`
      }

      return config
    },
    (error: AxiosError) => Promise.reject(error)
  )

  // Interceptor de response
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      // Solo redirige si NO estamos ya en una ruta pública
      // Evita el loop infinito cuando el login devuelve 401
      if (error.response?.status === 401 && !isPublicRoute()) {
        clearSession()
        window.location.href = '/login'
      }

      if (error.response?.status === 403 && !isPublicRoute()) {
        window.location.href = '/forbidden'
      }

      return Promise.reject(error)
    }
  )

  return instance
}

export const httpSecurity = createHttpInstance(API_SECURITY_URL)
export const httpBusiness = createHttpInstance(API_BUSINESS_URL)