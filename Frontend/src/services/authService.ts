import { httpClient } from './httpClient'
import type { LoginRequest, LoginResponse } from '../types/auth'

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
