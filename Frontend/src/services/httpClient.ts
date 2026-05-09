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

    if (status === 401) {
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('currentUser')
      } catch {

      }

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

    }
  }
  if (token) {

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
