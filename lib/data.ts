import { getScheduledFlights, applyDatePricing } from './schedule'
import { normalizeFlightEconomyPrices } from './pricing'

export interface Airport {
  code: string
  city: string
  name: string
  country: string
  lat: number
  lon: number
}

export interface Airline {
  code: string
  name: string
  color: string
  logoUrl: string
}

export interface FlightClass {
  price: number
  seatsLeft: number
}

export interface Flight {
  id: string
  flightNumber: string
  airline: Airline
  origin: Airport
  destination: Airport
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  stops: number
  stopCity?: string
  aircraft: string
  carryOnIncluded: boolean
  checkedBagPrice: number | null  // null = free
  economy: FlightClass
  business: FlightClass
  first: FlightClass
  /** Curated itinerary — keep at top of search results */
  featured?: boolean
  layoverMin?: number
  connectionDetail?: string
}

export interface Passenger {
  firstName: string
  lastName: string
  dob: string
  gender: string
  documentNumber: string
}

export interface AddOn {
  id: string
  type: 'checkedBag' | 'extraBag' | 'meal' | 'insurance' | 'priority' | 'lounge'
  name: string
  description: string
  price: number
  perPassenger: boolean
}

export interface MultiCityLeg {
  from: string
  to: string
  date: string
}

export interface SearchParams {
  from: string
  to: string
  date: string
  returnDate?: string
  passengers: number
  cabinClass: 'economy' | 'business' | 'first'
  tripType: 'oneWay' | 'roundTrip' | 'multicity'
  legs?: MultiCityLeg[]
}

export interface PendingBooking {
  id: string
  outboundFlight: Flight
  returnFlight?: Flight
  multiCityFlights?: Flight[]
  searchParams: SearchParams
}

export interface CompletedBooking {
  id: string
  pnr: string
  outboundFlight: Flight
  returnFlight?: Flight
  passengers: Passenger[]
  selectedSeats: string[]
  addOns: AddOn[]
  cabinClass: 'economy' | 'business' | 'first'
  passengersCount: number
  baseFare: number
  addOnsCost: number
  taxes: number
  totalPrice: number
  contactEmail: string
  createdAt: string
}

