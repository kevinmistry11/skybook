'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { POPULAR_CITIES, cityLabel, type City } from '@/lib/cities'

function todayISO() {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

function addDaysISO(base: string, days: number) {
  const d = new Date(`${base}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

interface Props {
  defaults?: {
    q?: string
    checkIn?: string
    checkOut?: string
    adults?: number
    children?: number
    rooms?: number
  }
  variant?: 'hero' | 'inline'
}

export default function HotelSearchForm({ defaults = {}, variant = 'hero' }: Props) {
  const router = useRouter()
  const minIn = todayISO()
  const [q, setQ] = useState(defaults.q || '')
  const [checkIn, setCheckIn] = useState(defaults.checkIn || addDaysISO(minIn, 14))
  const [checkOut, setCheckOut] = useState(defaults.checkOut || addDaysISO(minIn, 17))
  const [adults, setAdults] = useState(defaults.adults || 2)
  const [children, setChildren] = useState(defaults.children || 0)
  const [rooms, setRooms] = useState(defaults.rooms || 1)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const destRef = useRef<HTMLDivElement>(null)
  const [suggestions, setSuggestions] = useState<City[]>(POPULAR_CITIES)

  // Fetch city suggestions from the server as the user types (debounced).
  useEffect(() => {
    const query = q.trim()
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      if (!query) {
        setSuggestions(POPULAR_CITIES)
        return
      }
      fetch(`/api/cities?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
        .then(r => r.json())
        .then(data => setSuggestions(Array.isArray(data.results) ? data.results : []))
        .catch(() => { /* ignore aborts/errors, keep last list */ })
    }, query ? 180 : 0)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [q])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim()) return setError('Enter a city or hotel name.')
    if (checkIn < minIn) return setError('Check-in can’t be in the past.')
    if (checkOut <= checkIn) return setError('Check-out must be after check-in.')
    setError('')
    const params = new URLSearchParams({
      q: q.trim(),
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
      rooms: String(rooms),
    })
    router.push(`/search/hotels?${params.toString()}`)
  }

  const isHero = variant === 'hero'
  const labelCls = isHero
    ? 'block text-xs font-semibold mb-1.5 text-white/80 tracking-wide uppercase'
    : 'block text-xs font-semibold mb-1.5 text-gray-500 tracking-wide uppercase'
  const inputCls = isHero
    ? 'w-full border border-white/30 hover:border-white/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow'
    : 'w-full border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow'

  return (
    <form onSubmit={submit} className="w-full">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
        <div ref={destRef} className="relative col-span-2 sm:col-span-3 lg:col-span-2">
          <label className={labelCls}>Destination</label>
          <input
            type="text"
            value={q}
            onChange={e => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            placeholder="City, neighborhood, or hotel"
            className={inputCls}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls="hotel-dest-listbox"
            aria-autocomplete="list"
          />
          {open && (
            <div id="hotel-dest-listbox" role="listbox" className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[200] overflow-hidden">
              {!q.trim() && suggestions.length > 0 && (
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-4 pt-3 pb-1.5">
                  Popular destinations
                </p>
              )}
              {suggestions.length > 0 ? (
                suggestions.map(c => {
                  const label = cityLabel(c)
                  return (
                    <button
                      key={label}
                      type="button"
                      onMouseDown={() => {
                        setQ(label)
                        setError('')
                        setOpen(false)
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-gray-900">{c.city}</span>
                        <span className="text-xs text-gray-400 ml-1.5">{c.state}</span>
                      </div>
                    </button>
                  )
                })
              ) : q.trim().length >= 2 ? (
                <div className="px-4 py-4 text-center text-sm text-gray-400">
                  No matching cities — you can still search by hotel name or neighborhood
                </div>
              ) : null}
            </div>
          )}
        </div>
        <div>
          <label className={labelCls}>Check-in</label>
          <input
            type="date"
            min={minIn}
            value={checkIn}
            onChange={e => {
              setCheckIn(e.target.value)
              if (checkOut <= e.target.value) setCheckOut(addDaysISO(e.target.value, 1))
            }}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Check-out</label>
          <input
            type="date"
            min={addDaysISO(checkIn, 1)}
            value={checkOut}
            onChange={e => setCheckOut(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Adults</label>
          <select
            value={adults}
            onChange={e => setAdults(Number(e.target.value))}
            className={inputCls}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Children</label>
          <select
            value={children}
            onChange={e => setChildren(Number(e.target.value))}
            className={inputCls}
          >
            {[0, 1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Rooms</label>
          <select
            value={rooms}
            onChange={e => setRooms(Number(e.target.value))}
            className={inputCls}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className={`mt-3 text-sm font-medium ${isHero ? 'text-amber-200' : 'text-red-600'}`}>
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p className={`text-xs ${isHero ? 'text-white/60' : 'text-gray-400'}`}>
          Live rates via Google Hotels · Book on Kayak or partner sites
        </p>
        <button
          type="submit"
          className="w-full sm:w-auto font-bold py-2.5 px-8 rounded-xl text-sm text-white shadow-md active:scale-95 transition-all bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 shadow-orange-500/30"
        >
          Search hotels
        </button>
      </div>
    </form>
  )
}
