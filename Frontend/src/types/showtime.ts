import type { Auditorium } from './auditorium'
import type { Movie } from './movie'

export interface Showtime {
  id: number
  movieId: number
  auditoriumId: number
  startTime: string
  price: number
  movie?: Movie
  auditorium?: Auditorium
}

/** 1=Available, 2=Reserved, 3=Sold — backend SeatStatus */
export interface SeatMapItem {
  id: number
  seatCode: string
  status: number
}
