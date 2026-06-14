import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShowCardProps, StreamingService } from '../types/interfaces'
import '../css/ShowCard.css'
import { useShowContext } from '../contexts/ShowContext'
import { getAnimeStreaming } from '../services/api'
import { getDisplayTitle } from '../services/helper'

export function ShowCard({ show }: ShowCardProps) {
  const context = useShowContext()
  if (!context) {
    throw new Error('ShowCard must be used within a ShowProvider')
  }

  const showImg = show.images.jpg.large_image_url
  const showFromYear = show.aired.prop.from.year || '?'
  const displayTitle = getDisplayTitle(show)

  const { isFavorite, addToFavorites, removeFromFavorites } = context
  const favorite = isFavorite(show.mal_id)

  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [streamingServices, setStreamingServices] = useState<StreamingService[]>([])
  const [loadingStreaming, setLoadingStreaming] = useState<boolean>(false)
  const [streamingError, setStreamingError] = useState<boolean>(false)
  const [trailerPlaying, setTrailerPlaying] = useState<boolean>(false)

  useEffect(() => {
    if (isExpanded && streamingServices.length === 0 && !streamingError) {
      fetchStreamingServices()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded])

  // Reset trailer when card collapses
  useEffect(() => {
    if (!isExpanded) setTrailerPlaying(false)
  }, [isExpanded])

  async function fetchStreamingServices() {
    setLoadingStreaming(true)
    setStreamingError(false)
    try {
      const response = await getAnimeStreaming(show.mal_id)
      if (response.status === 500) {
        setStreamingError(true)
        return
      }
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

    const base = window.location.origin + window.location.pathname
    const url = `${base}?id=${show.mal_id}&q=${encodeURIComponent(displayTitle)}`

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(() => window.prompt('Copy this link', url))
    } else {
      window.prompt('Copy this link', url)
    }
  }

  const synopsis = show.synopsis || ''
  const isLongSynopsis = synopsis.length > 100
  const hasTrailer = !!show.trailer?.youtube_id

  const episodeStatusLine = (() => {
    const epPart =
      show.episodes != null ? `${show.episodes} eps` : '? eps'
    const statusPart = show.status ?? ''
    return statusPart ? `${epPart} · ${statusPart}` : epPart
  })()

  return (
    <div
      className={`show-card ${isExpanded ? 'expanded' : ''}`}
      onClick={toggleExpand}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggleExpand()
        }
      }}
      role='button'
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={displayTitle}
    >
      <div className='thumbnail-poster'>
        <img
          src={showImg}
          alt={displayTitle}
          loading='lazy'
          decoding='async'
        />
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
        <span className='text' aria-live='polite'>
          {copied ? 'Copied!' : 'Share'}
        </span>
      </button>

      <div className='show-info'>
        <h3>{displayTitle}</h3>
        <p>{showFromYear}</p>
        <Link
          to={`/anime/${show.mal_id}`}
          className='detail-link'
          onClick={(e) => e.stopPropagation()}
        >
          Details →
        </Link>
      </div>

      <div className='show-details'>
        <div className='show-details-flex'>

          {/* Trailer — click-to-play thumbnail, only when expanded and available */}
          {hasTrailer && (
            <div
              className='trailer-section'
              onClick={(e) => e.stopPropagation()}
            >
              {trailerPlaying ? (
                <div className='trailer-iframe-wrapper'>
                  <iframe
                    src={`${show.trailer!.embed_url}?autoplay=1`}
                    allow='autoplay; encrypted-media; fullscreen'
                    allowFullScreen
                    loading='lazy'
                    title={`${displayTitle} trailer`}
                  />
                </div>
              ) : (
                <div
                  className='trailer-thumb'
                  onClick={() => setTrailerPlaying(true)}
                  role='button'
                  tabIndex={0}
                  aria-label={`Play ${displayTitle} trailer`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setTrailerPlaying(true)
                    }
                  }}
                >
                  <img
                    src={`https://img.youtube.com/vi/${show.trailer!.youtube_id}/hqdefault.jpg`}
                    alt={`${displayTitle} trailer`}
                    loading='lazy'
                    decoding='async'
                  />
                  <span className='trailer-play-icon' aria-hidden='true'>▶</span>
                </div>
              )}
            </div>
          )}

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

          <div
            className={`not-synopsis-details-wrapper${
              !isSynopsisExpanded ? ' visible' : ''
            }`}
          >
            {!isSynopsisExpanded && (
              <div className='not-synopsis-details'>
                {/* Episode count + airing status */}
                {(show.episodes != null || show.status) && (
                  <p className='episode-status'>
                    {show.airing && <span className='airing-dot' aria-hidden='true' />}
                    {episodeStatusLine}
                  </p>
                )}

                <p>
                  <strong>Genres:</strong>{' '}
                  {show.genres.map((genre) => genre.name).join(', ')}
                </p>
                <p>
                  <strong>Rating:</strong> {show.rating}
                </p>
                <p>
                  <strong>Score:</strong> {show.score || '?'}{' '}
                  <strong className='ten'>/ 10</strong>
                </p>

                <div className='streaming-section'>
                  <p>
                    <strong>Available on:</strong>
                  </p>
                  {loadingStreaming ? (
                    <p className='streaming-loading'>
                      Loading streaming services...
                    </p>
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
                    <p className='no-streaming'>No streaming information found</p>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
