/** US city list for hotel destination autocomplete. Free-text is still allowed;
 *  these are just typeahead suggestions. */

export interface City {
  city: string
  state: string
}

/** Major US cities and common travel destinations. */
export const US_CITIES: City[] = [
  { city: 'New York', state: 'NY' },
  { city: 'Los Angeles', state: 'CA' },
  { city: 'Chicago', state: 'IL' },
  { city: 'Houston', state: 'TX' },
  { city: 'Phoenix', state: 'AZ' },
  { city: 'Philadelphia', state: 'PA' },
  { city: 'San Antonio', state: 'TX' },
  { city: 'San Diego', state: 'CA' },
  { city: 'Dallas', state: 'TX' },
  { city: 'San Jose', state: 'CA' },
  { city: 'Austin', state: 'TX' },
  { city: 'Jacksonville', state: 'FL' },
  { city: 'Fort Worth', state: 'TX' },
  { city: 'Columbus', state: 'OH' },
  { city: 'Charlotte', state: 'NC' },
  { city: 'San Francisco', state: 'CA' },
  { city: 'Indianapolis', state: 'IN' },
  { city: 'Seattle', state: 'WA' },
  { city: 'Denver', state: 'CO' },
  { city: 'Washington', state: 'DC' },
  { city: 'Boston', state: 'MA' },
  { city: 'El Paso', state: 'TX' },
  { city: 'Nashville', state: 'TN' },
  { city: 'Detroit', state: 'MI' },
  { city: 'Oklahoma City', state: 'OK' },
  { city: 'Portland', state: 'OR' },
  { city: 'Las Vegas', state: 'NV' },
  { city: 'Memphis', state: 'TN' },
  { city: 'Louisville', state: 'KY' },
  { city: 'Baltimore', state: 'MD' },
  { city: 'Milwaukee', state: 'WI' },
  { city: 'Albuquerque', state: 'NM' },
  { city: 'Tucson', state: 'AZ' },
  { city: 'Fresno', state: 'CA' },
  { city: 'Sacramento', state: 'CA' },
  { city: 'Kansas City', state: 'MO' },
  { city: 'Mesa', state: 'AZ' },
  { city: 'Atlanta', state: 'GA' },
  { city: 'Omaha', state: 'NE' },
  { city: 'Colorado Springs', state: 'CO' },
  { city: 'Raleigh', state: 'NC' },
  { city: 'Long Beach', state: 'CA' },
  { city: 'Virginia Beach', state: 'VA' },
  { city: 'Miami', state: 'FL' },
  { city: 'Oakland', state: 'CA' },
  { city: 'Minneapolis', state: 'MN' },
  { city: 'Tulsa', state: 'OK' },
  { city: 'Bakersfield', state: 'CA' },
  { city: 'Wichita', state: 'KS' },
  { city: 'Arlington', state: 'TX' },
  { city: 'Aurora', state: 'CO' },
  { city: 'Tampa', state: 'FL' },
  { city: 'New Orleans', state: 'LA' },
  { city: 'Cleveland', state: 'OH' },
  { city: 'Honolulu', state: 'HI' },
  { city: 'Anaheim', state: 'CA' },
  { city: 'Orlando', state: 'FL' },
  { city: 'Santa Ana', state: 'CA' },
  { city: 'St. Louis', state: 'MO' },
  { city: 'Riverside', state: 'CA' },
  { city: 'Pittsburgh', state: 'PA' },
  { city: 'Cincinnati', state: 'OH' },
  { city: 'Salt Lake City', state: 'UT' },
  { city: 'Fort Lauderdale', state: 'FL' },
  { city: 'San Juan', state: 'PR' },
  { city: 'Savannah', state: 'GA' },
  { city: 'Charleston', state: 'SC' },
  { city: 'Myrtle Beach', state: 'SC' },
  { city: 'Key West', state: 'FL' },
  { city: 'Palm Springs', state: 'CA' },
  { city: 'Napa', state: 'CA' },
  { city: 'Asheville', state: 'NC' },
  { city: 'Park City', state: 'UT' },
  { city: 'Scottsdale', state: 'AZ' },
  { city: 'Anchorage', state: 'AK' },
  { city: 'Boise', state: 'ID' },
  { city: 'Buffalo', state: 'NY' },
  { city: 'Richmond', state: 'VA' },
  { city: 'Reno', state: 'NV' },
  { city: 'Santa Barbara', state: 'CA' },
]

/** Popular defaults shown when the field is focused but empty. */
export const POPULAR_CITIES: City[] = [
  { city: 'New York', state: 'NY' },
  { city: 'Los Angeles', state: 'CA' },
  { city: 'Las Vegas', state: 'NV' },
  { city: 'Miami', state: 'FL' },
  { city: 'Chicago', state: 'IL' },
  { city: 'Orlando', state: 'FL' },
  { city: 'San Francisco', state: 'CA' },
  { city: 'New Orleans', state: 'LA' },
]

export function cityLabel(c: City): string {
  return `${c.city}, ${c.state}`
}

/** Filter cities by query. Prefix matches rank above substring matches. */
export function searchCities(query: string, limit = 8): City[] {
  const q = query.trim().toLowerCase()
  if (!q) return POPULAR_CITIES.slice(0, limit)

  const starts: City[] = []
  const contains: City[] = []
  for (const c of US_CITIES) {
    const label = cityLabel(c).toLowerCase()
    const name = c.city.toLowerCase()
    if (name.startsWith(q) || label.startsWith(q)) starts.push(c)
    else if (label.includes(q)) contains.push(c)
  }
  return [...starts, ...contains].slice(0, limit)
}
