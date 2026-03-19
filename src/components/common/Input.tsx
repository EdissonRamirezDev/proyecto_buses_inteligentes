import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // Etiqueta visible encima del input
  label?: string
  // Mensaje de error debajo del input
  error?: string
  // Texto de ayuda debajo del input
  hint?: string
  // Icono a la izquierda dentro del input
  leftIcon?: ReactNode
  // Elemento a la derecha dentro del input (ej: botón mostrar contraseña)
  rightElement?: ReactNode
  // Ocupa todo el ancho del contenedor
  fullWidth?: boolean
}

/**
 * Input es el componente base de campos de texto
 * Usa forwardRef para que react-hook-form pueda acceder al elemento DOM
 * Se usa en todos los formularios del sistema
 *
 * Uso con react-hook-form:
 * <Input
 *   label="Email"
 *   error={errors.email?.message}
 *   {...register('email')}
 * />
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightElement,
      fullWidth = true,
      className = '',
      id,
      ...rest
    },
    ref
  ) => {
    const inputId = id ?? rest.name

    const baseInputStyles = `
      block rounded-lg border bg-white px-3 py-2 text-sm
      text-gray-900 placeholder-gray-400
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:bg-gray-50 disabled:cursor-not-allowed
      dark:bg-gray-800 dark:text-gray-100
      dark:placeholder-gray-500
    `

    const stateStyles = error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-500'
      : `border-gray-300 focus:border-blue-500 focus:ring-blue-500
         dark:border-gray-600 dark:focus:border-blue-400`

    const paddingStyles = `
      ${leftIcon ? 'pl-10' : ''}
      ${rightElement ? 'pr-10' : ''}
    `

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}

        {/* Contenedor del input con iconos */}
        <div className="relative">
          {/* Icono izquierdo */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              ${baseInputStyles}
              ${stateStyles}
              ${paddingStyles}
              ${className}
            `}
            {...rest}
          />

          {/* Elemento derecho (ej: botón de mostrar/ocultar contraseña) */}
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>

        {/* Mensaje de error */}
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Texto de ayuda (solo si no hay error) */}
        {hint && !error && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input