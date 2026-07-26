import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'SkyBookFare — Find & Book Cheap Flights'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 72,
          background: 'linear-gradient(145deg,#0a0f3d 0%,#1a3ab8 50%,#0e7bd4 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, opacity: 0.85, letterSpacing: 4, textTransform: 'uppercase' }}>
          skybookfare.com
        </div>
        <div style={{ fontSize: 72, fontWeight: 900, marginTop: 16, lineHeight: 1.05 }}>
          SkyBookFare
        </div>
        <div style={{ fontSize: 36, fontWeight: 600, marginTop: 20, opacity: 0.95 }}>
          Find &amp; book cheap US flights
        </div>
        <div style={{ fontSize: 24, marginTop: 28, opacity: 0.8 }}>
          No booking fees · Compare major airlines · Transparent prices
        </div>
      </div>
    ),
    { ...size },
  )
}
