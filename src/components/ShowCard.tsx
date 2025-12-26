import { useState, useEffect } from 'react'
import { ShowCardProps, StreamingService } from '../types/interfaces'
import '../css/ShowCard.css'
import { useShowContext } from '../contexts/ShowContext'
import { getAnimeStreaming } from '../services/api'

export function ShowCard({ show }: ShowCardProps) {
  const context = useShowContext()
  if (!context) {
    throw new Error('ShowCard must be used within a ShowProvider')
  }

  const showImg = show.images.jpg.large_image_url,
    showFromYear = show.aired.prop.from.year || '?'

  const { isFavorite, addToFavorites, removeFromFavorites } = context
  const favorite = isFavorite(show.mal_id)

  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [streamingServices, setStreamingServices] = useState<
    StreamingService[]
  >([])
  const [loadingStreaming, setLoadingStreaming] = useState<boolean>(false)
  const [streamingError, setStreamingError] = useState<boolean>(false)

  useEffect(() => {
    if (isExpanded && streamingServices.length === 0 && !streamingError) {
      fetchStreamingServices()
    }
  }, [isExpanded])

  // ✅ ADD THIS FUNCTION TO FETCH STREAMING DATA
  const fetchStreamingServices = async () => {
    setLoadingStreaming(true)
    setStreamingError(false)
    try {
      const response = await getAnimeStreaming(show.mal_id)
      setStreamingServices(response.data || [])
    } catch (error) {
      console.error('Failed to fetch streaming services:', error)
      setStreamingError(true)
    } finally {
      setLoadingStreaming(false)
    }
  }

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
    const url = `${base}?id=${show.mal_id}&q=${encodeURIComponent(title)}`

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(() => {
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
        <img src={showImg} alt={show.title_english || show.title} />
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
        <span className='text' aria-live="polite">{copied ? 'Copied!' : 'Share'}</span>
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

          {/* ✅ ADD THIS NEW STREAMING SECTION */}

          <div className='streaming-section'>
            <p>
              <strong>Available on:</strong>
            </p>
            {loadingStreaming ? (
              <p className='streaming-loading'>Loading streaming services...</p>
            ) : streamingError ? (
              <p className='no-streaming'>Unable to load streaming info</p>
            ) : streamingServices.length > 0 ? (
              <div className='streaming-services'>
                {streamingServices.map((service, index) => (
                  <a
                    key={`${service.name}-${index}`}
                    href={service.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='streaming-link'
                    onClick={(e) => e.stopPropagation()}
                  >
                    {service.name}
                  </a>
                ))}
              </div>
            ) : (
              <p className='no-streaming'>No streaming information available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
