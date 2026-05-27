import { createApifyClient, ACTORS } from './base'

export interface IgCommentInput {
  postUrls: string[]
  maxComments?: number
}

export interface IgCommentRaw {
  id: string
  text: string
  ownerUsername: string
  ownerFullName?: string
  ownerProfilePicUrl?: string
  timestamp: string
  likesCount: number
}

export async function startIgCommentScrape(apiKey: string, input: IgCommentInput): Promise<string> {
  const client = createApifyClient(apiKey)
  const res = await fetch(
    `${client.baseUrl}/acts/${encodeURIComponent(ACTORS.IG_COMMENTS)}/runs`,
    {
      method: 'POST',
      headers: client.headers,
      body: JSON.stringify({ postUrls: input.postUrls, maxComments: input.maxComments ?? 200 }),
    }
  )
  if (!res.ok) throw new Error(`Apify start failed: ${res.status}`)
  const json = await res.json()
  return json.data.id as string
}

export async function getIgCommentResults(apiKey: string, runId: string): Promise<IgCommentRaw[]> {
  const client = createApifyClient(apiKey)
  const res = await fetch(
    `${client.baseUrl}/actor-runs/${runId}/dataset/items?limit=1000`,
    { headers: client.headers }
  )
  if (!res.ok) throw new Error(`Apify results failed: ${res.status}`)
  return res.json()
}
