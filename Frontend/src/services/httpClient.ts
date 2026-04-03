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
    console.error('[HTTP_ERROR]', {
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
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
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
