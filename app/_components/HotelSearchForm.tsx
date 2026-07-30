'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim()) return setError('Enter a city or hotel name.')
    if (checkOut <= checkIn) return setError('Check-out must be after check-in.')
    setError('')
    const params = new URLSearchParams({
      q: q.trim(),
      checkIn,
      checkOut,
      adults: String(adults),
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
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-2">
          <label className={labelCls}>Destination</label>
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="City, neighborhood, or hotel"
            className={inputCls}
            autoComplete="off"
          />
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
          <label className={labelCls}>Guests</label>
          <select
            value={adults}
            onChange={e => setAdults(Number(e.target.value))}
            className={inputCls}
          >
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'adult' : 'adults'}
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
