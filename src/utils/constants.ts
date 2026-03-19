export const API_SECURITY_URL = import.meta.env.VITE_API_SECURITY_URL
export const API_BUSINESS_URL = import.meta.env.VITE_API_BUSINESS_URL

export const TOKEN_KEY = 'buses_token'       // para tokenHelper — guarda solo el JWT
export const USER_KEY = 'buses_user'         // para tokenHelper — guarda solo el user
export const STORE_KEY = 'buses_auth_store'  // para Zustand persist — guarda el store

export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export const ROLES = {
  ADMIN_SISTEMA: 'Administrador Sistema',
  ADMIN_EMPRESA: 'Administrador Empresa',
  SUPERVISOR: 'Supervisor',
  CONDUCTOR: 'Conductor',
  CIUDADANO: 'Ciudadano',
} as const

export const MODULES = {
  USUARIOS: 'gestión de usuarios',
  BUSES: 'gestión de buses',
  RUTAS: 'gestión de rutas',
  PROGRAMACIONES: 'gestión de programaciones',
  REPORTES: 'visualización de reportes',
  INCIDENTES: 'gestión de incidentes',
  MENSAJES: 'envío de mensajes masivos',
} as const