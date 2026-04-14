import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../store'
import * as authService from '../../services/authService'
import Button from '../../components/common/Button'

/**
 * ProfilePage renders the user profile settings.
 * Allows the user to view their info and link/unlink OAuth providers.
 */
const ProfilePage = () => {
  const navigate = useNavigate()
  const { user, handleLogout } = useAuth()
  const setUser = useAuthStore((state) => state.setUser)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isGoogleLinked = user?.linkedProviders?.includes('google') ?? false
  const hasPassword = user?.hasPassword ?? true

  // ── Link Google ──────────────────────────────────────────────────────────
  const linkGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!user) return
      setLoading(true)
      setMessage(null)
      try {
        const result = await authService.linkOAuthProvider(user.id, 'google', tokenResponse.access_token)
        if (result.error) {
          setMessage({ type: 'error', text: result.error })
        } else {
          // Update user in store
          const updatedProviders = [...(user.linkedProviders ?? []), 'google']
          setUser({ ...user, linkedProviders: updatedProviders })
          setMessage({ type: 'success', text: 'Cuenta de Google vinculada exitosamente' })
        }
      } catch {
        setMessage({ type: 'error', text: 'Error al vincular la cuenta de Google' })
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Error al conectar con Google' })
    },
  })

  // ── Unlink Google ────────────────────────────────────────────────────────
  const unlinkGoogle = async () => {
    if (!user) return
    setLoading(true)
    setMessage(null)
    try {
      const result = await authService.unlinkOAuthProvider(user.id, 'google')
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        const updatedProviders = (user.linkedProviders ?? []).filter(p => p !== 'google')
        setUser({ ...user, linkedProviders: updatedProviders })
        setMessage({ type: 'success', text: 'Cuenta de Google desvinculada exitosamente' })
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error ?? 'Error al desvincular la cuenta de Google'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  Buses Inteligentes
                </span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 italic">
                  {user?.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          Configuración de perfil
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Administra tu información y cuentas vinculadas
        </p>

        {/* Status message */}
        {message && (
          <div className={`mb-6 p-3 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-sm ${
              message.type === 'success'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* User info card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Información básica
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Nombre
              </label>
              <p className="text-gray-900 dark:text-gray-100">{user?.name}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Correo electrónico
              </label>
              <p className="text-gray-900 dark:text-gray-100">{user?.email}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Roles asignados
              </label>
              <div className="flex gap-1 flex-wrap">
                {user?.roles?.length ? user.roles.map((r) => (
                  <span key={r.id} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    {r.name}
                  </span>
                )) : (
                  <span className="text-sm text-gray-400 dark:text-gray-500 italic">Sin roles asignados</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Linked accounts card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Cuentas vinculadas
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Conecta o desconecta proveedores de autenticación externa
          </p>

          {/* Google */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Google</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isGoogleLinked ? 'Vinculada' : 'No vinculada'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isGoogleLinked ? (
                <>
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Conectada
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={loading}
                    onClick={unlinkGoogle}
                    disabled={!hasPassword && (user?.linkedProviders?.length ?? 0) <= 1}
                  >
                    Desvincular
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={loading}
                  onClick={() => linkGoogle()}
                >
                  Vincular con Google
                </Button>
              )}
            </div>
          </div>

          {/* Warning when no password set */}
          {!hasPassword && isGoogleLinked && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Aviso:</strong> Tu cuenta fue creada con Google y no tiene contraseña establecida.
                No podrás desvincular Google hasta que configures una contraseña mediante
                {' '}<a href="/forgot-password" className="underline hover:no-underline">recuperación de contraseña</a>.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ProfilePage
