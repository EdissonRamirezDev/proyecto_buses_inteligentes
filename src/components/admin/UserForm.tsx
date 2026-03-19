import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { User } from '../../types/user.types'
import { createUser, updateUser } from '../../controllers/userController'
import Input from '../common/Input'
import Button from '../common/Button'

// Schema de creación — password requerido
const createSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/\d/, 'Debe contener al menos un número')
    .regex(/[@$!%*?&]/, 'Debe contener al menos un carácter especial'),
})

// Schema de edición — password opcional
const updateSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().optional(),
})

type CreateFormData = z.infer<typeof createSchema>
type UpdateFormData = z.infer<typeof updateSchema>
type FormData = CreateFormData | UpdateFormData

interface UserFormProps {
  userToEdit?: User | null
  onSuccess: () => void
  onCancel: () => void
}

/**
 * UserForm maneja la creación y edición de usuarios
 * En creación: password requerido
 * En edición: password opcional — si se deja vacío no se actualiza
 * HU-ENTR-1-002
 */
const UserForm = ({ userToEdit, onSuccess, onCancel }: UserFormProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const isEditing = !!userToEdit

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(isEditing ? updateSchema : createSchema),
  })

  // Precarga datos al editar
  useEffect(() => {
    if (userToEdit) {
      reset({
        name: userToEdit.name,
        email: userToEdit.email,
        password: '',
      })
    } else {
      reset({ name: '', email: '', password: '' })
    }
  }, [userToEdit, reset])

  const onSubmit = async (data: FormData) => {
    setError('')
    setIsLoading(true)

    if (isEditing && userToEdit) {
      // En edición solo enviamos password si el usuario escribió algo
      const updateData: Partial<User> = {
        name: data.name,
        email: data.email,
      }
      if (data.password && data.password.trim() !== '') {
        updateData.password = data.password
      }

      await updateUser(
        userToEdit.id,
        updateData,
        () => {},
        setError,
        () => {
          onSuccess()
          reset()
        }
      )
    } else {
      await createUser(
        {
          name: data.name,
          email: data.email,
          password: data.password,
        },
        () => {},
        setError,
        () => {
          onSuccess()
          reset()
        }
      )
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Nombre */}
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

      {/* Contraseña */}
      <Input
        label={isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
        type={showPassword ? 'text' : 'password'}
        placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'}
        error={errors.password?.message}
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

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  )
}

export default UserForm