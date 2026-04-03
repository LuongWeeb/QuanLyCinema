import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'https://localhost:7194'

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    // Token hết hạn / không hợp lệ -> xóa phiên để user login lại.
    if (status === 401) {
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('currentUser')
      } catch {
        // ignore
      }
      // Không reload toàn trang để tránh loop khi đang login/refresh dữ liệu.
      // App sẽ tự render lại khi `currentUser` bị xoá.
    }
    console.error('[HTTP_ERROR]', {
      url: error?.config?.url,
      method: error?.config?.method,
      status,
      data: error?.response?.data,
      message: error?.message,
    })
    return Promise.reject(error)
  },
)

httpClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    delete (config.headers as Record<string, unknown>)['Content-Type']
  }
  let token = localStorage.getItem('token')
  // Fallback: một số luồng đăng nhập (ví dụ hydrate qua Recoil) có thể chỉ lưu `currentUser`
  // mà chưa set key `token`. Khi đó, lấy `accessToken` từ `currentUser` để vẫn gửi Authorization.
  if (!token) {
    try {
      const raw = localStorage.getItem('currentUser')
      if (raw) {
        const u = JSON.parse(raw) as { accessToken?: string }
        if (u?.accessToken) {
          token = u.accessToken
          localStorage.setItem('token', token)
        }
      }
    } catch {
      // Ignore JSON parse errors and just send request without token.
    }
  }
  if (token) {
    // axios v1 có thể dùng AxiosHeaders (có method .set), nên không nên chỉ gán property.
    config.headers = config.headers ?? {}
    const headersAny = config.headers as any
    if (typeof headersAny.set === 'function') {
      headersAny.set('Authorization', `Bearer ${token}`)
    } else {
      headersAny.Authorization = `Bearer ${token}`
    }
  }
  return config
})
