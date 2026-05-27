export interface UrlMeta {
  url: string
  title: string | null
  description: string | null
  platform: 'youtube' | 'instagram' | 'other'
}

function detectPlatform(url: string): 'youtube' | 'instagram' | 'other' {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/instagram\.com/.test(url)) return 'instagram'
  return 'other'
}

function extractOgTag(html: string, property: string): string | null {
  // Try og:property first, then name=property
  const ogMatch = html.match(new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']*?)["']`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']*?)["'][^>]+property=["']og:${property}["']`, 'i'))
  if (ogMatch?.[1]) return decodeHtmlEntities(ogMatch[1])

  // Twitter fallback
  const twitterMatch = html.match(new RegExp(`<meta[^>]+name=["']twitter:${property}["'][^>]+content=["']([^"']*?)["']`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']*?)["'][^>]+name=["']twitter:${property}["']`, 'i'))
  if (twitterMatch?.[1]) return decodeHtmlEntities(twitterMatch[1])

  return null
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\n/g, ' ')
    .trim()
}

async function fetchYouTubeMeta(url: string): Promise<{ title: string | null; description: string | null }> {
  try {
    // YouTube oEmbed gives structured title + author
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const data = await res.json() as { title?: string; author_name?: string }
      // Also try to get the description from the video page
      const pageRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
        signal: AbortSignal.timeout(8000),
      })
      let description: string | null = null
      if (pageRes.ok) {
        const html = await pageRes.text()
        description = extractOgTag(html, 'description')
      }
      return { title: data.title ?? null, description }
    }
  } catch {
    // Fall through to generic fetch
  }
  return { title: null, description: null }
}

async function fetchGenericMeta(url: string): Promise<{ title: string | null; description: string | null }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  // Only read the first 100KB — enough for meta tags
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')
  const chunks: Uint8Array[] = []
  let totalBytes = 0
  while (totalBytes < 100_000) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    totalBytes += value.length
  }
  reader.cancel()
  const html = new TextDecoder().decode(Buffer.concat(chunks))
  return {
    title: extractOgTag(html, 'title'),
    description: extractOgTag(html, 'description'),
  }
}

export async function extractUrlMeta(url: string): Promise<UrlMeta> {
  const platform = detectPlatform(url)
  try {
    let title: string | null = null
    let description: string | null = null

    if (platform === 'youtube') {
      const yt = await fetchYouTubeMeta(url)
      title = yt.title
      description = yt.description
    } else {
      const generic = await fetchGenericMeta(url)
      title = generic.title
      description = generic.description
    }

    return { url, title, description, platform }
  } catch {
    // Return partial result — caller decides what to do
    return { url, title: null, description: null, platform }
  }
}