export const AIRPORTS: Airport[] = [
  // ── Major US Hubs ──
  { code: 'ATL', city: 'Atlanta',            name: 'Hartsfield-Jackson Atlanta International', country: 'US', lat: 33.6407,  lon: -84.4277  },
  { code: 'ORD', city: 'Chicago',            name: "O'Hare International",                     country: 'US', lat: 41.9742,  lon: -87.9073  },
  { code: 'LAX', city: 'Los Angeles',        name: 'Los Angeles International',                country: 'US', lat: 33.9425,  lon: -118.4081 },
  { code: 'DFW', city: 'Dallas/Fort Worth',  name: 'Dallas/Fort Worth International',          country: 'US', lat: 32.8998,  lon: -97.0403  },
  { code: 'DEN', city: 'Denver',             name: 'Denver International',                     country: 'US', lat: 39.8561,  lon: -104.6737 },
  { code: 'JFK', city: 'New York',           name: 'John F. Kennedy International',            country: 'US', lat: 40.6413,  lon: -73.7781  },
  { code: 'SFO', city: 'San Francisco',      name: 'San Francisco International',              country: 'US', lat: 37.6213,  lon: -122.3790 },
  { code: 'SEA', city: 'Seattle',            name: 'Seattle-Tacoma International',             country: 'US', lat: 47.4502,  lon: -122.3088 },
  { code: 'LAS', city: 'Las Vegas',          name: 'Harry Reid International',                 country: 'US', lat: 36.0840,  lon: -115.1537 },
  { code: 'MCO', city: 'Orlando',            name: 'Orlando International',                    country: 'US', lat: 28.4312,  lon: -81.3081  },
  { code: 'MIA', city: 'Miami',              name: 'Miami International',                      country: 'US', lat: 25.7959,  lon: -80.2870  },
  { code: 'CLT', city: 'Charlotte',          name: 'Charlotte Douglas International',          country: 'US', lat: 35.2140,  lon: -80.9431  },
  { code: 'PHX', city: 'Phoenix',            name: 'Phoenix Sky Harbor International',         country: 'US', lat: 33.4373,  lon: -112.0078 },
  { code: 'IAH', city: 'Houston',            name: 'George Bush Intercontinental',             country: 'US', lat: 29.9902,  lon: -95.3368  },
  { code: 'BOS', city: 'Boston',             name: 'Logan International',                      country: 'US', lat: 42.3656,  lon: -71.0096  },
  { code: 'MSP', city: 'Minneapolis',        name: 'Minneapolis–Saint Paul International',     country: 'US', lat: 44.8820,  lon: -93.2218  },
  { code: 'DTW', city: 'Detroit',            name: 'Detroit Metropolitan Wayne County',        country: 'US', lat: 42.2124,  lon: -83.3534  },
  { code: 'PHL', city: 'Philadelphia',       name: 'Philadelphia International',               country: 'US', lat: 39.8721,  lon: -75.2408  },
  { code: 'EWR', city: 'Newark',             name: 'Newark Liberty International',             country: 'US', lat: 40.6895,  lon: -74.1745  },
  { code: 'LGA', city: 'New York (Queens)',  name: 'LaGuardia Airport',                        country: 'US', lat: 40.7769,  lon: -73.8740  },

  // ── Major Secondary ──
  { code: 'SLC', city: 'Salt Lake City',     name: 'Salt Lake City International',             country: 'US', lat: 40.7884,  lon: -111.9778 },
  { code: 'BWI', city: 'Baltimore',          name: 'Baltimore/Washington International',       country: 'US', lat: 39.1774,  lon: -76.6682  },
  { code: 'SAN', city: 'San Diego',          name: 'San Diego International',                  country: 'US', lat: 32.7338,  lon: -117.1933 },
  { code: 'TPA', city: 'Tampa',              name: 'Tampa International',                      country: 'US', lat: 27.9755,  lon: -82.5332  },
  { code: 'PDX', city: 'Portland',           name: 'Portland International',                   country: 'US', lat: 45.5898,  lon: -122.5951 },
  { code: 'MDW', city: 'Chicago (Midway)',   name: 'Chicago Midway International',             country: 'US', lat: 41.7868,  lon: -87.7522  },
  { code: 'STL', city: 'St. Louis',          name: 'St. Louis Lambert International',          country: 'US', lat: 38.7487,  lon: -90.3700  },
  { code: 'HNL', city: 'Honolulu',           name: 'Daniel K. Inouye International',           country: 'US', lat: 21.3187,  lon: -157.9224 },
  { code: 'AUS', city: 'Austin',             name: 'Austin-Bergstrom International',           country: 'US', lat: 30.1975,  lon: -97.6664  },
  { code: 'RDU', city: 'Raleigh-Durham',     name: 'Raleigh-Durham International',             country: 'US', lat: 35.8801,  lon: -78.7880  },
  { code: 'MCI', city: 'Kansas City',        name: 'Kansas City International',                country: 'US', lat: 39.2976,  lon: -94.7139  },
  { code: 'MSY', city: 'New Orleans',        name: 'Louis Armstrong New Orleans International',country: 'US', lat: 29.9934,  lon: -90.2580  },
  { code: 'SMF', city: 'Sacramento',         name: 'Sacramento International',                 country: 'US', lat: 38.6954,  lon: -121.5908 },
  { code: 'OAK', city: 'Oakland',            name: 'Oakland International',                    country: 'US', lat: 37.7213,  lon: -122.2208 },
  { code: 'SJC', city: 'San Jose',           name: 'Norman Y. Mineta San José International',  country: 'US', lat: 37.3626,  lon: -121.9290 },

  // ── DC Area ──
  { code: 'DCA', city: 'Washington DC',      name: 'Ronald Reagan Washington National',        country: 'US', lat: 38.8521,  lon: -77.0377  },
  { code: 'IAD', city: 'Washington Dulles',  name: 'Washington Dulles International',          country: 'US', lat: 38.9445,  lon: -77.4558  },

  // ── Texas ──
  { code: 'DAL', city: 'Dallas (Love)',      name: 'Dallas Love Field',                        country: 'US', lat: 32.8471,  lon: -96.8518  },
  { code: 'HOU', city: 'Houston (Hobby)',    name: 'William P. Hobby Airport',                 country: 'US', lat: 29.6454,  lon: -95.2789  },
  { code: 'SAT', city: 'San Antonio',        name: 'San Antonio International',                country: 'US', lat: 29.5337,  lon: -98.4698  },
  { code: 'AMA', city: 'Amarillo',           name: 'Rick Husband Amarillo International',      country: 'US', lat: 35.2194,  lon: -101.7059 },
  { code: 'LBB', city: 'Lubbock',           name: 'Lubbock Preston Smith International',      country: 'US', lat: 33.6636,  lon: -101.8228 },
  { code: 'MAF', city: 'Midland-Odessa',     name: 'Midland International Air & Space Port',   country: 'US', lat: 31.9425,  lon: -102.2019 },
  { code: 'CRP', city: 'Corpus Christi',     name: 'Corpus Christi International',             country: 'US', lat: 27.7704,  lon: -97.5012  },
  { code: 'ELP', city: 'El Paso',            name: 'El Paso International',                    country: 'US', lat: 31.8072,  lon: -106.3777 },
  { code: 'SHV', city: 'Shreveport',         name: 'Shreveport Regional Airport',              country: 'US', lat: 32.4466,  lon: -93.8257  },
  { code: 'MFE', city: 'McAllen',            name: 'McAllen Miller International',             country: 'US', lat: 26.1758,  lon: -98.2386  },

  // ── Southeast ──
  { code: 'BNA', city: 'Nashville',          name: 'Nashville International',                  country: 'US', lat: 36.1245,  lon: -86.6782  },
  { code: 'MEM', city: 'Memphis',            name: 'Memphis International',                    country: 'US', lat: 35.0424,  lon: -89.9767  },
  { code: 'JAX', city: 'Jacksonville',       name: 'Jacksonville International',               country: 'US', lat: 30.4941,  lon: -81.6879  },
  { code: 'RSW', city: 'Fort Myers',         name: 'Southwest Florida International',          country: 'US', lat: 26.5362,  lon: -81.7552  },
  { code: 'PBI', city: 'West Palm Beach',    name: 'Palm Beach International',                 country: 'US', lat: 26.6832,  lon: -80.0956  },
  { code: 'FLL', city: 'Fort Lauderdale',    name: 'Fort Lauderdale-Hollywood International',  country: 'US', lat: 26.0726,  lon: -80.1527  },
  { code: 'SRQ', city: 'Sarasota',           name: 'Sarasota-Bradenton International',         country: 'US', lat: 27.3954,  lon: -82.5544  },
  { code: 'TLH', city: 'Tallahassee',        name: 'Tallahassee International',                country: 'US', lat: 30.3965,  lon: -84.3503  },
  { code: 'PNS', city: 'Pensacola',          name: 'Pensacola International',                  country: 'US', lat: 30.4734,  lon: -87.1866  },
  { code: 'VPS', city: 'Destin/Fort Walton', name: 'Destin-Fort Walton Beach Airport',         country: 'US', lat: 30.4833,  lon: -86.5254  },
  { code: 'ECP', city: 'Panama City Beach',  name: 'Northwest Florida Beaches International',  country: 'US', lat: 30.3571,  lon: -85.7956  },
  { code: 'SAV', city: 'Savannah',           name: 'Savannah/Hilton Head International',       country: 'US', lat: 32.1276,  lon: -81.2021  },
  { code: 'CHS', city: 'Charleston',         name: 'Charleston International',                 country: 'US', lat: 32.8987,  lon: -80.0405  },
  { code: 'BHM', city: 'Birmingham',         name: 'Birmingham-Shuttlesworth International',   country: 'US', lat: 33.5629,  lon: -86.7535  },
  { code: 'HSV', city: 'Huntsville',         name: 'Huntsville International',                 country: 'US', lat: 34.6372,  lon: -86.7751  },
  { code: 'TYS', city: 'Knoxville',          name: 'McGhee Tyson Airport',                     country: 'US', lat: 35.8110,  lon: -83.9940  },
  { code: 'CHA', city: 'Chattanooga',        name: 'Chattanooga Metropolitan Airport',         country: 'US', lat: 35.0353,  lon: -85.2038  },

  // ── Carolinas / Virginia ──
  { code: 'ILM', city: 'Wilmington',         name: 'Wilmington International',                 country: 'US', lat: 34.2706,  lon: -77.9026  },
  { code: 'MYR', city: 'Myrtle Beach',       name: 'Myrtle Beach International',               country: 'US', lat: 33.6797,  lon: -78.9283  },
  { code: 'AVL', city: 'Asheville',          name: 'Asheville Regional Airport',               country: 'US', lat: 35.4362,  lon: -82.5419  },
  { code: 'GSP', city: 'Greenville-Spartanburg', name: 'Greenville-Spartanburg International', country: 'US', lat: 34.8957,  lon: -82.2189  },
  { code: 'GSO', city: 'Greensboro',         name: 'Piedmont Triad International',             country: 'US', lat: 36.0978,  lon: -79.9373  },
  { code: 'RIC', city: 'Richmond',           name: 'Richmond International',                   country: 'US', lat: 37.5052,  lon: -77.3197  },
  { code: 'ORF', city: 'Norfolk',            name: 'Norfolk International',                    country: 'US', lat: 36.8976,  lon: -76.0183  },

  // ── Northeast ──
  { code: 'BDL', city: 'Hartford',           name: 'Bradley International',                    country: 'US', lat: 41.9389,  lon: -72.6832  },
  { code: 'PVD', city: 'Providence',         name: 'Theodore Francis Green Airport',           country: 'US', lat: 41.7328,  lon: -71.4284  },
  { code: 'MHT', city: 'Manchester NH',      name: 'Manchester-Boston Regional',               country: 'US', lat: 42.9326,  lon: -71.4357  },
  { code: 'BUF', city: 'Buffalo',            name: 'Buffalo Niagara International',            country: 'US', lat: 42.9405,  lon: -78.7322  },
  { code: 'ROC', city: 'Rochester',          name: 'Greater Rochester International',          country: 'US', lat: 43.1189,  lon: -77.6724  },
  { code: 'ALB', city: 'Albany',             name: 'Albany International',                     country: 'US', lat: 42.7483,  lon: -73.8017  },
  { code: 'SYR', city: 'Syracuse',           name: 'Syracuse Hancock International',           country: 'US', lat: 43.1112,  lon: -76.1063  },
  { code: 'BTV', city: 'Burlington VT',      name: 'Burlington International',                 country: 'US', lat: 44.4719,  lon: -73.1533  },
  { code: 'PWM', city: 'Portland ME',        name: 'Portland International Jetport',           country: 'US', lat: 43.6462,  lon: -70.3093  },
  { code: 'BGR', city: 'Bangor',             name: 'Bangor International',                     country: 'US', lat: 44.8074,  lon: -68.8281  },

  // ── Midwest ──
  { code: 'PIT', city: 'Pittsburgh',         name: 'Pittsburgh International',                 country: 'US', lat: 40.4914,  lon: -80.2329  },
  { code: 'CLE', city: 'Cleveland',          name: 'Cleveland Hopkins International',          country: 'US', lat: 41.4117,  lon: -81.8498  },
  { code: 'CAK', city: 'Akron',              name: 'Akron-Canton Airport',                     country: 'US', lat: 40.9161,  lon: -81.4422  },
  { code: 'CMH', city: 'Columbus',           name: 'John Glenn Columbus International',        country: 'US', lat: 39.9980,  lon: -82.8919  },
  { code: 'IND', city: 'Indianapolis',       name: 'Indianapolis International',               country: 'US', lat: 39.7173,  lon: -86.2944  },
  { code: 'MKE', city: 'Milwaukee',          name: 'General Mitchell International',           country: 'US', lat: 42.9472,  lon: -87.8966  },
  { code: 'OMA', city: 'Omaha',              name: 'Eppley Airfield',                          country: 'US', lat: 41.3032,  lon: -95.8940  },
  { code: 'DSM', city: 'Des Moines',         name: 'Des Moines International',                 country: 'US', lat: 41.5330,  lon: -93.6631  },
  { code: 'CID', city: 'Cedar Rapids',       name: 'The Eastern Iowa Airport',                 country: 'US', lat: 41.8847,  lon: -91.7108  },
  { code: 'MSN', city: 'Madison',            name: 'Dane County Regional',                     country: 'US', lat: 43.1399,  lon: -89.3375  },
  { code: 'GRR', city: 'Grand Rapids',       name: 'Gerald R. Ford International',             country: 'US', lat: 42.8808,  lon: -85.5228  },
  { code: 'SBN', city: 'South Bend',         name: 'South Bend International',                 country: 'US', lat: 41.7087,  lon: -86.3173  },
  { code: 'TUL', city: 'Tulsa',              name: 'Tulsa International',                      country: 'US', lat: 36.1984,  lon: -95.8881  },
  { code: 'OKC', city: 'Oklahoma City',      name: 'Will Rogers World Airport',                country: 'US', lat: 35.3931,  lon: -97.6007  },
  { code: 'ICT', city: 'Wichita',            name: 'Wichita Eisenhower National',              country: 'US', lat: 37.6499,  lon: -97.4331  },

  // ── Southwest ──
  { code: 'ABQ', city: 'Albuquerque',        name: 'Albuquerque International Sunport',        country: 'US', lat: 35.0402,  lon: -106.6096 },
  { code: 'TUS', city: 'Tucson',             name: 'Tucson International',                     country: 'US', lat: 32.1161,  lon: -110.9410 },
  { code: 'FAT', city: 'Fresno',             name: 'Fresno Yosemite International',            country: 'US', lat: 36.7762,  lon: -119.7180 },
  { code: 'BUR', city: 'Burbank',            name: 'Hollywood Burbank Airport',                country: 'US', lat: 34.2007,  lon: -118.3585 },
  { code: 'LGB', city: 'Long Beach',         name: 'Long Beach Airport',                       country: 'US', lat: 33.8177,  lon: -118.1516 },
  { code: 'ONT', city: 'Ontario CA',         name: 'LA/Ontario International',                 country: 'US', lat: 34.0560,  lon: -117.6012 },
  { code: 'SNA', city: 'Orange County',      name: 'John Wayne Airport',                       country: 'US', lat: 33.6757,  lon: -117.8682 },
  { code: 'PSP', city: 'Palm Springs',       name: 'Palm Springs International',               country: 'US', lat: 33.8297,  lon: -116.5067 },

  // ── Pacific Northwest / Mountain West ──
  { code: 'GEG', city: 'Spokane',            name: 'Spokane International',                    country: 'US', lat: 47.6199,  lon: -117.5339 },
  { code: 'BOI', city: 'Boise',              name: 'Boise Airport',                            country: 'US', lat: 43.5644,  lon: -116.2228 },
  { code: 'BZN', city: 'Bozeman',            name: 'Bozeman Yellowstone International',        country: 'US', lat: 45.7770,  lon: -111.1530 },
  { code: 'MSO', city: 'Missoula',           name: 'Missoula Montana Airport',                 country: 'US', lat: 46.9163,  lon: -114.0906 },
  { code: 'BIL', city: 'Billings',           name: 'Billings Logan International',             country: 'US', lat: 45.8077,  lon: -108.5428 },

  // ── Colorado / Mountain Resorts ──
  { code: 'COS', city: 'Colorado Springs',   name: 'Colorado Springs Airport',                 country: 'US', lat: 38.8058,  lon: -104.7008 },
  { code: 'GJT', city: 'Grand Junction',     name: 'Grand Junction Regional',                  country: 'US', lat: 39.1224,  lon: -108.5267 },
  { code: 'ASE', city: 'Aspen',              name: 'Aspen/Pitkin County Airport',              country: 'US', lat: 39.2232,  lon: -106.8688 },
  { code: 'EGE', city: 'Eagle/Vail',         name: 'Eagle County Regional',                    country: 'US', lat: 39.6426,  lon: -106.9177 },
  { code: 'JAC', city: 'Jackson Hole',       name: 'Jackson Hole Airport',                     country: 'US', lat: 43.6073,  lon: -110.7377 },
  { code: 'MTJ', city: 'Montrose CO',        name: 'Montrose Regional Airport',                country: 'US', lat: 38.5098,  lon: -107.8937 },
  { code: 'DRO', city: 'Durango',            name: 'Durango-La Plata County Airport',          country: 'US', lat: 37.1515,  lon: -107.7539 },

  // ── Hawaii ──
  { code: 'OGG', city: 'Maui',               name: 'Kahului Airport',                          country: 'US', lat: 20.8986,  lon: -156.4305 },
  { code: 'KOA', city: 'Kona (Big Island)',  name: 'Ellison Onizuka Kona International',       country: 'US', lat: 19.7388,  lon: -156.0456 },
  { code: 'LIH', city: 'Kauai',              name: 'Lihue Airport',                            country: 'US', lat: 21.9760,  lon: -159.3388 },
  { code: 'ITO', city: 'Hilo',               name: 'Hilo International',                       country: 'US', lat: 19.7213,  lon: -155.0485 },

  // ── Alaska ──
  { code: 'ANC', city: 'Anchorage',          name: 'Ted Stevens Anchorage International',      country: 'US', lat: 61.1743,  lon: -149.9960 },
  { code: 'FAI', city: 'Fairbanks',          name: 'Fairbanks International',                  country: 'US', lat: 64.8150,  lon: -147.8561 },
  { code: 'JNU', city: 'Juneau',             name: 'Juneau International',                     country: 'US', lat: 58.3550,  lon: -134.5763 },
  { code: 'KTN', city: 'Ketchikan',          name: 'Ketchikan International',                  country: 'US', lat: 55.3557,  lon: -131.7137 },

  // ── US Territories ──
  { code: 'SJU', city: 'San Juan',           name: 'Luis Muñoz Marín International',           country: 'US', lat: 18.4394,  lon: -66.0018  },
  { code: 'GUM', city: 'Guam',               name: 'Antonio B. Won Pat International',         country: 'US', lat: 13.4834,  lon: 144.7957  },
  { code: 'PPG', city: 'Pago Pago',          name: 'Pago Pago International',                  country: 'US', lat: -14.3310, lon: -170.7106 },
]

