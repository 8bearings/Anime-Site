import { createContext, useState, useContext, useEffect } from 'react'
import { AnimeShow, ShowContextType } from '../types/interfaces'

const ShowContext = createContext<ShowContextType | undefined>(undefined)

export const useShowContext = () => useContext(ShowContext)

export const ShowProvider = ({ children }: { children: React.ReactNode }) => {
  const [favorites, setFavorites] = useState<AnimeShow[]>(() => {
    const storedFavs = localStorage.getItem('favorites')
    return storedFavs ? JSON.parse(storedFavs) : []
  })

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites))
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
