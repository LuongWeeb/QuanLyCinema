import type { MyReservation } from '../types/reservation'
import { httpClient } from './httpClient'

export async function listMyReservations(): Promise<MyReservation[]> {
  const { data } = await httpClient.get<MyReservation[]>('/api/dat-ve/cua-toi')
  return data
}

export async function cancelReservation(reservationId: number): Promise<string> {
  const { data } = await httpClient.post<{ message: string }>(`/api/dat-ve/${reservationId}/huy`, {})
  return data.message
}

export async function downloadTicketPdfBlob(qrCode: string): Promise<Blob> {
  const { data } = await httpClient.get<Blob>(`/api/ve/${encodeURIComponent(qrCode)}/in-pdf`, {
    responseType: 'blob',
  })
  return data
}
