// Apify key comes from user_settings.apify_api_key (per-user), not env global
export function createApifyClient(apiKey: string) {
  const baseUrl = 'https://api.apify.com/v2'
  return {
    baseUrl,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  }
}

export const ACTORS = {
  IG_COMMENTS:  'apify/instagram-comment-scraper',
  IG_FOLLOWERS: 'apify/instagram-follower-scraper',
  GOOGLE_MAPS:  'apify/google-maps-scraper',
} as const
