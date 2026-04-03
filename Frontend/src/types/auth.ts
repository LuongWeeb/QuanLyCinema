export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  fullName: string
}

export interface LoginResponse {
  accessToken: string
  username: string
  role: string
}

export interface UserRoleItem {
  roleId: number
  roleName: string
}

export interface UserWithRolesResponse {
  userId: number
  username: string
  fullName: string
  createdAt: string
  accountStatus: string
  roles: UserRoleItem[]
}

export interface UserManagementQuery {
  page: number
  pageSize: number
  keyword?: string
  role?: string
}

export interface PagedUsersResponse {
  page: number
  pageSize: number
  total: number
  items: UserWithRolesResponse[]
}

export interface AssignUserRoleRequest {
  userId: number
  roleName: string
}

export interface CreateUserRequest {
  username: string
  password: string
  fullName: string
  roles?: string[]
}

export interface UpdateUserRequest {
  userId: number
  username: string
  fullName: string
  password?: string
}

export interface UpdateUserStatusRequest {
  userId: number
  status: 'active' | 'locked'
}

export interface ApiErrorDetail {
  status?: number
  message: string
  code?: string
}

export interface CustomerLookup {
  userId: number
  username: string
  fullName: string
}
