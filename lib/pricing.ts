/**
 * Demo pricing: economy checkouts land near a route target with
 * realistic cents (not a round dollar). Taxes are ~14% of base so
 * base + tax (+ seats) always add up.
 */

/** Default 1-adult economy total (pre-seats), with cents so it looks natural. */
export const TARGET_CHECKOUT_TOTAL = 345
export const TAX_RATE = 0.14

/** Per-route tax-inclusive economy targets (overrides the default). */
const ROUTE_CHECKOUT_TOTAL: Record<string, number> = {
  'CAK-SFO': 225,
  'SFO-CAK': 225,
  'CAK-SJC': 270,
  'SJC-CAK': 270,
}

/** Resolve the tax-inclusive economy target for a city pair (or default). */
export function checkoutTargetForRoute(origin?: string, destination?: string): number {
  if (origin && destination) {
    const hit = ROUTE_CHECKOUT_TOTAL[`${origin}-${destination}`]
    if (hit != null) return hit
  }
  return TARGET_CHECKOUT_TOTAL
}

/** True when the trip (any leg) is a pinned CAK itinerary (SFO / SJC). */
export function isCakSfoTrip(
  legs: { origin: { code: string }; destination: { code: string } }[],
): boolean {
  return legs.some(l => {
    const a = l.origin.code
    const b = l.destination.code
    return (
      (a === 'CAK' && (b === 'SFO' || b === 'SJC')) ||
      ((a === 'SFO' || a === 'SJC') && b === 'CAK')
    )
  })
}

/** Tax-inclusive target for a trip, honoring per-route pins (CAK↔SFO, CAK↔SJC). */
export function checkoutTargetForLegs(
  legs: { origin: { code: string }; destination: { code: string } }[],
  fallbackOrigin?: string,
  fallbackDest?: string,
): number {
  for (const l of legs) {
    const hit = ROUTE_CHECKOUT_TOTAL[`${l.origin.code}-${l.destination.code}`]
    if (hit != null) return hit
  }
  return checkoutTargetForRoute(fallbackOrigin, fallbackDest)
}

/** ± dollar band around the target for per-itinerary variance. */
const TOTAL_SPREAD = 16

function hashSeed(seed: string): number {
  let h = 5381
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) & 0x7fffffff
  return h
}

/** Deterministic multiplier in [1 - spread, 1 + spread] from a seed string. */
export function priceNoise(seed: string, spread = 0.05): number {
  const t = (hashSeed(seed) % 1000) / 999 // 0..1
  return 1 + (t * 2 - 1) * spread
}

/**
 * Per-adult tax-inclusive total with cents, centered near `targetTotal`.
 * Same seed always yields the same total (stable across refreshes).
 */
export function targetTotalPerAdult(seed = 'default', targetTotal = TARGET_CHECKOUT_TOTAL): number {
  const h = hashSeed(seed)
  // Offset in cents: roughly -TOTAL_SPREAD .. +TOTAL_SPREAD, never lands on .00 alone
  const spread = targetTotal <= 220 ? 10 : TOTAL_SPREAD
  const centOffset = (h % (spread * 200 + 1)) - spread * 100
  // Force non-zero cents: prefer .x0–.x9 variety (e.g. .80, .47, .13)
  let cents = Math.round(targetTotal * 100 + centOffset)
  if (cents % 100 === 0) cents += 80 // bump exact dollars to .80
  return Math.round(cents) / 100
}

/** Base fare (pre-tax) so base + tax ≈ target total per adult × passengers. */
export function targetBaseFare(
  passengers = 1,
  seed = 'default',
  targetTotal = TARGET_CHECKOUT_TOTAL,
): number {
  const total = targetTotalPerAdult(seed, targetTotal) * passengers
  return Math.round((total / (1 + TAX_RATE)) * 100) / 100
}

export function computeTaxes(baseFare: number): number {
  return Math.round(baseFare * TAX_RATE * 100) / 100
}

/**
 * Cabin multipliers (must match generateFlights / API makeCabinPrices).
 */
