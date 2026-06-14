import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getAnimeById, getAnimeStreaming } from '../services/api'
import { AnimeShow, StreamingService } from '../types/interfaces'
import { getDisplayTitle } from '../services/helper'
import { useShowContext } from '../contexts/ShowContext'
import '../css/AnimeDetail.css'
import '../css/ShowCard.css'

export function AnimeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const context = useShowContext()

  const [show, setShow] = useState<AnimeShow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streaming, setStreaming] = useState<StreamingService[]>([])
  const [trailerPlaying, setTrailerPlaying] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setShow(null)
    setStreaming([])
    setTrailerPlaying(false)

    async function load() {
      try {
        const res = await getAnimeById(Number(id))
        if (cancelled) return
        setShow(res.data)
        setLoading(false)
        try {
          const streamRes = await getAnimeStreaming(Number(id))
          if (!cancelled) setStreaming(streamRes.data || [])
        } catch {
          // streaming is best-effort
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load anime.')
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <div className='detail-loading' />
      </div>
    )
  }

  if (error || !show) {
    return <div className='detail-error'>{error ?? 'Anime not found.'}</div>
  }

  const displayTitle = getDisplayTitle(show)
  const favorite = context?.isFavorite(show.mal_id)
  const hasTrailer = !!(show.trailer?.youtube_id && show.trailer?.embed_url)

  return (
    <div className='anime-detail'>
      <button className='detail-back' onClick={() => navigate(-1)}>← Back</button>

      <div className='detail-hero'>
        <img
          className='detail-poster'
          src={show.images.jpg.large_image_url}
          alt={displayTitle}
        />

        <div className='detail-info'>
          <h1 className='detail-title'>{displayTitle}</h1>
          {show.title && show.title !== displayTitle && (
            <p className='detail-subtitle'>{show.title}</p>
          )}

          <div className='detail-meta'>
            {show.score ? <span className='detail-score'>★ {show.score}</span> : null}
            {show.year ? <span>{show.year}</span> : null}
            {show.type ? <span>{show.type}</span> : null}
            {(show.episodes != null || show.status) && (
              <span className='detail-ep-status'>
                {show.airing && <span className='airing-dot' aria-hidden='true' />}
                {show.episodes != null ? `${show.episodes} eps` : '? eps'}
                {show.status ? ` · ${show.status}` : ''}
              </span>
            )}
          </div>

          {show.studios && show.studios.length > 0 && (
            <p><strong>Studios:</strong> {show.studios.map((s) => s.name).join(', ')}</p>
          )}
          {show.genres && show.genres.length > 0 && (
            <p><strong>Genres:</strong> {show.genres.map((g) => g.name).join(', ')}</p>
          )}
          {show.rating && <p><strong>Rating:</strong> {show.rating}</p>}

          {context && (
            <div className='detail-actions'>
              <button
                className={`detail-fav-btn${favorite ? ' active' : ''}`}
                onClick={() => {
                  if (favorite) context.removeFromFavorites(show.mal_id)
                  else context.addToFavorites(show)
                }}
              >
                {favorite ? '♥ Saved' : '♥ Save to Favorites'}
              </button>
            </div>
          )}

          {streaming.length > 0 && (
            <div className='detail-streaming'>
              <strong>Available on:</strong>
              <div className='detail-streaming-links'>
                {streaming.map((s, i) => (
                  <a
                    key={`${s.name}-${i}`}
                    href={s.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='streaming-link'
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {hasTrailer && (
        <div className='detail-section'>
          <h2>Trailer</h2>
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
              />
              <span className='trailer-play-icon' aria-hidden='true'>▶</span>
            </div>
          )}
        </div>
      )}

      {show.synopsis && (
        <div className='detail-section'>
          <h2>Synopsis</h2>
          <p>{show.synopsis}</p>
        </div>
      )}
    </div>
  )
}
