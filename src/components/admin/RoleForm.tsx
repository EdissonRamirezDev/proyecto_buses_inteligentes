import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRole, updateRole } from '../../controllers/roleController'
import type { Role } from '../../types/role.types'
import Input from '../common/Input'
import Button from '../common/Button'

const roleSchema = z.object({
  name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(200, 'La descripción no puede exceder 200 caracteres'),
})

type RoleFormData = z.infer<typeof roleSchema>

interface RoleFormProps {
  roleToEdit?: Role | null
  onSuccess: () => void
  onCancel: () => void
}

/**
 * RoleForm maneja la creación y edición de roles
 * Usa name y description — coincide con Role.java del backend
 * HU-ENTR-1-001
 */
const RoleForm = ({ roleToEdit, onSuccess, onCancel }: RoleFormProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const isEditing = !!roleToEdit

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  })

  useEffect(() => {
    if (roleToEdit) {
      reset({
        name: roleToEdit.name,
        description: roleToEdit.description,
      })
    } else {
      reset({ name: '', description: '' })
    }
  }, [roleToEdit, reset])

  const onSubmit = async (data: RoleFormData) => {
    setError('')
    setIsLoading(true)

    if (isEditing && roleToEdit) {
      await updateRole(
        roleToEdit.id,
        data.name,
        data.description,
        () => {},
        setError,
        () => {
          onSuccess()
          reset()
        }
      )
    } else {
      await createRole(
        data.name,
        data.description,
        [],
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <Input
        label="Nombre del rol"
        placeholder="Ej: Supervisor de rutas"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Descripción"
        placeholder="Describe las responsabilidades de este rol"
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Guardar cambios' : 'Crear rol'}
        </Button>
      </div>
    </form>
  )
}

export default RoleForm