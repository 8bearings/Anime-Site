export interface ShowCardProps {
  show: AnimeShow
}

export interface AnimeShow {
  mal_id: number
  url: string
  images: {
    jpg: {
      image_url: string
      small_image_url: string
      large_image_url: string
    }
  }
  title: string
  title_english: string
  genre: string
  synopsis: string
  rating: string
  score: number
  genres: [
    {
      mal_id: number
      type: string
      name: string
      url: string
    }
  ]
  aired: {
    from: string
    to: string
    prop: {
      from: {
        day: number
        month: number
        year: number
      }
      to: {
        day: number
        month: number
        year: number
      }
    }
  }
}

export interface ShowContextType {
  favorites: AnimeShow[]
  addToFavorites: (show: AnimeShow) => void
  removeFromFavorites: (showId: number) => void
  isFavorite: (showId: number) => boolean
}
