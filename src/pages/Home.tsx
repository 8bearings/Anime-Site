import '../css/Home.css'
import { ShowCard } from '../components/ShowCard'
import { SkeletonCard } from '../components/SkeletonCard'
import { Suggestion } from '../components/Suggestion'
import { SearchAutocomplete } from '../components/SearchAutocomplete'
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  searchAnime,
  getPopularAnime,
  getTopAnime,
  getUpcomingAnime,
  getSeasonAnime,
  getSeasonsArchive,
  buildAnimeQuery,
  ApiError,
} from '../services/api'
import { AnimeShow, ActiveFilters, AnimeListResponse, SeasonArchiveEntry } from '../types/interfaces'
import { Footer } from '../components/Footer'
import { excludedGenres, excludedTypes, debounce } from '../services/helper'

type FeedMode = 'now' | 'airing' | 'popular' | 'upcoming' | 'top' | 'season' | 'search' | 'suggestion'

const TABS: { label: string; mode: FeedMode }[] = [
  { label: 'This Season', mode: 'now' },
  { label: 'Airing', mode: 'airing' },
  { label: 'Popular', mode: 'popular' },
  { label: 'Upcoming', mode: 'upcoming' },
  { label: 'Top Rated', mode: 'top' },
]

// Tab modes in order — used to map feedMode → ref index for the slider
const browseTabModes: FeedMode[] = [...TABS.map((t) => t.mode), 'season']

function getCurrentSeason(): string {
  const m = new Date().getMonth() + 1
  if (m <= 3) return 'winter'
  if (m <= 6) return 'spring'
  if (m <= 9) return 'summer'
  return 'fall'
}

function isRateLimit(err: unknown): boolean {
  return err instanceof ApiError && err.status === 429
}

export function Home() {
  const navigate = useNavigate()
  const skipInitialRef = useRef(false)
  const loadingRef = useRef(false)
  const activeFiltersRef = useRef<ActiveFilters>({})
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const sliderRef = useRef<HTMLDivElement | null>(null)

  const handleFiltersChange = useCallback((filters: ActiveFilters) => {
    activeFiltersRef.current = filters
  }, [])

  const [feedMode, setFeedMode] = useState<FeedMode>('now')
  const [searchQuery, setSearchQuery] = useState('')
  const [shows, setShows] = useState<AnimeShow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [suggestedShows, setSuggestedShows] = useState<AnimeShow[]>([])
  const [tooManyRequests, setTooManyRequests] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [allowExplicit, setAllowExplicit] = useState(false)

  // Season browser state
  const [showSeasonPicker, setShowSeasonPicker] = useState(false)
  const [archiveEntries, setArchiveEntries] = useState<SeasonArchiveEntry[]>([])
  const [archiveLoaded, setArchiveLoaded] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())
  const [pickerSeason, setPickerSeason] = useState(getCurrentSeason())
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear())
  const [seasonSeason, setSeasonSeason] = useState(getCurrentSeason())

  // Move the slider pill to match the active tab before the browser paints,
  // so the initial position is correct on the first frame (no flash).
  // Subsequent feedMode changes trigger the CSS transition (left/width/top).
  useLayoutEffect(() => {
    const idx = browseTabModes.indexOf(feedMode)
    const el = idx >= 0 ? tabRefs.current[idx] : null
    const slider = sliderRef.current
    if (!slider) return
    if (el) {
      slider.style.left = el.offsetLeft + 'px'
      slider.style.width = el.offsetWidth + 'px'
      slider.style.top = el.offsetTop + 'px'
      slider.style.height = el.offsetHeight + 'px'
      slider.style.opacity = '1'
    } else {
      slider.style.opacity = '0'
    }
  }, [feedMode])

  // Unified loader — all params explicit so callers can pass "future" values
  // without waiting for React state to flush.
  async function loadFeed(
    pageNum: number,
    mode: FeedMode = feedMode,
    syear: number = seasonYear,
    sseason: string = seasonSeason,
    query: string = searchQuery
  ) {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      let result: AnimeListResponse
      switch (mode) {
        case 'airing':
          result = await getTopAnime('airing', pageNum)
          break
        case 'popular':
          result = await getTopAnime('bypopularity', pageNum)
          break
        case 'upcoming':
          result = await getUpcomingAnime(pageNum)
          break
        case 'top':
          result = await getTopAnime(undefined, pageNum)
          break
        case 'season':
          result = await getSeasonAnime(syear, sseason, pageNum)
          break
        case 'search':
          result = await searchAnime(
            buildAnimeQuery({ q: query, ...activeFiltersRef.current }),
            pageNum
          )
          break
        default:
          result = await getPopularAnime(pageNum)
      }

      if (pageNum === 1) {
        setShows(result.data)
      } else {
        setShows((prev) => [...prev, ...result.data])
      }
      setHasMore(result.pagination?.has_next_page ?? result.data.length > 0)
    } catch (err) {
      console.error(err)
      if (isRateLimit(err)) {
        setTooManyRequests(true)
        setError('Too many requests. Please try again later.')
      } else {
        setError('Failed to load anime.')
      }
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  function handleTabChange(mode: FeedMode) {
    setFeedMode(mode)
    setPage(1)
    setShows([])
    setHasMore(true)
    setError(null)
    setTooManyRequests(false)
    setSuggestedShows([])
    setShowSeasonPicker(false)
    skipInitialRef.current = false
    loadingRef.current = false // allow new fetch even if previous was in flight
    loadFeed(1, mode)
  }

  async function performSearch(query: string) {
    if (!query.trim() || loading) return
    setFeedMode('search')
    setPage(1)
    setShows([])
    setHasMore(true)
    setError(null)
    setTooManyRequests(false)
    setSuggestedShows([])
    skipInitialRef.current = false
    loadingRef.current = false
    await loadFeed(1, 'search', seasonYear, seasonSeason, query)
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await performSearch(searchQuery)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    const q = params.get('q')

    if (id) {
      navigate(`/anime/${id}`, { replace: true })
      return
    }

    if (q) {
      const decoded = decodeURIComponent(q)
      setSearchQuery(decoded)
      performSearch(decoded)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!skipInitialRef.current) {
      loadFeed(1, 'now')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Season browser
  async function handleSeasonPickerOpen() {
    setShowSeasonPicker((prev) => !prev)
    if (!archiveLoaded) {
      try {
        const archive = await getSeasonsArchive()
        setArchiveEntries(archive.data ?? [])
        setArchiveLoaded(true)
      } catch {
        // silent — picker falls back to generated year list
      }
    }
  }

  function handleSeasonSelect() {
    setSeasonYear(pickerYear)
    setSeasonSeason(pickerSeason)
    setFeedMode('season')
    setPage(1)
    setShows([])
    setHasMore(true)
    setError(null)
    setTooManyRequests(false)
    setSuggestedShows([])
    setShowSeasonPicker(false)
    skipInitialRef.current = false
    loadingRef.current = false
    loadFeed(1, 'season', pickerYear, pickerSeason)
  }

  const handleScroll = () => {
    setShowBackToTop(window.scrollY > 600)

    if (loadingRef.current || !hasMore || tooManyRequests || feedMode === 'suggestion') return

    const nearBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 1200

    setIsNearBottom(nearBottom)

    if (nearBottom) {
      const nextPage = page + 1
      setPage(nextPage)
      loadFeed(nextPage, feedMode, seasonYear, seasonSeason, searchQuery)
    }
  }

  const handleScrollRef = useRef(handleScroll)
  useEffect(() => {
    handleScrollRef.current = handleScroll
  })

  const debouncedHandleScroll = useMemo(
    () => debounce(() => handleScrollRef.current(), 400),
    []
  )

  useEffect(() => {
    window.addEventListener('scroll', debouncedHandleScroll)
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll)
    }
  }, [debouncedHandleScroll])

  const uniqueShows = useMemo(
    () =>
      shows
        .filter(
          (show, index, self) =>
            index === self.findIndex((s) => s.mal_id === show.mal_id)
        )
        .filter((show) => !excludedTypes.includes(show.type))
        .filter((show) => {
          if (allowExplicit) return true
          if (show.genres && show.genres.length > 0) {
            return !show.genres.some((genre) => excludedGenres.includes(genre.name))
          }
          return true
        }),
    [shows, allowExplicit]
  )

  function handleShowSuggestion(suggested: AnimeShow[]) {
    setSuggestedShows(suggested)
    setFeedMode('suggestion')
  }

  function handleAutocompleteSelect(show: AnimeShow) {
    const title = show.title_english || show.title
    setSearchQuery(title)
    performSearch(title)
  }

  function handleRefresh() {
    setSearchQuery('')
    handleTabChange('now')
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Archive years sorted newest-first; fall back to last 20 years if archive not loaded
  const archiveYears = useMemo(() => {
    if (archiveEntries.length > 0) {
      return archiveEntries.map((e) => e.year).sort((a, b) => b - a)
    }
    return Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i)
  }, [archiveEntries])

  const seasonLabel =
    seasonSeason.charAt(0).toUpperCase() + seasonSeason.slice(1) + ' ' + seasonYear

  return (
    <div className='home-container'>
      <div className='home-content'>
        <div className='home'>

          {/* Browse mode pill tabs */}
          <div className='browse-tabs'>
            <div ref={sliderRef} className='browse-tab-slider' />
            {TABS.map((tab, i) => (
              <button
                key={tab.mode}
                ref={(el) => { tabRefs.current[i] = el }}
                className={`browse-tab${feedMode === tab.mode ? ' active' : ''}`}
                onClick={() => handleTabChange(tab.mode)}
              >
                {tab.label}
              </button>
            ))}
            <button
              ref={(el) => { tabRefs.current[TABS.length] = el }}
              className={`browse-tab${feedMode === 'season' ? ' active' : ''}`}
              onClick={handleSeasonPickerOpen}
            >
              {feedMode === 'season' ? seasonLabel : 'Season ▾'}
            </button>
          </div>

          {/* Inline season picker */}
          {showSeasonPicker && (
            <div className='season-picker'>
              <select
                value={pickerYear}
                onChange={(e) => setPickerYear(Number(e.target.value))}
              >
                {archiveYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={pickerSeason}
                onChange={(e) => setPickerSeason(e.target.value)}
              >
                <option value='winter'>Winter</option>
                <option value='spring'>Spring</option>
                <option value='summer'>Summer</option>
                <option value='fall'>Fall</option>
              </select>
              <button onClick={handleSeasonSelect} className='season-go-btn'>
                Go
              </button>
            </div>
          )}

          <div className='search-and-suggestion-container'>
            <form onSubmit={handleSearch} className='search-form'>
              <SearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onSelect={handleAutocompleteSelect}
              />
              <button type='submit' className='search-button'>
                Search
              </button>
            </form>
            <Suggestion
              onSuggest={handleShowSuggestion}
              onFiltersChange={handleFiltersChange}
              onAllowExplicitChange={setAllowExplicit}
            />
          </div>

          {(feedMode === 'search' || feedMode === 'suggestion') && (
            <div className='results-context'>
              <span className='results-context-label'>
                {feedMode === 'search' ? (
                  <>Results for <strong>“{searchQuery}”</strong></>
                ) : (
                  'Filtered suggestions'
                )}
              </span>
              <button onClick={handleRefresh} className='clear-results-btn'>
                ✕ Clear
              </button>
            </div>
          )}

          {error && (
            <div className='error-message'>
              <p>{error}</p>
              <button onClick={handleRefresh} className='retry-button'>
                Retry
              </button>
            </div>
          )}

          {feedMode === 'suggestion' && suggestedShows.length > 0 ? (
            <div className='suggested-shows'>
              {suggestedShows.map((show) => (
                <ShowCard show={show} key={show.mal_id} />
              ))}
            </div>
          ) : (
            <div className='shows-grid'>
              {loading && page === 1 ? (
                <div className='loading' />
              ) : error ? (
                <div className='error-message'>{error}</div>
              ) : uniqueShows.length > 0 ? (
                <>
                  {uniqueShows.map((show) => (
                    <ShowCard show={show} key={show.mal_id} />
                  ))}
                  {hasMore && isNearBottom && loading && (
                    <>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SkeletonCard key={`skeleton-${n}`} />
                      ))}
                    </>
                  )}
                </>
              ) : (
                !loading && <p>No shows found.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {showBackToTop && (
        <button
          className='back-to-top'
          onClick={scrollToTop}
          aria-label='Back to top'
        >
          ↑
        </button>
      )}
      <Footer />
    </div>
  )
}
