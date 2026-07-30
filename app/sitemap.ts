import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

const base = SITE_URL

const POPULAR_PAIRS: [string, string][] = [
  ['JFK','LAX'],['JFK','SFO'],['JFK','MIA'],['JFK','ORD'],['JFK','LAS'],
  ['JFK','ATL'],['JFK','BOS'],['JFK','SEA'],['JFK','DFW'],['JFK','DEN'],
  ['JFK','CLT'],['JFK','MCO'],['JFK','PHX'],['JFK','BNA'],
  ['LAX','SFO'],['LAX','LAS'],['LAX','PHX'],['LAX','DFW'],['LAX','ORD'],
  ['LAX','ATL'],['LAX','SEA'],['LAX','DEN'],['LAX','MIA'],['LAX','BOS'],
  ['LAX','BNA'],['LAX','MCO'],['LAX','CLT'],
  ['SFO','LAS'],['SFO','BNA'],['SFO','SEA'],['SFO','DEN'],['SFO','ORD'],
  ['SFO','PHX'],['SFO','ATL'],['SFO','MIA'],['SFO','DFW'],['SFO','CLT'],
  ['SFO','CLE'], // featured route
  ['ATL','ORD'],['ATL','DFW'],['ATL','MIA'],['ATL','CLT'],['ATL','BNA'],
  ['ATL','MCO'],['ATL','BOS'],['ATL','DEN'],['ATL','SEA'],
  ['ORD','DFW'],['ORD','MIA'],['ORD','BOS'],['ORD','DEN'],['ORD','CLT'],
  ['ORD','BNA'],['ORD','MCO'],['ORD','PHX'],['ORD','SEA'],
  ['DFW','BNA'],['DFW','MIA'],['DFW','DEN'],['DFW','MCO'],['DFW','BOS'],
  ['DFW','SEA'],['DFW','PHX'],
  ['BNA','MIA'],['BNA','DEN'],['BNA','CLT'],['BNA','MCO'],['BNA','BOS'],
  ['MIA','BOS'],['MIA','DEN'],['MIA','MCO'],
  ['DEN','SEA'],['DEN','PHX'],['DEN','BOS'],['DEN','LAS'],
  ['EWR','LAX'],['EWR','SFO'],['EWR','MIA'],['EWR','ORD'],['EWR','ATL'],
  ['LGA','ORD'],['LGA','ATL'],['LGA','MIA'],['LGA','DFW'],
  ['SEA','LAS'],['SEA','PHX'],['SEA','DEN'],
  ['LAS','PHX'],['LAS','DFW'],['LAS','ATL'],
  ['MCO','BOS'],['MCO','ORD'],['MCO','DFW'],
  ['CLE','SFO'],['CLE','JFK'],['CLE','LAX'],['CLE','ORD'],
]

function routeUrls(): MetadataRoute.Sitemap {
  const seen = new Set<string>()
  const entries: MetadataRoute.Sitemap = []
  for (const [a, b] of POPULAR_PAIRS) {
    for (const slug of [`${a.toLowerCase()}-to-${b.toLowerCase()}`, `${b.toLowerCase()}-to-${a.toLowerCase()}`]) {
      if (!seen.has(slug)) {
        seen.add(slug)
        entries.push({
          url: `${base}/flights/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }
  }
  return entries
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base,              lastModified: new Date(), changeFrequency: 'daily',   priority: 1   },
    { url: `${base}/search`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/flights`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/about`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/press`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/help`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/baggage`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terms`,   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    ...routeUrls(),
  ]
}
