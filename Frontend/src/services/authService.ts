import { httpClient } from './httpClient'
import type {
  AssignUserRoleRequest,
  CreateUserRequest,
  LoginRequest,
  LoginResponse,
  PagedUsersResponse,
  RegisterRequest,
  UpdateUserStatusRequest,
  UpdateUserRequest,
  UserManagementQuery,
} from '../types/auth'

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await httpClient.post<LoginResponse>(
    '/api/xac-thuc/dang-nhap',
    {
      username: payload.username,
      password: payload.password,
    },
  )

  return data
}

export async function register(payload: RegisterRequest): Promise<string> {
  const { data } = await httpClient.post<{ message: string }>('/api/xac-thuc/dang-ky', {
    username: payload.username,
    password: payload.password,
    fullName: payload.fullName,
  })
  return data.message
}

export async function getUsersWithRoles(query: UserManagementQuery): Promise<PagedUsersResponse> {
  const { data } = await httpClient.get<PagedUsersResponse>('/api/xac-thuc/nguoi-dung-vai-tro', {
    params: query,
  })
  return data
}

export async function assignRole(payload: AssignUserRoleRequest): Promise<string> {
  const { data } = await httpClient.post<{ message: string }>('/api/xac-thuc/gan-vai-tro', payload)
  return data.message
}

export async function removeRole(payload: AssignUserRoleRequest): Promise<string> {
  const { data } = await httpClient.post<{ message: string }>('/api/xac-thuc/go-vai-tro', payload)
  return data.message
}

export async function createUser(payload: CreateUserRequest): Promise<string> {
  const { data } = await httpClient.post<{ message: string }>('/api/xac-thuc/quan-ly-nguoi-dung/tao', payload)
  return data.message
}

export async function updateUser(payload: UpdateUserRequest): Promise<string> {
  const { data } = await httpClient.put<{ message: string }>(
    '/api/xac-thuc/quan-ly-nguoi-dung/cap-nhat',
    payload,
  )
  return data.message
}

export async function deleteUser(userId: number): Promise<string> {
  const { data } = await httpClient.delete<{ message: string }>(`/api/xac-thuc/quan-ly-nguoi-dung/${userId}`)
  return data.message
}

export async function updateUserStatus(payload: UpdateUserStatusRequest): Promise<string> {
  const { data } = await httpClient.put<{ message: string }>(
    '/api/xac-thuc/quan-ly-nguoi-dung/cap-nhat-trang-thai',
    payload,
  )
  return data.message
}
