'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  type Hotel,
  formatMoney,
  nightsBetween,
  sortHotels,
} from '@/lib/hotels'

interface Props {
  q: string
  checkIn: string
  checkOut: string
  adults: number
  childrenCount?: number
  rooms?: number
}

type Source = 'live' | 'unavailable' | 'loading' | 'error'

export default function HotelResults({ q, checkIn, checkOut, adults, childrenCount = 0, rooms = 1 }: Props) {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [source, setSource] = useState<Source>('loading')
  const [notice, setNotice] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'relevance' | 'price' | 'rating'>('relevance')
  const [minStars, setMinStars] = useState(0)
  const [freeCancelOnly, setFreeCancelOnly] = useState(false)

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut])

  useEffect(() => {
    if (!q || !checkIn || !checkOut) return
    let cancelled = false
    setSource('loading')
    setHotels([])
    setNotice(null)

    const params = new URLSearchParams({
      q,
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(childrenCount),
      rooms: String(rooms),
      sortBy,
    })
    if (minStars >= 2) params.set('minStars', String(minStars))

    fetch(`/api/hotels?${params.toString()}`)
      .then(async r => {
        const data = await r.json()
        if (cancelled) return
        if (!r.ok) throw new Error(data.error || 'Search failed')
        setHotels(data.hotels ?? [])
        setSource(data.source === 'live' ? 'live' : 'unavailable')
        setNotice(data.notice ?? null)
      })
      .catch(err => {
        if (cancelled) return
        console.error(err)
        setSource('error')
        setNotice(err instanceof Error ? err.message : 'Could not load hotels')
      })

    return () => {
      cancelled = true
    }
  }, [q, checkIn, checkOut, adults, childrenCount, rooms, sortBy, minStars])

  const filtered = useMemo(() => {
    let list = hotels
    if (freeCancelOnly) list = list.filter(h => h.freeCancellation)
    if (minStars >= 2) list = list.filter(h => (h.stars ?? 0) >= minStars || h.stars == null)
    return sortHotels(list, sortBy)
  }, [hotels, freeCancelOnly, minStars, sortBy])

  function summaryHref(h: Hotel): string {
    const p = new URLSearchParams({
      name: h.name,
      q,
      checkIn,
      checkOut,
      nights: String(nights),
      adults: String(adults),
      children: String(childrenCount),
      rooms: String(rooms),
    })
    if (h.pricePerNight != null) p.set('ppn', String(h.pricePerNight))
    if (h.totalPrice != null) p.set('total', String(h.totalPrice))
    if (h.stars != null) p.set('stars', String(h.stars))
    if (h.rating != null) p.set('rating', String(h.rating))
    if (h.reviews != null) p.set('reviews', String(h.reviews))
    if (h.freeCancellation) p.set('free', '1')
    if (h.source) p.set('src', h.source)
    if (h.thumbnail) p.set('thumb', h.thumbnail)
    return `/hotels/summary?${p.toString()}`
  }

  if (!q || !checkIn || !checkOut) {
    return (
      <div className="text-center py-20 text-gray-400">
        Enter a destination and dates to search hotels.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            Hotels in {q}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {checkIn} → {checkOut} · {nights} night{nights !== 1 ? 's' : ''} · {adults}{' '}
            adult{adults !== 1 ? 's' : ''}
            {source === 'live' && (
              <span className="ml-2 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                ✓ Live rates
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400 mr-1">Sort:</span>
        {([
          ['relevance', 'Best'],
          ['price', 'Lowest price'],
          ['rating', 'Top rated'],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSortBy(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              sortBy === k
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="text-xs text-gray-300 mx-1">|</span>
        {[0, 3, 4, 5].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setMinStars(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              minStars === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
            }`}
          >
            {s === 0 ? 'Any stars' : `${s}+ stars`}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFreeCancelOnly(v => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            freeCancelOnly
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
          }`}
        >
          Free cancellation
        </button>
      </div>

      {notice && source !== 'unavailable' && (
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <InfoIcon />
          <span>{notice}</span>
        </div>
      )}

      {source === 'live' && filtered.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <InfoIcon />
          <span>
            Select a hotel to <strong className="text-gray-600">review your booking details</strong>.
            No payment is taken — checkout is coming soon.
          </span>
        </div>
      )}

      {source === 'loading' && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-36 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {source === 'error' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
          <p className="font-semibold text-gray-700 mb-1">Couldn&apos;t load hotels</p>
          <p className="text-gray-400 text-sm">{notice || 'Please try again in a moment, or adjust your dates.'}</p>
        </div>
      )}

      {source === 'unavailable' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
          <p className="text-3xl mb-3">🏨</p>
          <p className="font-semibold text-gray-700 mb-1">No live rates available right now</p>
          <p className="text-gray-400 text-sm">
            We couldn&apos;t find live rates for {q} on these dates. Try different dates or another nearby city.
          </p>
        </div>
      )}

      {source === 'live' && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
          <p className="text-3xl mb-3">🏨</p>
          <p className="font-semibold text-gray-700 mb-1">No hotels match your filters</p>
          <p className="text-gray-400 text-sm">Try different dates or clear star / cancellation filters.</p>
        </div>
      )}

      {source !== 'loading' && filtered.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            {filtered.length} propert{filtered.length === 1 ? 'y' : 'ies'}
          </p>
          {filtered.map(h => (
            <HotelCard
              key={h.id}
              hotel={h}
              nights={nights}
              summaryUrl={summaryHref(h)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HotelCard({
  hotel,
  nights,
  summaryUrl,
}: {
  hotel: Hotel
  nights: number
  summaryUrl: string
}) {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <article className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div className="sm:w-44 md:w-52 shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 relative min-h-[140px]">
          {hotel.thumbnail && !imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hotel.thumbnail}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-40">
              🏨
            </div>
          )}
          {hotel.stars != null && hotel.stars > 0 && (
            <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {hotel.stars}-star
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-base sm:text-lg font-black text-gray-900 truncate">{hotel.name}</h2>
              {hotel.type && hotel.type !== 'hotel' && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {hotel.type}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
              {hotel.rating != null && (
                <span className="inline-flex items-center gap-1 font-bold text-gray-800">
                  <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {hotel.rating.toFixed(1)}
                  </span>
                  {hotel.reviews != null && (
                    <span className="font-normal text-gray-400">
                      ({hotel.reviews.toLocaleString()} reviews)
                    </span>
                  )}
                </span>
              )}
              {hotel.freeCancellation && (
                <span className="text-green-700 font-semibold">Free cancellation</span>
              )}
              {hotel.source && (
                <span className="text-gray-400">via {hotel.source}</span>
              )}
            </div>

            {hotel.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {hotel.amenities.slice(0, 5).map(a => (
                  <span
                    key={a}
                    className="text-[11px] text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Price + CTA */}
          <div className="sm:text-right shrink-0 sm:min-w-[140px] flex sm:flex-col items-end justify-between sm:justify-center gap-2">
            <div>
              {hotel.pricePerNight != null ? (
                <>
                  <p className="text-2xl font-black text-gray-900 tabular-nums">
                    {formatMoney(hotel.pricePerNight)}
                  </p>
                  <p className="text-xs text-gray-400">per night</p>
                  {hotel.totalPrice != null && nights > 1 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatMoney(hotel.totalPrice)} total · {nights} nights
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm font-semibold text-gray-500">See price on partner</p>
              )}
            </div>
            <Link
              href={summaryUrl}
              className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors w-full sm:w-auto shadow-sm"
            >
              Reserve
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

function InfoIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
