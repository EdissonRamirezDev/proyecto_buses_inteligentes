import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// Pages - Auth
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import TwoFactorPage from '../pages/auth/TwoFactorPage'
import OAuthCallbackPage from '../pages/auth/OAuthCallbackPage'
import CompleteProfilePage from '../pages/auth/CompleteProfilePage'

// Pages - Admin
import DashboardPage from '../pages/admin/DashboardPage'
import ProfilePage from '../pages/admin/ProfilePage'
import RolesPage from '../pages/admin/RolesPage'
import PermissionsPage from '../pages/admin/PermissionsPage'
import UsersPage from '../pages/admin/UsersPage'
import UserRolesPage from '../pages/admin/UserRolesPage'

import BusesPage from '../pages/admin/BusesPage'
import DriversPage from '../pages/admin/DriversPage'
import ShiftsPage from '../pages/admin/ShiftsPage'

// Pages - Errors
import NotFoundPage from '../pages/errors/NotFoundPage'
import ForbiddenPage from '../pages/errors/ForbiddenPage'

const AppRouter = () => {
  return (
    <Routes>
      {/* ── Rutas públicas ── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/2fa" element={<TwoFactorPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

      {/* ── Rutas protegidas: cualquier usuario autenticado ── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/admin/roles" element={<RolesPage />} />
        <Route path="/admin/permissions" element={<PermissionsPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/user-roles" element={<UserRolesPage />} />
        
        {/* Nuevas Rutas de Lógica */}
        <Route path="/admin/buses" element={<BusesPage />} />
        <Route path="/admin/drivers" element={<DriversPage />} />
        <Route path="/admin/shifts" element={<ShiftsPage />} />
      </Route>

      {/* ── Rutas de error ── */}
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="/404" element={<NotFoundPage />} />

      {/* Redirige la raíz al dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Cualquier ruta no definida va al 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default AppRouter