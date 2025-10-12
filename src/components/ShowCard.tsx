import { useState } from 'react'
import { ShowCardProps } from '../types/interfaces'
import '../css/ShowCard.css'
import { useShowContext } from '../contexts/ShowContext'

export function ShowCard({ show }: ShowCardProps) {
  const context = useShowContext()
  if (!context) {
    throw new Error('ShowCard must be used within a ShowProvider')
  }

  const showImg = show.images.jpg.large_image_url,
    showFromYear = show.aired.prop.from.year

  const { isFavorite, addToFavorites, removeFromFavorites } = context
  const favorite = isFavorite(show.mal_id)

  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  function toggleExpand() {
    setIsExpanded((prev) => !prev)
  }
  function toggleSynopsis() {
    setIsSynopsisExpanded((prev) => !prev)
  }

  function onFavClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (favorite) removeFromFavorites(show.mal_id)
    else addToFavorites(show)
  }

  function onShareClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()

    const title = show.title_english || show.title || ''
    const base = window.location.origin + window.location.pathname
    // Prefer exact id permalinks; include q for readability
    const url = `${base}?id=${show.mal_id}&q=${encodeURIComponent(title)}`

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(() => {
          // fallback
          window.prompt('Copy this link', url)
        })
    } else {
      window.prompt('Copy this link', url)
    }
  }

  const synopsis = show.synopsis || ''
  const isLongSynopsis = synopsis.length > 100

  return (
    <div
      className={`show-card ${isExpanded ? 'expanded' : ''}`}
      onClick={toggleExpand}
    >
      <div className='thumbnail-poster'>
        <img src={showImg} alt={show.title_english} />
      </div>
      <div className='show-overlay'>
        <button
          className='click-to animated-button'
          onClick={(e) => {
            e.stopPropagation()
            toggleExpand()
          }}
          aria-label={isExpanded ? 'Close details' : 'Open details'}
        >
          <span className='text'>
            {isExpanded ? 'Click to Close' : 'Click to Open'}
          </span>
        </button>
        <button
          className={`favorite-btn ${favorite ? 'active' : ''}`}
          onClick={onFavClick}
        >
          ♥
        </button>
      </div>
      <button
        className={`share-btn animated-button ${copied ? 'copied' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          onShareClick(e)
        }}
        title='Copy share link'
        aria-label='Share'
      >
        <span className='text'>{copied ? 'Copied!' : 'Share'}</span>
      </button>
      <div className='show-info'>
        <h3>{!show.title_english ? show.title : show.title_english}</h3>
        <p>{showFromYear}</p>
      </div>
      <div className='show-details'>
        <div className={`synopsis ${isSynopsisExpanded ? 'expanded' : ''}`}>
          <strong className='strong-synopsis'>Description: </strong>
          {show.synopsis}
        </div>
        {isLongSynopsis && (
          <button
            className='show-more-toggle'
            onClick={(e) => {
              e.stopPropagation()
              toggleSynopsis()
            }}
          >
            {isSynopsisExpanded ? 'Show Less' : 'Show More'}
          </button>
        )}
        <div className='not-synopsis-details'>
          <p>
            <strong>Genres:</strong>{' '}
            {show.genres.map((genre) => genre.name).join(', ')}
          </p>
          <p>
            <strong>Rating:</strong> {show.rating}
          </p>
          <p>
            <strong>Score:</strong> {!show.score ? '?' : show.score}{' '}
            <strong className='ten'>/ 10</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
