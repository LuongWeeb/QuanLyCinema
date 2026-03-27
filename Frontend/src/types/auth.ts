export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  username: string
  role: string
}

export interface ApiErrorDetail {
  status?: number
  message: string
  code?: string
}
