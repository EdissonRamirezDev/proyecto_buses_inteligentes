import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../store'
import * as authService from '../../services/authService'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

const completeProfileSchema = z.object({
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  phone: z.string().optional(),
})

type CompleteProfileData = z.infer<typeof completeProfileSchema>

/**
 * CompleteProfilePage forces citizens to provide their address
 * before they can access the rest of the application.
 * This page is shown after login if the user has the "Ciudadano" role
 * and profileComplete === false.
 */
const CompleteProfilePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const setUser = useAuthStore((state) => state.setUser)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteProfileData>({
    resolver: zodResolver(completeProfileSchema),
  })

  const onSubmit = async (data: CompleteProfileData) => {
    if (!user) return
    setError('')
    setLoading(true)

    try {
      const result = await authService.completeProfile(user.id, {
        address: data.address,
        phone: data.phone || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        // Update user in store to reflect profile completion
        setUser({ ...user, profileComplete: true })
        navigate('/dashboard', { replace: true })
      }
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Error al completar el perfil'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">

        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Completa tu perfil
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Necesitamos información adicional para continuar
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">

          {/* Info banner */}
          <div className="mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Hola, {user?.name}.</strong> Como ciudadano registrado, necesitamos
              tu dirección para poder brindarte un mejor servicio de transporte.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Dirección */}
            <Input
              label="Dirección *"
              placeholder="Calle 123, Barrio, Ciudad"
              error={errors.address?.message}
              {...register('address')}
            />

            {/* Teléfono (opcional) */}
            <Input
              label="Teléfono (opcional)"
              placeholder="+57 300 123 4567"
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Button type="submit" fullWidth isLoading={loading}>
              Guardar y continuar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CompleteProfilePage
