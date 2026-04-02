import { useLocation, Navigate } from 'react-router-dom'
import TwoFactorForm from '../../components/auth/TwoFactorForm'

/**
 * TwoFactorPage es la página standalone de verificación 2FA
 * Recibe el email desde el state de navegación
 * Si no hay email redirige al login
 * HU-ENTR-1-012
 */
const TwoFactorPage = () => {
  const location = useLocation()

  // El email viene en el state cuando LoginPage redirige aquí
  const email = location.state?.email as string | undefined

  // Si alguien entra directamente sin email, lo mandamos al login
  if (!email) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Verificación en dos pasos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ingresa el código enviado a tu email
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <TwoFactorForm email={email} />
        </div>
      </div>
    </div>
  )
}

export default TwoFactorPage