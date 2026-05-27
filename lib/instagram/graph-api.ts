// Instagram Graph API para contas Business/Creator
// Base: graph.facebook.com (NÃO graph.instagram.com — essa é a API descontinuada para contas pessoais)
export const IG_GRAPH_BASE = 'https://graph.facebook.com/v21.0'

// ─── Perfil ──────────────────────────────────────────────────────────────────

export interface IgProfile {
  id: string
  username: string
  name?: string
  biography?: string
  profile_picture_url?: string
  followers_count?: number
  follows_count?: number
  media_count?: number
  website?: string
}

export async function getIgProfile(igUserId: string, accessToken: string): Promise<IgProfile> {
  const fields = 'id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,website'
  const url = `${IG_GRAPH_BASE}/${igUserId}?fields=${fields}&access_token=${accessToken}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`IG profile fetch failed: ${res.status} — ${body}`)
  }
  return res.json()
}

// ─── Mídia ───────────────────────────────────────────────────────────────────

export interface IgPost {
  id: string
  media_type: 'IMAGE' | 'VIDEO' | 'REEL' | 'CAROUSEL_ALBUM' | string
  caption?: string
  timestamp: string
  like_count?: number
  comments_count?: number
  thumbnail_url?: string
  media_url?: string
  permalink?: string
}

export async function getIgMedia(igUserId: string, accessToken: string): Promise<IgPost[]> {
  // thumbnail_url: disponível apenas para VIDEO; media_url: para IMAGE, VIDEO, CAROUSEL_ALBUM
  const fields = 'id,caption,media_type,timestamp,like_count,comments_count,thumbnail_url,media_url,permalink'
  const url = `${IG_GRAPH_BASE}/${igUserId}/media?fields=${fields}&access_token=${accessToken}&limit=50`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`IG media fetch failed: ${res.status} — ${body}`)
  }
  const json = await res.json()
  return json.data ?? []
}

// ─── Insights por post ───────────────────────────────────────────────────────

export interface IgInsights {
  impressions: number
  reach: number
  saved: number
  video_views: number
  plays: number
  shares: number
}

export async function getIgPostInsights(
  mediaId: string,
  mediaType: string,
  accessToken: string
): Promise<IgInsights | null> {
  // API v22+: 'impressions', 'plays' e 'video_views' foram DESCONTINUADOS para todos os tipos.
  // Métricas universais confirmadas via testes (VIDEO, REEL, IMAGE, CAROUSEL_ALBUM):
  //   reach             → contas únicas que viram o post
  //   saved             → vezes que salvaram
  //   total_interactions → curtidas + salvos + comentários + compartilhamentos
  const metrics = 'reach,saved,total_interactions'

  const url = `${IG_GRAPH_BASE}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[IG insights] ${mediaId} (${mediaType}) ${res.status}: ${body.slice(0, 300)}`)
      return null
    }

    const json = await res.json() as {
      data?: Array<{
        name: string
        values?: Array<{ value: number }>
        value?: number
      }>
    }

    const result: Record<string, number> = {}
    for (const item of json.data ?? []) {
      result[item.name] = item.values?.[0]?.value ?? (item.value as number | undefined) ?? 0
    }

    return {
      impressions: result.reach              ?? 0,  // reach = substituto de impressions (v22+)
      reach:       result.reach              ?? 0,
      saved:       result.saved              ?? 0,
      video_views: result.total_interactions ?? 0,
      plays:       result.total_interactions ?? 0,
      shares:      result.shares             ?? 0,
    }
  } catch (err) {
    console.error(`[IG insights] parse error for ${mediaId}:`, err)
    return null
  }
}

// ─── Breakdown de alcance: seguidores vs não-seguidores ─────────────────────

export interface IgReachBreakdown {
  followers: number
  non_followers: number
}

export async function getIgReachBreakdown(
  mediaId: string,
  accessToken: string
): Promise<IgReachBreakdown | null> {
  // breakdown=follow_type retorna segmentação do alcance por tipo de seguidor
  const url = `${IG_GRAPH_BASE}/${mediaId}/insights?metric=reach&breakdown=follow_type&period=lifetime&access_token=${accessToken}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null

    const json = await res.json() as {
      data?: Array<{
        name: string
        total_value?: {
          value?: number
          breakdowns?: Array<{
            dimension_keys: string[]
            results: Array<{ dimension_values: string[]; value: number }>
          }>
        }
      }>
    }

    const reachData = json.data?.find(d => d.name === 'reach')
    const results = reachData?.total_value?.breakdowns?.[0]?.results ?? []
    const followers = results.find(r => r.dimension_values.includes('FOLLOWER'))?.value ?? 0
    const nonFollowers = results.find(r => r.dimension_values.includes('NON_FOLLOWER'))?.value ?? 0

    if (followers === 0 && nonFollowers === 0) return null
    return { followers, non_followers: nonFollowers }
  } catch {
    return null
  }
}

// ─── Métricas específicas de Reel ────────────────────────────────────────────

export interface IgReelMetrics {
  plays: number
  avg_watch_time_ms: number
}

export async function getIgReelMetrics(
  mediaId: string,
  accessToken: string
): Promise<IgReelMetrics | null> {
  // plays: visualizações do reel (funciona em v21.0 para tipo REEL)
  // ig_reels_avg_watch_time: tempo médio de visualização em ms
  const url = `${IG_GRAPH_BASE}/${mediaId}/insights?metric=plays,ig_reels_avg_watch_time&access_token=${accessToken}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null

    const json = await res.json() as {
      data?: Array<{
        name: string
        values?: Array<{ value: number }>
        value?: number
      }>
    }

    const result: Record<string, number> = {}
    for (const item of json.data ?? []) {
      result[item.name] = item.values?.[0]?.value ?? (item.value as number | undefined) ?? 0
    }

    if (!result.plays && !result.ig_reels_avg_watch_time) return null
    return {
      plays: result.plays ?? 0,
      avg_watch_time_ms: result.ig_reels_avg_watch_time ?? 0,
    }
  } catch {
    return null
  }
}

// ─── Comentários por post ────────────────────────────────────────────────────

export interface IgComment {
  id: string
  text: string
  username: string
  timestamp: string
}

export async function getIgComments(mediaId: string, accessToken: string): Promise<IgComment[]> {
  const url = `${IG_GRAPH_BASE}/${mediaId}/comments?fields=id,text,username,timestamp&access_token=${accessToken}&limit=100`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const json = await res.json() as { data?: IgComment[] }
    return json.data ?? []
  } catch {
    return []
  }
}

// ─── Token ───────────────────────────────────────────────────────────────────

export async function refreshIgToken(accessToken: string): Promise<{ access_token: string; expires_in: number }> {
  const url = `${IG_GRAPH_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  return res.json()
}
