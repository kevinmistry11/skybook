'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  generateFlights, formatTime, formatDate, formatDuration, formatTZAbbr, formatPrice,
  getPriceForClass, fareName, AIRPORTS, AIRLINES, AIRPORT_TZ,
  type Flight, type MultiCityLeg,
} from '@/lib/data'
import { normalizeFlightEconomyPrices } from '@/lib/pricing'

interface Props {
  from: string; to: string; date: string; returnDate?: string
  passengers: number; cabinClass: 'economy' | 'business' | 'first'
  tripType: 'oneWay' | 'roundTrip' | 'multicity'
  legs?: MultiCityLeg[]
}
type SortKey = 'best' | 'cheapest' | 'fastest' | 'earliest'
type Source  = 'live' | 'mock' | 'loading'

/** Build a Kayak deep-link for the selected itinerary (no on-site payment). */
function buildKayakUrl(opts: {
  from: string
  to: string
  date: string
  returnDate?: string
  passengers: number
  cabinClass: 'economy' | 'business' | 'first'
  tripType: 'oneWay' | 'roundTrip' | 'multicity'
  legs?: MultiCityLeg[]
  multiCityFlights?: Flight[]
}): string {
  const { from, to, date, returnDate, passengers, cabinClass, tripType, legs, multiCityFlights } = opts
  const base = 'https://www.kayak.com/flights'
  const pax = `${passengers}adults`
  const cabin =
    cabinClass === 'business' ? 'business' : cabinClass === 'first' ? 'first' : 'economy'
  const cabinQ = `?cabin=${cabin}&sort=bestflight_a`

  if (tripType === 'multicity' && multiCityFlights && multiCityFlights.length > 0) {
    const path = multiCityFlights
      .map(f => `${f.origin.code}-${f.destination.code}/${f.departureTime.split('T')[0]}`)
      .join('/')
    return `${base}/${path}/${pax}${cabinQ}`
  }
  if (tripType === 'multicity' && legs && legs.length >= 2) {
    const path = legs.map(l => `${l.from}-${l.to}/${l.date}`).join('/')
    return `${base}/multicity/${path}/${pax}${cabinQ}`
  }
  if (tripType === 'roundTrip' && returnDate) {
    return `${base}/${from}-${to}/${date}/${to}-${from}/${returnDate}/${pax}${cabinQ}`
  }
  return `${base}/${from}-${to}/${date}/${pax}${cabinQ}`
}

// ── Airline-specific fare class names ───────────────────────────────────────
// ── Fare rules per airline + cabin ──────────────────────────────────────────
interface FareRule { changes: string; refund: string }
const AIRLINE_RULES: Partial<Record<string, Record<'economy'|'business'|'first', FareRule>>> = {
  AA: {
    economy:  { changes: '$200 change fee', refund: 'Non-refundable'       },
    business: { changes: '$75 change fee',  refund: 'Cancel for credit'    },
    first:    { changes: 'Change for free', refund: 'Refundable'           },
  },
  DL: {
    economy:  { changes: '$200 change fee', refund: 'Non-refundable'       },
    business: { changes: '$75 change fee',  refund: 'Cancel for credit'    },
    first:    { changes: 'Change for free', refund: 'Refundable'           },
  },
  UA: {
    economy:  { changes: '$200 change fee', refund: 'Non-refundable'       },
    business: { changes: '$75 change fee',  refund: 'Cancel for credit'    },
    first:    { changes: 'Change for free', refund: 'Refundable'           },
  },
}
const DEFAULT_RULES: Record<'economy'|'business'|'first', FareRule> = {
  economy:  { changes: '$200 change fee', refund: 'Non-refundable' },
  business: { changes: '$150 change fee', refund: 'Non-refundable' },
  first:    { changes: '$75 change fee',  refund: 'Non-refundable' },
}
function fareRule(code: string, cabin: 'economy'|'business'|'first'): FareRule {
  return (AIRLINE_RULES[code]?.[cabin]) ?? DEFAULT_RULES[cabin]
}