// Airport → IANA timezone mapping
export const AIRPORT_TZ: Record<string, string> = {
  // Pacific (UTC-8/-7)
  SFO:'America/Los_Angeles', LAX:'America/Los_Angeles', LAS:'America/Los_Angeles',
  SEA:'America/Los_Angeles', SAN:'America/Los_Angeles', PDX:'America/Los_Angeles',
  SJC:'America/Los_Angeles', OAK:'America/Los_Angeles', SMF:'America/Los_Angeles',
  BUR:'America/Los_Angeles', LGB:'America/Los_Angeles', ONT:'America/Los_Angeles',
  SNA:'America/Los_Angeles', PSP:'America/Los_Angeles', FAT:'America/Los_Angeles',
  GEG:'America/Los_Angeles', BOI:'America/Los_Angeles',
  // Mountain — Arizona (UTC-7 all year, no DST)
  PHX:'America/Phoenix', TUS:'America/Phoenix',
  // Mountain (UTC-7/-6)
  DEN:'America/Denver', SLC:'America/Denver', ABQ:'America/Denver',
  ELP:'America/Denver', BZN:'America/Denver', MSO:'America/Denver',
  BIL:'America/Denver', COS:'America/Denver', GJT:'America/Denver',
  ASE:'America/Denver', EGE:'America/Denver', JAC:'America/Denver',
  MTJ:'America/Denver', DRO:'America/Denver',
  // Central (UTC-6/-5)
  ORD:'America/Chicago', DFW:'America/Chicago', IAH:'America/Chicago',
  MCI:'America/Chicago', MSP:'America/Chicago', MDW:'America/Chicago',
  STL:'America/Chicago', AUS:'America/Chicago', BNA:'America/Chicago',
  MEM:'America/Chicago', HOU:'America/Chicago', SAT:'America/Chicago',
  AMA:'America/Chicago', LBB:'America/Chicago', MAF:'America/Chicago',
  CRP:'America/Chicago', SHV:'America/Chicago', MFE:'America/Chicago',
  MSY:'America/Chicago', OMA:'America/Chicago', DSM:'America/Chicago',
  CID:'America/Chicago', MSN:'America/Chicago', DAL:'America/Chicago',
  TUL:'America/Chicago', OKC:'America/Chicago', ICT:'America/Chicago',
  PNS:'America/Chicago', VPS:'America/Chicago', ECP:'America/Chicago',
  MKE:'America/Chicago',
  // Eastern (UTC-5/-4)
  ATL:'America/New_York', JFK:'America/New_York', MIA:'America/New_York',
  CLT:'America/New_York', BOS:'America/New_York', DTW:'America/New_York',
  PHL:'America/New_York', EWR:'America/New_York', LGA:'America/New_York',
  BWI:'America/New_York', TPA:'America/New_York', MCO:'America/New_York',
  FLL:'America/New_York', RSW:'America/New_York', PBI:'America/New_York',
  SRQ:'America/New_York', TLH:'America/New_York', SAV:'America/New_York',
  CHS:'America/New_York', BHM:'America/New_York', HSV:'America/New_York',
  TYS:'America/New_York', CHA:'America/New_York', ILM:'America/New_York',
  MYR:'America/New_York', AVL:'America/New_York', GSP:'America/New_York',
  GSO:'America/New_York', RIC:'America/New_York', ORF:'America/New_York',
  DCA:'America/New_York', IAD:'America/New_York', BDL:'America/New_York',
  PVD:'America/New_York', MHT:'America/New_York', BUF:'America/New_York',
  ROC:'America/New_York', ALB:'America/New_York', SYR:'America/New_York',
  BTV:'America/New_York', PWM:'America/New_York', BGR:'America/New_York',
  PIT:'America/New_York', CLE:'America/New_York', CAK:'America/New_York',
  CMH:'America/New_York', IND:'America/New_York', JAX:'America/New_York',
  RDU:'America/New_York', GRR:'America/New_York', SBN:'America/New_York',
  // Hawaii (UTC-10, no DST)
  HNL:'Pacific/Honolulu', OGG:'Pacific/Honolulu', KOA:'Pacific/Honolulu',
  LIH:'Pacific/Honolulu', ITO:'Pacific/Honolulu',
  // Alaska
  ANC:'America/Anchorage', FAI:'America/Anchorage',
  JNU:'America/Juneau',    KTN:'America/Juneau',
  // US Territories
  SJU:'America/Puerto_Rico', GUM:'Pacific/Guam',          PPG:'Pacific/Pago_Pago',
}

