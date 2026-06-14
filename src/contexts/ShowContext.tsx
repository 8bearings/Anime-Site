import { createContext, useState, useContext, useEffect } from 'react'
import { AnimeShow, ShowContextType } from '../types/interfaces'

const ShowContext = createContext<ShowContextType | undefined>(undefined)

export const useShowContext = () => useContext(ShowContext)

export const ShowProvider = ({ children }: { children: React.ReactNode }) => {
  const [favorites, setFavorites] = useState<AnimeShow[]>(() => {
    try {
      const storedFavs = localStorage.getItem('favorites')
      const parsed = storedFavs ? JSON.parse(storedFavs) : []
      return Array.isArray(parsed) ? parsed : []
    } catch (err) {
      console.error('Failed to read favorites from localStorage:', err)
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('favorites', JSON.stringify(favorites))
    } catch (err) {
      console.error('Failed to save favorites to localStorage:', err)
    }
  }, [favorites])

  const addToFavorites = (show: AnimeShow) => {
    setFavorites((prev) => [...prev, show])
  }

  const removeFromFavorites = (showId: number) => {
    setFavorites((prev) =>
      prev.filter((show: AnimeShow) => show.mal_id !== showId)
    )
  }

  const isFavorite = (showId: number) => {
    return favorites.some((show: AnimeShow) => show.mal_id === showId)
  }

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
  }
  return <ShowContext.Provider value={value}>{children}</ShowContext.Provider>
}
