import type { ReservationResult } from '../types/booking'
import { httpClient } from './httpClient'

function normalizeReservation(raw: Record<string, unknown>): ReservationResult {
  return {
    reservationId: Number(raw.reservationId ?? raw.ReservationId),
    totalAmount: Number(raw.totalAmount ?? raw.TotalAmount),
    ticketQrs: (raw.ticketQrs ?? raw.TicketQrs ?? []) as string[],
  }
}

export async function createReservation(
  showtimeId: number,
  seatIds: number[],
  targetUserId?: number,
): Promise<ReservationResult> {
  const { data } = await httpClient.post<Record<string, unknown>>('/api/dat-ve', {
    showtimeId,
    seatIds,
    ...(targetUserId != null && targetUserId > 0 ? { targetUserId } : {}),
  })
  return normalizeReservation(data)
}

export async function payReservation(reservationId: number, method: string): Promise<string> {
  const { data } = await httpClient.post<{ message: string }>('/api/dat-ve/thanh-toan', {
    reservationId,
    method,
  })
  return data.message
}
