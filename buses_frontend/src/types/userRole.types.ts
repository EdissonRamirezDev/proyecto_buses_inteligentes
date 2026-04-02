import type { User } from './user.types'
import type { Role } from './role.types'

// Coincide exactamente con UserRole.java del backend
export interface UserRole {
  id: string
  user: User
  role: Role
}

export interface CreateUserRoleRequest {
  userId: string
  roleId: string
}