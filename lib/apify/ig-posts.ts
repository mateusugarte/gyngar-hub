import { createApifyClient } from './base'

const IG_POSTS_ACTOR = 'apify/instagram-scraper'

export interface IgPostScraped {
  url?: string
  type?: string
  shortCode?: string
  caption?: string | null
  likesCount?: number
  commentsCount?: number
  videoViewCount?: number
  timestamp?: string
  ownerUsername?: string
  ownerFullName?: string
  displayUrl?: string
  videoUrl?: string
}

/**
 * Scrapes an Instagram post/profile using the user-configured actor input.
 * directUrls is always overridden with the target URL.
 * Uses run-sync to avoid polling — waits up to 45s for completion.
 */
export async function scrapeIgPostSync(
  apiKey: string,
  inputConfig: Record<string, unknown>,
  targetUrl: string
): Promise<IgPostScraped[]> {
  const client = createApifyClient(apiKey)

  const input = {
    ...inputConfig,
    directUrls: [targetUrl],
    // Cap results when scraping a single URL for speed
    resultsLimit: Math.min(Number(inputConfig.resultsLimit ?? 10), 20),
  }

  const res = await fetch(
    `${client.baseUrl}/acts/${encodeURIComponent(IG_POSTS_ACTOR)}/run-sync-get-dataset-items?timeout=45`,
    {
      method: 'POST',
      headers: client.headers,
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(50000),
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Apify IG scrape falhou: ${res.status} ${text.slice(0, 200)}`)
  }

  return res.json() as Promise<IgPostScraped[]>
}