export const CABIN_MULT = {
  economy: 1,
  business: 2.8,
  first: 5.5,
} as const

/**
 * Checkout totals for a trip.
 * Prefer `listedTotalPerAdult` (sum of tax-inclusive fares shown on search) so
 * payment matches the price the traveler already selected — Kayak-style.
 * Otherwise fall back to the route target ± spread.
 * Seat add-ons are added on top.
 */
export function computeCheckoutTotals(opts: {
  passengers: number
  cabinClass: 'economy' | 'business' | 'first'
  seatAddonCost?: number
  /** Itinerary seed (flight ids) so totals vary realistically per trip */
  seed?: string
  /** Tax-inclusive economy target; defaults to TARGET_CHECKOUT_TOTAL */
  targetTotal?: number
  /**
   * Tax-inclusive per-adult total already shown on search (all legs, selected cabin).
   * When set, checkout uses this exact figure (no second random target).
   */
  listedTotalPerAdult?: number
}): { baseFare: number; taxes: number; totalPrice: number } {
  const {
    passengers,
    cabinClass,
    seatAddonCost = 0,
    seed = 'default',
    targetTotal = TARGET_CHECKOUT_TOTAL,
    listedTotalPerAdult,
  } = opts
  const mult = CABIN_MULT[cabinClass]

  // Desired tax-inclusive subtotal (before seats)
  const desiredTotal =
    listedTotalPerAdult != null
      ? Math.round(listedTotalPerAdult * passengers * 100) / 100
      : Math.round(targetTotalPerAdult(seed, targetTotal) * passengers * mult * 100) / 100

  // Split into base + tax that sum exactly to desiredTotal
  const baseFare = Math.round((desiredTotal / (1 + TAX_RATE)) * 100) / 100
  const taxes = Math.round((desiredTotal - baseFare) * 100) / 100
  const totalPrice = Math.round((baseFare + taxes + seatAddonCost) * 100) / 100
  return { baseFare, taxes, totalPrice }
}

export interface PricedCabin {
  price: number
  seatsLeft: number
}

/**
 * Remap flights so listed economy prices are tax-inclusive and sit in a band
 * around targetTotal × legShare (1 = one-way, 0.5 each RT leg, 1/n multi-city).
 * Search cards and checkout then show the same number (Kayak-style).
 *
 * Featured itineraries are pinned near the exact share of `targetTotal`
 * (e.g. CAK↔SFO RT ≈ $225, CAK↔SJC RT ≈ $270) so they don't drift with ranking noise.
 */
export function normalizeFlightEconomyPrices<T extends {
  id: string
  economy: PricedCabin
  business: PricedCabin
  first: PricedCabin
  featured?: boolean
}>(flights: T[], legShare = 1, targetTotal = TARGET_CHECKOUT_TOTAL): T[] {
  if (flights.length === 0) return flights

  // Stable tax-inclusive center (no extra seed drift) so RT out+ret ≈ targetTotal
  const center = Math.round(targetTotal * legShare * 100) / 100
  const prices = flights.map(f => f.economy.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)

  return flights.map(f => {
    let economy: number
    if (f.featured) {
      // Pin featured (AA CAK↔SFO etc.) to ~exact share of the route target
      economy = Math.round(center * priceNoise(f.id, 0.012) * 100) / 100
    } else {
      let t = 0.5
      if (max > min) t = (f.economy.price - min) / (max - min)
      // Other options stay near the same target (±5% band)
      const band = center * 0.05
      const ranked = center - band + t * 2 * band
      economy = Math.round(ranked * priceNoise(f.id, 0.02) * 100) / 100
    }
    const seatsE = f.economy.seatsLeft
    const seatsB = f.business.seatsLeft
    const seatsF = f.first.seatsLeft
    return {
      ...f,
      economy:  { price: economy, seatsLeft: seatsE },
      business: { price: Math.round(economy * CABIN_MULT.business * 100) / 100, seatsLeft: seatsB },
      first:    { price: Math.round(economy * CABIN_MULT.first * 100) / 100, seatsLeft: seatsF },
    }
  })
}
