export const BASE_URL = 'https://api.jikan.moe/v4'

/**
 * Error thrown for any non-2xx API response. Carries the HTTP `status`
 * so callers can branch on it (e.g. 429 rate limiting) without string matching.
 */
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// --- In-memory response cache -------------------------------------------------
// Jikan data changes slowly, so caching by URL for a few minutes makes repeat
// searches / re-expanded cards feel instant and cuts requests against the
// rate limit. Lives for the page session only.

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const cache = new Map<string, { data: unknown; expires: number }>()

// --- Request throttle ---------------------------------------------------------
// Jikan allows ~3 requests/second. We serialize requests through a promise
// chain and space them by MIN_INTERVAL so bursts (infinite scroll, opening
// several cards) don't trip 429s in the first place.

const MIN_INTERVAL = 350 // ms between outgoing requests
let lastRequestTime = 0
let chain: Promise<unknown> = Promise.resolve()

function scheduleFetch(url: string): Promise<Response> {
  const run = async () => {
    const wait = Math.max(0, lastRequestTime + MIN_INTERVAL - Date.now())
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
    lastRequestTime = Date.now()
    return fetch(url)
  }

  const result = chain.then(run)
  // Keep the chain alive even if a request rejects, so one failure doesn't
  // stall every subsequent request.
  chain = result.catch(() => undefined)
  return result
}

/**
 * Fetch a JSON resource from the Jikan API with caching + rate-limit throttling.
 * @param path Path appended to BASE_URL, e.g. `/anime/1`.
 */
export async function apiFetch<T = unknown>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`

  const cached = cache.get(url)
  if (cached && cached.expires > Date.now()) {
    return cached.data as T
  }

  const response = await scheduleFetch(url)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new ApiError(response.status, `${response.status} ${text}`.trim())
  }

  const data = (await response.json()) as T
  cache.set(url, { data, expires: Date.now() + CACHE_TTL })
  return data
}
