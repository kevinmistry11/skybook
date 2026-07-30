'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AirportPicker from './AirportPicker'
import type { MultiCityLeg } from '@/lib/data'

interface SearchFormProps {
  compact?: boolean
  defaultValues?: {
    from?: string
    to?: string
    date?: string
    returnDate?: string
    passengers?: number
    cabinClass?: string
    tripType?: string
    legs?: MultiCityLeg[]
  }
}

function parseLegCode(from: string, to: string, date: string): MultiCityLeg[] {
  return [
    { from: from || '', to: to || '', date: date || '' },
    { from: to   || '', to: '',       date: ''         },
  ]
}

export default function SearchForm({ compact = false, defaultValues = {} }: SearchFormProps) {
  const router = useRouter()
  const today  = new Date().toISOString().split('T')[0]

  const [tripType,   setTripType]   = useState<'oneWay' | 'roundTrip' | 'multicity'>((defaultValues.tripType as 'oneWay' | 'roundTrip' | 'multicity') || 'roundTrip')
  const [from,       setFrom]       = useState(defaultValues.from       || '')
  const [to,         setTo]         = useState(defaultValues.to         || '')
  const [date,       setDate]       = useState(defaultValues.date       || '')
  const [returnDate, setReturnDate] = useState(defaultValues.returnDate || '')
  const [passengers, setPassengers] = useState(defaultValues.passengers || 1)
  const [cabinClass, setCabinClass] = useState(defaultValues.cabinClass || 'economy')
  const [error,      setError]      = useState('')

  // Multi-city legs state
  const [legs, setLegs] = useState<MultiCityLeg[]>(
    defaultValues.legs && defaultValues.legs.length >= 2
      ? defaultValues.legs
      : parseLegCode(defaultValues.from || '', defaultValues.to || '', defaultValues.date || '')
  )

  function swapAirports() { setFrom(to); setTo(from) }

  function updateLeg(idx: number, field: keyof MultiCityLeg, value: string) {
    setLegs(prev => {
      const next = prev.map((l, i) => i === idx ? { ...l, [field]: value } : l)
      // Auto-fill next leg's "from" with this leg's "to"
      if (field === 'to' && idx + 1 < next.length && next[idx + 1].from === '') {
        next[idx + 1] = { ...next[idx + 1], from: value }
      }
      return next
    })
  }

  function addLeg() {
    if (legs.length >= 5) return
    setLegs(prev => [...prev, { from: prev[prev.length - 1].to || '', to: '', date: '' }])
  }

  function removeLeg(idx: number) {
    if (legs.length <= 2) return
    setLegs(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (tripType === 'multicity') {
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i]
        if (!leg.from) return setError(`Leg ${i + 1}: Please select a departure airport.`)
        if (!leg.to)   return setError(`Leg ${i + 1}: Please select a destination airport.`)
        if (leg.from === leg.to) return setError(`Leg ${i + 1}: Departure and destination cannot be the same.`)
        if (!leg.date) return setError(`Leg ${i + 1}: Please select a date.`)
      }
      const legsStr = legs.map(l => `${l.from}:${l.to}:${l.date}`).join(',')
      const params  = new URLSearchParams({ tripType: 'multicity', legs: legsStr, passengers: String(passengers), cabinClass })
      router.push(`/search?${params}`)
      return
    }

    if (!from)                                         return setError('Please select a departure airport.')
    if (!to)                                           return setError('Please select a destination airport.')
    if (from === to)                                   return setError('Departure and destination cannot be the same.')
    if (!date)                                         return setError('Please select a departure date.')
    if (tripType === 'roundTrip' && !returnDate)       return setError('Please select a return date.')
    if (tripType === 'roundTrip' && returnDate < date) return setError('Return date must be after departure date.')
    const params = new URLSearchParams({
      from, to, date, passengers: String(passengers), cabinClass, tripType,
      ...(tripType === 'roundTrip' && returnDate ? { returnDate } : {}),
    })
    router.push(`/search?${params}`)
  }

  const inputCls = compact
    ? 'w-full border border-gray-300 hover:border-gray-400 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow'
    : 'w-full border border-white/30 hover:border-white/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow'

  const labelCls = compact
    ? 'block text-xs font-semibold mb-1 text-gray-600'
    : 'block text-xs font-semibold mb-1.5 text-white/80 tracking-wide uppercase'

  // ── Non-compact (home page — sits on dark gradient) ──────────────────────
  if (!compact) {
    const btnSpan = tripType === 'roundTrip' ? 'sm:col-span-2 lg:col-span-2' : 'sm:col-span-2 lg:col-span-3'

    return (
      <form onSubmit={handleSubmit} className="w-full">
        {/* Trip type toggle */}
        <div className="flex gap-2 mb-5">
          {(['roundTrip', 'oneWay', 'multicity'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTripType(t)}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                tripType === t ? 'bg-white text-blue-700 shadow-md' : 'border border-white/40 text-white/80 hover:bg-white/15 hover:border-white/60'
              }`}>
              {t === 'roundTrip' ? 'Round Trip' : t === 'oneWay' ? 'One Way' : 'Multi-City'}
            </button>
          ))}
        </div>

        {/* Multi-city legs */}
        {tripType === 'multicity' ? (
          <div className="space-y-3">
            {legs.map((leg, idx) => (
              <div key={idx} className="grid gap-3 grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] items-end">
                <AirportPicker
                  label={`City ${idx + 1} — From`}
                  value={leg.from}
                  onChange={v => updateLeg(idx, 'from', v)}
                  placeholder="Departure city"
                  excludeCode={leg.to}
                  dark
                />
                <div className="hidden sm:flex pb-0.5">
                  <button type="button" title="Swap"
                    onClick={() => setLegs(prev => prev.map((l, i) => i === idx ? { ...l, from: l.to, to: l.from } : l))}
                    className="shrink-0 w-9 h-9 rounded-full bg-white hover:bg-blue-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                </div>
                <AirportPicker
                  label="To"
                  value={leg.to}
                  onChange={v => updateLeg(idx, 'to', v)}
                  placeholder="Destination city"
                  excludeCode={leg.from}
                  dark
                />
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className={labelCls}>Date</label>
                    <input type="date" value={leg.date} min={today}
                      onChange={e => { updateLeg(idx, 'date', e.target.value); e.target.blur() }} className={inputCls} />
                  </div>
                  {legs.length > 2 && (
                    <button type="button" onClick={() => removeLeg(idx)}
                      className="mb-0.5 shrink-0 w-9 h-9 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-400/40 flex items-center justify-center text-red-200 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {legs.length < 5 && (
              <button type="button" onClick={addLeg}
                className="flex items-center gap-2 text-sm text-white/80 hover:text-white border border-white/30 hover:border-white/60 px-4 py-2 rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add another city
              </button>
            )}

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 pt-1">
              <div>
                <label className={labelCls}>Passengers</label>
                <select value={passengers} onChange={e => setPassengers(Number(e.target.value))} className={inputCls}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Adult' : 'Adults'}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Class</label>
                <select value={cabinClass} onChange={e => setCabinClass(e.target.value)} className={inputCls}>
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First Class</option>
                </select>
              </div>
              <div className="flex items-end sm:col-span-2">
                <button type="submit"
                  className="w-full font-bold py-2.5 px-6 rounded-xl text-sm text-white shadow-md active:scale-95 transition-all bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40">
                  Search Flights
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* One-way / Round-trip form */
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* From + swap + To */}
            <div className="flex items-end gap-2 sm:col-span-2">
              <div className="flex-1 min-w-0">
                <AirportPicker label="From" value={from} onChange={setFrom} placeholder="Departure city" excludeCode={to} dark />
              </div>
              <button type="button" onClick={swapAirports} title="Swap airports"
                className="mb-0.5 shrink-0 w-9 h-9 rounded-full bg-white hover:bg-blue-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <AirportPicker label="To" value={to} onChange={setTo} placeholder="Destination city" excludeCode={from} dark />
              </div>
            </div>

            {/* Depart */}
            <div>
              <label className={labelCls}>Depart</label>
              <input type="date" value={date} min={today} onChange={e => { setDate(e.target.value); e.target.blur() }} className={inputCls} />
            </div>

            {/* Return or second Passengers slot */}
            {tripType === 'roundTrip' ? (
              <div>
                <label className={labelCls}>Return</label>
                <input type="date" value={returnDate} min={date || today} onChange={e => { setReturnDate(e.target.value); e.target.blur() }} className={inputCls} />
              </div>
            ) : (
              <div>
                <label className={labelCls}>Passengers</label>
                <select value={passengers} onChange={e => setPassengers(Number(e.target.value))} className={inputCls}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Adult' : 'Adults'}</option>)}
                </select>
              </div>
            )}

            {tripType === 'roundTrip' && (
              <div>
                <label className={labelCls}>Passengers</label>
                <select value={passengers} onChange={e => setPassengers(Number(e.target.value))} className={inputCls}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Adult' : 'Adults'}</option>)}
                </select>
              </div>
            )}

            {/* Class */}
            <div>
              <label className={labelCls}>Class</label>
              <select value={cabinClass} onChange={e => setCabinClass(e.target.value)} className={inputCls}>
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>

            <div className={`flex items-end ${btnSpan}`}>
              <button type="submit"
                className="w-full font-bold py-2.5 px-6 rounded-xl text-sm text-white shadow-md active:scale-95 transition-all bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40">
                Search Flights
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-200 bg-red-500/20 border border-red-400/30 px-3 py-2 rounded-lg">{error}</p>}
      </form>
    )
  }

  // ── Compact (search results page — sits on white bg) ─────────────────────
  return (
    <form onSubmit={handleSubmit} className="w-full">

      {tripType === 'multicity' ? (
        /* Compact multi-city */
        <div className="space-y-2">
          {legs.map((leg, idx) => (
            <div key={idx} className="grid gap-2 grid-cols-[1fr_1fr_auto_auto] items-end">
              <AirportPicker
                label={`Leg ${idx + 1} From`}
                value={leg.from}
                onChange={v => updateLeg(idx, 'from', v)}
                placeholder="From"
                excludeCode={leg.to}
              />
              <AirportPicker
                label="To"
                value={leg.to}
                onChange={v => updateLeg(idx, 'to', v)}
                placeholder="To"
                excludeCode={leg.from}
              />
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={leg.date} min={today}
                  onChange={e => { updateLeg(idx, 'date', e.target.value); e.target.blur() }} className={inputCls} />
              </div>
              {legs.length > 2 ? (
                <button type="button" onClick={() => removeLeg(idx)}
                  className="mb-0.5 w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-red-50 hover:border-red-300 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : <div />}
            </div>
          ))}
        </div>
      ) : (
        /* Compact one-way / round-trip */
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <div className="flex items-end gap-2 col-span-2">
            <div className="flex-1 min-w-0">
              <AirportPicker label="From" value={from} onChange={setFrom} placeholder="Departure city" excludeCode={to} />
            </div>
            <button type="button" onClick={swapAirports} title="Swap"
              className="mb-0.5 shrink-0 w-9 h-9 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <AirportPicker label="To" value={to} onChange={setTo} placeholder="Destination city" excludeCode={from} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Depart</label>
            <input type="date" value={date} min={today} onChange={e => { setDate(e.target.value); e.target.blur() }} className={inputCls} />
          </div>

          {tripType === 'roundTrip' && (
            <div>
              <label className={labelCls}>Return</label>
              <input type="date" value={returnDate} min={date || today} onChange={e => { setReturnDate(e.target.value); e.target.blur() }} className={inputCls} />
            </div>
          )}

          <div>
            <label className={labelCls}>Pax</label>
            <select value={passengers} onChange={e => setPassengers(Number(e.target.value))} className={inputCls}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Adult' : 'Adults'}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Class</label>
            <select value={cabinClass} onChange={e => setCabinClass(e.target.value)} className={inputCls}>
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>
        </div>
      )}

      {/* Button + trip type toggles */}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <button type="submit"
          className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-2 px-6 rounded-xl text-sm shadow-sm transition-colors shrink-0">
          Search Flights
        </button>
        {tripType === 'multicity' && legs.length < 5 && (
          <button type="button" onClick={addLeg}
            className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-300 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors bg-white">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add city
          </button>
        )}
        <div className="flex gap-2">
          {(['roundTrip', 'oneWay', 'multicity'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTripType(t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                tripType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}>
              {t === 'roundTrip' ? 'Round Trip' : t === 'oneWay' ? 'One Way' : 'Multi-City'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
    </form>
  )
}
