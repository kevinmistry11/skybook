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
          <p className="text-gray-500 text-sm">Last updated: January 15, 2026</p>
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
              body: `We collect information you provide directly to us, such as your name, email address, phone number, payment
              information, and travel preferences when you create an account or complete a booking. We also collect
              technical information automatically, including your IP address, browser type, device identifiers, pages
              visited, and referring URLs. This is collected via standard web server logs and first-party analytics.`,
            },
            {
              title: '2. How We Use Your Information',
              body: `We use your information to: process and confirm flight bookings; send booking confirmations and e-tickets;
              provide customer support; send transactional emails (booking receipts, itinerary updates); improve our
              search algorithms and user experience; comply with legal obligations; and prevent fraud. We do not use
              your data for third-party advertising, and we do not sell your personal information to any third party.`,
            },
            {
              title: '3. Information Sharing',
              body: `We share your information with: airlines and their reservation systems to complete your booking (your
              name, contact details, and payment data are transmitted directly to the airline via secure APIs);
              payment processors (we use PCI DSS Level 1 certified processors; SkyBookFare never stores raw card data);
              and service providers who help us operate the platform (hosting, email delivery, analytics) under strict
              data processing agreements.`,
            },
            {
              title: '4. Data Security',
              body: `We use industry-standard security measures including TLS 1.3 encryption for all data in transit,
              AES-256 encryption at rest for sensitive fields, role-based access controls, and annual third-party
              penetration testing. Our infrastructure holds SOC 2 Type II attestation. Despite these measures, no
              system is perfectly secure — please use a strong, unique password for your account.`,
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
              body: `We retain booking data for 7 years to comply with financial and tax regulations. Account data is
              retained while your account is active and for 2 years after account deletion, unless a longer
              retention period is required by law.`,
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
