'use client'

import { useState } from 'react'
import Link from 'next/link'

const FAQS = [
  {
    id: 'cancellation',
    category: 'Cancellations & Refunds',
    q: 'How do I cancel my booking?',
    a: 'SkyBookFare does not issue tickets. Cancel through Kayak or the airline that issued your ticket, using the confirmation they sent you. Cancellation is subject to that provider\'s fare rules.',
  },
  {
    id: 'refund',
    category: 'Cancellations & Refunds',
    q: 'When will I receive my refund?',
    a: 'Refunds are handled by Kayak or the airline that charged your card — not by SkyBookFare. Timing and eligibility follow their fare rules and payment policies.',
  },
  {
    id: 'change',
    category: 'Changes',
    q: 'Can I change my flight date or time?',
    a: 'Changes are handled by the airline or Kayak according to the fare rules on your ticket. Use the booking reference from your Kayak or airline confirmation. SkyBookFare cannot change or reissue tickets.',
  },
  {
    id: 'seat',
    category: 'Seats & Upgrades',
    q: 'Can I choose my seat?',
    a: 'Seat selection is offered by Kayak or the airline during their checkout, not on SkyBookFare. Availability and prices depend on the carrier and fare.',
  },
  {
    id: 'baggage-faq',
    category: 'Baggage',
    q: 'How do I know what baggage is included?',
    a: 'Baggage allowances vary by airline and fare type. Each flight card on the search results page displays whether a carry-on bag is included and the checked-bag fee. For full details by airline, see our Baggage Policy page.',
  },
  {
    id: 'payment',
    category: 'Payment',
    q: 'Does SkyBookFare take payment?',
    a: 'SkyBookFare does not process payments and is not PCI DSS certified. When you select a flight, you continue to Kayak to pay. Payment methods are those Kayak or the airline offer.',
  },
  {
    id: 'confirmation',
    category: 'Booking',
    q: 'Where is my booking confirmation?',
    a: 'Your e-ticket and booking reference come from Kayak or the airline after you complete the purchase there — not from SkyBookFare. Check the email you used on Kayak, including spam.',
  },
  {
    id: 'checkin',
    category: 'Booking',
    q: 'How do I check in for my flight?',
    a: 'Check-in is done directly with the airline, not through SkyBookFare. Most airlines open online check-in 24 hours before departure. Use the PNR from your Kayak or airline confirmation on the airline\'s website or app.',
  },
]

export default function HelpPage() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="bg-gray-50 min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-12">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Help Center</p>
          <h1 className="text-4xl font-black text-gray-900 mb-3">How can we help?</h1>
          <p className="text-gray-500">Answers to the most common questions about SkyBookFare.</p>
        </div>

        {/* Quick contact bar */}
        <div className="bg-blue-600 text-white rounded-2xl p-5 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm mb-0.5">Can&apos;t find your answer?</p>
            <p className="text-blue-200 text-xs">Our team is available 7 days a week.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <a href="tel:18007592665" className="bg-white text-blue-600 font-bold text-xs px-4 py-2 rounded-full hover:bg-blue-50 transition-colors">
              📞 Call us
            </a>
            <Link href="/contact" className="border border-white/40 text-white font-bold text-xs px-4 py-2 rounded-full hover:bg-white/10 transition-colors">
              Email support
            </Link>
          </div>
        </div>

        {/* FAQ accordion */}
        <div className="space-y-3">
          {FAQS.map(faq => (
            <div key={faq.id} id={faq.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
                onClick={() => setOpen(open === faq.id ? null : faq.id)}
              >
                <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">{faq.category}</p>
                  <p className="text-sm font-semibold text-gray-900">{faq.q}</p>
                </div>
                <span className={`text-gray-400 text-lg transition-transform shrink-0 ${open === faq.id ? 'rotate-45' : ''}`}>+</span>
              </button>
              {open === faq.id && (
                <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center text-sm text-gray-500">
          Still need help?{' '}
          <Link href="/contact" className="text-blue-600 font-semibold hover:underline">
            Contact our support team →
          </Link>
        </div>
      </div>
    </div>
  )
}
