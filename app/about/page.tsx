import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About SkyBookFare — Our Story',
  description: 'Learn about SkyBookFare, the flight search platform built to give travelers transparent pricing with no booking fees.',
}

export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen">

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-4">About Us</p>
          <h1 className="text-4xl sm:text-5xl font-black mb-5 leading-tight">
            Transparent flights.<br />No surprises.
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            SkyBookFare was founded on a simple belief: booking a flight should be fast, fair, and free of hidden fees.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-black text-gray-900 mb-5">Our Story</h2>
        <div className="prose prose-gray max-w-none text-gray-600 space-y-4 text-[15px] leading-relaxed">
          <p>
            Founded in 2019 and headquartered in San Francisco, SkyBookFare started as a small team of engineers and frequent
            flyers who were tired of clicking through confusing fare matrices, booking-fee surprises at checkout, and
            interfaces that felt designed to obscure rather than inform.
          </p>
          <p>
            We built SkyBookFare to aggregate real-time schedules from all major US carriers — American, Delta, United,
            Southwest, JetBlue, Alaska, and Frontier — and surface them in a single, clean interface with the total
            price shown up front: base fare, taxes, and carrier fees included.
          </p>
          <p>
            Today SkyBookFare serves hundreds of thousands of travelers searching domestic US flights each month. We
            don&apos;t charge booking fees. We don&apos;t sell your data. We make money through airline referral
            partnerships only when you actually complete a booking.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white border-y border-gray-100 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 mb-10 text-center">How SkyBookFare works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Enter your trip details', body: 'Choose your origin, destination, travel dates, cabin class, and number of passengers.' },
              { step: '2', title: 'Compare real fares', body: 'We pull live schedules from all major US airlines and show you the best available fares, side by side.' },
              { step: '3', title: 'Book with confidence', body: 'Select your flight, pick your seat, and pay — taxes and fees included, no checkout surprises.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white font-black text-lg rounded-full flex items-center justify-center mx-auto mb-4">{s.step}</div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { value: '7', label: 'US airlines searched' },
            { value: '350+', label: 'US airports covered' },
            { value: '$0', label: 'Booking fees — ever' },
            { value: '2019', label: 'Year founded' },
          ].map(s => (
            <div key={s.label} className="text-center bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-3xl font-black text-blue-600 mb-1">{s.value}</p>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Security */}
      <section className="bg-white border-y border-gray-100 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">Security & Compliance</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: 'PCI DSS Level 1', body: 'Our payment infrastructure meets the highest level of PCI Data Security Standard compliance, independently audited annually.' },
              { title: 'TLS 1.3 Encryption', body: 'All data in transit is encrypted with TLS 1.3. Payment card data is tokenized and never stored on our servers.' },
              { title: 'SOC 2 Type II', body: 'SkyBookFare holds a SOC 2 Type II attestation, certifying our security, availability, and confidentiality controls.' },
              { title: 'IATA Affiliate Member', body: 'As an IATA affiliate, SkyBookFare adheres to industry standards for fair and transparent distribution of airfare.' },
            ].map(t => (
              <div key={t.title} className="flex gap-4 p-5 rounded-xl border border-gray-100 bg-gray-50">
                <div className="w-8 h-8 shrink-0 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-base">✓</div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{t.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-4">Ready to search smarter?</h2>
        <p className="text-gray-500 mb-8">Find the best fare for your next trip in under 30 seconds.</p>
        <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-full transition-colors">
          Search Flights
        </Link>
      </section>
    </div>
  )
}
