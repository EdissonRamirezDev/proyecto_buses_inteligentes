import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
})

type ForgotFormData = z.infer<typeof forgotSchema>

/**
 * ForgotPasswordPage maneja la solicitud de recuperación de contraseña
 * Usa reCAPTCHA v3 invisible — se ejecuta automáticamente al enviar
 * Por seguridad siempre muestra mensaje de éxito (HU-ENTR-1-013)
 * HU-ENTR-1-011
 */
const ForgotPasswordPage = () => {
  const { handleForgotPassword, forgotPasswordSuccess, isLoading } = useAuth()
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [localError, setLocalError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotFormData) => {
    setLocalError('')

    if (!executeRecaptcha) {
      setLocalError('reCAPTCHA no está listo. Intenta de nuevo.')
      return
    }

    // Se ejecuta invisible — 'forgot_password' identifica la acción en el panel
    const recaptchaToken = await executeRecaptcha('forgot_password')

    await handleForgotPassword({
      email: data.email,
      recaptchaToken,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">

        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Te enviaremos instrucciones a tu email
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">

          {/* Estado de éxito */}
          {forgotPasswordSuccess ? (
            <div className="text-center flex flex-col gap-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Revisa tu email
                </p>
                {/* Mensaje genérico por seguridad — HU-ENTR-1-013 */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Si el email existe en el sistema, recibirás instrucciones de recuperación en los próximos minutos.
                </p>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                ¿No llegó? Revisa tu carpeta de spam
              </p>
              <Link
                to="/login"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

              {localError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{localError}</p>
                </div>
              )}

              <Input
                label="Email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                error={errors.email?.message}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
                {...register('email')}
              />

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                disabled={!executeRecaptcha}
              >
                Enviar instrucciones
              </Button>

              {/* Aviso legal requerido por Google para reCAPTCHA v3 */}
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                Protegido por reCAPTCHA —{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="hover:underline">
                  Privacidad
                </a>{' '}
                y{' '}
                <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="hover:underline">
                  Términos
                </a>
              </p>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Volver al login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage