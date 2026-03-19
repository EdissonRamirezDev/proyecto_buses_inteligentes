import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // Variante visual del botón
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  // Tamaño del botón
  size?: 'sm' | 'md' | 'lg'
  // Muestra spinner y deshabilita el botón mientras carga
  isLoading?: boolean
  // Icono opcional a la izquierda del texto
  leftIcon?: ReactNode
  // Icono opcional a la derecha del texto
  rightIcon?: ReactNode
  // Ocupa todo el ancho del contenedor
  fullWidth?: boolean
  children: ReactNode
}

/**
 * Button es el componente base de botones de la app
 * Extiende los atributos nativos del botón HTML
 * Se usa en todos los formularios y acciones del sistema
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...rest
}: ButtonProps) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  const variants = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700 active:bg-blue-800
      focus:ring-blue-500
      dark:bg-blue-500 dark:hover:bg-blue-600
    `,
    secondary: `
      bg-gray-100 text-gray-700
      hover:bg-gray-200 active:bg-gray-300
      focus:ring-gray-400
      dark:bg-gray-700 dark:text-gray-200
      dark:hover:bg-gray-600
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700 active:bg-red-800
      focus:ring-red-500
      dark:bg-red-500 dark:hover:bg-red-600
    `,
    ghost: `
      bg-transparent text-gray-700
      hover:bg-gray-100 active:bg-gray-200
      focus:ring-gray-400
      dark:text-gray-200 dark:hover:bg-gray-800
    `,
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...rest}
    >
      {/* Muestra spinner en lugar del icono izquierdo cuando carga */}
      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}

      {children}

      {rightIcon && !isLoading && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  )
}

export default Button