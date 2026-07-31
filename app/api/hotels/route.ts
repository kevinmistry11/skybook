import { NextRequest, NextResponse } from 'next/server'
import {
  type Hotel,
  type HotelSearchParams,
  sortHotels,
  nightsBetween,
} from '@/lib/hotels'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSerpProperty(p: any, idx: number, nights: number): Hotel | null {
  try {
    const name = (p.name as string | undefined)?.trim()
    if (!name) return null

    const rate =
      p.rate_per_night?.extracted_lowest ??
      p.extracted_price ??
      (typeof p.price === 'string'
        ? Number(String(p.price).replace(/[^0-9.]/g, ''))
        : null)

    const total =
      p.total_rate?.extracted_lowest ??
      (typeof rate === 'number' && rate > 0 ? Math.round(rate * nights) : null)

    const stars =
      typeof p.extracted_hotel_class === 'number'
        ? p.extracted_hotel_class
        : typeof p.hotel_class === 'number'
          ? p.hotel_class
          : typeof p.hotel_class === 'string'
            ? parseInt(p.hotel_class, 10) || null
            : null

    const thumb =
      (p.thumbnail as string | undefined) ??
      (p.images?.[0]?.thumbnail as string | undefined) ??
      (p.images?.[0]?.original_image as string | undefined) ??
      null

    const amenities: string[] = Array.isArray(p.amenities)
      ? p.amenities.slice(0, 8).map(String)
      : []

    const id =
      (p.property_token as string | undefined) ??
      `serp-${idx}-${name.slice(0, 24).replace(/\s+/g, '-')}`

    return {
      id: String(id),
      name,
      type: (p.type as string) || 'hotel',
      thumbnail: thumb,
      rating:
        typeof p.overall_rating === 'number'
          ? Math.round(p.overall_rating * 10) / 10
          : null,
      reviews: typeof p.reviews === 'number' ? p.reviews : null,
      stars: stars && stars >= 1 && stars <= 5 ? stars : null,
      pricePerNight: typeof rate === 'number' && rate > 0 ? Math.round(rate) : null,
      totalPrice: typeof total === 'number' && total > 0 ? Math.round(total) : null,
      amenities,
      freeCancellation: Boolean(p.free_cancellation),
      addressHint: null,
      latitude: p.gps_coordinates?.latitude ?? null,
      longitude: p.gps_coordinates?.longitude ?? null,
      partnerLink: (p.link as string | undefined) ?? null,
      source: (p.prices?.[0]?.source as string | undefined) ?? (p.source as string | undefined) ?? 'Google Hotels',
    }
  } catch (e) {
    console.error('[hotels] mapSerpProperty error', e)
    return null
  }
}

async function fetchFromSerpAPI(params: HotelSearchParams): Promise<Hotel[] | null> {
  const key = process.env.SERPAPI_KEY
  if (!key) return null

  const nights = nightsBetween(params.checkIn, params.checkOut)
  const url = new URL('https://serpapi.com/search')
  url.searchParams.set('engine', 'google_hotels')
  url.searchParams.set('q', params.q)
  url.searchParams.set('check_in_date', params.checkIn)
  url.searchParams.set('check_out_date', params.checkOut)
  url.searchParams.set('adults', String(params.adults))
  if (params.children && params.children > 0) {
    url.searchParams.set('children', String(params.children))
  }
  url.searchParams.set('currency', 'USD')
  url.searchParams.set('gl', 'us')
  url.searchParams.set('hl', 'en')
  if (params.sortBy === 'price') url.searchParams.set('sort_by', '3')
  if (params.sortBy === 'rating') url.searchParams.set('sort_by', '8')
  if (params.minStars && params.minStars >= 3) {
    // hotel_class is multi-select: 3,4,5 etc.
    const classes = Array.from({ length: 6 - params.minStars }, (_, i) => String(params.minStars! + i))
    url.searchParams.set('hotel_class', classes.join(','))
  }
  url.searchParams.set('api_key', key)

  const debugUrl = url.toString().replace(/api_key=[^&]+/, 'api_key=***')
  console.log('[hotels] SerpAPI request', debugUrl)

  const res = await fetch(url.toString(), { next: { revalidate: 600 } })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[hotels] SerpAPI HTTP', res.status, body.slice(0, 400))
    return null
  }

  const data = await res.json()
  if (data.error) {
    console.error('[hotels] SerpAPI error', data.error)
    return null
  }

  // List results — only keep hotels that have a real live rate.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: any[] = [...(data.properties ?? []), ...(data.ads ?? [])]
  if (props.length) {
    const hotels = (props
      .map((p, i) => mapSerpProperty(p, i, nights))
      .filter(Boolean) as Hotel[])
      .filter(h => typeof h.pricePerNight === 'number' && h.pricePerNight > 0)
    return hotels.length ? sortHotels(hotels, params.sortBy ?? 'relevance') : null
  }

  // Single property details response — only if it has a live rate.
  if (data.name && data.search_information?.hotels_results_state?.includes('property')) {
    const one = mapSerpProperty(data, 0, nights)
    return one && typeof one.pricePerNight === 'number' && one.pricePerNight > 0 ? [one] : null
  }

  return null
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const q = (sp.get('q') || sp.get('destination') || '').trim()
  const checkIn = (sp.get('checkIn') || sp.get('check_in') || '').trim()
  const checkOut = (sp.get('checkOut') || sp.get('check_out') || '').trim()
  const adults = Math.min(6, Math.max(1, Number(sp.get('adults') || '2') || 2))
  const children = Math.min(6 - adults, Math.max(0, Number(sp.get('children') || '0') || 0))
  const rooms = Math.min(8, Math.max(1, Number(sp.get('rooms') || '1') || 1))
  const sortRaw = (sp.get('sortBy') || 'relevance').toLowerCase()
  const sortBy =
    sortRaw === 'price' || sortRaw === 'rating' ? (sortRaw as 'price' | 'rating') : 'relevance'
  const minStars = Number(sp.get('minStars') || '0') || 0

  if (!q) {
    return NextResponse.json({ error: 'Missing destination (q)' }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
    return NextResponse.json({ error: 'checkIn and checkOut must be YYYY-MM-DD' }, { status: 400 })
  }
  if (checkOut <= checkIn) {
    return NextResponse.json({ error: 'checkOut must be after checkIn' }, { status: 400 })
  }

  const params: HotelSearchParams = {
    q,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    sortBy,
    minStars: minStars >= 2 ? minStars : undefined,
  }

  try {
    const live = await fetchFromSerpAPI(params)
    if (live && live.length) {
      return NextResponse.json({
        hotels: live,
        source: 'live' as const,
        nights: nightsBetween(checkIn, checkOut),
        query: params,
      })
    }
  } catch (e) {
    console.error('[hotels] live fetch failed', e)
  }

  // No live rates available — do not fabricate listings; show an empty state.
  return NextResponse.json({
    hotels: [],
    source: 'unavailable' as const,
    nights: nightsBetween(checkIn, checkOut),
    query: params,
    notice:
      'Live hotel rates aren’t available right now. Try different dates or another nearby city.',
  })
}
