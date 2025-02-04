import { ShowCardProps } from '../types/interfaces'
import '../css/ShowCard.css'
import { useShowContext } from '../contexts/ShowContext'

export function ShowCard({ show }: ShowCardProps) {
  const context = useShowContext()
  if (!context) {
    throw new Error('ShowCard must be used within a ShowProvider')
  }

  const { isFavorite, addToFavorites, removeFromFavorites } = context
  const favorite = isFavorite(show.mal_id)

  function onFavClick(e: any) {
    e.preventDefault()
    if (favorite) removeFromFavorites(show.mal_id)
    else addToFavorites(show)
  }

  return (
    <div className='show-card'>
      <div className='thumbnail-poster'>
        <img src={show.images.jpg.large_image_url} alt={show.title_english} />
      </div>
      <div className='show-overlay'>
        <button
          className={`favorite-btn ${favorite ? 'active' : ''}`}
          onClick={onFavClick}
        >
          ♥
        </button>
      </div>
      <div className='show-info'>
        <h3>{!show.title_english ? show.title : show.title_english}</h3>
        <p>{show.aired.prop.from.year}</p>
      </div>
    </div>
  )
}
