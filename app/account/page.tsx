'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getBookings } from '@/lib/store'
import { formatTime, formatDate, formatDuration, type CompletedBooking } from '@/lib/data'

export default function AccountPage() {
  const [bookings, setBookings] = useState<CompletedBooking[]>([])
  const [loaded,   setLoaded]   = useState(false)

  useEffect(() => {
    setBookings(getBookings())
    setLoaded(true)
  }, [])

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">My Trips</h1>
          <p className="text-gray-500 text-sm mt-1">All bookings saved in this browser</p>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
            <p className="text-gray-500 mb-4">No trips yet. Book your first flight!</p>
            <Link href="/" className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors inline-block">
              Search Flights
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BookingCard({ booking }: { booking: CompletedBooking }) {
  const { outboundFlight: flight, returnFlight, pnr, cabinClass, totalPrice, passengers } = booking
  const isUpcoming = new Date(flight.departureTime) > new Date()

  return (
    <Link href={`/confirmation/${booking.id}`} className="block">
      <div className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
              style={{ backgroundColor: flight.airline.color }}
            >
              {flight.airline.code}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {flight.origin.city} → {flight.destination.city}
                {returnFlight && ' (Round Trip)'}
              </p>
              <p className="text-xs text-gray-400">{flight.airline.name} · {flight.flightNumber}</p>
            </div>
          </div>
          <div className="text-right shrink-0 ml-2">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${isUpcoming ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {isUpcoming ? 'Upcoming' : 'Past'}
            </span>
            <p className="text-xs text-gray-400 mt-1">Ref: <span className="font-mono font-bold text-gray-600">{pnr}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div>
            <p className="font-bold text-gray-900">{formatTime(flight.departureTime)}</p>
            <p className="text-xs text-gray-500">{flight.origin.code}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-400">{formatDuration(flight.durationMinutes)}</p>
            <div className="h-0.5 bg-gray-200 mt-1" />
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">{formatTime(flight.arrivalTime)}</p>
            <p className="text-xs text-gray-500">{flight.destination.code}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>{formatDate(flight.departureTime)} · {passengers.length} pas · <span className="capitalize">{cabinClass}</span></span>
          <span className="font-semibold text-gray-700">${totalPrice}</span>
        </div>
      </div>
    </Link>
  )
}
