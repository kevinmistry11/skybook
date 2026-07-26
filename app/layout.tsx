import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/_components/Navbar";
import Footer from "@/app/_components/Footer";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "SkyBookFare",
    "skybookfare",
    "skybookfare.com",
    "cheap flights",
    "flight search",
    "book flights online",
    "US domestic flights",
    "airline tickets",
    "flight deals",
    "no booking fees",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: "Compare US flights with transparent prices and no booking fees on SkyBookFare.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: { google: "Oc2hn6VGpPjZIKFFe5NXMSM5umF3tkQpM90WZGAWXwU" },
  other: { "google-adsense-account": "ca-pub-6813946412691851" },
  category: "travel",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />

        {/* Structured data — Organization + WebSite (helps brand & sitelinks) */}
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: SITE_NAME,
                alternateName: ["Sky Book Fare", "SkyBook Fare", "skybookfare.com"],
                url: SITE_URL,
                logo: `${SITE_URL}/logo.svg`,
                description: SITE_DESCRIPTION,
                contactPoint: {
                  "@type": "ContactPoint",
                  telephone: "+1-800-759-2665",
                  contactType: "customer support",
                  availableLanguage: "English",
                  areaServed: "US",
                },
                sameAs: [],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: SITE_NAME,
                alternateName: "skybookfare.com",
                url: SITE_URL,
                description: SITE_DESCRIPTION,
                inLanguage: "en-US",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${SITE_URL}/search?from={from}&to={to}&date={date}&passengers=1&cabinClass=economy&tripType=roundTrip`,
                  },
                  "query-input": [
                    "required name=from",
                    "required name=to",
                    "required name=date",
                  ],
                },
              },
            ]),
          }}
        />

        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6813946412691851"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        <Script id="clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "x6n2xcgrs4");
        `}</Script>
      </body>
    </html>
  );
}
