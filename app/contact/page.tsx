'use client'

export default function ContactPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-16 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-12">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Get in touch</p>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Contact Us</h1>
          <p className="text-gray-500 text-lg">Our support team is available 7 days a week.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">

          {/* Contact form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="font-bold text-gray-900 text-lg mb-6">Send us a message</h2>
            <form className="space-y-5" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kayak or airline confirmation (optional)</label>
                <input
                  type="text"
                  placeholder="From your confirmation email"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Subject</label>
                <select className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white">
                  <option>Select a topic</option>
                  <option>Booking help</option>
                  <option>Cancellation &amp; refunds</option>
                  <option>Seat selection</option>
                  <option>Baggage questions</option>
                  <option>Kayak / airline booking</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message</label>
                <textarea
                  rows={5}
                  placeholder="Describe your issue or question..."
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-full transition-colors text-sm"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact details */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
              <h2 className="font-bold text-gray-900 text-base mb-5">Other ways to reach us</h2>
              <div className="space-y-5">
                {[
                  {
                    icon: '📞',
                    label: 'Phone support',
                    value: '1-800-759-2665',
                    detail: 'Mon–Fri 6 AM – 10 PM PT · Sat–Sun 7 AM – 8 PM PT',
                  },
                  {
                    icon: '✉️',
                    label: 'Email support',
                    value: 'support@skybookfare.com',
                    detail: 'Typical response time: under 4 hours',
                  },
                  {
                    icon: '📍',
                    label: 'Headquarters',
                    value: '601 Montgomery St, Suite 1400',
                    detail: 'San Francisco, CA 94111',
                  },
                ].map(c => (
                  <div key={c.label} className="flex gap-4">
                    <span className="text-xl w-8 text-center shrink-0">{c.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">{c.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{c.value}</p>
                      <p className="text-xs text-gray-500">{c.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <h3 className="font-bold text-blue-900 text-sm mb-2">Booking within 24 hours?</h3>
              <p className="text-blue-700 text-xs leading-relaxed">
                For urgent booking issues (travel within 24 hours), please call us directly at
                <strong> 1-800-759-2665</strong> — our priority line is staffed 24/7.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Frequently asked questions</h3>
              <ul className="space-y-2 text-sm text-blue-600">
                <li><a href="/help#cancellation" className="hover:underline">How do I cancel my booking?</a></li>
                <li><a href="/help#change" className="hover:underline">Can I change my flight?</a></li>
                <li><a href="/baggage" className="hover:underline">What&apos;s the baggage allowance?</a></li>
                <li><a href="/help#refund" className="hover:underline">When will I receive my refund?</a></li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