// Convert a local HH:MM time at a given IANA timezone + date to a UTC Date
export function localToUTC(dateStr: string, timeStr: string, tz: string): Date {
  const probe = new Date(`${dateStr}T${timeStr}:00Z`)
  const localHHMM = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(probe)
  const [lhStr, lmStr] = localHHMM.split(':')
  const lh = parseInt(lhStr) % 24
  const lm = parseInt(lmStr)
  const [th, tm] = timeStr.split(':').map(Number)
  let diff = (th * 60 + tm) - (lh * 60 + lm)
  if (diff > 720)  diff -= 1440
  if (diff < -720) diff += 1440
  return new Date(probe.getTime() + diff * 60000)
}

// Google Flights' own airline logo CDN — same source used by google.com/flights
const GSTATIC = (code: string) => `https://www.gstatic.com/flights/airline_logos/70px/${code}.png`

export const AIRLINES: Airline[] = [
  { code: 'AA', name: 'American Airlines',  color: '#C8102E', logoUrl: GSTATIC('AA') },
  { code: 'DL', name: 'Delta Air Lines',    color: '#003DA5', logoUrl: GSTATIC('DL') },
  { code: 'UA', name: 'United Airlines',    color: '#005DAA', logoUrl: GSTATIC('UA') },
  { code: 'WN', name: 'Southwest Airlines', color: '#304CB2', logoUrl: GSTATIC('WN') },
  { code: 'B6', name: 'JetBlue Airways',    color: '#0033A0', logoUrl: GSTATIC('B6') },
  { code: 'AS', name: 'Alaska Airlines',    color: '#0074C8', logoUrl: GSTATIC('AS') },
  { code: 'F9', name: 'Frontier Airlines',  color: '#007A3E', logoUrl: GSTATIC('F9') },
]

