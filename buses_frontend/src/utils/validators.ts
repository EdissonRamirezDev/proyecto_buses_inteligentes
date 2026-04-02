export const isStrongPassword = (password: string): boolean => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
  return regex.test(password)
}

export const getPasswordStrength = (
  password: string
): 'débil' | 'media' | 'fuerte' => {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[@$!%*?&]/.test(password)) score++

  if (score <= 2) return 'débil'
  if (score <= 4) return 'media'
  return 'fuerte'
}

export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const isValidCode2FA = (code: string): boolean => {
  return /^\d{6}$/.test(code)
}

export const passwordsMatch = (
  password: string,
  confirm: string
): boolean => {
  return password === confirm
}