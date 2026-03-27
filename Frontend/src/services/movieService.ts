import type { Movie } from '../types/movie'
import { httpClient } from './httpClient'

export async function getNowShowingMovies(): Promise<Movie[]> {
  const { data } = await httpClient.get<Movie[]>('/api/phim')
  return data
}
