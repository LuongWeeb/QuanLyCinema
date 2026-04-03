import type { MovieRevenueRow, PopularShowtimeItem, RevenueReport } from '../types/report'
import { httpClient } from './httpClient'

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function normalizePopular(raw: Record<string, unknown>): PopularShowtimeItem {
  return {
    showtimeId: num(raw.showtimeId ?? raw.ShowtimeId),
    movieName: String(raw.movieName ?? raw.MovieName ?? ''),
    startTime: String(raw.startTime ?? raw.StartTime ?? ''),
    soldTickets: num(raw.soldTickets ?? raw.SoldTickets),
  }
}

function normalizeMovieRevenue(raw: Record<string, unknown>): MovieRevenueRow {
  return {
    movieId: num(raw.movieId ?? raw.MovieId),
    movieName: String(raw.movieName ?? raw.MovieName ?? ''),
    revenue: num(raw.revenue ?? raw.Revenue),
    ticketsSold: num(raw.ticketsSold ?? raw.TicketsSold),
  }
}

function normalizeReport(raw: Record<string, unknown>): RevenueReport {
  const pop = raw.popularShowtimes ?? raw.PopularShowtimes
  const byMovie = raw.revenueByMovie ?? raw.RevenueByMovie
  return {
    totalRevenue: num(raw.totalRevenue ?? raw.TotalRevenue),
    ticketsSold: num(raw.ticketsSold ?? raw.TicketsSold),
    popularShowtimes: Array.isArray(pop)
      ? (pop as Record<string, unknown>[]).map((x) => normalizePopular(x))
      : [],
    revenueByMovie: Array.isArray(byMovie)
      ? (byMovie as Record<string, unknown>[]).map((x) => normalizeMovieRevenue(x))
      : [],
  }
}

/** `from` / `to`: ISO 8601 (UTC hoặc có offset). */
export async function fetchRevenueReport(fromIso: string, toIso: string): Promise<RevenueReport> {
  const { data } = await httpClient.get<Record<string, unknown>>('/api/bao-cao/doanh-thu', {
    params: { from: fromIso, to: toIso },
  })
  return normalizeReport(data)
}
