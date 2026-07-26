/**
 * Demo pricing: almost all economy checkouts land around TARGET_CHECKOUT_TOTAL.
 * Taxes are 14% of base so line items still add up: base + tax (+ seats) = total.
 */

export const TARGET_CHECKOUT_TOTAL = 400
export const TAX_RATE = 0.14

/** Base fare (pre-tax) so base + 14% tax ≈ $400 per adult. */
export function targetBaseFare(passengers = 1): number {
  return Math.round((TARGET_CHECKOUT_TOTAL / (1 + TAX_RATE)) * passengers * 100) / 100
}

export function computeTaxes(baseFare: number): number {
  return Math.round(baseFare * TAX_RATE * 100) / 100
}

/** Deterministic multiplier in [1 - spread, 1 + spread] from a seed string. */
export function priceNoise(seed: string, spread = 0.05): number {
  let h = 5381
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) & 0x7fffffff
  const t = (h % 1000) / 999 // 0..1
  return 1 + (t * 2 - 1) * spread
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
 * Checkout totals for a trip: normalizes economy base so
 * base + tax ≈ TARGET_CHECKOUT_TOTAL × passengers, then applies cabin mult.
 * Seat add-ons are added on top of the tax-inclusive target.
 */
export function computeCheckoutTotals(opts: {
  passengers: number
  cabinClass: 'economy' | 'business' | 'first'
  seatAddonCost?: number
}): { baseFare: number; taxes: number; totalPrice: number } {
  const { passengers, cabinClass, seatAddonCost = 0 } = opts
  const economyBase = targetBaseFare(passengers)
  const mult = CABIN_MULT[cabinClass]
  // Cabin scales the economy target; seats add on top of tax-inclusive total
  const baseFare = Math.round(economyBase * mult * 100) / 100
  const taxes = computeTaxes(baseFare)
  const totalPrice = Math.round((baseFare + taxes + seatAddonCost) * 100) / 100
  return { baseFare, taxes, totalPrice }
}

export interface PricedCabin {
  price: number
  seatsLeft: number
}

/**
 * Remap a list of flights so economy prices sit in a band around
 * targetBase × legShare (legShare=1 one-way, 0.5 each RT leg, 1/n multi-city).
 * Preserves relative ordering between flights.
 */
export function normalizeFlightEconomyPrices<T extends {
  id: string
  economy: PricedCabin
  business: PricedCabin
  first: PricedCabin
}>(flights: T[], legShare = 1): T[] {
  if (flights.length === 0) return flights

  const center = targetBaseFare(1) * legShare
  const prices = flights.map(f => f.economy.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)

  return flights.map(f => {
    let t = 0.5
    if (max > min) t = (f.economy.price - min) / (max - min)
    // Map rank into ~±5% band around center, plus tiny per-flight noise
    const band = center * 0.05
    const ranked = center - band + t * 2 * band
    const economy = Math.round(ranked * priceNoise(f.id, 0.02) * 100) / 100
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
