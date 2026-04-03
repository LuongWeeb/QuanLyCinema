import type { PendingReservationAdmin } from '../types/pendingReservation'
import { httpClient } from './httpClient'

function normalizeRow(raw: Record<string, unknown>): PendingReservationAdmin {
  return {
    id: Number(raw.id ?? raw.Id),
    customerUsername: String(raw.customerUsername ?? raw.CustomerUsername ?? ''),
    customerFullName: String(raw.customerFullName ?? raw.CustomerFullName ?? ''),
    movieName: String(raw.movieName ?? raw.MovieName ?? ''),
    startTime: String(raw.startTime ?? raw.StartTime ?? ''),
    auditoriumName: String(raw.auditoriumName ?? raw.AuditoriumName ?? ''),
    totalAmount: Number(raw.totalAmount ?? raw.TotalAmount ?? 0),
    seatCodes: (raw.seatCodes ?? raw.SeatCodes ?? []) as string[],
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ''),
  }
}

export async function listPendingApprovals(): Promise<PendingReservationAdmin[]> {
  const { data } = await httpClient.get<Record<string, unknown>[]>('/api/dat-ve/cho-duyet')
  if (!Array.isArray(data)) return []
  return data.map((row) => normalizeRow(row as Record<string, unknown>))
}

export async function listAwaitingPayment(): Promise<PendingReservationAdmin[]> {
  const { data } = await httpClient.get<Record<string, unknown>[]>('/api/dat-ve/cho-thanh-toan')
  if (!Array.isArray(data)) return []
  return data.map((row) => normalizeRow(row as Record<string, unknown>))
}

export async function approveReservation(reservationId: number): Promise<string> {
  const { data } = await httpClient.post<{ message: string }>(`/api/dat-ve/${reservationId}/duyet`, {})
  return data.message
}

export async function rejectReservation(reservationId: number): Promise<string> {
  const { data } = await httpClient.post<{ message: string }>(`/api/dat-ve/${reservationId}/tu-choi`, {})
  return data.message
}
