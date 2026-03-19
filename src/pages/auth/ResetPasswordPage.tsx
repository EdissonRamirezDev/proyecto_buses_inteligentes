import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getPasswordStrength } from '../../utils/validators'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/\d/, 'Debe contener al menos un número')
      .regex(/[@$!%*?&]/, 'Debe contener al menos un carácter especial'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type ResetFormData = z.infer<typeof resetSchema>

/**
 * ResetPasswordPage maneja el restablecimiento de contraseña
 * Lee el token de la URL (viene del email de recuperación)
 * HU-ENTR-1-013
 */
const ResetPasswordPage = () => {
  const { handleResetPassword, error, isLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')

  // Token que viene en la URL del email de recuperación
  const token = searchParams.get('token') ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetFormData) => {
    await handleResetPassword({
      token,
      password: data.password,
      confirmPassword: data.confirmPassword,
    })
  }

  const strength = getPasswordStrength(passwordValue)
  const strengthConfig = {
    débil: { width: 'w-1/3', color: 'bg-red-500', label: 'Débil' },
    media: { width: 'w-2/3', color: 'bg-yellow-500', label: 'Media' },
    fuerte: { width: 'w-full', color: 'bg-green-500', label: 'Fuerte' },
  }
  const strengthInfo = strengthConfig[strength]

  // Si no hay token en la URL el enlace es inválido
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            El enlace de recuperación es inválido o ha expirado.
          </p>
          <Link
            to="/forgot-password"
            className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Nueva contraseña
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Elige una contraseña segura
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Nueva contraseña con indicador de fortaleza */}
            <div className="flex flex-col gap-1">
              <Input
                label="Nueva contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                error={errors.password?.message}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                }
                {...register('password', {
                  onChange: (e) => setPasswordValue(e.target.value),
                })}
              />

              {/* Indicador de fortaleza */}
              {passwordValue && (
                <div className="flex flex-col gap-1">
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strengthInfo.width} ${strengthInfo.color}`} />
                  </div>
                  <p className={`text-xs font-medium ${
                    strength === 'débil' ? 'text-red-500' :
                    strength === 'media' ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    Contraseña {strengthInfo.label}
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Confirmar contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repite tu contraseña"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" fullWidth isLoading={isLoading}>
              Restablecer contraseña
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage