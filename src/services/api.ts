export const BASE_URL = 'https://api.jikan.moe/v4'

export const getPopularAnime = async (page: number = 1) => {
  const response = await fetch(`${BASE_URL}/seasons/now?sfw&page=${page}`)
  const data = await response.json()
  return data
}

export const searchAnime = async (query: string, page: number = 1) => {
  const response = await fetch(
    `${BASE_URL}/anime?q=${encodeURIComponent(query)}&sfw&page=${page}`
  )
  const data = await response.json()
  return data
}

export function debounce(func, delay) {
  let timeout
  return function (...args) {
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(context, args), delay)
  }
}
