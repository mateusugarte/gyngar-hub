import { createApifyClient } from './base'

export type ApifyRunStatus = 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMING-OUT' | 'TIMED-OUT' | 'ABORTING' | 'ABORTED'

export interface ApifyRunInfo {
  id: string
  status: ApifyRunStatus
  startedAt: string
  finishedAt?: string
  stats?: {
    requestsTotal?: number
    itemCount?: number
  }
}

export async function getRunStatus(apiKey: string, runId: string): Promise<ApifyRunInfo> {
  const client = createApifyClient(apiKey)
  const res = await fetch(
    `${client.baseUrl}/actor-runs/${runId}`,
    { headers: client.headers }
  )
  if (!res.ok) throw new Error(`Apify status failed: ${res.status}`)
  const json = await res.json()
  return json.data as ApifyRunInfo
}
