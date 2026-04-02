import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'

/**
 * OAuthCallbackPage maneja el retorno de Microsoft y GitHub
 * después de que el usuario se autenticó en sus plataformas
 * Lee el código y el provider de la URL y los envía al backend
 * HU-ENTR-1-005, HU-ENTR-1-006
 */
const OAuthCallbackPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { handleOAuthLogin } = useAuth()

  // useRef evita que el efecto se ejecute dos veces en StrictMode
  const hasProcessed = useRef(false)

  useEffect(() => {
    if (hasProcessed.current) return
    hasProcessed.current = true

    const processCallback = async () => {
      // Parámetros que vienen en la URL de retorno
      const code = searchParams.get('code')
      const state = searchParams.get('state') // 'github'
      const error = searchParams.get('error')

      // El usuario canceló la autenticación en el proveedor
      if (error || !code || !state) {
        navigate('/login', {
          state: { message: 'Autenticación cancelada' },
        })
        return
      }

      // Validar que el state sea un proveedor conocido
      if (state !== 'microsoft' && state !== 'github') {
        navigate('/login')
        return
      }

      // Enviamos el código al backend para que lo intercambie por un token
      await handleOAuthLogin({
        provider: state,
        token: code,
      })
    }

    processCallback()
  }, [])

  return (
    <LoadingSpinner
      fullScreen
      text="Completando autenticación..."
    />
  )
}

export default OAuthCallbackPage