const AIRCRAFT: Record<string, string[]> = {
  AA: ['Boeing 737-800', 'Airbus A321', 'Boeing 777-200ER', 'Airbus A319', 'Boeing 787-9 Dreamliner', 'Airbus A321XLR'],
  DL: ['Airbus A220-300', 'Boeing 737-900ER', 'Airbus A321neo', 'Boeing 767-300ER', 'Airbus A330-900neo', 'Boeing 757-200'],
  UA: ['Boeing 737-800', 'Boeing 737 MAX 9', 'Airbus A320neo', 'Boeing 777-300ER', 'Boeing 787-9 Dreamliner', 'Boeing 757-200'],
  WN: ['Boeing 737-800', 'Boeing 737 MAX 8', 'Boeing 737-700', 'Boeing 737 MAX 7'],
  B6: ['Airbus A320', 'Airbus A321', 'Airbus A220-300', 'Embraer E190', 'Airbus A321neo'],
  AS: ['Boeing 737-900ER', 'Boeing 737-800', 'Airbus A320', 'Embraer E175', 'Boeing 737 MAX 9'],
  F9: ['Airbus A320neo', 'Airbus A321neo', 'Airbus A319neo'],
}

const BAGGAGE: Record<string, { carryOnIncluded: boolean; checkedBagPrice: number | null }> = {
  AA: { carryOnIncluded: true,  checkedBagPrice: 30 },
  DL: { carryOnIncluded: true,  checkedBagPrice: 30 },
  UA: { carryOnIncluded: true,  checkedBagPrice: 35 },
  WN: { carryOnIncluded: true,  checkedBagPrice: null },
  B6: { carryOnIncluded: true,  checkedBagPrice: 35 },
  AS: { carryOnIncluded: true,  checkedBagPrice: 30 },
  F9: { carryOnIncluded: false, checkedBagPrice: 49 },
}

