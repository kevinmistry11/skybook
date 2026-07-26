import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use — SkyBookFare',
  description: 'SkyBookFare Terms of Use — rules and conditions governing your use of the SkyBookFare flight search platform.',
}

export default function TermsPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="mb-10">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Terms of Use</h1>
          <p className="text-gray-500 text-sm">Last updated: January 15, 2026 · Effective: February 1, 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          <p className="text-gray-600 leading-relaxed text-sm mb-6">
            Please read these Terms of Use (&ldquo;Terms&rdquo;) carefully before using the SkyBookFare website or mobile application
            (the &ldquo;Service&rdquo;) operated by SkyBookFare, Inc. (&ldquo;SkyBookFare&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By accessing or using the
            Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not
            access the Service.
          </p>

          {[
            {
              title: '1. Eligibility',
              body: 'You must be at least 18 years of age to use this Service. By using SkyBookFare, you represent that you are at least 18 and are legally capable of entering into binding contracts in your jurisdiction.',
            },
            {
              title: '2. Nature of the Service',
              body: 'SkyBookFare is a flight search and booking platform. We display fare information sourced from airlines and GDS (Global Distribution System) providers. While we strive for accuracy, fare availability and pricing are ultimately controlled by airlines and may change at any moment. SkyBookFare is not an airline and does not operate any aircraft.',
            },
            {
              title: '3. Bookings and Payments',
              body: 'When you complete a booking through SkyBookFare, you are entering into a direct contract with the airline for transportation services. Payment is processed at the time of booking. SkyBookFare charges no booking fees — the price displayed is the full price. All prices are in US dollars and include applicable taxes and carrier-imposed fees.',
            },
            {
              title: '4. Fare Rules and Cancellations',
              body: 'Each ticket is subject to the fare rules of the airline and fare class selected. Most economy fares sold through SkyBookFare are non-refundable. Changes are permitted subject to airline change fees (typically $75–$200 depending on cabin class) plus any fare difference. SkyBookFare has no ability to waive airline fare rules on your behalf.',
            },
            {
              title: '5. Accuracy of Information',
              body: 'You are responsible for reviewing all booking details before payment, including: passenger names (must match government-issued ID), travel dates, flight times, cabin class, and number of bags. SkyBookFare is not liable for costs arising from errors in information you provide.',
            },
            {
              title: '6. Prohibited Uses',
              body: 'You agree not to: use the Service for any unlawful purpose; scrape, crawl, or data-mine the Service without written permission; attempt to bypass or circumvent any security measures; use the Service to book flights for resale or commercial purposes without authorization; impersonate any person or entity.',
            },
            {
              title: '7. Intellectual Property',
              body: 'All content on SkyBookFare — including text, graphics, logos, and software — is the property of SkyBookFare, Inc. or its licensors and is protected by US and international copyright law. You may not reproduce, distribute, or create derivative works without express written permission.',
            },
            {
              title: '8. Limitation of Liability',
              body: 'To the fullest extent permitted by law, SkyBookFare shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service or any flight delay, cancellation, or disruption by any airline. SkyBookFare\'s total liability for any claim shall not exceed the booking fees, if any, paid by you for the specific transaction giving rise to the claim.',
            },
            {
              title: '9. Indemnification',
              body: 'You agree to indemnify and hold harmless SkyBookFare, Inc. and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses arising from your use of the Service or your violation of these Terms.',
            },
            {
              title: '10. Governing Law',
              body: 'These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes shall be resolved exclusively in the state or federal courts located in San Francisco County, California.',
            },
            {
              title: '11. Changes to Terms',
              body: 'We reserve the right to update these Terms at any time. We will provide at least 14 days\' notice of material changes via email or a prominent in-app notice. Continued use of the Service after changes become effective constitutes acceptance of the revised Terms.',
            },
            {
              title: '12. Contact',
              body: 'Questions about these Terms? Contact us at legal@skybookfare.com or SkyBookFare, Inc., 601 Montgomery St, Suite 1400, San Francisco, CA 94111.',
            },
          ].map(s => (
            <div key={s.title} className="mb-7">
              <h2 className="text-base font-bold text-gray-900 mb-2">{s.title}</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
