/** Sắp xếp mã ghế kiểu A1, B12: theo hàng chữ rồi theo số. */
export function parseSeatParts(code: string): { row: string; num: number } | null {
  const m = code.trim().match(/^([A-Za-z]+)(\d+)$/i)
  if (!m) return null
  return { row: m[1].toUpperCase(), num: parseInt(m[2], 10) }
}

export function compareSeatCodes(a: string, b: string): number {
  const pa = parseSeatParts(a)
  const pb = parseSeatParts(b)
  if (pa && pb) {
    if (pa.row !== pb.row) return pa.row.localeCompare(pb.row)
    return pa.num - pb.num
  }
  return a.localeCompare(b)
}

export function sortSeatsForDisplay<T extends { seatCode: string }>(seats: T[]): T[] {
  return [...seats].sort((x, y) => compareSeatCodes(x.seatCode, y.seatCode))
}

export const VIP_PRICE_MULTIPLIER = 1.5
