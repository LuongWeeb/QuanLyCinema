import type { Auditorium, AuditoriumListItem, Seat } from '../types/auditorium'
import { httpClient } from './httpClient'

export async function listAuditoriums(): Promise<AuditoriumListItem[]> {
  const { data } = await httpClient.get<AuditoriumListItem[]>('/api/phong-chieu/danh-sach')
  return data
}

export async function getAuditorium(id: number): Promise<Auditorium> {
  const { data } = await httpClient.get<Auditorium>(`/api/phong-chieu/${id}`)
  return data
}

export async function createAuditorium(body: {
  name: string
  capacity: number
  seatCodes: string[]
}): Promise<{ id: number; name: string; seats: number }> {
  const { data } = await httpClient.post('/api/phong-chieu', body)
  return data
}

export async function updateAuditorium(
  id: number,
  body: { name: string; capacity: number },
): Promise<Auditorium> {
  const { data } = await httpClient.put<Auditorium>(`/api/phong-chieu/${id}`, body)
  return data
}

export async function deleteAuditorium(id: number): Promise<string> {
  const { data } = await httpClient.delete<{ message: string }>(`/api/phong-chieu/${id}`)
  return data.message
}

export async function listSeats(auditoriumId: number): Promise<Seat[]> {
  const { data } = await httpClient.get<Seat[]>(`/api/phong-chieu/${auditoriumId}/ghe`)
  return data
}

export async function addSeat(
  auditoriumId: number,
  seatCode: string,
  isVip = false,
): Promise<Seat> {
  const { data } = await httpClient.post<Seat>(`/api/phong-chieu/${auditoriumId}/ghe`, {
    seatCode,
    isVip,
  })
  return data
}

export async function addSeatsByRow(
  auditoriumId: number,
  body: { rowIndex: number; startNumber: number; count: number; isVip: boolean },
): Promise<{ added: number; codes: string[] }> {
  const { data } = await httpClient.post<{ added: number; codes: string[] }>(
    `/api/phong-chieu/${auditoriumId}/ghe/theo-hang`,
    {
      rowIndex: body.rowIndex,
      startNumber: body.startNumber,
      count: body.count,
      isVip: body.isVip,
    },
  )
  return data
}

export async function bulkSetSeatVip(
  auditoriumId: number,
  seatIds: number[],
  isVip: boolean,
): Promise<number> {
  const { data } = await httpClient.put<{ updated: number }>(
    `/api/phong-chieu/${auditoriumId}/ghe/vip`,
    { seatIds, isVip },
  )
  return data.updated
}

export async function updateSeat(
  auditoriumId: number,
  seatId: number,
  seatCode: string,
  isVip: boolean,
): Promise<Seat> {
  const { data } = await httpClient.put<Seat>(
    `/api/phong-chieu/${auditoriumId}/ghe/${seatId}`,
    { seatCode, isVip },
  )
  return data
}

export async function deleteSeat(auditoriumId: number, seatId: number): Promise<string> {
  const { data } = await httpClient.delete<{ message: string }>(
    `/api/phong-chieu/${auditoriumId}/ghe/${seatId}`,
  )
  return data.message
}
