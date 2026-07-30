import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIAL_PROFILES } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Press & Brand — SkyBookFare Official',
  description:
    'Official SkyBookFare brand information, logo, contact, and how to cite skybookfare.com. SkyBookFare is the flight search site at www.skybookfare.com.',
  alternates: { canonical: `${SITE_URL}/press` },
}

const socialEntries = Object.entries(SOCIAL_PROFILES).filter(([, url]) => !!url)

export default function PressPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-4">Press & brand</p>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">SkyBookFare</h1>
          <p className="text-blue-200 text-lg">
            Official brand kit and facts for the flight search site at{' '}
            <a href={SITE_URL} className="text-white font-semibold underline underline-offset-2">
              www.skybookfare.com
            </a>
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-4">Official facts</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-bold text-gray-500 sm:w-36 shrink-0">Brand name</dt>
              <dd className="text-gray-900 font-semibold">SkyBookFare</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-bold text-gray-500 sm:w-36 shrink-0">Website</dt>
              <dd>
                <a href={SITE_URL} className="text-blue-600 font-semibold hover:underline">
                  {SITE_URL}
                </a>
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-bold text-gray-500 sm:w-36 shrink-0">Domain</dt>
              <dd className="text-gray-900">skybookfare.com · www.skybookfare.com</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-bold text-gray-500 sm:w-36 shrink-0">What we do</dt>
              <dd className="text-gray-700">{SITE_DESCRIPTION}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-bold text-gray-500 sm:w-36 shrink-0">Support</dt>
              <dd className="text-gray-700">
                <a href="mailto:support@skybookfare.com" className="text-blue-600 hover:underline">
                  support@skybookfare.com
                </a>
                {' · '}
                1-800-759-2665
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-bold text-gray-500 sm:w-36 shrink-0">HQ</dt>
              <dd className="text-gray-700">601 Montgomery St, Suite 1400, San Francisco, CA 94111, USA</dd>
            </div>
          </dl>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-3">How to refer to us</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
            <li>
              Use the exact brand name <strong className="text-gray-900">SkyBookFare</strong> (one word; capitals S, B, F).
            </li>
            <li>
              Link to the official site:{' '}
              <a href={SITE_URL} className="text-blue-600 font-semibold hover:underline">
                {SITE_URL}
              </a>
            </li>
            <li>
              Do not confuse SkyBookFare with similarly named third-party travel sites. This is the official SkyBookFare
              property.
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-3">Logo</h2>
          <p className="text-sm text-gray-600 mb-4">
            Official logo for editorial and partner use. Link back to {SITE_NAME} when possible.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="SkyBookFare logo" className="h-14 w-auto bg-white border border-gray-100 rounded-xl p-2" />
            <a
              href="/logo.svg"
              download
              className="inline-flex items-center rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 transition-colors"
            >
              Download logo (SVG)
            </a>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-3">Official social profiles</h2>
          {socialEntries.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {socialEntries.map(([label, url]) => (
                <li key={label}>
                  <a href={url} target="_blank" rel="noopener noreferrer me" className="text-blue-600 font-semibold hover:underline capitalize">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">
              Official social profiles for SkyBookFare will be listed here once published. Until then, the only
              canonical web property is{' '}
              <a href={SITE_URL} className="text-blue-600 font-semibold hover:underline">
                www.skybookfare.com
              </a>
              .
            </p>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-3">Press contact</h2>
          <p className="text-sm text-gray-600 mb-4">
            For partnership or press inquiries about SkyBookFare:
          </p>
          <p className="text-sm font-semibold text-gray-900">
            <a href="mailto:support@skybookfare.com" className="text-blue-600 hover:underline">
              support@skybookfare.com
            </a>
          </p>
          <p className="mt-6">
            <Link href="/about" className="text-sm font-semibold text-blue-600 hover:underline">
              About SkyBookFare →
            </Link>
            {' · '}
            <Link href="/contact" className="text-sm font-semibold text-blue-600 hover:underline">
              Contact →
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}
