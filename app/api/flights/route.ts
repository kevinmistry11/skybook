import { NextRequest, NextResponse } from 'next/server'
import { AIRPORTS, AIRLINES, AIRPORT_TZ, getBasePrice, localToUTC, generateFlights, type Flight } from '@/lib/data'
import { applyDatePricing, getScheduledFlights } from '@/lib/schedule'
import { normalizeFlightEconomyPrices } from '@/lib/pricing'

// ── IATA aircraft type codes → readable names (used by Amadeus path) ─────────
const AIRCRAFT_CODES: Record<string, string> = {
  '319': 'Airbus A319',        '320': 'Airbus A320',        '321': 'Airbus A321',
  '32A': 'Airbus A320neo',     '32B': 'Airbus A320neo',     '32N': 'Airbus A321neo',
  '32Q': 'Airbus A321neo',     '32S': 'Airbus A321neo',
  '333': 'Airbus A330-300',    '332': 'Airbus A330-200',
  '339': 'Airbus A330-900neo', '338': 'Airbus A330-800neo',
  '77W': 'Boeing 777-300ER',   '772': 'Boeing 777-200ER',
  '788': 'Boeing 787-8',       '789': 'Boeing 787-9',       '78J': 'Boeing 787-9',
  '73H': 'Boeing 737-800',     '738': 'Boeing 737-800',     '73W': 'Boeing 737-700',
  '7M8': 'Boeing 737 MAX 8',   '7M9': 'Boeing 737 MAX 9',   '7M7': 'Boeing 737 MAX 7',
  '757': 'Boeing 757-200',     '75W': 'Boeing 757-200',     '753': 'Boeing 757-300',
  '767': 'Boeing 767-300',     '76W': 'Boeing 767-300ER',
  'E75': 'Embraer E175',       'E7W': 'Embraer E175',       'E70': 'Embraer E170',
  'E90': 'Embraer E190',       'E95': 'Embraer E195',
  'CR9': 'Bombardier CRJ-900', 'CR7': 'Bombardier CRJ-700', 'CR2': 'Bombardier CRJ-200',
  '220': 'Airbus A220-300',    '221': 'Airbus A220-100',    '223': 'Airbus A220-300',
  'DH4': 'Dash 8-400',         'AT7': 'ATR 72',
}

// Shared: derive a price with centNoise for any base+date
function priceWithNoise(base: number, date: string): number {
  const priced    = applyDatePricing(base, date)
  const centNoise = ((base * 23 + 7) % 97) / 100
  return Math.round((priced + centNoise) * 100) / 100
}

function makeCabinPrices(economy: number, seatsLeft: number) {
  return {
    economy:  { price: economy,                                          seatsLeft },
    business: { price: Math.round(economy * 2.8 * 100) / 100,           seatsLeft: Math.max(1, Math.floor(seatsLeft * 0.3)) },
    first:    { price: Math.round(economy * 5.5 * 100) / 100,           seatsLeft: Math.max(1, Math.floor(seatsLeft * 0.12)) },
  }
}

