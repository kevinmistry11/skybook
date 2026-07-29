import type { Metadata } from 'next'
import SearchForm from '@/app/_components/SearchForm'
import AirlineLogoGrid from '@/app/_components/AirlineLogoGrid'
import BookingCounter from '@/app/_components/BookingCounter'
import Link from 'next/link'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  // Brand name first — unambiguous match for "skybookfare" queries
  title: { absolute: 'SkyBookFare | Official Site — Book Cheap Flights' },
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'SkyBookFare | Official Site — Book Cheap Flights',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
}

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Does SkyBookFare charge booking fees?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. SkyBookFare charges zero booking fees. The price you see includes all taxes and carrier fees — nothing is added at checkout." }
    },
    {
      "@type": "Question",
      "name": "How do I find cheap flights on SkyBookFare?",
      "acceptedAnswer": { "@type": "Answer", "text": "Enter your origin, destination, and travel dates on the homepage. SkyBookFare searches all major US airlines including American, Delta, United, Southwest, JetBlue, and Alaska to find the lowest fares." }
    },
    {
      "@type": "Question",
      "name": "Can I book round-trip flights on SkyBookFare?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Select 'Round Trip' on the search form, enter your outbound and return dates, and the total round-trip price is shown upfront on every flight result." }
    },
    {
      "@type": "Question",
      "name": "Which airlines does SkyBookFare search?",
      "acceptedAnswer": { "@type": "Answer", "text": "SkyBookFare searches American Airlines, Delta, United, Southwest, JetBlue, Alaska Airlines, Frontier, and Spirit across 150+ US airports." }
    },
    {
      "@type": "Question",
      "name": "Is SkyBookFare secure?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. SkyBookFare uses 256-bit SSL encryption, is PCI DSS Level 1 certified, and SOC 2 Type II attested. Your payment data is never stored on our servers." }
    },
    {
      "@type": "Question",
      "name": "What is the official SkyBookFare website?",
      "acceptedAnswer": { "@type": "Answer", "text": "The official SkyBookFare website is https://www.skybookfare.com. SkyBookFare is a US flight search and booking site and is not affiliated with similarly named third-party sites." }
    },
    {
      "@type": "Question",
      "name": "How do I spell SkyBookFare?",
      "acceptedAnswer": { "@type": "Answer", "text": "SkyBookFare is one word with capital S, B, and F — SkyBookFare. The domain is skybookfare.com (www.skybookfare.com)." }
    },
  ]
}

const DEALS = [
  { from: 'JFK', to: 'LAX', fromCity: 'New York',      toCity: 'Los Angeles',  price: 178, was: 329, tags: ['Nonstop available'], color: 'from-violet-500 to-purple-600', daysOut: 21 },
  { from: 'ORD', to: 'MIA', fromCity: 'Chicago',       toCity: 'Miami',        price: 138, was: 259, tags: ['Best seller'],        color: 'from-rose-500 to-pink-600',    daysOut: 18 },
  { from: 'LAX', to: 'BOS', fromCity: 'Los Angeles',   toCity: 'Boston',       price: 189, was: 349, tags: ['Nonstop available'], color: 'from-sky-500 to-blue-600',     daysOut: 30 },
  { from: 'JFK', to: 'MIA', fromCity: 'New York',      toCity: 'Miami',        price: 109, was: 219, tags: ['Best value'],         color: 'from-emerald-500 to-teal-600', daysOut: 14 },
  { from: 'SFO', to: 'JFK', fromCity: 'San Francisco', toCity: 'New York',     price: 168, was: 289, tags: ['Deal of the day'],    color: 'from-orange-500 to-amber-600', daysOut: 25 },
  { from: 'ATL', to: 'DEN', fromCity: 'Atlanta',       toCity: 'Denver',       price: 119, was: 219, tags: ['Nonstop'],            color: 'from-cyan-500 to-indigo-600',  daysOut: 12 },
]

