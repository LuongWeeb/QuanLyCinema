export interface MyReservationTicket {
  seatCode: string
  qrCode: string
  checkedIn: boolean
}

export interface MyReservation {
  id: number
  status: string
  movieName: string
  startTime: string
  auditoriumName: string
  totalAmount: number
  seatCodes: string[]
  tickets: MyReservationTicket[]
  canCancel: boolean
  canPay: boolean
}
