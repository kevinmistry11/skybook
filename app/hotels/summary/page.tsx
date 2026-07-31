import type { Metadata } from 'next'
import Link from 'next/link'
import { formatMoney } from '@/lib/hotels'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Review your stay',
  description: 'Review your selected hotel and stay details on SkyBookFare.',
  alternates: { canonical: `${SITE_URL}/hotels/summary` },
  robots: { index: false, follow: true },
}

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function HotelSummaryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const s = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '')

  const name = s('name')
  const q = s('q')
  const checkIn = s('checkIn')
  const checkOut = s('checkOut')
  const nights = Math.max(1, Number(s('nights')) || 1)
  const adults = Math.max(1, Number(s('adults')) || 2)
  const children = Math.max(0, Number(s('children')) || 0)
  const rooms = Math.max(1, Number(s('rooms')) || 1)
  const ppn = s('ppn') ? Number(s('ppn')) : null
  const total = s('total') ? Number(s('total')) : ppn != null ? ppn * nights : null
  const stars = s('stars') ? Number(s('stars')) : null
  const rating = s('rating') ? Number(s('rating')) : null
  const reviews = s('reviews') ? Number(s('reviews')) : null
  const free = s('free') === '1'
  const src = s('src')
  const thumb = s('thumb')

  const backParams = new URLSearchParams({
    q,
    checkIn,
    checkOut,
    adults: String(adults),
    children: String(children),
    rooms: String(rooms),
  })
  const backHref = `/search/hotels?${backParams.toString()}`

  if (!name) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-3xl mb-3">🏨</p>
          <p className="font-semibold text-gray-700 mb-4">No hotel selected</p>
          <Link href="/hotels" className="text-blue-600 font-semibold hover:underline">
            ← Back to hotel search
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2 text-sm">
          <Link href="/hotels" className="font-semibold text-blue-600 hover:underline">
            Hotels
          </Link>
          <span className="text-gray-300">/</span>
          <Link href={backHref} className="font-semibold text-blue-600 hover:underline">
            Results
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500">Review</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Review your stay</h1>

        {/* Hotel card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-48 shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 relative min-h-[150px]">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-40">
                  🏨
                </div>
              )}
              {stars != null && stars > 0 && (
                <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {stars}-star
                </span>
              )}
            </div>
            <div className="flex-1 p-5">
              <h2 className="text-lg font-black text-gray-900">{name}</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1.5">
                {rating != null && (
                  <span className="inline-flex items-center gap-1 font-bold text-gray-800">
                    <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {rating.toFixed(1)}
                    </span>
                    {reviews != null && (
                      <span className="font-normal text-gray-400">
                        ({reviews.toLocaleString()} reviews)
                      </span>
                    )}
                  </span>
                )}
                {free && <span className="text-green-700 font-semibold">Free cancellation</span>}
                {src && <span className="text-gray-400">via {src}</span>}
              </div>
              <p className="text-sm text-gray-500 mt-3">{q}</p>
            </div>
          </div>
        </div>

        {/* Stay details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Stay details
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Check-in</p>
              <p className="font-bold text-gray-900">{fmtDate(checkIn)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Check-out</p>
              <p className="font-bold text-gray-900">{fmtDate(checkOut)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Nights</p>
              <p className="font-bold text-gray-900">{nights}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Guests</p>
              <p className="font-bold text-gray-900">
                {adults} adult{adults !== 1 ? 's' : ''}
                {children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''} · {rooms} room{rooms !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Price summary */}
        {ppn != null && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Price summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>
                  {formatMoney(ppn)} × {nights} night{nights !== 1 ? 's' : ''}
                  {rooms > 1 ? ` × ${rooms} rooms` : ''}
                </span>
                <span>{formatMoney((total ?? ppn * nights) * (rooms || 1))}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-900">Estimated total</span>
                <span className="text-2xl font-black text-gray-900 tabular-nums">
                  {formatMoney((total ?? ppn * nights) * (rooms || 1))}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Taxes and fees may apply. Final price is confirmed at checkout.
              </p>
            </div>
          </div>
        )}

        {/* No-payment note */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
          This is a booking summary. <strong>No payment is being collected yet</strong> — secure
          checkout is coming soon. Your stay isn&apos;t reserved until checkout is available.
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 font-bold px-5 py-3 rounded-xl text-sm hover:border-blue-300 transition-colors"
          >
            ← Back to results
          </Link>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-1.5 bg-gray-200 text-gray-400 font-bold px-5 py-3 rounded-xl text-sm cursor-not-allowed flex-1"
          >
            Continue to checkout — coming soon
          </button>
        </div>
      </div>
    </div>
  )
}