function dealDate(daysOut: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysOut)
  return d.toISOString().split('T')[0]
}

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

      {/* ── Hero ── */}
      <section className="relative" style={{ background: 'linear-gradient(145deg,#0a0f3d 0%,#1a3ab8 40%,#0e7bd4 75%,#00c2e8 100%)' }}>
        {/* Decorative layer — overflow-hidden scoped here so the dropdown isn't clipped */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-24">

          {/* Headline */}
          <div className="text-center mb-10">
            <p className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full mb-5 border border-white/20 uppercase tracking-widest">
              <span>✈️</span> All Major US Airlines · One Search
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 tracking-tight">
              SkyBookFare — Book Cheap Flights
            </h1>
            <p className="text-blue-200/90 text-lg font-medium max-w-2xl mx-auto">
              Welcome to the official <strong className="text-white font-bold">SkyBookFare</strong> site
              (skybookfare.com). Search US airlines with no booking fees, no hidden charges, and real prices.
            </p>
          </div>

          {/* Search form — relative + z-10 so its dropdown always paints above trust badges */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl shadow-black/30 p-6 sm:p-8">
            <SearchForm />
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              { icon: '🔒', text: 'PCI DSS Level 1' },
              { icon: '✅', text: 'No booking fees' },
              { icon: '💳', text: 'SOC 2 Type II certified' },
              { icon: '🌎', text: 'All major US airlines' },
            ].map(b => (
              <span key={b.text} className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full">
                <span>{b.icon}</span>{b.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Today's Deals ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-end justify-between mb-7">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Today&apos;s Top Flight Deals</h2>
            <p className="text-gray-500 text-sm mt-1">Fares as of today · Click to search</p>
          </div>
          <span className="hidden sm:block text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
            Round-trip prices shown
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DEALS.map(deal => {
            const pct = Math.round((1 - deal.price / deal.was) * 100)
            return (
              <Link
                key={`${deal.from}-${deal.to}`}
                href={`/search?from=${deal.from}&to=${deal.to}&date=${dealDate(deal.daysOut)}&passengers=1&cabinClass=economy&tripType=roundTrip`}
                className="group bg-white rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-xl transition-all overflow-hidden"
              >
                {/* Gradient header */}
                <div className={`h-2 bg-gradient-to-r ${deal.color}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-black text-gray-900">{deal.fromCity}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-lg font-black text-gray-900">{deal.toCity}</span>
                      </div>
                      <p className="text-xs font-mono text-gray-400 tracking-wide">{deal.from} → {deal.to}</p>
                    </div>
                    <span className={`bg-gradient-to-r ${deal.color} text-white text-xs font-black px-2.5 py-1 rounded-full shrink-0`}>
                      -{pct}%
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="flex flex-wrap gap-1">
                      {deal.tags.map(tag => (
                        <span key={tag} className="inline-block text-xs text-blue-600 font-semibold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 line-through">${deal.was}</p>
                      <p className="text-3xl font-black text-gray-900 leading-none">${deal.price}</p>
                      <p className="text-xs text-gray-400 mt-0.5">per person</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Partner Airlines ── */}
      <section className="bg-white border-y border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-black text-gray-400 uppercase tracking-widest mb-8">
            Searching fares across all major US carriers
          </p>
          <AirlineLogoGrid />
        </div>
      </section>

      {/* ── Why SkyBookFare ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-12">Why travelers choose SkyBookFare</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { gradient: 'from-violet-500 to-purple-600', icon: '💰', title: 'No Booking Fees', body: 'The price you see is the price you pay — taxes and carrier fees included. Always.' },
            { gradient: 'from-sky-500 to-blue-600',     icon: '🔒', title: 'Secure & Private', body: 'PCI DSS Level 1 certified. TLS 1.3 encryption. SOC 2 Type II attested. Your data is never sold.' },
            { gradient: 'from-emerald-500 to-teal-600', icon: '📱', title: 'Instant E-Ticket',  body: 'Your confirmation and e-ticket arrive instantly to your email. No printing needed.' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-7 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-3xl mx-auto mb-5 shadow-lg`}>
                {f.icon}
              </div>
              <h3 className="font-black text-gray-900 text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Booking Counter ── */}
      <section className="bg-white border-y border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <BookingCounter target={3847291} label="Flights booked" />
            <BookingCounter target={98}     label="Satisfaction rate" suffix="%" />
            <BookingCounter target={150}    label="US airports" suffix="+" />
            <BookingCounter target={12}     label="Partner airlines" suffix="+" />
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900 mb-2">Travelers love SkyBookFare</h2>
          <div className="flex justify-center items-center gap-1 text-yellow-400 text-lg">★★★★★</div>
          <p className="text-gray-500 text-sm mt-1">4.8 out of 5 · 14,200+ reviews</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              name: 'Rachel T.',   city: 'Chicago, IL',
              stars: 5,
              text: 'Found a flight from ORD to MIA for $138 round-trip. I\'ve been checking other sites for weeks and nothing came close. Booked in under 2 minutes.',
              initials: 'RT', color: 'from-rose-500 to-pink-600',
            },
            {
              name: 'Marcus W.',  city: 'Los Angeles, CA',
              stars: 5,
              text: 'The price breakdown is totally transparent — no surprise fees at checkout. What I saw was what I paid. Definitely my go-to now for domestic flights.',
              initials: 'MW', color: 'from-blue-500 to-indigo-600',
            },
            {
              name: 'Priya S.',   city: 'New York, NY',
              stars: 5,
              text: 'Seat selection and the whole booking flow was smooth and fast. Got my confirmation email immediately. Flying to SFO next week, can\'t wait!',
              initials: 'PS', color: 'from-violet-500 to-purple-600',
            },
            {
              name: 'James O.',   city: 'Houston, TX',
              stars: 5,
              text: 'Booked a last-minute flight to Denver and it was cheaper than anything else I found. The "seats left" warning made me act fast — good thing I did.',
              initials: 'JO', color: 'from-emerald-500 to-teal-600',
            },
            {
              name: 'Diane K.',   city: 'Seattle, WA',
              stars: 5,
              text: 'I love that it shows the round-trip total upfront on the search results. Other sites make you click through to see the real price. SkyBookFare is honest.',
              initials: 'DK', color: 'from-orange-500 to-amber-600',
            },
            {
              name: 'Anthony R.', city: 'Atlanta, GA',
              stars: 5,
              text: 'Used it for a work trip to Boston. The filtering by departure time was super helpful. Found a nonstop at 7am and was in meetings by noon. Excellent.',
              initials: 'AR', color: 'from-cyan-500 to-sky-600',
            },
          ].map(r => (
            <div key={r.name} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 text-yellow-400 text-sm mb-3">
                {'★'.repeat(r.stars)}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{r.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${r.color} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                  {r.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ_SCHEMA.mainEntity.map((q) => (
            <details key={q.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm group">
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                <span className="font-semibold text-gray-900 text-sm pr-4">{q.name}</span>
                <svg className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-6 pb-4 text-sm text-gray-500 leading-relaxed">{q.acceptedAnswer.text}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-4 sm:mx-8 mb-14 rounded-3xl overflow-hidden">
        <div className="relative" style={{ background: 'linear-gradient(135deg,#0a0f3d 0%,#1a3ab8 50%,#0e7bd4 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative max-w-2xl mx-auto px-6 py-14 text-center">
            <h2 className="text-3xl font-black text-white mb-3">Ready to take off?</h2>
            <p className="text-blue-200 mb-8 text-lg">Search all major airlines and find the best fares in seconds.</p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-black px-10 py-3.5 rounded-full transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5"
            >
              Search Flights Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── Brand / SEO copy (helps Google associate the name SkyBookFare) ── */}
      <section className="bg-white border-t border-gray-100 py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 mb-4">What is SkyBookFare?</h2>
          <div className="space-y-4 text-[15px] text-gray-600 leading-relaxed">
            <p>
              <strong className="text-gray-900">SkyBookFare</strong> is the brand name of this flight search service.
              The official website is <strong className="text-gray-900">www.skybookfare.com</strong> (also known as
              skybookfare.com). SkyBookFare is not affiliated with similarly named third-party booking sites.
            </p>
            <p>
              Travelers use SkyBookFare to compare US domestic fares from American Airlines, Delta, United, Southwest,
              JetBlue, Alaska, Frontier, and more — in one place. SkyBookFare shows transparent pricing up front and
              does not add a separate booking fee at checkout. Search one-way, round-trip, or multi-city trips, pick
              seats, and receive an e-ticket by email.
            </p>
            <p>
              To find the official site, search <strong className="text-gray-900">SkyBookFare</strong> or go directly to{' '}
              <a href={SITE_URL} className="text-blue-600 font-semibold hover:underline">https://www.skybookfare.com</a>.
              Explore <Link href="/flights" className="text-blue-600 font-semibold hover:underline">popular flight routes</Link>,
              read <Link href="/about" className="text-blue-600 font-semibold hover:underline">about SkyBookFare</Link>,
              or <Link href="/contact" className="text-blue-600 font-semibold hover:underline">contact support</Link> at
              support@skybookfare.com.
            </p>
          </div>
        </div>
      </section>

      {/* ── Popular Routes ── */}
      <section className="bg-gray-50 border-t border-gray-100 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Popular Routes on SkyBookFare</h2>
              <p className="text-gray-500 text-sm mt-1">Browse flights on the most searched US routes</p>
            </div>
            <Link href="/flights" className="text-sm font-semibold text-blue-600 hover:underline hidden sm:block">
              View all routes →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              ['JFK','LAX','New York','Los Angeles',178],
              ['LAX','SFO','Los Angeles','San Francisco',79],
              ['SFO','BNA','San Francisco','Nashville',139],
              ['JFK','MIA','New York','Miami',109],
              ['ORD','LAX','Chicago','Los Angeles',149],
              ['ATL','ORD','Atlanta','Chicago',109],
              ['SFO','SEA','San Francisco','Seattle',89],
              ['DFW','BNA','Dallas','Nashville',119],
              ['LAX','LAS','Los Angeles','Las Vegas',59],
              ['JFK','BOS','New York','Boston',79],
              ['BNA','LAX','Nashville','Los Angeles',149],
              ['ORD','MIA','Chicago','Miami',138],
            ].map(([from, to, fc, tc, price]) => (
              <Link key={`${from}-${to}`}
                href={`/flights/${(from as string).toLowerCase()}-to-${(to as string).toLowerCase()}`}
                className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-3.5 transition-all group">
                <p className="font-black text-gray-900 text-sm">{from} → {to}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{fc} to {tc}</p>
                <p className="text-blue-600 font-bold text-sm mt-2">From ${price}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-center sm:hidden">
            <Link href="/flights" className="text-sm font-semibold text-blue-600 hover:underline">
              View all routes →
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
