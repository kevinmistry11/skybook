import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — SkyBookFare',
  description: 'SkyBookFare Privacy Policy — how we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="mb-10">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: August 31, 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 prose prose-sm prose-gray max-w-none">

          <p className="text-gray-600 leading-relaxed">
            SkyBookFare, Inc. (&ldquo;SkyBookFare,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your personal information.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our website
            at skybookfare.com or any of our services (collectively, the &ldquo;Service&rdquo;).
          </p>

          {[
            {
              title: '1. Information We Collect',
              body: `SkyBookFare is a flight search site. We do not collect payment card numbers, CVVs, or other payment
              credentials, and we do not complete airline bookings on this site. We may collect information you type
              into search or contact forms (for example trip details or an email address) and technical information
              collected automatically, including your IP address, browser type, device identifiers, pages visited, and
              referring URLs, via standard web server logs and first-party analytics.`,
            },
            {
              title: '2. How We Use Your Information',
              body: `We use this information to: run flight and hotel search; improve the product; respond to support
              requests you send us; comply with legal obligations; and prevent abuse. We do not process payments, issue
              tickets, or send e-tickets. We do not use your data for third-party advertising, and we do not sell your
              personal information to any third party.`,
            },
            {
              title: '3. Information Sharing',
              body: `When you select a flight, you leave SkyBookFare and continue on Kayak (or another booking partner) to
              complete the purchase. That partner and the airline — not SkyBookFare — collect payment and passenger
              details needed to ticket the trip. We also use service providers who help us operate the site (hosting,
              analytics) under data processing agreements. We do not transmit payment data to airlines because we do
              not collect it.`,
            },
            {
              title: '4. Data Security',
              body: `The site is served over HTTPS so data in transit between your browser and our servers is encrypted.
              SkyBookFare is not PCI DSS certified and does not hold a SOC 2 attestation. We do not store payment card
              data. No system is perfectly secure — do not send card numbers to us by email or through this site.`,
            },
            {
              title: '5. Cookies and Tracking',
              body: `We use essential cookies to maintain your session and search preferences. We do not use cross-site
              tracking cookies or advertising pixels. You can disable cookies in your browser settings; this may
              affect certain features such as saved searches and login sessions.`,
            },
            {
              title: '6. Your Rights',
              body: `Depending on your jurisdiction, you may have the right to access, correct, or delete your personal
              information; to restrict or object to certain processing; and to data portability. To exercise any of
              these rights, contact us at privacy@skybookfare.com. We will respond within 30 days.`,
            },
            {
              title: '7. Data Retention',
              body: `Because we do not issue tickets, we do not retain airline booking records. Server logs and analytics
              data are kept for a limited period needed to operate and secure the site, unless a longer retention
              period is required by law. Support emails you send us are retained as needed to handle your request.`,
            },
            {
              title: '8. Children\'s Privacy',
              body: `The Service is not directed to children under 13. We do not knowingly collect personal information
              from children under 13. If we become aware that a child under 13 has provided us with personal data,
              we will delete it promptly.`,
            },
            {
              title: '9. Changes to This Policy',
              body: `We may update this Privacy Policy from time to time. We will notify you of material changes by
              email (if you have an account) or by posting a prominent notice on the website. Your continued use of
              the Service after such changes constitutes acceptance of the updated policy.`,
            },
            {
              title: '10. Contact Us',
              body: `For privacy-related inquiries, contact us at: privacy@skybookfare.com · SkyBookFare, Inc., 601 Montgomery St,
              Suite 1400, San Francisco, CA 94111.`,
            },
          ].map(section => (
            <div key={section.title} className="mt-7">
              <h2 className="text-base font-bold text-gray-900 mb-2">{section.title}</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
