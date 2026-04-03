export interface AuditoriumListItem {
  id: number
  name: string
  capacity: number
  seatCount: number
}

export interface Auditorium {
  id: number
  name: string
  capacity: number
}

export interface Seat {
  id: number
  auditoriumId: number
  seatCode: string
  /** Thiếu trên API cũ → coi như false */
  isVip?: boolean
}
