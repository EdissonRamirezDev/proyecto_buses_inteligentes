import type { Role } from './role.types'

// Coincide exactamente con User.java del backend
export interface User {
  id: string
  name: string
  email: string
  password?: string
  roles?: Role[]  // construido en el frontend via /user-role
}

// Coincide exactamente con UserRole.java del backend
export interface UserRole {
  id: string
  user: User
  role: Role
}

export interface AssignRoleRequest {
  userId: string
  roleIds: string[]
}

export interface UpdatePermissionRequest {
  roleId: string
  permissionIds: string[]
}