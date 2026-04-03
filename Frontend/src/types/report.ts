export interface PopularShowtimeItem {
  showtimeId: number
  movieName: string
  startTime: string
  soldTickets: number
}

export interface MovieRevenueRow {
  movieId: number
  movieName: string
  revenue: number
  ticketsSold: number
}

export interface RevenueReport {
  totalRevenue: number
  ticketsSold: number
  popularShowtimes: PopularShowtimeItem[]
  revenueByMovie: MovieRevenueRow[]
}