const AIRLINE_PRICE_FACTOR: Record<string, number> = {
  AA: 1.0, DL: 1.05, UA: 0.98, WN: 0.88, B6: 0.85, AS: 0.90, F9: 0.62,
}

// Major hub airports used as connection points for 1-stop itineraries
const MAJOR_HUBS = ['ATL', 'ORD', 'DFW', 'DEN', 'LAX', 'SFO', 'JFK', 'SEA', 'IAH', 'CLT', 'PHX', 'MSP', 'SLC', 'DTW', 'BOS', 'EWR']

// Compute great-circle distance in miles between two lat/lon points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getBaseDuration(from: string, to: string): number {
  const fromAp = AIRPORTS.find(a => a.code === from)
  const toAp   = AIRPORTS.find(a => a.code === to)
  if (!fromAp || !toAp) return 240
  const miles = haversineDistance(fromAp.lat, fromAp.lon, toAp.lat, toAp.lon)
  // ~530 mph cruise + ~45 min overhead (taxi, climb, descent)
  return Math.round(miles / 530 * 60 + 45)
}

// Per-route discount applied on top of the duration/airline tiers, for routes
// that are known to run cheaper than the generic curve (e.g. dense, competitive
// short-haul routes with lots of low-cost-carrier capacity).
const ROUTE_PRICE_FACTOR: Record<string, number> = {
  'SFO-LAX': 0.84, 'LAX-SFO': 0.84,
}

export function getBasePrice(durationMinutes: number, airlineCode: string, origin?: string, destination?: string): number {
  let base: number
  if      (durationMinutes < 90)  base = 59
  else if (durationMinutes < 150) base = 89
  else if (durationMinutes < 240) base = 119
  else if (durationMinutes < 360) base = 149
  else if (durationMinutes < 480) base = 169
  else if (durationMinutes < 600) base = 189
  else if (durationMinutes < 720) base = 209
  else                            base = 239
  const routeFactor = (origin && destination) ? (ROUTE_PRICE_FACTOR[`${origin}-${destination}`] ?? 1.0) : 1.0
  return Math.round(base * (AIRLINE_PRICE_FACTOR[airlineCode] ?? 1.0) * routeFactor)
}

function seededRand(seed: string): () => number {
  let h = 5381
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) & 0x7fffffff
  return () => { h = ((h * 1664525) + 1013904223) & 0x7fffffff; return h / 0x7fffffff }
}

