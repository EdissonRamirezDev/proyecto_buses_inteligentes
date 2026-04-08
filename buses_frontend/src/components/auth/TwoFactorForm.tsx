import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import * as authService from '../../services/authService'
import Button from '../common/Button'

interface TwoFactorFormProps {
  // Email del usuario para mostrar enmascarado en pantalla
  email: string
}

// Tiempo de expiración del código en segundos (10 minutos)
const CODE_EXPIRY_SECONDS = 600

/**
 * TwoFactorForm maneja la verificación del segundo factor
 * Incluye countdown de expiración y reenvío de código
 * HU-ENTR-1-012
 */
const TwoFactorForm = ({ email }: TwoFactorFormProps) => {
  const { handleTwoFactor, error, isLoading, attemptsLeft } = useAuth()

  // Array de 6 dígitos, uno por cada input
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(CODE_EXPIRY_SECONDS)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  // Refs para mover el foco entre inputs automáticamente
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown de expiración del código
  useEffect(() => {
    if (secondsLeft <= 0) return

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [secondsLeft])

  // Formatea los segundos como MM:SS
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Enmascara el email: tucorreo@gmail.com → tu****@gmail.com
  const maskEmail = (email: string): string => {
    const [user, domain] = email.split('@')
    return `${user.slice(0, 2)}****@${domain}`
  }

  const handleInputChange = (index: number, value: string) => {
    // Solo acepta números
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1) // solo el último carácter
    setCode(newCode)

    // Mueve el foco al siguiente input automáticamente
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Al borrar, regresa al input anterior
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = Array(6).fill('')
    pasted.split('').forEach((char, i) => {
      newCode[i] = char
    })
    setCode(newCode)
    // Mueve el foco al último dígito pegado
    inputRefs.current[Math.min(pasted.length - 1, 5)]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) return

    await handleTwoFactor({ email, code: fullCode })
  }

  const handleResend = async () => {
    setIsResending(true)
    setResendSuccess(false)
    try {
      await authService.resendTwoFactorCode(email)
      setSecondsLeft(CODE_EXPIRY_SECONDS)
      setCode(Array(6).fill(''))
      setResendSuccess(true)
      inputRefs.current[0]?.focus()
    } catch {
      // Error silencioso por seguridad
    } finally {
      setIsResending(false)
    }
  }

  const isCodeComplete = code.every((d) => d !== '')

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Instrucciones */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ingresa el código de 6 dígitos enviado a
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
          {maskEmail(email)}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          {attemptsLeft <= 2 && attemptsLeft > 0 && (
            <p className="text-xs text-red-500 mt-1">
              Intentos restantes: {attemptsLeft}
            </p>
          )}
        </div>
      )}

      {/* Inputs de 6 dígitos */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`
              w-11 h-14 text-center text-xl font-bold
              border-2 rounded-lg
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${digit
                ? 'border-blue-500 dark:border-blue-400'
                : 'border-gray-300 dark:border-gray-600'
              }
            `}
          />
        ))}
      </div>

      {/* Countdown de expiración */}
      <div className="text-center">
        {secondsLeft > 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            El código expira en{' '}
            <span className={`font-semibold ${secondsLeft < 60 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
              {formatTime(secondsLeft)}
            </span>
          </p>
        ) : (
          <p className="text-sm text-red-500">El código ha expirado</p>
        )}
      </div>

      {/* Botón submit */}
      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        disabled={!isCodeComplete || secondsLeft <= 0}
      >
        Verificar código
      </Button>

      {/* Reenviar código */}
      <div className="text-center">
        {resendSuccess && (
          <p className="text-xs text-green-600 dark:text-green-400 mb-2">
            Código reenviado exitosamente
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ¿No recibió el código?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-50"
          >
            {isResending ? 'Reenviando...' : 'Revisar spam o reenviar'}
          </button>
        </p>
      </div>
    </form>
  )
}

export default TwoFactorForm