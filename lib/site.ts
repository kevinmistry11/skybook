/** Canonical production origin (apex redirects here). */
export const SITE_URL = 'https://www.skybookfare.com'
export const SITE_NAME = 'SkyBookFare'
export const SITE_TAGLINE = 'Official Site — Book Cheap Flights'
/** Title tag: brand name first for unambiguous Google brand matching. */
export const SITE_TITLE = 'SkyBookFare | Official Site — Book Cheap Flights'
/**
 * Meta description: brand + domain first sentence so Google has a clear text match.
 */
export const SITE_DESCRIPTION =
  'SkyBookFare (skybookfare.com) is the official site to search and book cheap US flights. Compare American, Delta, United, Southwest, JetBlue, Alaska and more — transparent fares, no booking fees.'

/**
 * Official social / profile URLs for schema sameAs + footer.
 * Fill these in after you create each profile under the exact name "SkyBookFare".
 * Leave empty until the profile exists (empty entries are omitted).
 */
export const SOCIAL_PROFILES: Record<string, string> = {
  facebook: 'https://www.facebook.com/profile.php?id=61592781085459',
  // x: 'https://x.com/skybookfare',
  // linkedin: 'https://www.linkedin.com/company/skybookfare',
  // instagram: 'https://www.instagram.com/skybookfare',
}

export function socialSameAs(): string[] {
  return Object.values(SOCIAL_PROFILES).filter(Boolean)
}
