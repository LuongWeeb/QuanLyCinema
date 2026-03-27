import axios from 'axios'
import type { ApiErrorDetail } from '../types/auth'

export function mapApiError(error: unknown): ApiErrorDetail {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data as
      | { message?: string; title?: string; code?: string }
      | undefined

    const apiMessage = data?.message || data?.title
    if (apiMessage) {
      return {
        status,
        message: apiMessage,
        code: data?.code,
      }
    }

    if (status === 401) {
      return {
        status,
        message: 'Sai tài khoản hoặc mật khẩu.',
      }
    }

    if (status === 0 || error.code === 'ERR_NETWORK') {
      return {
        status,
        message:
          'Không kết nối được backend. Kiểm tra API đang chạy và VITE_API_BASE_URL.',
        code: error.code,
      }
    }

    return {
      status,
      message: error.message || 'Lỗi không xác định từ server.',
      code: error.code,
    }
  }

  return {
    message: 'Đã xảy ra lỗi không xác định.',
  }
}
