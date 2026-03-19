import { useAuthStore } from '../store'
import { MODULES } from '../utils/constants'

/**
 * usePermissions es el hook especializado en control de acceso
 * Se usa en componentes que necesitan mostrar u ocultar
 * elementos según los permisos del usuario autenticado
 *
 * Uso: const { canCreate, canDelete } = usePermissions('gestión de roles')
 */
export const usePermissions = (modulo: string) => {
  const hasPermission = useAuthStore((state) => state.hasPermission)

  return {
    // Verificaciones granulares por acción
    canRead: hasPermission(modulo, 'lectura'),
    canCreate: hasPermission(modulo, 'escritura'),
    canEdit: hasPermission(modulo, 'edicion'),
    canDelete: hasPermission(modulo, 'eliminacion'),

    // Atajo para verificar si tiene algún acceso al módulo
    hasAnyAccess:
      hasPermission(modulo, 'lectura') ||
      hasPermission(modulo, 'escritura') ||
      hasPermission(modulo, 'edicion') ||
      hasPermission(modulo, 'eliminacion'),
  }
}

/**
 * useRoleCheck verifica roles específicos del usuario
 * Se usa principalmente en ProtectedRoute y en
 * componentes que renderizan contenido diferente por rol
 *
 * Uso: const { isAdmin, isConductor } = useRoleCheck()
 */
export const useRoleCheck = () => {
  const hasRole = useAuthStore((state) => state.hasRole)

  return {
    isAdminSistema: hasRole('Administrador Sistema'),
    isAdminEmpresa: hasRole('Administrador Empresa'),
    isSupervisor: hasRole('Supervisor'),
    isConductor: hasRole('Conductor'),
    isCiudadano: hasRole('Ciudadano'),
    isAnyAdmin:
      hasRole('Administrador Sistema') ||
      hasRole('Administrador Empresa'),
  }
}

/**
 * useModuleAccess verifica acceso a todos los módulos del sistema
 * Útil para construir menús de navegación dinámicos
 * que solo muestran las opciones disponibles para el usuario
 *
 * Uso: const moduleAccess = useModuleAccess()
 *      if (moduleAccess.usuarios.canCreate) { ... }
 */
export const useModuleAccess = () => {
  const hasPermission = useAuthStore((state) => state.hasPermission)

  const checkModule = (modulo: string) => ({
    canRead: hasPermission(modulo, 'lectura'),
    canCreate: hasPermission(modulo, 'escritura'),
    canEdit: hasPermission(modulo, 'edicion'),
    canDelete: hasPermission(modulo, 'eliminacion'),
  })

  return {
    usuarios: checkModule(MODULES.USUARIOS),
    buses: checkModule(MODULES.BUSES),
    rutas: checkModule(MODULES.RUTAS),
    programaciones: checkModule(MODULES.PROGRAMACIONES),
    reportes: checkModule(MODULES.REPORTES),
    incidentes: checkModule(MODULES.INCIDENTES),
    mensajes: checkModule(MODULES.MENSAJES),
  }
}