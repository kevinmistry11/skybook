import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'My Trips',
  description: 'SkyBookFare does not store tickets. Manage bookings on Kayak or with the airline that issued your ticket.',
}

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">My Trips</h1>
          <p className="text-gray-500 text-sm mt-1">Bookings are completed on Kayak, not on SkyBookFare</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
          <p className="text-gray-700 font-semibold mb-2">SkyBookFare does not issue tickets</p>
          <p className="text-gray-500 mb-4 text-sm max-w-md mx-auto">
            When you select a flight, you continue to Kayak to complete the purchase. Your confirmation, changes,
            cancellations, and check-in are handled by Kayak or the airline — not stored here.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors inline-block">
              Search Flights
            </Link>
            <a
              href="https://www.kayak.com/trips"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-300 text-gray-700 font-semibold px-6 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors inline-block"
            >
              Manage trips on Kayak
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
