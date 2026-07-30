import type { Metadata } from 'next'
import Link from 'next/link'
import HotelSearchForm from '@/app/_components/HotelSearchForm'
import { SITE_NAME, SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Hotels — Live rates & partner booking',
  description:
    'Search hotels with live rates on SkyBookFare. Compare stays and book on Kayak or partner sites with no booking fees from us.',
  alternates: { canonical: `${SITE_URL}/hotels` },
}

const DESTINATIONS = [
  { q: 'Cleveland, OH', label: 'Cleveland', blurb: 'Near CLE Hopkins' },
  { q: 'San Francisco, CA', label: 'San Francisco', blurb: 'Downtown & SFO' },
  { q: 'New York, NY', label: 'New York', blurb: 'Manhattan & beyond' },
  { q: 'Miami, FL', label: 'Miami', blurb: 'Beach & downtown' },
  { q: 'Chicago, IL', label: 'Chicago', blurb: 'Loop & lakeshore' },
  { q: 'Los Angeles, CA', label: 'Los Angeles', blurb: 'LAX & Hollywood' },
]

function defaultDates() {
  const inD = new Date()
  inD.setDate(inD.getDate() + 14)
  const outD = new Date(inD)
  outD.setDate(outD.getDate() + 3)
  const iso = (d: Date) => d.toISOString().split('T')[0]
  return { checkIn: iso(inD), checkOut: iso(outD) }
}

export default function HotelsPage() {
  const { checkIn, checkOut } = defaultDates()

  return (
    <div className="bg-gray-50 min-h-screen">
      <section
        className="relative"
        style={{
          background:
            'linear-gradient(145deg,#0a0f3d 0%,#1a3ab8 40%,#0e7bd4 75%,#00c2e8 100%)',
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="text-center mb-8">
            <p className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-white/20 uppercase tracking-widest">
              🏨 Live hotel rates · Book on partners
            </p>
            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-3 tracking-tight">
              Find hotels with live prices
            </h1>
            <p className="text-blue-100/90 text-base sm:text-lg max-w-2xl mx-auto">
              Search stays on {SITE_NAME}, compare nightly rates, then complete booking on Kayak
              or a partner site — we never charge booking fees.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl shadow-black/30 p-6 sm:p-8">
            <HotelSearchForm variant="hero" />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Popular destinations</h2>
        <p className="text-sm text-gray-500 mb-6">Jump to live rates for common trip cities</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DESTINATIONS.map(d => {
            const href = `/search/hotels?q=${encodeURIComponent(d.q)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=2`
            return (
              <Link
                key={d.q}
                href={href}
                className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all p-5"
              >
                <p className="text-lg font-black text-gray-900 group-hover:text-blue-700">
                  {d.label}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{d.blurb}</p>
                <p className="text-xs font-semibold text-blue-600 mt-3">Search hotels →</p>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16 text-center">
        <p className="text-sm text-gray-500 leading-relaxed">
          Rates are pulled from Google Hotels via our data partner when available. Final price is
          confirmed on the booking partner (e.g. Kayak). {SITE_NAME} may earn a commission at no
          extra cost to you.
        </p>
        <Link href="/" className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline">
          ← Back to flight search
        </Link>
      </section>
    </div>
  )
}
