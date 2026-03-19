import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme              // tema actual
  toggleTheme: () => void   // función para cambiar entre light y dark
  isDark: boolean           // atajo para saber si el tema es oscuro
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
})

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * ThemeProvider maneja el tema visual de la app
 * Persiste la preferencia en localStorage
 * Respeta la preferencia del sistema operativo del usuario
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Prioridad: 1. Lo que el usuario eligió antes
    //            2. Preferencia del sistema operativo
    //            3. Light por defecto
    const stored = localStorage.getItem('buses_theme') as Theme
    if (stored) return stored

    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
    return prefersDark ? 'dark' : 'light'
  })

  useEffect(() => {
    // Aplica el tema al elemento raíz del HTML
    // Tailwind usa la clase 'dark' en el <html> para el modo oscuro
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Persiste la preferencia del usuario
    localStorage.setItem('buses_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, isDark: theme === 'dark' }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook para consumir el ThemeContext
 * Uso: const { isDark, toggleTheme } = useTheme()
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider')
  }
  return context
}