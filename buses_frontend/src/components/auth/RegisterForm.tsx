import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../hooks/useAuth'
import { getPasswordStrength } from '../../utils/validators'
import Input from '../common/Input'
import Button from '../common/Button'

// El backend solo tiene name, email, password
const registerSchema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z
      .string()
      .min(1, 'El email es requerido')
      .email('Ingresa un email válido'),
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

type RegisterFormData = z.infer<typeof registerSchema>

/**
 * RegisterForm maneja el formulario de registro
 * Campos: name, email, password — coincide con User.java del backend
 * HU-ENTR-1-007
 */
const RegisterForm = () => {
  const { handleRegister, error, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    await handleRegister(data)
  }

  const strength = getPasswordStrength(passwordValue)
  const strengthConfig = {
    débil: { width: 'w-1/3', color: 'bg-red-500', label: 'Débil' },
    media: { width: 'w-2/3', color: 'bg-yellow-500', label: 'Media' },
    fuerte: { width: 'w-full', color: 'bg-green-500', label: 'Fuerte' },
  }
  const strengthInfo = strengthConfig[strength]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Nombre completo */}
      <Input
        label="Nombre completo"
        placeholder="Juan Pérez"
        error={errors.name?.message}
        {...register('name')}
      />

      {/* Email */}
      <Input
        label="Email"
        type="email"
        placeholder="tucorreo@ejemplo.com"
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Contraseña con indicador de fortaleza */}
      <div className="flex flex-col gap-1">
        <Input
          label="Contraseña"
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

        {/* Indicador de fortaleza — HU-ENTR-1-007 */}
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

      {/* Confirmar contraseña */}
      <Input
        label="Confirmar contraseña"
        type={showConfirmPassword ? 'text' : 'password'}
        placeholder="Repite tu contraseña"
        error={errors.confirmPassword?.message}
        rightElement={
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        }
        {...register('confirmPassword')}
      />

      <Button type="submit" fullWidth isLoading={isLoading}>
        Crear cuenta
      </Button>
    </form>
  )
}

export default RegisterForm