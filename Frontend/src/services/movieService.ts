import type { Movie, MovieDetail } from '../types/movie'
import { httpClient } from './httpClient'

export interface MoviePayload {
  name: string
  genre: string
  durationMinutes: number
  rating: number
  posterUrl?: string | null
}

export async function getNowShowingMovies(): Promise<Movie[]> {
  const { data } = await httpClient.get<Movie[]>('/api/phim')
  return data
}

/** Lọc phim theo từ khóa (tên hoặc thể loại) và/hoặc thể loại — khớp API `tuKhoa`, `theLoai`. */
export async function listMovies(filters?: { keyword?: string; genre?: string }): Promise<Movie[]> {
  const { data } = await httpClient.get<Movie[]>('/api/phim', {
    params: {
      tuKhoa: filters?.keyword?.trim() || undefined,
      theLoai: filters?.genre?.trim() || undefined,
    },
  })
  return data
}

export async function getMovieById(id: number): Promise<Movie> {
  const { data } = await httpClient.get<Movie>(`/api/phim/${id}`)
  return data
}

export async function getMovieDetail(id: number): Promise<MovieDetail> {
  const { data } = await httpClient.get<MovieDetail>(`/api/phim/${id}/chi-tiet`)
  return data
}

export async function rateMovie(id: number, stars: number): Promise<void> {
  await httpClient.post(`/api/phim/${id}/danh-gia`, { stars })
}

export async function uploadMoviePoster(movieId: number, file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await httpClient.post<{ posterUrl: string }>(`/api/phim/${movieId}/anh-bia`, fd)
  return data.posterUrl
}

export async function createMovie(payload: MoviePayload): Promise<Movie> {
  const { data } = await httpClient.post<Movie>('/api/phim', payload)
  return data
}

export async function updateMovie(id: number, payload: MoviePayload): Promise<Movie> {
  const { data } = await httpClient.put<Movie>(`/api/phim/${id}`, payload)
  return data
}

export async function deleteMovie(id: number): Promise<string> {
  const { data } = await httpClient.delete<{ message: string }>(`/api/phim/${id}`)
  return data.message
}
