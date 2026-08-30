import type { Metadata } from 'next'
import Link from 'next/link'
import { AIRPORTS, type Airport } from '@/lib/data'

// ── Popular route pairs (both directions are generated) ───────────────────────
const POPULAR_PAIRS: [string, string][] = [
  ['JFK','LAX'],['JFK','SFO'],['JFK','MIA'],['JFK','ORD'],['JFK','LAS'],
  ['JFK','ATL'],['JFK','BOS'],['JFK','SEA'],['JFK','DFW'],['JFK','DEN'],
  ['JFK','CLT'],['JFK','MCO'],['JFK','PHX'],['JFK','BNA'],
  ['LAX','SFO'],['LAX','LAS'],['LAX','PHX'],['LAX','DFW'],['LAX','ORD'],
  ['LAX','ATL'],['LAX','SEA'],['LAX','DEN'],['LAX','MIA'],['LAX','BOS'],
  ['LAX','BNA'],['LAX','MCO'],['LAX','CLT'],
  ['SFO','LAS'],['SFO','BNA'],['SFO','SEA'],['SFO','DEN'],['SFO','ORD'],
  ['SFO','PHX'],['SFO','ATL'],['SFO','MIA'],['SFO','DFW'],['SFO','CLT'],
  ['ATL','ORD'],['ATL','DFW'],['ATL','MIA'],['ATL','CLT'],['ATL','BNA'],
  ['ATL','MCO'],['ATL','BOS'],['ATL','DEN'],['ATL','SEA'],
  ['ORD','DFW'],['ORD','MIA'],['ORD','BOS'],['ORD','DEN'],['ORD','CLT'],
  ['ORD','BNA'],['ORD','MCO'],['ORD','PHX'],['ORD','SEA'],
  ['DFW','BNA'],['DFW','MIA'],['DFW','DEN'],['DFW','MCO'],['DFW','BOS'],
  ['DFW','SEA'],['DFW','PHX'],
  ['BNA','MIA'],['BNA','DEN'],['BNA','CLT'],['BNA','MCO'],['BNA','BOS'],
  ['MIA','BOS'],['MIA','DEN'],['MIA','MCO'],
  ['DEN','SEA'],['DEN','PHX'],['DEN','BOS'],['DEN','LAS'],
  ['EWR','LAX'],['EWR','SFO'],['EWR','MIA'],['EWR','ORD'],['EWR','ATL'],
  ['LGA','ORD'],['LGA','ATL'],['LGA','MIA'],['LGA','DFW'],
  ['SEA','LAS'],['SEA','PHX'],['SEA','DEN'],
  ['LAS','PHX'],['LAS','DFW'],['LAS','ATL'],
  ['MCO','BOS'],['MCO','ORD'],['MCO','DFW'],
  ['CAK','SFO'],['CAK','SJC'],['CAK','ORD'],
]

export function generateStaticParams() {
  const seen = new Set<string>()
  const params: { route: string }[] = []
  for (const [a, b] of POPULAR_PAIRS) {
    const fwd = `${a.toLowerCase()}-to-${b.toLowerCase()}`
    const rev = `${b.toLowerCase()}-to-${a.toLowerCase()}`
    if (!seen.has(fwd)) { seen.add(fwd); params.push({ route: fwd }) }
    if (!seen.has(rev)) { seen.add(rev); params.push({ route: rev }) }
  }
  return params
}

export const dynamicParams = true

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseRoute(slug: string): { from: Airport; to: Airport } | null {
  const parts = slug.split('-to-')
  if (parts.length !== 2) return null
  const from = AIRPORTS.find(a => a.code === parts[0].toUpperCase())
  const to   = AIRPORTS.find(a => a.code === parts[1].toUpperCase())
  return from && to ? { from, to } : null
}

function haversineKm(a: Airport, b: Airport): number {
  const R    = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLon = (b.lon - a.lon) * Math.PI / 180
  const x    = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
}

function estimateDuration(km: number): number {
  return Math.round(km / 850 * 60 + 35)
}

function fmtDur(mins: number): string {
  return `${Math.floor(mins/60)}h ${mins % 60}m`
}

