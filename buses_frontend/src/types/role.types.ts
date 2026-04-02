// Coincide exactamente con Role.java del backend
export interface Role {
  id: string
  name: string
  description: string
}

// Coincide exactamente con Permission.java del backend
export interface Permission {
  id: string
  url: string
  method: string
  model: string
}

// Coincide exactamente con RolePermission.java del backend
export interface RolePermission {
  id: string
  role: Role
  permission: Permission
}

export interface CreateRoleRequest {
  name: string
  description: string
}

export interface UpdateRoleRequest {
  id: string
  name?: string
  description?: string
}