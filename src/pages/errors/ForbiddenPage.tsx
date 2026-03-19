import { Link } from 'react-router-dom'
import Button from '../../components/common/Button'

/**
 * ForbiddenPage se muestra cuando el usuario no tiene
 * permisos para acceder a una ruta (error 403)
 * HU-ENTR-1-009
 */
const ForbiddenPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-red-500 dark:text-red-400">
          403
        </p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Acceso denegado
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          No tienes permisos para acceder a esta sección.
        </p>
        <div className="mt-8">
          <Link to="/dashboard">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForbiddenPage