export const BASE_URL = 'https://api.jikan.moe/v4'

export const getPopularAnime = async (page: number = 1) => {
  const response = await fetch(`${BASE_URL}/seasons/now?sfw&page=${page}`)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Failed to fetch popular anime: ${response.status} ${text}`)
  }
  const data = await response.json()
  return data
}

export const searchAnime = async (query: string, page: number = 1) => {
  const response = await fetch(`${BASE_URL}/anime${query}&page=${page}`)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Failed to search anime: ${response.status} ${text}`)
  }
  const data = await response.json()
  return data
}

export const getAnimeById = async (id: number) => {
  const response = await fetch(`${BASE_URL}/anime/${id}`)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Failed to fetch anime by id: ${response.status} ${text}`)
  }
  const data = await response.json()
  return data
}

export const getAnimeStreaming = async (id: number) => {
  const response = await fetch(`${BASE_URL}/anime/${id}/streaming`)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Failed to fetch streaming data: ${response.status} ${text}`)
  }
  const data = await response.json()
  return data
}

export function debounce<F extends (...args: unknown[]) => unknown>(
  func: F,
  delay: number
): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout>

  return (...args: Parameters<F>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply('thisArg', args), delay)
  }
}
