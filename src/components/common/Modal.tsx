import { type ReactNode, useEffect } from 'react'
import Button from './Button'

interface ModalProps {
  // Controla si el modal está visible
  isOpen: boolean
  // Función que cierra el modal
  onClose: () => void
  // Título del modal
  title: string
  // Contenido del modal
  children: ReactNode
  // Botón de acción principal (opcional)
  confirmLabel?: string
  // Acción del botón principal
  onConfirm?: () => void
  // Variante del botón de confirmación
  confirmVariant?: 'primary' | 'danger'
  // Estado de carga del botón de confirmación
  isConfirmLoading?: boolean
  // Tamaño del modal
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Modal es el componente de diálogo reutilizable
 * Se usa para confirmaciones, formularios y alertas
 * Cierra con ESC o haciendo clic fuera del contenido
 *
 * Uso:
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Eliminar rol"
 *   confirmLabel="Eliminar"
 *   confirmVariant="danger"
 *   onConfirm={handleDelete}
 * >
 *   ¿Estás seguro de eliminar este rol?
 * </Modal>
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel,
  onConfirm,
  confirmVariant = 'primary',
  isConfirmLoading = false,
  size = 'md',
}: ModalProps) => {
  // Cierra el modal con la tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Bloquea el scroll del body mientras el modal está abierto
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  return (
    // Overlay oscuro detrás del modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Contenido del modal — detiene la propagación para no cerrar al hacer clic adentro */}
      <div
        className={`
          w-full ${sizes[size]} bg-white dark:bg-gray-800
          rounded-xl shadow-xl
          animate-in fade-in zoom-in-95 duration-200
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            {/* Icono X */}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer — solo si hay botón de confirmación */}
        {confirmLabel && onConfirm && (
          <div className="flex items-center justify-end gap-3 px-6 pb-6">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isConfirmLoading}
            >
              Cancelar
            </Button>
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              isLoading={isConfirmLoading}
            >
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal