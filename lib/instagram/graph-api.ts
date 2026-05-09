export const IG_GRAPH_BASE = 'https://graph.instagram.com/v21.0'

export function createIGClient(accessToken: string) {
  return {
    baseUrl: IG_GRAPH_BASE,
    accessToken,
    get: async (path: string) => {
      const res = await fetch(`${IG_GRAPH_BASE}${path}?access_token=${accessToken}`)
      if (!res.ok) throw new Error(`Instagram API error: ${res.status}`)
      return res.json()
    },
  }
}
