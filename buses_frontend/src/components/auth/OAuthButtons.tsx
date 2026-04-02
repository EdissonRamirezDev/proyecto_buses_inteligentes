import { useGoogleLogin } from '@react-oauth/google'
import { useMsal } from '@azure/msal-react'
import { useAuth } from '../../hooks/useAuth'
import { loginRequest } from '../../config/msalConfig'

/**
 * OAuthButtons renderiza los botones de autenticación externa
 * Google usa @react-oauth/google
 * Microsoft usa @azure/msal-react (librería oficial)
 * GitHub usa redirección OAuth manual
 * HU-ENTR-1-004, HU-ENTR-1-005, HU-ENTR-1-006
 */
const OAuthButtons = () => {
  const { handleOAuthLogin, error } = useAuth()
  const { instance } = useMsal()

  // ── Google ────────────────────────────────────────────────────────────────
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      await handleOAuthLogin({
        provider: 'google',
        token: tokenResponse.access_token,
      })
    },
    onError: () => {
      console.error('Error al iniciar sesión con Google')
    },
  })

  // ── Microsoft ─────────────────────────────────────────────────────────────
  // Usa popup en lugar de redirección para evitar problemas con el callback
  const loginWithMicrosoft = async () => {
    try {
      const result = await instance.loginPopup(loginRequest)

      if (result.accessToken) {
        await handleOAuthLogin({
          provider: 'microsoft',
          token: result.accessToken,
        })
      }
    } catch (error) {
      console.error('Error al iniciar sesión con Microsoft:', error)
    }
  }

  // ── GitHub ────────────────────────────────────────────────────────────────
  // GitHub no tiene librería oficial para React, usamos redirección OAuth
  const loginWithGitHub = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    const redirectUri = `${window.location.origin}/oauth/callback`

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state: 'github',
    })

    window.location.href =
      `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Mensaje de error OAuth */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 text-center">
          {error}
        </p>
      )}

      {/* Botón Google */}
      <button
        onClick={() => loginWithGoogle()}
        className="
          w-full flex items-center justify-center gap-3 px-4 py-2.5
          border border-gray-300 dark:border-gray-600
          rounded-lg bg-white dark:bg-gray-800
          text-sm font-medium text-gray-700 dark:text-gray-200
          hover:bg-gray-50 dark:hover:bg-gray-700
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Iniciar sesión con Google
      </button>

      {/* Botón Microsoft */}
      <button
        onClick={loginWithMicrosoft}
        className="
          w-full flex items-center justify-center gap-3 px-4 py-2.5
          border border-gray-300 dark:border-gray-600
          rounded-lg bg-white dark:bg-gray-800
          text-sm font-medium text-gray-700 dark:text-gray-200
          hover:bg-gray-50 dark:hover:bg-gray-700
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#F25022" d="M1 1h10v10H1z"/>
          <path fill="#00A4EF" d="M13 1h10v10H13z"/>
          <path fill="#7FBA00" d="M1 13h10v10H1z"/>
          <path fill="#FFB900" d="M13 13h10v10H13z"/>
        </svg>
        Iniciar sesión con Microsoft
      </button>

      {/* Botón GitHub */}
      <button
        onClick={loginWithGitHub}
        className="
          w-full flex items-center justify-center gap-3 px-4 py-2.5
          border border-gray-300 dark:border-gray-600
          rounded-lg bg-white dark:bg-gray-800
          text-sm font-medium text-gray-700 dark:text-gray-200
          hover:bg-gray-50 dark:hover:bg-gray-700
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        Iniciar sesión con GitHub
      </button>
    </div>
  )
}

export default OAuthButtons