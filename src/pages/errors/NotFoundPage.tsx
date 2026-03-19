import { Link } from 'react-router-dom'
import Button from '../../components/common/Button'

/**
 * NotFoundPage se muestra cuando la ruta no existe
 */
const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-blue-600 dark:text-blue-400">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Página no encontrada
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          La página que buscas no existe o fue movida.
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

export default NotFoundPage