// ── SerpAPI path ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSerpOffer(offer: any, idx: number, date: string): Flight | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legs: any[] = offer.flights
    const first = legs[0]
    const last  = legs[legs.length - 1]

    const airlineCode = ((first.flight_number as string) ?? '').split(' ')[0] || 'XX'
    const airline = AIRLINES.find(a => a.code === airlineCode) ?? {
      code:    airlineCode,
      name:    first.airline   ?? airlineCode,
      color:   '#555',
      logoUrl: first.airline_logo ?? `https://www.gstatic.com/flights/airline_logos/70px/${airlineCode}.png`,
    }

    const makeAp = (iata: string, name: string) =>
      AIRPORTS.find(a => a.code === iata) ?? { code: iata, city: name, name, country: 'US', lat: 0, lon: 0 }

    const origin      = makeAp(first.departure_airport.id, first.departure_airport.name)
    const destination = makeAp(last.arrival_airport.id,    last.arrival_airport.name)

    const stops    = legs.length - 1
    const stopCity = stops > 0 ? legs[0].arrival_airport.id : undefined

    // SerpAPI gives "Boeing 737", "Airbus A321", etc.
    const aircraft = (first.airplane as string | undefined) ?? 'Boeing 737-800'

    const durationMinutes: number = offer.total_duration ?? first.duration ?? 180

    // SerpAPI times are local airport times: "2026-06-27 11:59"
    const depTZ = AIRPORT_TZ[first.departure_airport.id] ?? 'America/Chicago'
    const arrTZ = AIRPORT_TZ[last.arrival_airport.id]    ?? 'America/Chicago'
    const [depDateStr, depTimeStr] = (first.departure_airport.time as string).split(' ')
    const [arrDateStr, arrTimeStr] = (last.arrival_airport.time  as string).split(' ')
    const depUTC = localToUTC(depDateStr, depTimeStr, depTZ)
    const arrUTC = localToUTC(arrDateStr, arrTimeStr, arrTZ)

    // Our own pricing — SerpAPI price is intentionally ignored
    const base         = getBasePrice(durationMinutes, airlineCode, origin.code, destination.code)
    const economyPrice = priceWithNoise(base, date)
    const seatsLeft    = 3 + Math.abs((idx * 17 + durationMinutes) % 32)

    const checkedBagPrice: number | null = airlineCode === 'WN' ? null : 35

    return {
      id:              `serp-${first.departure_airport.id}-${last.arrival_airport.id}-${date}-${idx}`,
      flightNumber:    (first.flight_number as string) ?? `${airlineCode} ${1000 + idx}`,
      airline,
      origin,
      destination,
      departureTime:   depUTC.toISOString(),
      arrivalTime:     arrUTC.toISOString(),
      durationMinutes,
      stops,
      stopCity,
      aircraft,
      carryOnIncluded: true,
      checkedBagPrice,
      ...makeCabinPrices(economyPrice, seatsLeft),
    } as Flight
  } catch (e) {
    console.error('[flights] mapSerpOffer error', e)
    return null
  }
}

async function fetchFromSerpAPI(
  from: string, to: string, date: string, passengers: string
): Promise<Flight[] | null> {
  const key = process.env.SERPAPI_KEY
  if (!key) return null

  const url = new URL('https://serpapi.com/search')
  url.searchParams.set('engine',        'google_flights')
  url.searchParams.set('departure_id',  from)
  url.searchParams.set('arrival_id',    to)
  url.searchParams.set('outbound_date', date)
  url.searchParams.set('adults',        passengers)
  url.searchParams.set('currency',      'USD')
  url.searchParams.set('hl',            'en')
  url.searchParams.set('type',          '2')   // one-way; we call once per leg
  url.searchParams.set('api_key',       key)

  const res = await fetch(url.toString(), { next: { revalidate: 300 } })
  if (!res.ok) {
    console.error('[flights] SerpAPI HTTP error', res.status)
    return null
  }

  const data = await res.json()
  if (data.error) {
    console.error('[flights] SerpAPI error field', data.error)
    return null
  }

  const offers = [...(data.best_flights ?? []), ...(data.other_flights ?? [])]
  if (!offers.length) return null

  const flights = offers.map((o, i) => mapSerpOffer(o, i, date)).filter(Boolean) as Flight[]
  if (!flights.length) return null
  return normalizeFlightEconomyPrices(flights, 1)
}

// ── Amadeus path (fallback) ───────────────────────────────────────────────────

const AMADEUS_BASE = 'https://test.api.amadeus.com'
let cachedToken: { value: string; expiresAt: number } | null = null

