export interface Movie {
  id: number
  name: string
  genre: string
  durationMinutes: number
  rating: number
  posterUrl?: string | null
}

export interface MovieDetail extends Movie {
  averageUserStars: number
  userRatingCount: number
  myStars: number | null
}
