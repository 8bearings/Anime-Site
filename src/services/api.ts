import {
  StreamingResponse,
  AnimeListResponse,
  AnimeByIdResponse,
  SeasonArchiveResponse,
} from '../types/interfaces'
import { apiFetch, ApiError } from './http'

export { BASE_URL, ApiError } from './http'

// --- Tenrai resilience ---
const DEFAULT_LIST_LIMIT = 24

function shouldFallbackPopularError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status >= 500 || err.status === 504
  }
  return false
}

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

export interface AnimeQuery {
  q?: string
  genres?: string[]
  type?: string
  status?: string
  rating?: string
  minScore?: number
  maxScore?: number
  startDate?: string
  endDate?: string
  orderBy?: string
  sort?: 'asc' | 'desc'
  sfw?: boolean
  limit?: number
}

/** Builds a URL param string (no leading `?`) for the /anime endpoint. */
export function buildAnimeQuery(p: AnimeQuery): string {
  const parts: string[] = []
  if (p.q) parts.push(`q=${encodeURIComponent(p.q)}`)
  if (p.genres?.length) parts.push(`genres=${p.genres.join(',')}`)
  if (p.type) parts.push(`type=${p.type}`)
  if (p.status) parts.push(`status=${p.status}`)
  if (p.rating) parts.push(`rating=${p.rating}`)
  if (p.minScore !== undefined && p.minScore > 0)
    parts.push(`min_score=${p.minScore}`)
  if (p.maxScore !== undefined && p.maxScore > 0)
    parts.push(`max_score=${p.maxScore}`)
  if (p.startDate) parts.push(`start_date=${p.startDate}`)
  if (p.endDate) parts.push(`end_date=${p.endDate}`)
  if (p.orderBy) parts.push(`order_by=${p.orderBy}`)
  if (p.sort) parts.push(`sort=${p.sort}`)
  if (p.sfw) parts.push('sfw')
  if (p.limit) parts.push(`limit=${p.limit}`)
  return parts.join('&')
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/** Accepts a raw param string (no leading `?`) from buildAnimeQuery. */
export const searchAnime = async (
  query: string,
  page: number = 1,
): Promise<AnimeListResponse> => {
  const qs = [query, `page=${page}`].filter(Boolean).join('&')
  return apiFetch<AnimeListResponse>(`/anime?${qs}`)
}

export const getPopularAnime = async (
  page: number = 1,
): Promise<AnimeListResponse> => {
  try {
    return await apiFetch<AnimeListResponse>(
      `/seasons/now?sfw&limit=${DEFAULT_LIST_LIMIT}&page=${page}`,
    )
  } catch (err) {
    // Fallback: if /seasons/now fails with 5xx/504, use popular anime instead
    if (shouldFallbackPopularError(err)) {
      return getTopAnime('bypopularity', page)
    }
    throw err
  }
}

export const getAnimeById = async (id: number): Promise<AnimeByIdResponse> => {
  return apiFetch<AnimeByIdResponse>(`/anime/${id}`)
}

export const getAnimeStreaming = async (
  id: number,
): Promise<StreamingResponse> => {
  const data = await apiFetch<StreamingResponse>(`/anime/${id}/streaming`)
  return {
    status: data.status,
    message: data.message,
    data: data.data || [],
  }
}

export const getTopAnime = async (
  filter?: 'airing' | 'upcoming' | 'bypopularity' | 'favorite',
  page: number = 1,
): Promise<AnimeListResponse> => {
  const filterPart = filter ? `filter=${filter}&` : ''
  return apiFetch<AnimeListResponse>(
    `/top/anime?${filterPart}sfw&limit=${DEFAULT_LIST_LIMIT}&page=${page}`,
  )
}

export const getSeasonAnime = async (
  year: number,
  season: string,
  page: number = 1,
): Promise<AnimeListResponse> => {
  return apiFetch<AnimeListResponse>(
    `/seasons/${year}/${season}?sfw&limit=${DEFAULT_LIST_LIMIT}&page=${page}`,
  )
}

export const getUpcomingAnime = async (
  page: number = 1,
): Promise<AnimeListResponse> => {
  return apiFetch<AnimeListResponse>(
    `/seasons/upcoming?sfw&limit=${DEFAULT_LIST_LIMIT}&page=${page}`,
  )
}

export const getSeasonsArchive = async (): Promise<SeasonArchiveResponse> => {
  return apiFetch<SeasonArchiveResponse>('/seasons')
}

export const getRandomAnime = async (): Promise<AnimeByIdResponse> => {
  return apiFetch<AnimeByIdResponse>('/random/anime', { cache: false })
}
