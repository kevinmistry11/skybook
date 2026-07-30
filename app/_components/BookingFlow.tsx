'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  generateSeatMap,
  formatTime,
  formatDate,
  formatDuration,
  formatPrice,
  getPriceForClass,
  fareName,
  AIRPORT_TZ,
  type Flight,
  type Passenger,
  type PendingBooking,
  type SeatRow,
  type SeatInfo,
  generatePNR,
} from '@/lib/data'
import { getPendingBooking, addBooking } from '@/lib/store'
import { computeCheckoutTotals } from '@/lib/pricing'

export default function BookingFlow({ flightId }: { flightId: string }) {
  const router = useRouter()
  const [pending, setPending]     = useState<PendingBooking | null>(null)
  const [notFound, setNotFound]   = useState(false)

  const emptyPax = (): Passenger => ({ firstName: '', lastName: '', dob: '', gender: '', documentNumber: '' })
  const [pax, setPax]             = useState<Passenger[]>([emptyPax()])
  const [email, setEmail]         = useState('')

  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [seatAddonCost, setSeatAddonCost] = useState(0)

  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry]         = useState('')
  const [cvv, setCvv]               = useState('')
  const [cardName, setCardName]     = useState('')

  const [errors, setErrors]   = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const data = getPendingBooking(flightId)
    if (!data) { setNotFound(true); return }
    setPending(data)
    setPax(Array.from({ length: data.searchParams.passengers }, emptyPax))
  }, [flightId])

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(145deg,#0a0f3d 0%,#1a3ab8 60%,#0e7bd4 100%)' }}>
      <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm w-full mx-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <p className="font-bold text-gray-900 mb-1">Session Expired</p>
        <p className="text-sm text-gray-500 mb-5">Your booking session was not found or has expired.</p>
        <button onClick={() => router.push('/')}
          className="w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all"
          style={{ background: 'linear-gradient(135deg,#f97316,#ec4899)' }}>
          Start a New Search
        </button>
      </div>
    </div>
  )

  if (!pending) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(145deg,#0a0f3d 0%,#1a3ab8 60%,#0e7bd4 100%)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-white/70 text-sm">Loading your booking…</p>
      </div>
    </div>
  )

  const { outboundFlight: flight, returnFlight, multiCityFlights, searchParams } = pending
  const { cabinClass, passengers: passengerCount } = searchParams
  const isMultiCity = searchParams.tripType === 'multicity' && !!multiCityFlights

  // Split base fare across legs for display so order summary lines add up to the target total
  const displayLegs: Flight[] = isMultiCity
    ? multiCityFlights!
    : returnFlight
      ? [flight, returnFlight]
      : [flight]

  // ~$345-ish with cents, varies slightly by itinerary (not a flat round number)
  const priceSeed = displayLegs.map(f => f.id).join('|')
  const { baseFare, taxes, totalPrice } = computeCheckoutTotals({
    passengers: passengerCount,
    cabinClass,
    seatAddonCost,
    seed: priceSeed,
  })
  const rawLegPrices = displayLegs.map(f => getPriceForClass(f, cabinClass))
  const rawLegSum = rawLegPrices.reduce((s, p) => s + p, 0) || 1
  const displayLegPrices = rawLegPrices.map((p, i) => {
    if (i === rawLegPrices.length - 1) {
      const allocated = displayLegs.slice(0, -1).reduce((s, _, j) => {
        return s + Math.round((rawLegPrices[j] / rawLegSum) * (baseFare / passengerCount) * 100) / 100
      }, 0)
      return Math.round((baseFare / passengerCount - allocated) * 100) / 100
    }
    return Math.round((p / rawLegSum) * (baseFare / passengerCount) * 100) / 100
  })
  const legPriceById = Object.fromEntries(displayLegs.map((f, i) => [f.id, displayLegPrices[i]]))

  const seatMap: SeatRow[] = generateSeatMap(flight.id, cabinClass)

  function findSeat(code: string) {
    for (const r of seatMap) { const s = r.seats.find(s => s.code === code); if (s) return s }
    return null
  }

  function toggleSeat(code: string, taken: boolean) {
    if (taken) return
    setSelectedSeats(prev => {
      const next = prev.includes(code)
        ? prev.filter(s => s !== code)
        : prev.length >= passengerCount ? [...prev.slice(1), code] : [...prev, code]
      const cost = next.reduce((sum, c) => sum + (findSeat(c)?.price ?? 0), 0)
      setSeatAddonCost(cost)
      return next
    })
  }

  function formatCard(val: string) { return val.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim() }
  function fmtExpiry(val: string) {
    const d = val.replace(/\D/g,'').slice(0,4)
    return d.length >= 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: string[] = []

    pax.forEach((p, i) => {
      const label = passengerCount > 1 ? `Passenger ${i + 1}` : 'Passenger'
      if (!p.firstName.trim()) errs.push(`${label}: First name required`)
      if (!p.lastName.trim())  errs.push(`${label}: Last name required`)
      if (!p.dob)              errs.push(`${label}: Date of birth required`)
      if (!p.gender)           errs.push(`${label}: Gender required`)
    })
    if (!email.trim() || !email.includes('@')) errs.push('Valid contact email required')
    if (cardNumber.replace(/\s/g,'').length < 16) errs.push('Enter a valid 16-digit card number')
    if (expiry.length < 5)  errs.push('Enter a valid expiry date (MM/YY)')
    if (cvv.length < 3)     errs.push('Enter a valid CVV')
    if (!cardName.trim())   errs.push('Name on card is required')

    setErrors(errs)
    if (errs.length > 0) { window.scrollTo({ top: 0, behavior: 'smooth' }); return }

    setLoading(true)
    setTimeout(() => {
      const bookingId = crypto.randomUUID()
      addBooking({
        id: bookingId,
        pnr: generatePNR(),
        outboundFlight: flight,
        returnFlight: returnFlight ?? undefined,
        passengers: pax,
        selectedSeats,
        addOns: [],
        cabinClass,
        passengersCount: passengerCount,
        baseFare,
        addOnsCost: seatAddonCost,
        taxes,
        totalPrice,
        contactEmail: email,
        createdAt: new Date().toISOString(),
      })
      router.push(`/confirmation/${bookingId}`)
    }, 1800)
  }

  const colLabels      = cabinClass === 'first' ? ['A', 'C', '', 'D', 'F'] : ['A', 'B', 'C', '', 'D', 'E', 'F']
  const selectedCost   = selectedSeats.reduce((sum, c) => sum + (findSeat(c)?.price ?? 0), 0)
  const maskedCard     = cardNumber.replace(/\s/g,'').padEnd(16,'·').replace(/(.{4})/g,'$1 ').trim()
  const displayCardNum = cardNumber.replace(/\s/g,'').length > 0
    ? maskedCard.split(' ').map((g,i) => i < 3 ? '····' : g).join(' ')
    : '···· ···· ···· ····'

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400'

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Dark branded flight header ── */}
      <div style={{ background: 'linear-gradient(135deg,#0a0f3d 0%,#1a3ab8 50%,#0e7bd4 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {isMultiCity ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Multi-City</span>
              <span className="text-white font-black text-lg">
                {multiCityFlights!.map(f => f.origin.code).join(' → ')} → {multiCityFlights![multiCityFlights!.length - 1].destination.code}
              </span>
              <span className="ml-auto bg-white/10 border border-white/20 text-white/80 text-xs font-semibold px-3 py-1 rounded-full">
                {passengerCount} {passengerCount === 1 ? 'Passenger' : 'Passengers'} · {fareName(flight.airline.code, cabinClass, flight.flightNumber)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-lg"
                  style={{ backgroundColor: flight.airline.color }}>
                  {flight.airline.code}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="font-black text-xl">{flight.origin.code}</span>
                    <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-black text-xl">{flight.destination.code}</span>
                  </div>
                  <p className="text-white/60 text-xs mt-0.5">
                    {formatDate(flight.departureTime, AIRPORT_TZ[flight.origin.code])} ·{' '}
                    {formatTime(flight.departureTime, AIRPORT_TZ[flight.origin.code])} – {formatTime(flight.arrivalTime, AIRPORT_TZ[flight.destination.code])} ·{' '}
                    {flight.flightNumber}
                  </p>
                </div>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <span className="bg-white/10 border border-white/20 text-white/80 text-xs font-semibold px-3 py-1 rounded-full">
                  {fareName(flight.airline.code, cabinClass, flight.flightNumber)}
                </span>
                <span className="bg-white/10 border border-white/20 text-white/80 text-xs font-semibold px-3 py-1 rounded-full">
                  {passengerCount} {passengerCount === 1 ? 'Passenger' : 'Passengers'}
                </span>
                {returnFlight && (
                  <span className="bg-white/10 border border-white/20 text-white/80 text-xs font-semibold px-3 py-1 rounded-full">
                    Round Trip
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-0 text-xs font-semibold">
            {[
              { n: 1, label: 'Traveler Info' },
              { n: 2, label: 'Seat Selection' },
              { n: 3, label: 'Payment' },
            ].map(({ n, label }, i) => (
              <div key={n} className="flex items-center">
                {i > 0 && <div className="h-px w-6 sm:w-10 bg-blue-200 mx-1 sm:mx-2" />}
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg,#1a3ab8,#0e7bd4)' }}>
                    {n}
                  </div>
                  <span className="hidden sm:block text-gray-600">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* ── Left: form sections ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Errors */}
              {errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <p className="text-sm font-bold text-red-700 mb-1.5 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    Please fix the following
                  </p>
                  {errors.map((e, i) => <p key={i} className="text-xs text-red-600 pl-6">• {e}</p>)}
                </div>
              )}

              {/* ── Section 1: Traveler Info ── */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="px-6 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#0a0f3d,#1a3ab8)' }}>
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm tracking-tight">Traveler Information</p>
                    <p className="text-white/50 text-[11px] mt-0.5">Enter details as they appear on your ID</p>
                  </div>
                </div>
                <div className="p-6">
                  {pax.map((p, i) => (
                    <div key={i} className={i > 0 ? 'mt-7 pt-7 border-t border-gray-100' : ''}>
                      {passengerCount > 1 && (
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Passenger {i + 1}</p>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">First Name *</label>
                          <input type="text" value={p.firstName}
                            onChange={e => setPax(prev => prev.map((x, idx) => idx === i ? { ...x, firstName: e.target.value } : x))}
                            placeholder="John" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Last Name *</label>
                          <input type="text" value={p.lastName}
                            onChange={e => setPax(prev => prev.map((x, idx) => idx === i ? { ...x, lastName: e.target.value } : x))}
                            placeholder="Smith" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Date of Birth *</label>
                          <input type="date" value={p.dob}
                            onChange={e => setPax(prev => prev.map((x, idx) => idx === i ? { ...x, dob: e.target.value } : x))}
                            max={new Date().toISOString().split('T')[0]}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Gender *</label>
                          <select value={p.gender}
                            onChange={e => setPax(prev => prev.map((x, idx) => idx === i ? { ...x, gender: e.target.value } : x))}
                            className={inputCls}>
                            <option value="">Select</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="X">Non-binary / Other</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Passport / ID Number <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                          <input type="text" value={p.documentNumber}
                            onChange={e => setPax(prev => prev.map((x, idx) => idx === i ? { ...x, documentNumber: e.target.value } : x))}
                            placeholder="e.g. US1234567" className={inputCls} />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Contact Details</p>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Email Address *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputCls} />
                    <p className="text-xs text-gray-400 mt-2">Your e-ticket and confirmation will be sent here.</p>
                  </div>
                </div>
              </div>

              {/* ── Section 2: Seat Selection ── */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="px-6 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#1a3ab8,#0e7bd4)' }}>
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm tracking-tight">Choose Your Seat</p>
                    <p className="text-white/50 text-[11px] mt-0.5">Optional — skip to auto-assign at check-in</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-lg bg-gray-200" />Taken</div>
                    <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-lg bg-blue-600" />Selected</div>
                    {cabinClass === 'economy' ? (
                      <>
                        <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-lg border-2 border-teal-400 bg-teal-50" />Extra legroom</div>
                        <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-lg border border-gray-300 bg-white" />Window/Aisle (+$)</div>
                        <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-lg border border-gray-300 bg-white opacity-50" />Middle (free)</div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-lg border border-gray-300 bg-white" />Available</div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <div className="min-w-max mx-auto" style={{ maxWidth: 340 }}>
                      <div className="flex items-center justify-center gap-1 mb-2 ml-8">
                        {colLabels.map((c, i) => (
                          <div key={i} className={`w-7 text-center text-xs font-bold text-gray-400 ${c === '' ? 'w-3' : ''}`}>{c}</div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {seatMap.map(({ row, seats }) => (
                          <div key={row} className="flex items-center gap-1">
                            <div className="w-7 text-right text-xs text-gray-300 pr-1 shrink-0">{row}</div>
                            {(cabinClass === 'first'
                              ? seats.map(s => (
                                  <SeatCell key={s.code} seat={s} selected={selectedSeats.includes(s.code)} onClick={() => toggleSeat(s.code, s.taken)} />
                                )).reduce<React.ReactNode[]>((acc, el, i) => { if (i === 2) acc.push(<div key="aisle" className="w-3" />); acc.push(el); return acc }, [])
                              : seats.map(s => (
                                  <SeatCell key={s.code} seat={s} selected={selectedSeats.includes(s.code)} onClick={() => toggleSeat(s.code, s.taken)} />
                                )).reduce<React.ReactNode[]>((acc, el, i) => { if (i === 3) acc.push(<div key="aisle" className="w-3" />); acc.push(el); return acc }, [])
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {selectedSeats.length > 0 && (
                    <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">Seats selected</p>
                        <p className="text-sm font-black text-gray-800 mt-0.5">{selectedSeats.join(', ')}</p>
                      </div>
                      {selectedCost > 0 && (
                        <p className="text-sm font-bold text-blue-700">+${selectedCost}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Section 3: Payment ── */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="px-6 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#0e7bd4,#00c2e8)' }}>
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm tracking-tight">Secure Payment</p>
                    <p className="text-white/50 text-[11px] mt-0.5">256-bit SSL · PCI DSS Level 1 certified</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="h-6 px-2 rounded bg-white/20 flex items-center">
                      <span className="text-[10px] font-black text-white tracking-tight">VISA</span>
                    </div>
                    <div className="h-6 px-1.5 rounded bg-white/20 flex items-center gap-0.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-300 -ml-1" />
                    </div>
                    <div className="h-6 px-2 rounded bg-white/20 flex items-center">
                      <span className="text-[10px] font-black text-white">AMEX</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Credit card preview */}
                  <div className="relative rounded-2xl overflow-hidden h-40 p-5 flex flex-col justify-between select-none"
                    style={{ background: 'linear-gradient(135deg,#0a0f3d 0%,#1a3ab8 50%,#0e7bd4 100%)' }}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
                    <div className="relative flex items-start justify-between">
                      <div className="w-8 h-6 rounded bg-yellow-400/80 flex items-center justify-center">
                        <div className="w-4 h-3 border border-yellow-700/40 rounded-sm grid grid-cols-2 gap-0">
                          <div className="bg-yellow-600/30 rounded-sm" />
                          <div className="bg-yellow-600/30 rounded-sm" />
                        </div>
                      </div>
                      <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest">SkyBookFare</div>
                    </div>
                    <div className="relative">
                      <p className="font-mono text-white text-sm font-bold tracking-widest mb-2">{displayCardNum}</p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Card Holder</p>
                          <p className="text-white text-xs font-bold tracking-wide">{cardName || 'YOUR NAME'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Expires</p>
                          <p className="text-white text-xs font-bold">{expiry || 'MM/YY'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Card Number *</label>
                    <input type="text" inputMode="numeric" value={cardNumber}
                      onChange={e => setCardNumber(formatCard(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      className={`${inputCls} font-mono`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Expiry *</label>
                      <input type="text" inputMode="numeric" value={expiry}
                        onChange={e => setExpiry(fmtExpiry(e.target.value))}
                        placeholder="MM/YY"
                        className={`${inputCls} font-mono`} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">CVV *</label>
                      <input type="text" inputMode="numeric" value={cvv}
                        onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,4))}
                        placeholder="123"
                        className={`${inputCls} font-mono`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Name on Card *</label>
                    <input type="text" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())}
                      placeholder="JOHN SMITH"
                      className={`${inputCls} uppercase font-mono tracking-wide`} />
                  </div>
                </div>
              </div>

              {/* ── Pay button ── */}
              <button type="submit" disabled={loading}
                className="w-full text-white font-black py-4 rounded-2xl text-base transition-all disabled:opacity-70 flex items-center justify-center gap-3 shadow-xl"
                style={{ background: loading ? '#9ca3af' : 'linear-gradient(135deg,#f97316,#ec4899)', boxShadow: loading ? 'none' : '0 8px 32px rgba(249,115,22,0.35)' }}>
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing your booking…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Pay ${formatPrice(totalPrice)} &amp; Confirm Booking
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                By completing this purchase you agree to our{' '}
                <a href="/terms" className="underline hover:text-gray-600">Terms of Service</a> and{' '}
                <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>.
              </p>
            </div>

            {/* ── Right: Order Summary sidebar ── */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 sticky top-24">
                {/* Dark header */}
                <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg,#0a0f3d,#1a3ab8)' }}>
                  <p className="text-white font-black text-sm">Order Summary</p>
                  <p className="text-white/50 text-[11px] mt-0.5">
                    {isMultiCity ? 'Multi-City' : returnFlight ? 'Round Trip' : 'One Way'} · {passengerCount} {passengerCount === 1 ? 'pax' : 'pax'} · {fareName(flight.airline.code, cabinClass, flight.flightNumber)}
                  </p>
                </div>

                {/* Flights */}
                <div className="bg-white p-4 space-y-3">
                  {isMultiCity
                    ? multiCityFlights!.map((f, i) => (
                        <FlightMini key={f.id} flight={f} cabinClass={cabinClass} label={`Leg ${i + 1}`} displayPrice={legPriceById[f.id]} />
                      ))
                    : <>
                        <FlightMini flight={flight} cabinClass={cabinClass} label={returnFlight ? 'Outbound' : 'Flight'} displayPrice={legPriceById[flight.id]} />
                        {returnFlight && <FlightMini flight={returnFlight} cabinClass={cabinClass} label="Return" displayPrice={legPriceById[returnFlight.id]} />}
                      </>
                  }

                  {selectedSeats.length > 0 && (
                    <div className="bg-blue-50 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">Seats</p>
                      <p className="text-sm font-bold text-gray-800">{selectedSeats.join(', ')}</p>
                    </div>
                  )}
                </div>

                {/* Price breakdown */}
                <div className="bg-gray-50 border-t border-gray-100 px-4 pt-4 pb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Price Breakdown</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Base fare × {passengerCount}</span>
                      <span className="font-medium">${formatPrice(baseFare)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Taxes &amp; fees</span>
                      <span className="font-medium">${formatPrice(taxes)}</span>
                    </div>
                    {seatAddonCost > 0 && (
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Seat selection</span>
                        <span className="font-medium">+${formatPrice(seatAddonCost)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-black text-gray-900">Total</span>
                  <span className="text-xl font-black" style={{ background: 'linear-gradient(135deg,#1a3ab8,#0e7bd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    ${formatPrice(totalPrice)}
                  </span>
                </div>

                {/* Trust signals */}
                <div className="bg-white border-t border-gray-100 px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Secure checkout · No hidden fees
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    E-ticket sent instantly to your email
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-amber-600">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    Non-refundable fare · Changes may incur a fee
                  </div>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}

function FlightMini({ flight, cabinClass, label, displayPrice }: {
  flight: Flight
  cabinClass: 'economy'|'business'|'first'
  label: string
  displayPrice?: number
}) {
  const price = displayPrice ?? getPriceForClass(flight, cabinClass)
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{label}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-white font-bold text-[8px] shrink-0"
            style={{ backgroundColor: flight.airline.color }}>
            {flight.airline.code}
          </div>
          <span className="text-[11px] font-semibold text-gray-600">{flight.flightNumber}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-center">
          <p className="text-base font-black text-gray-900 leading-none">{formatTime(flight.departureTime, AIRPORT_TZ[flight.origin.code])}</p>
          <p className="text-[11px] font-bold text-gray-400 mt-0.5">{flight.origin.code}</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[10px] text-gray-400">{formatDuration(flight.durationMinutes)}</p>
          <div className="flex items-center my-0.5">
            <div className="flex-1 h-px bg-gray-200" />
            {flight.stops > 0 && <div className="w-1.5 h-1.5 rounded-full border border-gray-400 bg-white shrink-0 mx-0.5" />}
            <svg className="w-3 h-3 text-gray-300 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
          <p className="text-[10px]">
            {flight.stops === 0
              ? <span className="text-green-600 font-medium">Nonstop</span>
              : <span className="text-gray-400">{flight.stops} stop{flight.stops > 1 ? 's' : ''}{flight.stopCity ? ` · ${flight.stopCity}` : ''}</span>}
          </p>
        </div>
        <div className="text-center">
          <p className="text-base font-black text-gray-900 leading-none">{formatTime(flight.arrivalTime, AIRPORT_TZ[flight.destination.code])}</p>
          <p className="text-[11px] font-bold text-gray-400 mt-0.5">{flight.destination.code}</p>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-[10px] text-gray-400">
        <span>{formatDate(flight.departureTime, AIRPORT_TZ[flight.origin.code])}</span>
        <span className="font-medium text-gray-500">${formatPrice(price)} / person</span>
      </div>
    </div>
  )
}

function SeatCell({ seat, selected, onClick }: { seat: SeatInfo; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={seat.taken}
      title={`${seat.code}${seat.price > 0 ? ` +$${seat.price}` : ' Free'}`}
      className={`w-7 h-7 rounded-lg text-[9px] font-bold transition-all ${
        seat.taken     ? 'bg-gray-200 text-gray-300 cursor-not-allowed'
        : selected     ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40'
        : seat.extraLegroom ? 'border-2 border-teal-400 bg-teal-50 text-teal-700 hover:bg-teal-100'
        : 'bg-white border border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
      }`}>
      {selected ? '✓' : seat.taken ? '' : seat.price > 0 ? String(seat.price) : '–'}
    </button>
  )
}