async function getAmadeusToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && now < cachedToken.expiresAt) return cachedToken.value
  const key    = process.env.AMADEUS_API_KEY
  const secret = process.env.AMADEUS_API_SECRET
  if (!key || !secret) throw new Error('Amadeus keys not set')
  const res  = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${key}&client_secret=${secret}`,
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Amadeus token error: ${JSON.stringify(data)}`)
  cachedToken = { value: data.access_token, expiresAt: now + (data.expires_in - 120) * 1000 }
  return cachedToken.value
}

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  return m ? (parseInt(m[1] || '0') * 60) + parseInt(m[2] || '0') : 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAmadeusOffer(offer: any, idx: number, date: string): Flight | null {
  try {
    const itin  = offer.itineraries[0]
    const segs  = itin.segments
    const first = segs[0]
    const last  = segs[segs.length - 1]

    const code    = first.carrierCode ?? first.operating?.carrierCode ?? 'XX'
    const airline = AIRLINES.find(a => a.code === code) ?? {
      code, name: code, color: '#555',
      logoUrl: `https://www.gstatic.com/flights/airline_logos/70px/${code}.png`,
    }

    const makeAp = (iata: string) =>
      AIRPORTS.find(a => a.code === iata) ?? { code: iata, city: iata, name: `${iata} Airport`, country: 'US', lat: 0, lon: 0 }

    const durationMinutes  = parseDuration(itin.duration)
    const originAp         = makeAp(first.departure.iataCode)
    const destinationAp    = makeAp(last.arrival.iataCode)
    const economyPrice     = priceWithNoise(getBasePrice(durationMinutes, code, originAp.code, destinationAp.code), date)
    const seatsLeft        = offer.numberOfBookableSeats ?? (8 + Math.abs((idx * 17 + 7) % 35))
    const fareDetails      = offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]
    const includedBags     = fareDetails?.includedCheckedBags?.quantity ?? 0
    const checkedBagPrice: number | null = includedBags > 0 ? null : 30
    const aircraftCode     = first.aircraft?.code ?? ''
    const aircraft         = AIRCRAFT_CODES[aircraftCode] ?? (aircraftCode ? `Aircraft ${aircraftCode}` : 'Boeing 737-800')

    return {
      id:              `am-${offer.id}-${idx}`,
      flightNumber:    `${code} ${first.number}`,
      airline,
      origin:          originAp,
      destination:     destinationAp,
      departureTime:   first.departure.at,
      arrivalTime:     last.arrival.at,
      durationMinutes,
      stops:           segs.length - 1,
      stopCity:        segs.length > 1 ? segs[0].arrival.iataCode : undefined,
      aircraft,
      carryOnIncluded: true,
      checkedBagPrice,
      ...makeCabinPrices(economyPrice, seatsLeft),
    } as Flight
  } catch {
    return null
  }
}

async function fetchFromAmadeus(
  from: string, to: string, date: string, passengers: string, cabinClass: string
): Promise<Flight[] | null> {
  const cabinMap: Record<string, string> = { economy: 'ECONOMY', business: 'BUSINESS', first: 'FIRST' }
  try {
    const token = await getAmadeusToken()
    const url   = new URL(`${AMADEUS_BASE}/v2/shopping/flight-offers`)
    url.searchParams.set('originLocationCode',      from)
    url.searchParams.set('destinationLocationCode', to)
    url.searchParams.set('departureDate',           date)
    url.searchParams.set('adults',                  passengers)
    url.searchParams.set('travelClass',             cabinMap[cabinClass] ?? 'ECONOMY')
    url.searchParams.set('currencyCode',            'USD')
    url.searchParams.set('max',                     '15')

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    })
    if (!res.ok) return null

    const data = await res.json()
    if (!data.data?.length) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flights = data.data.map((o: any, i: number) => mapAmadeusOffer(o, i, date)).filter(Boolean) as Flight[]
    if (!flights.length) return null
    return normalizeFlightEconomyPrices(flights, 1)
  } catch {
    return null
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const sp         = new URL(req.url).searchParams
  const from       = sp.get('from')
  const to         = sp.get('to')
  const date       = sp.get('date')
  const passengers = sp.get('passengers') ?? '1'
  const cabinClass = sp.get('cabinClass')  ?? 'economy'

  if (!from || !to || !date) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  // Always load local schedule flights for this route/date
  const localFlights: Flight[] = generateFlights(from, to, date)

  // 1. Try SerpAPI — merge with local so user sees full list
  const serpFlights = await fetchFromSerpAPI(from, to, date, passengers)
  if (serpFlights && serpFlights.length > 0) {
    // Deduplicate: keep serp flights, add local flights whose flight number
    // doesn't already appear in the serp results
    const serpNums = new Set(serpFlights.map(f => f.flightNumber))
    const extra    = localFlights.filter(f => !serpNums.has(f.flightNumber))
    const merged   = [...serpFlights, ...extra]
    return NextResponse.json({ flights: merged, source: 'live' })
  }

  // 2. Try Amadeus (test environment fallback)
  const amFlights = await fetchFromAmadeus(from, to, date, passengers, cabinClass)
  if (amFlights && amFlights.length > 0) {
    const amNums = new Set(amFlights.map(f => f.flightNumber))
    const extra  = localFlights.filter(f => !amNums.has(f.flightNumber))
    return NextResponse.json({ flights: [...amFlights, ...extra], source: 'live' })
  }

  // 3. Use local schedule/generated data
  return NextResponse.json({ flights: localFlights, source: 'local' })
}
