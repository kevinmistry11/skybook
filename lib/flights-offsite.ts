/**
 * Off-site flight booking (Kayak).
 *
 * Search results hand the traveler straight to Kayak rather than an on-site
 * checkout, mirroring how hotels are handled in `lib/hotels.ts`.
 */

export interface KayakFlightLeg {
  from: string
  to: string
  date: string
}

/** Kayak cabin path segment — economy is the default and takes no segment. */
function cabinSegment(cabinClass: 'economy' | 'business' | 'first'): string {
  return cabinClass === 'economy' ? '' : `/${cabinClass}`
}

/**
 * Kayak Flights deep link for a trip (book off-site).
 *
 *   one-way     /flights/SFO-JFK/2026-09-10/1adults
 *   round trip  /flights/SFO-JFK/2026-09-10/2026-09-17/1adults
 *   multi-city  /flights/SFO-JFK/2026-09-10/JFK-LAX/2026-09-14/1adults
 */
export function buildKayakFlightsUrl(params: {
  legs: KayakFlightLeg[]
  /** Round-trip return date; only used when there is a single leg. */
  returnDate?: string
  passengers: number
  cabinClass: 'economy' | 'business' | 'first'
}): string {
  const { legs, returnDate, passengers, cabinClass } = params

  const segments = legs
    .filter(l => l.from && l.to && l.date)
    .map(l => `${l.from.trim().toUpperCase()}-${l.to.trim().toUpperCase()}/${l.date}`)

  // Nothing usable to deep link — send the traveler to Kayak's flight search.
  if (segments.length === 0) return 'https://www.kayak.com/flights'

  // A round trip is the single leg plus a return date; multi-city chains legs.
  const path =
    segments.length === 1 && returnDate ? `${segments[0]}/${returnDate}` : segments.join('/')

  const pax = `${Math.max(1, passengers)}adults`
  return `https://www.kayak.com/flights/${path}/${pax}${cabinSegment(cabinClass)}?sort=bestflight_a`
}

/** Open a Kayak deep link in a new tab, without handing over the referrer. */
export function openKayakFlights(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}
