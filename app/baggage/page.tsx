import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Baggage Policy — SkyBookFare',
  description: 'Carry-on and checked bag rules for every major US airline, all in one place.',
}

const AIRLINES = [
  {
    name: 'American Airlines',
    code: 'AA',
    carryOn: 'Included (1 bag + 1 personal item)',
    checked1: '$40',
    checked2: '$45',
    oversize: '$200+',
    maxWeight: '50 lb (23 kg)',
    note: 'Basic Economy passengers are not permitted an overhead carry-on bag.',
  },
  {
    name: 'Delta Air Lines',
    code: 'DL',
    carryOn: 'Included (1 bag + 1 personal item)',
    checked1: '$35',
    checked2: '$45',
    oversize: '$200+',
    maxWeight: '50 lb (23 kg)',
    note: 'SkyMiles Medallion members receive free checked bags.',
  },
  {
    name: 'United Airlines',
    code: 'UA',
    carryOn: 'Included (1 bag + 1 personal item)',
    checked1: '$40',
    checked2: '$45',
    oversize: '$200+',
    maxWeight: '50 lb (23 kg)',
    note: 'Basic Economy: no carry-on overhead bin access.',
  },
  {
    name: 'Southwest Airlines',
    code: 'WN',
    carryOn: 'Included (1 bag + 1 personal item)',
    checked1: 'FREE',
    checked2: 'FREE',
    oversize: '$75+',
    maxWeight: '50 lb (23 kg)',
    note: 'Southwest does not charge change fees on any fare. Cancellations can be converted to travel credit at no charge on all fare types.',
  },
  {
    name: 'JetBlue Airways',
    code: 'B6',
    carryOn: 'Included (1 bag + 1 personal item)',
    checked1: '$35',
    checked2: '$45',
    oversize: '$150+',
    maxWeight: '50 lb (23 kg)',
    note: 'Blue Basic fare: carry-on bag must fit under the seat.',
  },
  {
    name: 'Alaska Airlines',
    code: 'AS',
    carryOn: 'Included (1 bag + 1 personal item)',
    checked1: '$35',
    checked2: '$45',
    oversize: '$75+',
    maxWeight: '50 lb (23 kg)',
    note: 'MVP Gold 75K members receive 3 free checked bags.',
  },
  {
    name: 'Frontier Airlines',
    code: 'F9',
    carryOn: '$39–$59 (at booking) or $99 at gate',
    checked1: '$39–$59',
    checked2: '$49–$79',
    oversize: '$75+',
    maxWeight: '40 lb (18 kg)',
    note: 'Personal item (under-seat) is always free. Frontier is a bare-fare carrier — all add-ons are a la carte.',
  },
]

export default function BaggagePage() {
  return (
    <div className="bg-gray-50 min-h-screen py-16 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-12">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Baggage Policy</p>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Baggage Rules by Airline</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            All fees shown are per person, one way, for Economy class. Fees are subject to change by airlines at any time.
          </p>
        </div>

        {/* Size limits */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 mb-8">
          <h2 className="font-bold text-gray-900 mb-5">Standard size limits (most carriers)</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: '🎒', label: 'Personal item', size: 'Up to 18 × 14 × 8 in', note: 'Must fit under the seat in front of you' },
              { icon: '🧳', label: 'Carry-on bag', size: 'Up to 22 × 14 × 9 in', note: 'Must fit in the overhead bin' },
              { icon: '💼', label: 'Checked bag', size: 'Up to 62 linear inches', note: 'L+W+H combined, max 50 lb for most airlines' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className="font-bold text-gray-900 text-sm mb-1">{s.label}</p>
                <p className="text-blue-700 font-semibold text-xs mb-1">{s.size}</p>
                <p className="text-gray-500 text-xs">{s.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Per-airline table */}
        <div className="space-y-4">
          {AIRLINES.map(a => (
            <div key={a.code} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
                <span className="font-black text-blue-700 text-sm w-8 shrink-0">{a.code}</span>
                <span className="font-bold text-gray-900">{a.name}</span>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                  {[
                    { label: 'Carry-on', value: a.carryOn },
                    { label: '1st Checked Bag', value: a.checked1 },
                    { label: '2nd Checked Bag', value: a.checked2 },
                    { label: 'Max Weight', value: a.maxWeight },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{f.label}</p>
                      <p className={`text-sm font-semibold ${f.value === 'FREE' ? 'text-green-600' : 'text-gray-900'}`}>{f.value}</p>
                    </div>
                  ))}
                </div>
                {a.note && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                    ℹ️ {a.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          Baggage fees are set and collected by airlines, not SkyBookFare. Fees shown are estimates and subject to change.
          Always confirm with your airline before travel.
        </p>
      </div>
    </div>
  )
}
