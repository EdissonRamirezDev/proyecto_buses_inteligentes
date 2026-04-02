import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useAuth } from '../../hooks/useAuth'
import Input from '../common/Input'
import Button from '../common/Button'
import type { LoginRequest } from '../../types/auth.types'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
})

type LoginFormData = z.infer<typeof loginSchema>

/**
 * LoginForm maneja el formulario de inicio de sesión
 * Usa reCAPTCHA v3 invisible — se ejecuta automáticamente al enviar
 * sin ninguna interacción del usuario
 * HU-ENTR-1-008, HU-ENTR-1-010
 */
const LoginForm = () => {
  const { handleLogin, error, isLoading } = useAuth()
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    // Verificar que reCAPTCHA v3 esté listo
    if (!executeRecaptcha) {
      console.error('reCAPTCHA no está listo')
      return
    }

    // Se ejecuta de forma invisible — no requiere interacción del usuario
    // 'login' es la acción que identifica este evento en el panel de reCAPTCHA
    const recaptchaToken = await executeRecaptcha('login')

    const loginData: LoginRequest = {
      ...data,
      recaptchaToken,
    }

    await handleLogin(loginData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Error general del formulario */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Campo email */}
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

      {/* Campo contraseña con toggle de visibilidad */}
      <Input
        label="Contraseña"
        type={showPassword ? 'text' : 'password'}
        placeholder="Tu contraseña"
        error={errors.password?.message}
        leftIcon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        }
        {...register('password')}
      />

      {/* Botón de submit — reCAPTCHA v3 se ejecuta automáticamente aquí */}
      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        disabled={!executeRecaptcha}
      >
        Iniciar sesión
      </Button>

      {/* Aviso legal requerido por Google para reCAPTCHA v3 invisible */}
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
    </form>
  )
}

export default LoginForm