interface LoadingSpinnerProps {
  // Tamaño del spinner
  size?: 'sm' | 'md' | 'lg'
  // Texto opcional debajo del spinner
  text?: string
  // Si ocupa toda la pantalla o solo su contenedor
  fullScreen?: boolean
}

/**
 * LoadingSpinner muestra un indicador de carga
 * Se usa en:
 * - ProtectedRoute mientras verifica la sesión
 * - Botones mientras se procesa una petición
 * - Páginas mientras cargan sus datos
 */
const LoadingSpinner = ({
  size = 'md',
  text,
  fullScreen = false,
}: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-2',
    lg: 'h-16 w-16 border-4',
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`
          animate-spin rounded-full border-gray-200
          border-t-blue-600 ${sizes[size]}
        `}
      />
      {text && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner