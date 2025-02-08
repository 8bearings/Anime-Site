export const BASE_URL = 'https://api.jikan.moe/v4'

export const getPopularAnime = async (page: number = 1) => {
  const response = await fetch(`${BASE_URL}/seasons/now?sfw&page=${page}`)
  const data = await response.json()
  return data
}

export const searchAnime = async (query: string, page: number = 1) => {
  const response = await fetch(`${BASE_URL}/anime${query}&page=${page}`)
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
