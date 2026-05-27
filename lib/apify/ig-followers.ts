import { createApifyClient, ACTORS } from './base'

export interface IgFollowerInput {
  username: string
  maxFollowers?: number
}

export interface IgFollowerRaw {
  username: string
  fullName?: string
  biography?: string
  followersCount?: number
  followsCount?: number
  isBusinessAccount?: boolean
  businessCategory?: string
  externalUrl?: string
  profilePicUrl?: string
}

export async function startIgFollowerScrape(apiKey: string, input: IgFollowerInput): Promise<string> {
  const client = createApifyClient(apiKey)
  const res = await fetch(
    `${client.baseUrl}/acts/${encodeURIComponent(ACTORS.IG_FOLLOWERS)}/runs`,
    {
      method: 'POST',
      headers: client.headers,
      body: JSON.stringify({ username: input.username, maxFollowers: input.maxFollowers ?? 500 }),
    }
  )
  if (!res.ok) throw new Error(`Apify start failed: ${res.status}`)
  const json = await res.json()
  return json.data.id as string
}

export async function getIgFollowerResults(apiKey: string, runId: string): Promise<IgFollowerRaw[]> {
  const client = createApifyClient(apiKey)
  const res = await fetch(
    `${client.baseUrl}/actor-runs/${runId}/dataset/items?limit=1000`,
    { headers: client.headers }
  )
  if (!res.ok) throw new Error(`Apify results failed: ${res.status}`)
  return res.json()
}
