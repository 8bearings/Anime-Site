import { useState } from 'react'
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

  const [isExpanded, setIsExpanded] = useState(false)
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false)

  function toggleExpand() {
    setIsExpanded((prev) => !prev)
  }
  function toggleSynopsis() {
    setIsSynopsisExpanded((prev) => !prev)
  }

  function onFavClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (favorite) removeFromFavorites(show.mal_id)
    else addToFavorites(show)
  }

  return (
    <div
      className={`show-card ${isExpanded ? 'expanded' : ''}`}
      onClick={toggleExpand}
    >
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
      {isExpanded && (
        <div className={`show-details ${isExpanded ? 'expanded' : ''}`}>
          <div className={`synopsis ${isSynopsisExpanded ? 'expanded' : ''}`}>
            {show.synopsis}
          </div>
          <button
            className='show-more-toggle'
            onClick={(e) => {
              e.stopPropagation()
              toggleSynopsis()
            }}
          >
            {isSynopsisExpanded ? 'Show Less' : 'Show More'}
          </button>
          <div className='not-synopsis-details'>
            <p>
              <strong>Genres:</strong>{' '}
              {show.genres.map((genre) => genre.name).join(', ')}
            </p>
            <p>
              <strong>Rating:</strong> {show.rating}
            </p>
            <p>
              <strong>Score:</strong> {show.score}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
