import type { Showtime } from '../types/showtime'
import { httpClient } from './httpClient'

export async function listShowtimes(movieId?: number): Promise<Showtime[]> {
  const { data } = await httpClient.get<Showtime[]>('/api/lich-chieu', {
    params: movieId != null ? { phimId: movieId } : undefined,
  })
  return data
}

export async function createShowtime(body: {
  movieId: number
  auditoriumId: number
  startTime: string
  price: number
}): Promise<Showtime> {
  const { data } = await httpClient.post<Showtime>('/api/lich-chieu', body)
  return data
}

export async function updateShowtime(
  id: number,
  body: { movieId: number; auditoriumId: number; startTime: string; price: number },
): Promise<Showtime> {
  const { data } = await httpClient.put<Showtime>(`/api/lich-chieu/${id}`, body)
  return data
}

export async function deleteShowtime(id: number): Promise<string> {
  const { data } = await httpClient.delete<{ message: string }>(`/api/lich-chieu/${id}`)
  return data.message
}

export type SeatMapItem = { id: number; seatCode: string; status: number; isVip?: boolean }

export async function getSeatMap(showtimeId: number): Promise<SeatMapItem[]> {
  const { data } = await httpClient.get<SeatMapItem[]>(`/api/lich-chieu/${showtimeId}/so-do-ghe`)
  return data
}
