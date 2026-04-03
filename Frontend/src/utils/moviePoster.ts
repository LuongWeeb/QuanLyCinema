/** Gốc API để ghép đường dẫn ảnh tĩnh (poster upload lên server). */
export const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') || 'https://localhost:7194'

export function resolveUploadedPosterUrl(posterUrl: string | null | undefined): string | null {
  if (!posterUrl?.trim()) return null
  const u = posterUrl.trim()
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  const path = u.startsWith('/') ? u : `/${u}`
  return `${API_ORIGIN}${path}`
}
