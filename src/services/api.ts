// export const API_KEY = ''

export const BASE_URL = 'https://api.jikan.moe/v4'

export const getPopularAnime = async () => {
  const response = await fetch(`${BASE_URL}/top/anime?sfw`)
  const data = await response.json()
  return data
}

export const searchAnime = async (query: string) => {
  const response = await fetch(
    `${BASE_URL}/anime&q=${encodeURIComponent(
      query
    )}`
  )
  const data = await response.json()
  return data
}