export function generateFlights(from: string, to: string, date: string): Flight[] {
  const fromAirport = AIRPORTS.find(a => a.code === from)
  const toAirport   = AIRPORTS.find(a => a.code === to)
  if (!fromAirport || !toAirport || from === to) return []

  // ── Use real schedule database when available ──────────────────────────
  const scheduled = getScheduledFlights(from, to, date)
  if (scheduled && scheduled.length > 0) {
    const today   = new Date(); today.setHours(0,0,0,0)
    const dep     = new Date(date)
    const daysOut = Math.round((dep.getTime() - today.getTime()) / 86400000)
    // Seats left decreases as departure approaches
    const maxSeats = daysOut <= 3 ? 4 : daysOut <= 7 ? 9 : daysOut <= 21 ? 22 : 45

    const flights = scheduled.map((sf, i) => {
      const airline = AIRLINES.find(a => a.code === sf.code) ??
        { code: sf.code, name: sf.code, color: '#555', logoUrl: `https://www.gstatic.com/flights/airline_logos/70px/${sf.code}.png` }
      const baggage = BAGGAGE[sf.code] || { carryOnIncluded: true, checkedBagPrice: 35 }

      const fromTZ  = AIRPORT_TZ[from] ?? 'America/Chicago'
      const depDate = localToUTC(date, sf.dep, fromTZ)
      const arrDate = new Date(depDate.getTime() + sf.dur * 60000)

      const economyPrice = applyDatePricing(sf.fare, date)
      // Seed seats to be deterministic per flight
      const r = seededRand(`${from}-${to}-${date}-sched-${i}`)
      const seatsLeft = 1 + Math.floor(r() * maxSeats)

      return {
        id:             `sched-${from}-${to}-${date}-${sf.code}${sf.num}`,
        flightNumber:   sf.label ?? `${sf.code} ${sf.num}`,
        airline,
        origin:         fromAirport,
        destination:    toAirport,
        departureTime:  depDate.toISOString(),
        arrivalTime:    arrDate.toISOString(),
        durationMinutes:sf.dur,
        stops:          sf.stops ?? 0,
        stopCity:       sf.via,
        aircraft:       sf.ac,
        carryOnIncluded:baggage.carryOnIncluded,
        checkedBagPrice:baggage.checkedBagPrice,
        featured:       sf.featured,
        layoverMin:     sf.layoverMin,
        connectionDetail: sf.connectionDetail,
        economy:  { price: economyPrice,                                  seatsLeft },
        business: { price: Math.round(economyPrice * 2.8 * 100) / 100,    seatsLeft: Math.max(1, Math.floor(seatsLeft * 0.3)) },
        first:    { price: Math.round(economyPrice * 5.5 * 100) / 100,    seatsLeft: Math.max(1, Math.floor(seatsLeft * 0.12)) },
      } as Flight
    })
    // Band economy around target one-way base; SearchResults re-normalizes per route.
    // Featured curated itineraries stay first, then by departure time.
    return normalizeFlightEconomyPrices(flights, 1)
      .sort((a, b) => {
        if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1
        return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
      })
  }

  // ── Fallback: haversine-based random generation for unlisted routes ────
  const baseDuration = getBaseDuration(from, to)
  const countRand = seededRand(`${from}-${to}-${date}-count`)
  const count = 7 + Math.floor(countRand() * 4)
  const stopOptions = MAJOR_HUBS.filter(h => h !== from && h !== to)

  const generated = Array.from({ length: count }, (_, i) => {
    const r = seededRand(`${from}-${to}-${date}-${i}`)
    const airline = AIRLINES[Math.floor(r() * AIRLINES.length)]
    const aircraftList = AIRCRAFT[airline.code] || ['Boeing 737-800']
    const aircraft = aircraftList[Math.floor(r() * aircraftList.length)]
    const baggage = BAGGAGE[airline.code] || { carryOnIncluded: true, checkedBagPrice: 35 }

    const flightNumRanges: Record<string, [number, number]> = {
      AA: [1, 3999], DL: [1, 4999], UA: [1, 5999], WN: [1, 9999],
      B6: [1, 2999], AS: [1, 999],  F9: [1, 999],
    }
    const [min, max] = flightNumRanges[airline.code] || [100, 9999]
    const flightNum = `${airline.code} ${min + Math.floor(r() * (max - min))}`

    const timeSlots = [5,6,6,7,7,8,8,9,10,11,12,13,14,15,16,17,17,18,19,20,21,22]
    const depHour = timeSlots[Math.floor(r() * timeSlots.length)]
    const depMin  = Math.floor(r() * 4) * 15
    const depTimeStr = `${String(depHour).padStart(2,'0')}:${String(depMin).padStart(2,'0')}`

    const fromTZFb = AIRPORT_TZ[from] ?? 'America/Chicago'
    const dep      = localToUTC(date, depTimeStr, fromTZFb)

    const durationVariance = 0.90 + r() * 0.22
    const duration = Math.round(baseDuration * durationVariance)
    const arr = new Date(dep.getTime() + duration * 60000)

    const nonStopChance = baseDuration < 200 ? 0.75 : 0.45
    const stopsRoll = r()
    const stops = stopsRoll < nonStopChance ? 0 : stopsRoll < 0.85 ? 1 : 2
    const stopCity = stopOptions[Math.floor(r() * stopOptions.length)]

    const base = getBasePrice(duration, airline.code, from, to)
    const priceVariance = 0.80 + r() * 0.55
    const economyPrice = Math.round(base * priceVariance * 100) / 100
    const seatsLeft = 1 + Math.floor(r() * 42)

    return {
      id: `${from}-${to}-${date}-${i}`,
      flightNumber: flightNum,
      airline,
      origin: fromAirport,
      destination: toAirport,
      departureTime: dep.toISOString(),
      arrivalTime: arr.toISOString(),
      durationMinutes: duration,
      stops,
      stopCity: stops > 0 ? stopCity : undefined,
      aircraft,
      carryOnIncluded: baggage.carryOnIncluded,
      checkedBagPrice: baggage.checkedBagPrice,
      economy:  { price: economyPrice,                                      seatsLeft },
      business: { price: Math.round(economyPrice * 2.8 * 100) / 100,       seatsLeft: Math.max(1, Math.floor(seatsLeft * 0.3)) },
      first:    { price: Math.round(economyPrice * 5.5 * 100) / 100,       seatsLeft: Math.max(1, Math.floor(seatsLeft * 0.12)) },
    } as Flight
  })
  return normalizeFlightEconomyPrices(generated, 1)
    .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
}

