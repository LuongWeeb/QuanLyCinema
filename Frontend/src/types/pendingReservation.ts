export interface PendingReservationAdmin {
  id: number
  customerUsername: string
  customerFullName: string
  movieName: string
  startTime: string
  auditoriumName: string
  totalAmount: number
  seatCodes: string[]
  createdAt: string
}