function estimatePrice(km: number): number {
  if (km < 500)  return 69
  if (km < 1000) return 99
  if (km < 1800) return 139
  if (km < 2800) return 179
  return 229
}

function nextFriday(): string {
  const d = new Date()
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7))
  return d.toISOString().split('T')[0]
}

function relatedRoutes(from: string): [string,string][] {
  return POPULAR_PAIRS
    .flatMap(([a, b]) => [[a,b],[b,a]] as [string,string][])
    .filter(([a, b]) => a === from && b !== from)
    .slice(0, 6)
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ route: string }> }): Promise<Metadata> {
  const { route } = await params
  const parsed = parseRoute(route)
  if (!parsed) return { title: 'Route Not Found | SkyBookFare' }
  const { from, to } = parsed
  const price = estimatePrice(haversineKm(from, to))
  return {
    title: `Cheap Flights ${from.city} to ${to.city} (${from.code}–${to.code}) | From $${price} | SkyBookFare`,
    description: `Find the cheapest flights from ${from.city} (${from.code}) to ${to.city} (${to.code}). Compare fares across all major airlines. Book now from $${price} on SkyBookFare — no booking fees.`,
    openGraph: {
      title: `${from.city} → ${to.city} Flights from $${price}`,
      description: `Compare flights from ${from.city} to ${to.city}. All airlines, no hidden fees.`,
    },
    alternates: { canonical: `https://skybookfare.com/flights/${route}` },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function RoutePage({ params }: { params: Promise<{ route: string }> }) {
  const { route } = await params
  const parsed = parseRoute(route)

  if (!parsed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">✈️</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Route not found</h1>
          <p className="text-gray-500 mb-6">We couldn&apos;t find that airport pair. Try searching below.</p>
          <Link href="/" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
            Search Flights
          </Link>
        </div>
      </div>
    )
  }

  const { from, to } = parsed
  const km       = haversineKm(from, to)
  const duration = estimateDuration(km)
  const price    = estimatePrice(km)
  const date     = nextFriday()
  const related  = relatedRoutes(from.code)

  const STATS = [
    { label: 'Avg Flight Time', value: fmtDur(duration) },
    { label: 'Distance',        value: `${Math.round(km).toLocaleString()} km` },
    { label: 'Fares From',      value: `$${price}` },
    { label: 'Daily Flights',   value: km < 800 ? '10–18' : km < 2000 ? '6–12' : '4–8' },
  ]

  const FAQS = [
    {
      q: `How long is the flight from ${from.city} to ${to.city}?`,
      a: `The average flight from ${from.city} (${from.code}) to ${to.city} (${to.code}) takes about ${fmtDur(duration)}. Nonstop flights are fastest; connecting flights add 1–3 hours depending on the layover.`,
    },
    {
      q: `What is the cheapest time to fly from ${from.city} to ${to.city}?`,
      a: `Fares on the ${from.city}–${to.city} route are typically lowest on Tuesdays and Wednesdays. Booking 3–6 weeks in advance and flying mid-week usually gets you the best deal. Avoid holiday weekends for the lowest prices.`,
    },
    {
      q: `Which airlines fly from ${from.code} to ${to.code}?`,
      a: `American Airlines, Delta, and United are the most common carriers on this route. Southwest, JetBlue, and Alaska Airlines also operate flights depending on the season. SkyBookFare compares all of them at once so you always get the best available fare.`,
    },
    {
      q: `Does ${from.code} to ${to.code} have nonstop flights?`,
      a: km < 2500
        ? `Yes — nonstop flights are widely available between ${from.city} and ${to.city}. Connecting flights via hubs like Dallas, Atlanta, or Chicago are also available and sometimes cheaper.`
        : `Nonstop flights on the ${from.city}–${to.city} route are available but limited. Most flights connect through a major hub such as Dallas, Chicago, or Atlanta.`,
    },
    {
      q: `How far in advance should I book flights to ${to.city}?`,
      a: `For domestic US flights, the sweet spot is typically 3–8 weeks before departure. Last-minute fares (within 7 days) are usually the most expensive. SkyBookFare shows live pricing so you can track when fares drop.`,
    },
  ]

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen bg-gray-50">

        {/* ── Hero ── */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center gap-2 text-blue-300 text-sm mb-4">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/flights" className="hover:text-white transition-colors">Flights</Link>
              <span>/</span>
              <span className="text-white">{from.code} → {to.code}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black mb-2 leading-tight">
              Cheap Flights from {from.city} to {to.city}
            </h1>
            <p className="text-blue-200 text-lg mb-8">
              {from.name} ({from.code}) → {to.name} ({to.code})
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {STATS.map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide mb-0.5">{s.label}</p>
                  <p className="text-white font-black text-xl">{s.value}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href={`/search?from=${from.code}&to=${to.code}&date=${date}&passengers=1&cabinClass=economy&tripType=oneWay`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-black px-8 py-3.5 rounded-2xl text-base shadow-lg shadow-orange-500/30 transition-all active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search {from.code} → {to.code} Flights
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

          {/* ── About the route ── */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              About {from.city} to {to.city} Flights
            </h2>
            <div className="prose prose-sm text-gray-600 max-w-none space-y-3">
              <p>
                The <strong>{from.city} ({from.code}) to {to.city} ({to.code})</strong> air corridor is one of the most
                frequently searched US domestic routes. Travelers can expect flight times of approximately{' '}
                <strong>{fmtDur(duration)}</strong> on nonstop services, with the distance between the two cities
                spanning roughly <strong>{Math.round(km).toLocaleString()} km</strong>.
              </p>
              <p>
                Economy fares on this route typically start from <strong>${price}</strong>, though prices fluctuate
                based on demand, season, and how far in advance you book. Business class options are available
                on most mainline carriers and typically run 2–3× the economy fare.
              </p>
              <p>
                Multiple airlines compete on the {from.code}–{to.code} route, keeping fares competitive.
                SkyBookFare compares all available options in real time so you always see the lowest current price
                across every airline with no booking fees added.
              </p>
            </div>
          </section>

          {/* ── Booking tips ── */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tips for Booking {from.code} to {to.code}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: '📅',
                  title: 'Book 3–6 Weeks Ahead',
                  text: 'Domestic fares are cheapest in this window. Any earlier and airlines haven\'t released sale inventory. Any later and prices spike.',
                },
                {
                  icon: '📆',
                  title: 'Fly Tuesday or Wednesday',
                  text: 'Mid-week departures are consistently cheaper. Avoid Sunday evenings and Friday afternoons — peak business travel days.',
                },
                {
                  icon: '🔔',
                  title: 'Compare All Cabins',
                  text: 'Sometimes the difference between Economy and Main Cabin Select is just $30–50 — worth checking for the extra flexibility.',
                },
              ].map(tip => (
                <div key={tip.title} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="text-2xl mb-3">{tip.icon}</div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1.5">{tip.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions — {from.city} to {to.city}
            </h2>
            <div className="space-y-5">
              {FAQS.map(faq => (
                <div key={faq.q} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Related routes from origin ── */}
          {related.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">More Flights from {from.city}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {related.map(([a, b]) => {
                  const toAp = AIRPORTS.find(x => x.code === b)
                  if (!toAp) return null
                  const routeKm = haversineKm(from, toAp)
                  return (
                    <Link key={b} href={`/flights/${a.toLowerCase()}-to-${b.toLowerCase()}`}
                      className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all p-4 group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-gray-900 text-sm">{a} → {b}</span>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-500">{from.city} → {toAp.city}</p>
                      <p className="text-xs font-bold text-blue-600 mt-1">From ${estimatePrice(routeKm)}</p>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Search CTA ── */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-black mb-2">Ready to fly {from.code} → {to.code}?</h2>
            <p className="text-blue-200 mb-6 text-sm">Compare all airlines with no booking fees. Fares updated in real time.</p>
            <Link
              href={`/search?from=${from.code}&to=${to.code}&date=${date}&passengers=1&cabinClass=economy&tripType=oneWay`}
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-black px-8 py-3 rounded-xl text-sm hover:bg-blue-50 transition-colors shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Flights Now
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
