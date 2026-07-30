/** Hotel search types, partner deep-links, and demo fallback inventory. */

export interface Hotel {
  id: string
  name: string
  type: 'hotel' | 'vacation rental' | string
  thumbnail: string | null
  rating: number | null
  reviews: number | null
  stars: number | null
  /** Lowest rate per night (USD), taxes may vary by partner */
  pricePerNight: number | null
  /** Lowest total stay rate when provided by the source */
  totalPrice: number | null
  amenities: string[]
  freeCancellation: boolean
  addressHint: string | null
  latitude: number | null
  longitude: number | null
  /** Direct partner / Google hotel link when available */
  partnerLink: string | null
  source: string | null
}

export interface HotelSearchParams {
  q: string
  checkIn: string
  checkOut: string
  adults: number
  children?: number
  sortBy?: 'relevance' | 'price' | 'rating'
  minStars?: number
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn}T12:00:00`)
  const b = new Date(`${checkOut}T12:00:00`)
  const n = Math.round((b.getTime() - a.getTime()) / 86400000)
  return Math.max(1, n)
}

/** Kayak Hotels deep link for the search (book off-site). */
export function buildKayakHotelsUrl(params: {
  q: string
  checkIn: string
  checkOut: string
  adults: number
}): string {
  const { q, checkIn, checkOut, adults } = params
  // Kayak accepts free-text destinations in the path
  const dest = encodeURIComponent(q.trim().replace(/\s+/g, '-'))
  const pax = `${Math.max(1, adults)}adults`
  return `https://www.kayak.com/hotels/${dest}/${checkIn}/${checkOut}/${pax}`
}

/** Booking.com search deep link (alternate partner). */
export function buildBookingHotelsUrl(params: {
  q: string
  checkIn: string
  checkOut: string
  adults: number
}): string {
  const { q, checkIn, checkOut, adults } = params
  const url = new URL('https://www.booking.com/searchresults.html')
  url.searchParams.set('ss', q)
  url.searchParams.set('checkin', checkIn)
  url.searchParams.set('checkout', checkOut)
  url.searchParams.set('group_adults', String(Math.max(1, adults)))
  url.searchParams.set('no_rooms', '1')
  url.searchParams.set('selected_currency', 'USD')
  return url.toString()
}

/**
 * Prefer a property-level partner link; otherwise Kayak search for the destination.
 */
export function bookHotelUrl(
  hotel: Hotel,
  search: { q: string; checkIn: string; checkOut: string; adults: number },
): string {
  if (hotel.partnerLink && /^https?:\/\//i.test(hotel.partnerLink)) {
    return hotel.partnerLink
  }
  // Hotel-name search on Kayak often lands near the property
  const q = `${hotel.name} ${search.q}`.trim()
  return buildKayakHotelsUrl({ ...search, q })
}

function hashSeed(seed: string): number {
  let h = 5381
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) & 0x7fffffff
  return h
}

function seededRand(seed: string): () => number {
  let h = hashSeed(seed)
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0
    return h / 0x100000000
  }
}

const MOCK_NAMES = [
  'Harborview Inn',
  'Grand Plaza Hotel',
  'City Center Suites',
  'Riverside Boutique',
  'Skyline Residence',
  'Parkside Hotel',
  'Metro Lodge',
  'The Landmark',
  'Cedar Court Hotel',
  'Union Station Inn',
  'Lakeshore Stay',
  'Atrium Hotel',
]

const MOCK_AMENITIES = [
  'Free Wi-Fi',
  'Free parking',
  'Pool',
  'Fitness center',
  'Breakfast',
  'Pet-friendly',
  'Airport shuttle',
  'Spa',
  'Restaurant',
  'Air conditioning',
]

/**
 * Deterministic demo hotels when SerpAPI is unavailable (local / outage).
 * Prices are illustrative only — UI labels them as sample rates.
 */
export function mockHotels(params: HotelSearchParams): Hotel[] {
  const nights = nightsBetween(params.checkIn, params.checkOut)
  const r = seededRand(`${params.q}|${params.checkIn}|${params.checkOut}|${params.adults}`)
  const count = 10 + Math.floor(r() * 6)

  const hotels: Hotel[] = Array.from({ length: count }, (_, i) => {
    const rr = seededRand(`${params.q}-hotel-${i}`)
    const name = MOCK_NAMES[i % MOCK_NAMES.length]
    const stars = 2 + Math.floor(rr() * 4)
    const pricePerNight = Math.round(79 + rr() * 220 + stars * 18)
    const amenCount = 3 + Math.floor(rr() * 4)
    const amenities: string[] = []
    const pool = [...MOCK_AMENITIES]
    for (let a = 0; a < amenCount && pool.length; a++) {
      const idx = Math.floor(rr() * pool.length)
      amenities.push(pool.splice(idx, 1)[0])
    }
    return {
      id: `mock-${params.q.replace(/\s+/g, '-').toLowerCase()}-${i}`,
      name: `${name} ${params.q.split(',')[0].trim()}`.slice(0, 60),
      type: 'hotel',
      thumbnail: null,
      rating: Math.round((3.4 + rr() * 1.5) * 10) / 10,
      reviews: 40 + Math.floor(rr() * 2400),
      stars,
      pricePerNight,
      totalPrice: pricePerNight * nights,
      amenities,
      freeCancellation: rr() > 0.4,
      addressHint: params.q,
      latitude: null,
      longitude: null,
      partnerLink: null,
      source: 'Sample rates',
    }
  })

  return sortHotels(hotels, params.sortBy ?? 'relevance')
}

export function sortHotels(
  hotels: Hotel[],
  sortBy: 'relevance' | 'price' | 'rating' = 'relevance',
): Hotel[] {
  const list = [...hotels]
  if (sortBy === 'price') {
    return list.sort((a, b) => (a.pricePerNight ?? 9e9) - (b.pricePerNight ?? 9e9))
  }
  if (sortBy === 'rating') {
    return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  }
  return list
}

export function formatMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
