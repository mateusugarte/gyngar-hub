import { createApifyClient, ACTORS } from './base'

export interface GMapsInput {
  searchTerms: string[]
  maxResults?: number
  country?: string
  state?: string
  city?: string
}

export interface GMapsRaw {
  title: string
  website?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  countryCode?: string
  categoryName?: string
  totalScore?: number
  reviewsCount?: number
  description?: string
  url?: string
}

export async function startGMapsScrape(apiKey: string, input: GMapsInput): Promise<string> {
  const client = createApifyClient(apiKey)
  const res = await fetch(
    `${client.baseUrl}/acts/${encodeURIComponent(ACTORS.GOOGLE_MAPS)}/runs`,
    {
      method: 'POST',
      headers: client.headers,
      body: JSON.stringify({
        searchStringsArray: input.searchTerms,
        maxCrawledPlacesPerSearch: input.maxResults ?? 100,
        language: 'pt',
        countryCode: input.country ?? 'BR',
      }),
    }
  )
  if (!res.ok) throw new Error(`Apify start failed: ${res.status}`)
  const json = await res.json()
  return json.data.id as string
}

export async function getGMapsResults(apiKey: string, runId: string): Promise<GMapsRaw[]> {
  const client = createApifyClient(apiKey)
  const res = await fetch(
    `${client.baseUrl}/actor-runs/${runId}/dataset/items?limit=1000`,
    { headers: client.headers }
  )
  if (!res.ok) throw new Error(`Apify results failed: ${res.status}`)
  return res.json()
}
