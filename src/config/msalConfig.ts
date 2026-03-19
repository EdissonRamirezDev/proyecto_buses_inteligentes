import { type Configuration, type PopupRequest } from '@azure/msal-browser'

/**
 * Configuración de MSAL (Microsoft Authentication Library)
 * Maneja el flujo OAuth con cuentas Microsoft personales y organizacionales
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    // common acepta tanto cuentas personales como organizacionales
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: `${window.location.origin}/oauth/callback`,
  },
  cache: {
    // sessionStorage limpia la caché al cerrar el navegador
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
}

/**
 * Permisos que solicitamos al usuario de Microsoft
 */
export const loginRequest: PopupRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
}