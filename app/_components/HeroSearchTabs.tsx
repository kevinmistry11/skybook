'use client'

import { useState } from 'react'
import SearchForm from './SearchForm'
import HotelSearchForm from './HotelSearchForm'

type Tab = 'flights' | 'hotels'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'flights', label: 'Flights', icon: '✈️' },
  { id: 'hotels', label: 'Hotels', icon: '🏨' },
]

export default function HeroSearchTabs() {
  const [tab, setTab] = useState<Tab>('flights')

  return (
    <div className="w-full">
      {/* Tab switcher */}
      <div
        role="tablist"
        aria-label="Search flights or hotels"
        className="flex gap-2 mb-5"
      >
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                active
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 hover:text-white'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Active form */}
      {tab === 'flights' ? <SearchForm /> : <HotelSearchForm variant="hero" />}
    </div>
  )
}
