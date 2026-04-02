import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import * as permissionService from '../../services/permissionService'
import type { Permission } from '../../types/role.types'
import Input from '../common/Input'
import Button from '../common/Button'

const permissionSchema = z.object({
  url: z
    .string()
    .min(1, 'La URL es requerida')
    .max(100, 'La URL no puede exceder 100 caracteres'),
  method: z
    .string()
    .min(2, 'El método HTTP es requerido (ej: GET, POST)')
    .max(10, 'El método no puede exceder 10 caracteres'),
  model: z
    .string()
    .min(1, 'El modelo/módulo es requerido')
    .max(50, 'El modelo no puede exceder 50 caracteres'),
})

type PermissionFormData = z.infer<typeof permissionSchema>

interface PermissionFormProps {
  permissionToEdit?: Permission | null
  onSuccess: () => void
  onCancel: () => void
}

/**
 * PermissionForm maneja la creación y edición de permisos
 */
const PermissionForm = ({ permissionToEdit, onSuccess, onCancel }: PermissionFormProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const isEditing = !!permissionToEdit

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PermissionFormData>({
    resolver: zodResolver(permissionSchema),
  })

  useEffect(() => {
    if (permissionToEdit) {
      reset({
        url: permissionToEdit.url,
        method: permissionToEdit.method,
        model: permissionToEdit.model,
      })
    } else {
      reset({ url: '', method: '', model: '' })
    }
  }, [permissionToEdit, reset])

  const onSubmit = async (data: PermissionFormData) => {
    setError('')
    setIsLoading(true)

    if (isEditing && permissionToEdit) {
      try {
        await permissionService.updatePermission(permissionToEdit.id, {
          url: data.url,
          method: data.method,
          model: data.model,
        })
        onSuccess()
        reset()
      } catch (err: any) {
        const message = err.response?.data?.message
        setError(message ?? 'Error al actualizar el permiso.')
      }
    } else {
      try {
        await permissionService.createPermission({
          url: data.url,
          method: data.method,
          model: data.model,
        })
        onSuccess()
        reset()
      } catch (err: any) {
        const message = err.response?.data?.message
        setError(message ?? 'Error al crear el permiso.')
      }
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
        label="URL"
        placeholder="Ej: /api/usuarios"
        error={errors.url?.message}
        {...register('url')}
      />

      <Input
        label="Método HTTP"
        placeholder="Ej: GET, POST, PUT, DELETE"
        error={errors.method?.message}
        {...register('method')}
      />

      <Input
        label="Modelo (Módulo)"
        placeholder="Ej: usuarios, roles, buses"
        error={errors.model?.message}
        {...register('model')}
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
          {isEditing ? 'Guardar cambios' : 'Crear permiso'}
        </Button>
      </div>
    </form>
  )
}

export default PermissionForm
