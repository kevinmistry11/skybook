import { NextRequest, NextResponse } from 'next/server'
import citiesData from '@/lib/us-cities.json'
import { US_CITIES } from '@/lib/cities'

export const dynamic = 'force-dynamic'

interface RawCity {
  c: string
  s: string
  p?: number
}

// Prepared once per server instance (cold start), reused across requests.
const CITIES = citiesData as RawCity[]
const PREP = CITIES.map(x => ({
  c: x.c,
  s: x.s,
  p: x.p || 0,
  cl: x.c.toLowerCase(),
  ll: `${x.c}, ${x.s}`.toLowerCase(),
}))

// Major metros get ranked to the top when they match.
const MAJOR = new Set(US_CITIES.map(x => `${x.city.toLowerCase()}|${x.state.toLowerCase()}`))

const LIMIT = 8

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim().toLowerCase()
  if (q.length < 1) {
    return NextResponse.json({ results: [] })
  }

  type Scored = { c: string; s: string; tier: number; major: boolean; pop: number; len: number }
  const matches: Scored[] = []

  for (const city of PREP) {
    let tier = -1
    if (city.cl.startsWith(q) || city.ll.startsWith(q)) {
      tier = 0
    } else if (city.cl.includes(` ${q}`)) {
      tier = 1 // matches the start of a later word (e.g. "york" in "New York")
    } else if (city.cl.includes(q)) {
      tier = 2
    }
    if (tier === -1) continue
    matches.push({
      c: city.c,
      s: city.s,
      tier,
      major: MAJOR.has(`${city.cl}|${city.s.toLowerCase()}`),
      pop: city.p,
      len: city.c.length,
    })
    // Perf cap: plenty to rank from once we've gathered this many
    if (matches.length > 600) break
  }

  matches.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier
    if (a.major !== b.major) return a.major ? -1 : 1
    if (a.pop !== b.pop) return b.pop - a.pop
    if (a.len !== b.len) return a.len - b.len
    return a.c.localeCompare(b.c)
  })

  const results = matches.slice(0, LIMIT).map(m => ({ city: m.c, state: m.s }))
  return NextResponse.json({ results })
}