// ── Terminal (deterministic pseudo-random from flight id) ───────────────────
function getTerminal(seed: string, intl = false): string {
  const h = [...seed].reduce((a, c) => ((a * 31) + c.charCodeAt(0)) | 0, 0)
  const pool = intl ? ['1','2','3','4','5'] : ['A','B','C','D','E','1','2','3']
  return pool[Math.abs(h) % pool.length]
}

// ── Carbon estimate ─────────────────────────────────────────────────────────
function estimateCO2(mins: number, cabin: 'economy'|'business'|'first'): number {
  const km     = (mins / 60) * 850
  const factor = cabin === 'first' ? 3.0 : cabin === 'business' ? 2.2 : 1.0
  return Math.round(km * 0.133 * factor / 5) * 5
}

// ── API fetch helper ────────────────────────────────────────────────────────
async function fetchFlights(
  from: string, to: string, date: string, passengers: number, cabin: string
): Promise<{ flights: Flight[]; source: Source }> {
  try {
    const r = await fetch(`/api/flights?from=${from}&to=${to}&date=${date}&passengers=${passengers}&cabinClass=${cabin}`)
    const d = await r.json()
    if (d.flights?.length > 0) return { flights: d.flights, source: 'live' as Source }
  } catch { /* fall through */ }
  return { flights: generateFlights(from, to, date), source: 'mock' }
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SearchResults({ from, to, date, returnDate, passengers, cabinClass, tripType, legs }: Props) {
  const [outboundFlights,  setOutboundFlights]  = useState<Flight[]>([])
  const [returnFlights,    setReturnFlights]     = useState<Flight[]>([])
  const [loading,          setLoading]           = useState(true)
  const [source,           setSource]            = useState<Source>('loading')
  const [sort,             setSort]              = useState<SortKey>('best')
  const [stopFilter,       setStopFilter]        = useState<'any'|'0'|'1'>('any')
  const [maxPrice,         setMaxPrice]          = useState(9999)
  const [airlineFilter,    setAirlineFilter]     = useState<Set<string>>(new Set())
  const [timeFilter,       setTimeFilter]        = useState<'any'|'morning'|'afternoon'|'evening'>('any')
  const [selectedOutbound, setSelectedOutbound]  = useState<Flight | null>(null)

  // Multi-city state
  const [mcFlightsPerLeg,  setMcFlightsPerLeg]  = useState<Flight[][]>([])
  const [mcSelected,       setMcSelected]        = useState<Flight[]>([])
  const [mcCurrentLeg,     setMcCurrentLeg]      = useState(0)

  useEffect(() => {
    if (tripType === 'multicity') {
      if (!legs || legs.length < 2) return
      setLoading(true)
      setMcFlightsPerLeg([])
      setMcSelected([])
      setMcCurrentLeg(0)
      const legShare = 1 / legs.length
      Promise.all(legs.map(l => fetchFlights(l.from, l.to, l.date, passengers, cabinClass))).then(results => {
        setMcFlightsPerLeg(results.map(r => normalizeFlightEconomyPrices(r.flights, legShare)))
        setSource(results[0]?.source ?? 'mock')
        setLoading(false)
      })
      return
    }

    if (!from || !to || !date) return
    setLoading(true)
    setOutboundFlights([])
    setReturnFlights([])
    setSelectedOutbound(null)

    // One-way: each leg ~ full target base (checkout ~$345-ish with tax).
    // Round-trip: each leg ~ half so out+ret base yields a similar RT total.
    const legShare = tripType === 'roundTrip' ? 0.5 : 1

    const jobs: Promise<{ flights: Flight[]; source: Source }>[] = [
      fetchFlights(from, to, date, passengers, cabinClass),
    ]
    if (tripType === 'roundTrip' && returnDate) {
      jobs.push(fetchFlights(to, from, returnDate, passengers, cabinClass))
    }

    Promise.all(jobs).then(([out, ret]) => {
      setOutboundFlights(normalizeFlightEconomyPrices(out.flights, legShare))
      setSource(out.source)
      if (ret) setReturnFlights(normalizeFlightEconomyPrices(ret.flights, legShare))
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, date, returnDate, tripType, passengers, cabinClass, legs])

  const fromAirport   = AIRPORTS.find(a => a.code === from)
  const toAirport     = AIRPORTS.find(a => a.code === to)
  const allPrices     = outboundFlights.map(f => getPriceForClass(f, cabinClass))
  const cheapestPrice = allPrices.length ? Math.min(...allPrices) : 0
  const maxPossible   = allPrices.length ? Math.max(...allPrices, 500) : 9999

  const applyFilters = useCallback((flights: Flight[]): Flight[] =>
    flights.filter(f => {
      const price = getPriceForClass(f, cabinClass)
      if (stopFilter === '0' && f.stops !== 0) return false
      if (stopFilter === '1' && f.stops > 1)   return false
      if (price > maxPrice) return false
      if (airlineFilter.size > 0 && !airlineFilter.has(f.airline.code)) return false
      const originTZf = AIRPORT_TZ[f.origin.code] ?? 'America/Chicago'
      const hStr = new Intl.DateTimeFormat('en-US', { timeZone: originTZf, hour: '2-digit', hour12: false }).format(new Date(f.departureTime))
      const h = parseInt(hStr) % 24
      if (timeFilter === 'morning'   && !(h >= 5  && h < 12)) return false
      if (timeFilter === 'afternoon' && !(h >= 12 && h < 17)) return false
      if (timeFilter === 'evening'   && !(h >= 17)) return false
      return true
    }), [cabinClass, stopFilter, maxPrice, airlineFilter, timeFilter])

  const sortFlights = useCallback((flights: Flight[]): Flight[] =>
    [...flights].sort((a, b) => {
      const pa = getPriceForClass(a, cabinClass), pb = getPriceForClass(b, cabinClass)
      if (sort === 'cheapest') return pa - pb
      if (sort === 'fastest')  return a.durationMinutes - b.durationMinutes
      if (sort === 'earliest') return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
      return (pa + a.durationMinutes * 0.4) - (pb + b.durationMinutes * 0.4)
    }), [cabinClass, sort])

  const filteredOut = useMemo(() => sortFlights(applyFilters(outboundFlights)), [outboundFlights, sortFlights, applyFilters])
  const filteredRet = useMemo(() => sortFlights(applyFilters(returnFlights)),   [returnFlights,   sortFlights, applyFilters])
  const showReturn  = tripType === 'roundTrip' && !!selectedOutbound

  const minReturnPrice = useMemo(() =>
    tripType === 'roundTrip' && returnFlights.length
      ? Math.min(...returnFlights.map(f => getPriceForClass(f, cabinClass)))
      : undefined,
  [tripType, returnFlights, cabinClass])

  if (tripType !== 'multicity' && (!from || !to || !date)) return (
    <div className="text-center py-20 text-gray-400">Enter a search above to find flights.</div>
  )
  if (tripType === 'multicity' && (!legs || legs.length < 2)) return (
    <div className="text-center py-20 text-gray-400">Select at least two cities above to find flights.</div>
  )

  function openKayak(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function selectFlight(_outbound: Flight, _ret?: Flight) {
    openKayak(
      buildKayakUrl({
        from,
        to,
        date,
        returnDate,
        passengers,
        cabinClass,
        tripType,
        legs,
      }),
    )
  }

  function selectMcFlight(flight: Flight) {
    const newSelected = [...mcSelected, flight]
    if (mcCurrentLeg + 1 < (legs?.length ?? 0)) {
      setMcSelected(newSelected)
      setMcCurrentLeg(mcCurrentLeg + 1)
    } else {
      openKayak(
        buildKayakUrl({
          from: legs![0].from,
          to: legs![legs!.length - 1].to,
          date: legs![0].date,
          passengers,
          cabinClass,
          tripType: 'multicity',
          legs,
          multiCityFlights: newSelected,
        }),
      )
    }
  }

  const presentAirlines = [...new Set(outboundFlights.map(f => f.airline.code))]
    .map(code => AIRLINES.find(a => a.code === code)!).filter(Boolean)

  // ── Multi-city render ────────────────────────────────────────────────────
  if (tripType === 'multicity' && legs) {
    const currentLeg    = legs[mcCurrentLeg]
    const currentFlights = mcFlightsPerLeg[mcCurrentLeg] ?? []
    const filtered       = sortFlights(applyFilters(currentFlights))
    const cheapest       = filtered.length ? Math.min(...filtered.map(f => getPriceForClass(f, cabinClass))) : 0
    const totalSoFar     = mcSelected.reduce((s, f) => s + getPriceForClass(f, cabinClass), 0)

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-60 shrink-0 space-y-4">
          {/* Progress */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Your Trip</h3>
            <div className="space-y-2">
              {legs.map((leg, idx) => {
                const done    = idx < mcCurrentLeg
                const current = idx === mcCurrentLeg
                const sel     = mcSelected[idx]
                return (
                  <div key={idx} className={`flex items-start gap-2 p-2 rounded-xl text-xs ${current ? 'bg-blue-50 border border-blue-200' : done ? 'bg-green-50 border border-green-200' : 'border border-gray-100'}`}>
                    <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${current ? 'bg-blue-600 text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {done ? '✓' : idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${current ? 'text-blue-800' : done ? 'text-green-800' : 'text-gray-400'}`}>
                        {leg.from} → {leg.to}
                      </p>
                      {done && sel && (
                        <p className="text-gray-500 truncate">{sel.airline.name} · {formatTime(sel.departureTime, AIRPORT_TZ[sel.origin.code])}</p>
                      )}
                      {current && <p className="text-blue-500">Selecting now…</p>}
                    </div>
                    {done && (
                      <button onClick={() => { setMcCurrentLeg(idx); setMcSelected(prev => prev.slice(0, idx)) }}
                        className="text-blue-500 hover:text-blue-700 font-medium shrink-0">Edit</button>
                    )}
                  </div>
                )
              })}
            </div>
            {mcSelected.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Subtotal so far</p>
                <p className="text-base font-black text-gray-900">${formatPrice(totalSoFar * passengers)}</p>
                <p className="text-[10px] text-gray-400">{passengers} passenger{passengers > 1 ? 's' : ''}, excl. taxes</p>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Filter Leg {mcCurrentLeg + 1}</h3>
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Stops</p>
              <div className="flex gap-2">
                {([['any','Any'],['0','Nonstop'],['1','1 Stop']] as const).map(([v,l]) => (
                  <button key={v} onClick={() => setStopFilter(v)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${stopFilter===v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sort</p>
              <div className="flex flex-wrap gap-1.5">
                {(['best','cheapest','fastest','earliest'] as SortKey[]).map(s => (
                  <button key={s} onClick={() => setSort(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${sort===s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-0.5">
              Leg {mcCurrentLeg + 1} of {legs.length}
            </p>
            <p className="text-base font-bold text-blue-900">
              {AIRPORTS.find(a => a.code === currentLeg.from)?.city ?? currentLeg.from} ({currentLeg.from})
              {' → '}
              {AIRPORTS.find(a => a.code === currentLeg.to)?.city ?? currentLeg.to} ({currentLeg.to})
              {' · '}{currentLeg.date}
            </p>
          </div>
          <FlightList
            flights={filtered} cabinClass={cabinClass} passengers={passengers}
            sort={sort} onSortChange={setSort} loading={loading} source={source}
            onSelect={selectMcFlight}
            label={`${currentLeg.from} → ${currentLeg.to} · ${currentLeg.date}`}
            cheapest={cheapest}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      {/* ── Filters sidebar ── */}
      <aside className="w-full lg:w-60 shrink-0 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Filter Results</h3>

          {/* Stops */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Stops</p>
            <div className="flex gap-2">
              {([['any','Any'],['0','Nonstop'],['1','1 Stop']] as const).map(([v,l]) => (
                <button key={v} onClick={() => setStopFilter(v)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${stopFilter===v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Departure time */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Departure</p>
            <div className="grid grid-cols-2 gap-1.5">
              {([['any','Any time',''],['morning','Morning','5am–12pm'],['afternoon','Afternoon','12–5pm'],['evening','Evening','5pm+']] as const).map(([v,l,sub]) => (
                <button key={v} onClick={() => setTimeFilter(v)}
                  className={`py-2 px-1 rounded-lg border text-xs transition-colors ${timeFilter===v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  <span className="font-semibold block">{l}</span>
                  {sub && <span className="opacity-70">{sub}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Max Price</p>
              <p className="text-xs font-bold text-blue-600">{maxPrice >= maxPossible ? 'Any' : `$${maxPrice}`}</p>
            </div>
            <input type="range" min={cheapestPrice} max={maxPossible} step={5} value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))} className="w-full accent-blue-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>${cheapestPrice}</span><span>${maxPossible}+</span></div>
          </div>

          {/* Airlines */}
          {presentAirlines.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Airlines</p>
              <div className="space-y-1.5">
                {presentAirlines.map(a => (
                  <label key={a.code} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={airlineFilter.has(a.code)}
                      onChange={() => setAirlineFilter(prev => { const n = new Set(prev); n.has(a.code) ? n.delete(a.code) : n.add(a.code); return n })}
                      className="rounded border-gray-300 text-blue-600" />
                    <div className="w-5 h-5 rounded overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.logoUrl} alt={a.name} className="w-4 h-4 object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                    </div>
                    <span className="text-xs text-gray-700 group-hover:text-gray-900 truncate">
                      {a.name.replace(' Air Lines','').replace(' Airlines','').replace(' Airways','')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Results ── */}
      <div className="flex-1 min-w-0">
        {showReturn ? (
          <>
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-800">Outbound selected — now pick your return</p>
                <p className="text-xs text-blue-500 mt-0.5">
                  {selectedOutbound!.airline.name} · {selectedOutbound!.flightNumber} · {formatTime(selectedOutbound!.departureTime, AIRPORT_TZ[selectedOutbound!.origin.code])} {formatTZAbbr(selectedOutbound!.departureTime, AIRPORT_TZ[selectedOutbound!.origin.code] ?? 'America/Chicago')} → {formatTime(selectedOutbound!.arrivalTime, AIRPORT_TZ[selectedOutbound!.destination.code])} {formatTZAbbr(selectedOutbound!.arrivalTime, AIRPORT_TZ[selectedOutbound!.destination.code] ?? 'America/Chicago')}
                </p>
              </div>
              <button onClick={() => setSelectedOutbound(null)} className="text-xs text-blue-600 border border-blue-300 px-3 py-1 rounded-lg hover:bg-blue-100">Change</button>
            </div>
            <FlightList
              flights={filteredRet} cabinClass={cabinClass} passengers={passengers}
              sort={sort} onSortChange={setSort} loading={loading} source={source}
              onSelect={ret => selectFlight(selectedOutbound!, ret)}
              label={`${to} → ${from} · Return · ${returnDate}`}
              cheapest={filteredRet.length ? Math.min(...filteredRet.map(f => getPriceForClass(f, cabinClass))) : 0}
              outboundPrice={getPriceForClass(selectedOutbound!, cabinClass)}
            />
          </>
        ) : (
          <FlightList
            flights={filteredOut} cabinClass={cabinClass} passengers={passengers}
            sort={sort} onSortChange={setSort} loading={loading} source={source}
            onSelect={f => tripType === 'oneWay' ? selectFlight(f) : setSelectedOutbound(f)}
            label={`${fromAirport?.city ?? from} (${from}) → ${toAirport?.city ?? to} (${to}) · ${date}`}
            cheapest={cheapestPrice}
            minReturnPrice={minReturnPrice}
          />
        )}
      </div>
    </div>
  )
}

// ── Flight list ────────────────────────────────────────────────────────────

function FlightList({ flights, cabinClass, passengers, sort, onSortChange, onSelect, label, cheapest, loading, source, outboundPrice, minReturnPrice }: {
  flights: Flight[]; cabinClass: 'economy'|'business'|'first'; passengers: number
  sort: SortKey; onSortChange: (s: SortKey) => void; onSelect: (f: Flight) => void
  label: string; cheapest: number; loading: boolean; source: Source; outboundPrice?: number; minReturnPrice?: number
}) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900 truncate">{label}</p>
            {source === 'live' && !loading && (
              <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200 shrink-0">
                ✓ Live schedules
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? 'Searching for flights…' : `${flights.length} flight${flights.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        {!loading && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-gray-400 mr-1 hidden sm:inline">Sort:</span>
            {(['best','cheapest','fastest','earliest'] as SortKey[]).map(s => (
              <button key={s} onClick={() => onSortChange(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${sort===s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {!loading && flights.length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Clicking &quot;Book on Kayak&quot; opens Kayak.com in a new tab to complete your booking. SkyBookFare may earn a commission at no extra cost to you.
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_,i) => <SkeletonCard key={i} />)}</div>
      ) : flights.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
          <p className="text-3xl mb-3">✈️</p>
          <p className="font-semibold text-gray-700 mb-1">No flights match your filters</p>
          <p className="text-gray-400 text-sm">Try adjusting the stops, price, or departure time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flights.map((f, idx) => (
            <FlightCard key={f.id} flight={f} cabinClass={cabinClass} passengers={passengers}
              onSelect={onSelect} isCheapest={idx === 0 && getPriceForClass(f, cabinClass) === cheapest}
              outboundPrice={outboundPrice} minReturnPrice={minReturnPrice} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-7 w-20 bg-gray-200 rounded-lg" />
            <div className="flex-1 h-px bg-gray-200" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="flex-1 h-px bg-gray-200" />
            <div className="h-7 w-20 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-3 w-48 bg-gray-100 rounded" />
          <div className="h-3 w-32 bg-gray-100 rounded" />
        </div>
        <div className="shrink-0 space-y-2 ml-4">
          <div className="h-8 w-20 bg-gray-200 rounded-lg" />
          <div className="h-9 w-24 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ── Flight card ─────────────────────────────────────────────────────────────

function FlightCard({ flight, cabinClass, passengers, onSelect, isCheapest, outboundPrice, minReturnPrice }: {
  flight: Flight; cabinClass: 'economy'|'business'|'first'; passengers: number
  onSelect: (f: Flight) => void; isCheapest: boolean; outboundPrice?: number; minReturnPrice?: number
}) {
  const price     = getPriceForClass(flight, cabinClass)
  const classData = flight[cabinClass]
  const dep       = new Date(flight.departureTime)
  const arr       = new Date(flight.arrivalTime)
  const originTZ  = AIRPORT_TZ[flight.origin.code]      ?? 'America/Chicago'
  const destTZ    = AIRPORT_TZ[flight.destination.code] ?? 'America/Chicago'
  const depDay    = new Intl.DateTimeFormat('en-CA', { timeZone: originTZ }).format(dep)
  const arrDay    = new Intl.DateTimeFormat('en-CA', { timeZone: destTZ   }).format(arr)
  const nextDay   = depDay !== arrDay
  const [imgFailed, setImgFailed] = useState(false)
  const [expanded, setExpanded]   = useState(false)

  const fName   = fareName(flight.airline.code, cabinClass, flight.flightNumber)
  const fRule   = fareRule(flight.airline.code, cabinClass)
  const co2     = estimateCO2(flight.durationMinutes, cabinClass)
  const depTerm = getTerminal(flight.id + 'dep', flight.origin.country      !== 'US')
  const arrTerm = getTerminal(flight.id + 'arr', flight.destination.country !== 'US')

  return (
    <div className={`bg-white rounded-2xl border transition-all hover:shadow-lg ${isCheapest ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}`}>
      {isCheapest && (
        <div className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-t-2xl flex items-center gap-1.5">
          <span>★</span> Lowest fare for this route
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 sm:gap-4">

          {/* Logo */}
          <div className="w-12 shrink-0">
            <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
              {!imgFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={flight.airline.logoUrl} alt={flight.airline.name}
                  className="w-9 h-9 object-contain" onError={() => setImgFailed(true)} />
              ) : (
                <span className="text-xs font-black" style={{ color: flight.airline.color }}>{flight.airline.code}</span>
              )}
            </div>
          </div>

          {/* Times + route */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Depart */}
              <div className="shrink-0 text-center sm:text-left">
                <p className="text-xl font-black text-gray-900 leading-none tabular-nums">{formatTime(flight.departureTime, originTZ)}</p>
                <p className="text-xs text-gray-400 tabular-nums">{formatTZAbbr(flight.departureTime, originTZ)}</p>
                <p className="text-sm font-bold text-gray-500 mt-0.5">{flight.origin.code}</p>
                <p className="text-xs text-gray-400 hidden sm:block truncate max-w-[80px]">{flight.origin.city}</p>
              </div>

              {/* Duration bar */}
              <div className="flex-1 min-w-0 px-1">
                <p className="text-xs text-gray-400 text-center mb-1">{formatDuration(flight.durationMinutes)}</p>
                <div className="flex items-center">
                  <div className="flex-1 h-px bg-gray-300" />
                  {flight.stops > 0 && <div className="w-2 h-2 mx-0.5 rounded-full border-2 border-gray-400 bg-white shrink-0" />}
                  {flight.stops > 1 && <div className="w-2 h-2 mx-0.5 rounded-full border-2 border-gray-400 bg-white shrink-0" />}
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                </div>
                <p className="text-xs text-center mt-1 font-medium">
                  {flight.stops === 0
                    ? <span className="text-green-600">Nonstop</span>
                    : <span className="text-gray-500">{flight.stops} stop{flight.stops > 1 ? 's' : ''}{flight.stopCity ? ` · ${flight.stopCity}` : ''}</span>}
                </p>
              </div>

              {/* Arrive */}
              <div className="shrink-0 text-center sm:text-right">
                <p className="text-xl font-black text-gray-900 leading-none tabular-nums">
                  {formatTime(flight.arrivalTime, destTZ)}
                  {nextDay && <sup className="text-xs text-orange-400 ml-0.5 font-normal">+1</sup>}
                </p>
                <p className="text-xs text-gray-400 tabular-nums">{formatTZAbbr(flight.arrivalTime, destTZ)}</p>
                <p className="text-sm font-bold text-gray-500 mt-0.5">{flight.destination.code}</p>
                <p className="text-xs text-gray-400 hidden sm:block truncate max-w-[80px]">{flight.destination.city}</p>
              </div>
            </div>

            {/* Meta row: airline · flight# · fare class · aircraft */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
              <span>{flight.airline.name}</span>
              <span>·</span>
              <span>{flight.flightNumber}</span>
              <span>·</span>
              <span className="font-semibold text-gray-600">{fName}</span>
              <span>·</span>
              <span>{flight.aircraft}</span>
            </div>

            {/* Baggage + refund policy */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className={flight.carryOnIncluded ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {flight.carryOnIncluded ? '✓' : '✗'} Carry-on
              </span>
              <span className={flight.checkedBagPrice === null ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {flight.checkedBagPrice === null ? '✓ 1st bag free' : `✗ Bag +$${flight.checkedBagPrice}`}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500">{fRule.refund}</span>
            </div>
          </div>

          {/* Price + CTA */}
          <div className="text-right shrink-0 ml-1">
            {outboundPrice !== undefined ? (
              <>
                <p className="text-2xl font-black text-gray-900 tabular-nums">${formatPrice((outboundPrice + price) * passengers)}</p>
                <p className="text-xs text-gray-400 mb-1.5">round trip total</p>
                <p className="text-xs text-gray-500 mb-1.5">+${formatPrice(price * passengers)} this leg</p>
              </>
            ) : minReturnPrice !== undefined ? (
              <>
                <p className="text-2xl font-black text-gray-900 tabular-nums">${formatPrice((price + minReturnPrice) * passengers)}</p>
                <p className="text-xs text-gray-400 mb-1.5">round trip total</p>
                <p className="text-xs text-gray-500 mb-1.5">outbound ${formatPrice(price * passengers)}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-gray-900 tabular-nums">${formatPrice(price * passengers)}</p>
                <p className="text-xs text-gray-400 mb-1.5">{passengers > 1 ? 'total' : 'per person'}</p>
              </>
            )}
            {classData.seatsLeft <= 5 && (
              <p className="text-xs text-red-500 font-semibold mb-1">{classData.seatsLeft} left!</p>
            )}
            <button onClick={() => onSelect(flight)}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors w-full shadow-sm flex items-center justify-center gap-1.5">
              {outboundPrice !== undefined
                ? <>Book on Kayak <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></>
                : minReturnPrice !== undefined
                  ? 'Select outbound'
                  : <>Book on Kayak <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full border-t border-gray-100 px-5 py-2 flex items-center justify-between text-xs hover:bg-gray-50 transition-colors rounded-b-2xl"
      >
        <span className="text-gray-400">
          {formatDate(flight.departureTime)}
          {isCheapest && <span className="ml-2 text-blue-600 font-semibold">Best value</span>}
        </span>
        <span className="text-blue-600 font-medium flex items-center gap-1">
          {expanded ? 'Hide details' : 'Flight details'}
          <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 rounded-b-2xl space-y-4">
          {/* Terminals + fare + carbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Departure</p>
              <p className="text-sm font-semibold text-gray-900">{flight.origin.code}</p>
              <p className="text-xs text-gray-500">Terminal {depTerm}</p>
              <p className="text-xs text-gray-400">{formatDate(flight.departureTime, originTZ)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Arrival</p>
              <p className="text-sm font-semibold text-gray-900">{flight.destination.code}</p>
              <p className="text-xs text-gray-500">Terminal {arrTerm}</p>
              <p className="text-xs text-gray-400">{formatDate(flight.arrivalTime, destTZ)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fare Class</p>
              <p className="text-sm font-semibold text-gray-900">{fName}</p>
              <p className="text-xs text-gray-500">{fRule.changes}</p>
              <p className="text-xs text-gray-500">{fRule.refund}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Carbon</p>
              <p className="text-sm font-semibold text-gray-900">{co2} kg CO₂</p>
              <p className="text-xs text-gray-500">per passenger</p>
              <p className="text-xs text-green-600 font-medium">🌱 Avg for route</p>
            </div>
          </div>

          {/* Layover info */}
          {flight.stops > 0 && flight.stopCity && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
              <span>🔄</span>
              <span>
                <span className="font-semibold">Connection in {flight.stopCity}</span>
                {' · '}Layover approx. {formatDuration(Math.round(flight.durationMinutes * 0.22))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
