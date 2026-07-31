import type { Metadata } from 'next'
import Link from 'next/link'
import HotelSearchForm from '@/app/_components/HotelSearchForm'
import HotelResults from '@/app/_components/HotelResults'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Hotel search results',
  description: 'Compare live hotel rates on SkyBookFare and review your stay — no booking fees.',
  alternates: { canonical: `${SITE_URL}/search/hotels` },
  robots: { index: false, follow: true },
}

export default async function HotelSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const q = String(sp.q || sp.destination || '')
  const checkIn = String(sp.checkIn || sp.check_in || '')
  const checkOut = String(sp.checkOut || sp.check_out || '')
  const adults = Math.min(6, Math.max(1, Number(sp.adults || '2') || 2))
  const children = Math.min(6 - adults, Math.max(0, Number(sp.children || '0') || 0))
  const rooms = Math.min(8, Math.max(1, Number(sp.rooms || '1') || 1))

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 text-sm">
              <Link href="/hotels" className="font-semibold text-blue-600 hover:underline">
                Hotels
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-500">Results</span>
            </div>
            <Link href="/" className="text-xs font-semibold text-gray-500 hover:text-gray-800">
              Flights
            </Link>
          </div>
          <HotelSearchForm
            variant="inline"
            defaults={{ q, checkIn, checkOut, adults, children, rooms }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HotelResults q={q} checkIn={checkIn} checkOut={checkOut} adults={adults} childrenCount={children} rooms={rooms} />
      </div>
    </div>
  )
}
