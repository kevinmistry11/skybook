import type { Metadata } from 'next'
import Link from 'next/link'
import { AIRPORTS, type Airport } from '@/lib/data'

import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Popular US Domestic Flight Routes',
  description: 'Browse cheap flights on the most popular US domestic routes on SkyBookFare. Compare fares across all major airlines on routes like New York to LA, San Francisco to Nashville, and more.',
  alternates: { canonical: `${SITE_URL}/flights` },
}

const FEATURED: [string, string, number][] = [
  ['JFK','LAX',178],['LAX','SFO',79],['SFO','BNA',139],['JFK','MIA',109],
  ['ORD','LAX',149],['ATL','LAX',169],['JFK','ORD',119],['DFW','LAX',139],
  ['SFO','SEA',89],['JFK','BOS',79],['LAX','LAS',59],['ORD','MIA',138],
  ['JFK','LAS',149],['ATL','ORD',109],['BNA','LAX',149],['DEN','LAX',119],
  ['SFO','DEN',119],['LAX','PHX',69],['EWR','LAX',169],['LGA','ATL',119],
  ['CAK','SJC',270],
]

function haversineKm(a: Airport, b: Airport): number {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLon = (b.lon - a.lon) * Math.PI / 180
  const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
}

function estimateDuration(km: number): number {
  return Math.round(km / 850 * 60 + 35)
}

function fmtDur(mins: number): string {
  return `${Math.floor(mins/60)}h ${mins % 60}m`
}

export default function FlightsIndexPage() {
  const cards = FEATURED.map(([from, to, price]) => {
    const fromAp = AIRPORTS.find(a => a.code === from)
    const toAp   = AIRPORTS.find(a => a.code === to)
    if (!fromAp || !toAp) return null
    const km  = haversineKm(fromAp, toAp)
    const dur = estimateDuration(km)
    return { from: fromAp, to: toAp, price, dur, slug: `${from.toLowerCase()}-to-${to.toLowerCase()}` }
  }).filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-black mb-3">Popular US Flight Routes</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Browse cheap flights on the most searched domestic routes. Updated daily with the latest fares.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <h2 className="text-xl font-bold text-gray-900 mb-5">Top Routes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {cards.map((c) => {
            if (!c) return null
            return (
              <Link key={c.slug} href={`/flights/${c.slug}`}
                className="bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-black text-gray-900 text-lg">{c.from.code} → {c.to.code}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.from.city} to {c.to.city}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">{fmtDur(c.dur)}</div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">from</p>
                    <p className="text-xl font-black text-blue-600">${c.price}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* SEO text block */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 prose prose-sm text-gray-600 max-w-none">
          <h2 className="text-xl font-bold text-gray-900 mt-0">Finding Cheap Domestic Flights</h2>
          <p>
            SkyBookFare searches across all major US airlines — American Airlines, Delta, United, Southwest, JetBlue,
            Alaska Airlines, Frontier, and Spirit — to find the lowest available fares on every route.
            There are no booking fees and no fare markups. The price you see is the price you pay.
          </p>
          <p>
            The most popular US domestic routes include the transcontinental corridors between New York and Los Angeles,
            San Francisco and New York, and Chicago and Miami. Routes to leisure destinations like Las Vegas,
            Orlando, and Honolulu also see consistently high demand, especially during school holidays.
          </p>
          <p>
            For the best fares, book 3–6 weeks in advance and consider flying on a Tuesday or Wednesday.
            Avoid peak travel days like Sunday evening and Friday afternoon, and check nearby airports —
            flying into Oakland (OAK) instead of San Francisco (SFO), or Newark (EWR) instead of JFK,
            can often save $30–80 on a ticket.
          </p>
          <Link href="/" className="text-blue-600 font-semibold no-underline hover:underline">
            Search all flights on SkyBookFare →
          </Link>
        </div>

      </div>
    </div>
  )
}