export function formatPrice(amount: number): string {
  return amount.toFixed(2)
}

const FARE_NAMES: Record<string, { economy: string; business: string; first: string }> = {
  AA: { economy: 'Main Cabin',     business: 'Main Select',       first: 'First'           },
  DL: { economy: 'Delta Main',     business: 'Delta One',         first: 'First Class'     },
  UA: { economy: 'Economy',        business: 'Polaris Business',  first: 'United First'    },
  WN: { economy: 'Wanna Get Away', business: 'Anytime',           first: 'Business Select' },
  B6: { economy: 'Blue',           business: 'Mint',              first: 'Mint Suite'      },
  AS: { economy: 'Saver',          business: 'First Class',       first: 'First Class'     },
  F9: { economy: 'Economy',        business: 'Stretch',           first: 'Stretch'         },
}

/** Demo / published itineraries sold as Basic Economy only. */
const BASIC_ECONOMY_FLIGHTS = new Set([
  'UA 2097', 'UA 234',                 // SFO↔CLE
  'AA 5175 / AA 3049',                 // CAK→SFO via ORD
  'AA 1253 / AA 5242',                 // SFO→CAK via ORD
  'AA 5175', 'AA 3049', 'AA 1253', 'AA 5242',
  'UA 4646 / UA 1540',                 // CAK→SJC via ORD
  'UA 1239 / UA 5358',                 // SJC→CAK via ORD
  'UA 4752 / UA 2156',
  'UA 2157 / UA 4753',
  'UA 4646', 'UA 1540', 'UA 1239', 'UA 5358',
  'UA 4752', 'UA 2156', 'UA 2157', 'UA 4753',
])

export function fareName(
  airlineCode: string,
  cabin: 'economy' | 'business' | 'first',
  flightNumber?: string,
): string {
  if (
    cabin === 'economy' &&
    flightNumber &&
    BASIC_ECONOMY_FLIGHTS.has(flightNumber)
  ) {
    return 'Basic Economy'
  }
  return (FARE_NAMES[airlineCode] ?? {})[cabin] ?? (cabin.charAt(0).toUpperCase() + cabin.slice(1))
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatTime(iso: string, tz?: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    ...(tz ? { timeZone: tz } : {}),
  })
}

export function formatDate(iso: string, tz?: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    ...(tz ? { timeZone: tz } : {}),
  })
}

export function formatTZAbbr(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
    .format(new Date(iso)).split(' ').pop() ?? ''
}

export function getPriceForClass(flight: Flight, cls: 'economy' | 'business' | 'first'): number {
  return flight[cls].price
}

export const ADD_ONS: AddOn[] = [
  { id: 'checked-bag', type: 'checkedBag',  name: 'Checked Bag (23kg)',       description: 'First checked bag allowance',                  price: 35, perPassenger: false },
  { id: 'extra-bag',   type: 'extraBag',    name: 'Extra Checked Bag (23kg)', description: 'Second checked bag',                           price: 50, perPassenger: false },
  { id: 'priority',    type: 'priority',    name: 'Priority Boarding',        description: 'Board among the first group of passengers',    price: 15, perPassenger: true  },
  { id: 'meal-std',    type: 'meal',        name: 'Standard Meal',            description: 'Choice of chicken or pasta',                   price: 12, perPassenger: true  },
  { id: 'meal-veg',    type: 'meal',        name: 'Vegetarian Meal',          description: 'Plant-based meal option',                      price: 12, perPassenger: true  },
  { id: 'insurance',   type: 'insurance',   name: 'Travel Insurance',         description: 'Trip cancellation, medical & baggage coverage', price: 29, perPassenger: true  },
  { id: 'lounge',      type: 'lounge',      name: 'Airport Lounge Access',    description: 'Access to premium lounge before departure',    price: 45, perPassenger: false },
]

export interface SeatInfo {
  code: string
  taken: boolean
  type: 'window' | 'middle' | 'aisle'
  class: 'economy' | 'business' | 'first'
  price: number
  extraLegroom: boolean
}

export interface SeatRow {
  row: number
  seats: SeatInfo[]
}

export function generateSeatMap(flightId: string, cabinClass: 'economy' | 'business' | 'first'): SeatRow[] {
  const rand = seededRand(flightId + '-' + cabinClass)
  const config =
    cabinClass === 'first'    ? { rows: 4,  start: 1,  cols: ['A', 'C', 'D', 'F'] } :
    cabinClass === 'business' ? { rows: 8,  start: 5,  cols: ['A', 'B', 'D', 'E'] } :
                                { rows: 26, start: 13, cols: ['A', 'B', 'C', 'D', 'E', 'F'] }

  return Array.from({ length: config.rows }, (_, rowIdx) => {
    const row = config.start + rowIdx
    return {
      row,
      seats: config.cols.map(col => {
        const type: SeatInfo['type'] = (col === 'A' || col === 'F') ? 'window' : (col === 'C' || col === 'D') ? 'aisle' : 'middle'
        const extraLegroom = cabinClass === 'economy' && row <= config.start + 2
        let price = 0
        if (cabinClass === 'first') {
          price = 40
        } else if (cabinClass === 'business') {
          price = type === 'window' ? 30 : 20
        } else {
          if (extraLegroom)          price = 25
          else if (type === 'window') price = 15
          else if (type === 'aisle')  price = 12
          // middle seats are free
        }
        return { code: `${row}${col}`, taken: rand() < 0.42, type, class: cabinClass, price, extraLegroom } as SeatInfo
      }),
    }
  })
}

export function generatePNR(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
