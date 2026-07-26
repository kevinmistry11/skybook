import Link from 'next/link'

const POPULAR_ROUTES = [
  { from: 'JFK', to: 'LAX', label: 'New York → Los Angeles' },
  { from: 'ORD', to: 'MIA', label: 'Chicago → Miami' },
  { from: 'LAX', to: 'SFO', label: 'Los Angeles → San Francisco' },
  { from: 'ATL', to: 'DEN', label: 'Atlanta → Denver' },
  { from: 'DFW', to: 'ORD', label: 'Dallas → Chicago' },
  { from: 'BOS', to: 'MIA', label: 'Boston → Miami' },
]

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 14)
const defaultDate = tomorrow.toISOString().split('T')[0]

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <span className="text-white font-bold text-lg">SkyBookFare</span>
            </div>
            <p className="text-sm leading-relaxed mb-3">
              Search and compare flights across all major US airlines. Real schedules, transparent pricing.
            </p>
            <p className="text-xs leading-relaxed text-gray-500">
              601 Montgomery St, Suite 1400<br />
              San Francisco, CA 94111<br />
              1-800-759-2665
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About SkyBookFare</Link></li>
              <li><Link href="/about#how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/account" className="hover:text-white transition-colors">My Trips</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/baggage" className="hover:text-white transition-colors">Baggage Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Popular Routes</h4>
            <ul className="space-y-2 text-sm">
              {POPULAR_ROUTES.map(r => (
                <li key={r.label}>
                  <Link
                    href={`/search?from=${r.from}&to=${r.to}&date=${defaultDate}&passengers=1&cabinClass=economy&tripType=oneWay`}
                    className="hover:text-white transition-colors"
                  >
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <p>© 2026 SkyBookFare, Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
