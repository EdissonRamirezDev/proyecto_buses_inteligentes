import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoginForm from '../../components/auth/LoginForm'
import OAuthButtons from '../../components/auth/OAuthButtons'
import TwoFactorForm from '../../components/auth/TwoFactorForm'

/**
 * LoginPage es la página principal de autenticación
 * Maneja dos estados:
 * 1. Formulario de login normal
 * 2. Formulario de 2FA si el backend lo requiere
 * HU-ENTR-1-008, HU-ENTR-1-012
 */
const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, requires2FA } = useAuth()

  // Mensaje de éxito que viene desde RegisterPage o ResetPasswordPage
  const successMessage = location.state?.message as string | undefined

  // Si ya está autenticado, redirige al dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated]) // ← sin navigate en las dependencias

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">

        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {requires2FA ? 'Verificación en dos pasos' : 'Bienvenido de vuelta'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {requires2FA
              ? 'Ingresa el código enviado a tu email'
              : 'Sistema de Buses Inteligentes'}
          </p>
        </div>

        {/* Card principal */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">

          {/* Mensaje de éxito (viene de registro o reset password) */}
          {successMessage && (
            <div className="mb-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-400">
                {successMessage}
              </p>
            </div>
          )}

          {/* Muestra 2FA o login normal según el estado */}
          {requires2FA ? (
            <TwoFactorForm email="" />
          ) : (
            <>
              {/* Botones OAuth */}
              <OAuthButtons />

              {/* Divisor */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    o continúa con email
                  </span>
                </div>
              </div>

              {/* Formulario de login */}
              <LoginForm />

              {/* Enlace olvidé contraseña */}
              <div className="mt-4 text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Enlace a registro */}
        {!requires2FA && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

export default LoginPage