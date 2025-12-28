/* eslint-disable @typescript-eslint/no-explicit-any */
import '../css/Home.css'
import { ShowCard } from '../components/ShowCard'
import { SkeletonCard } from '../components/SkeletonCard'
import { Suggestion } from '../components/Suggestion'
import { useState, useEffect, useRef } from 'react'
import {
  searchAnime,
  getPopularAnime,
  debounce,
  getAnimeById,
} from '../services/api'
import { AnimeShow } from '../types/interfaces'
import { Footer } from '../components/Footer'
import { excludedGenres, excludedTypes } from '../services/helper'

export function Home() {
  const skipPopularRef = useRef(false)
  const loadingRef = useRef(false) 
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [shows, setShows] = useState<AnimeShow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [suggestedShows, setSuggestedShows] = useState<AnimeShow[]>([])
  const [tooManyRequests, setTooManyRequests] = useState<boolean>(false)
  const [isPermalink, setIsPermalink] = useState<boolean>(false)
  const [isNearBottom, setIsNearBottom] = useState(false)

  async function performSearch(query: string, pageNum = 1) {
    if (!query.trim()) return
    setLoading(true)
    setIsSearching(true)
    setPage(1)
    setShows([])
    setTooManyRequests(false)
    setError(null)
    setSuggestedShows([])
    try {
      const queryString = `?q=${encodeURIComponent(query)}`
      const searchResults = await searchAnime(queryString, pageNum)
      if (!searchResults || !searchResults.data) {
        setError('No results returned from search.')
        setShows([])
        setHasMore(false)
      } else {
        setShows(searchResults.data)
        setError(null)
        setHasMore(
          Array.isArray(searchResults.data) && searchResults.data.length > 0
        )
      }
    } catch (error: any) {
      console.error(error)
      if (error.message && error.message.includes('429')) {
        setTooManyRequests(true)
        setError('Too many requests. Please try again later.')
      } else {
        setError('Failed to search anime.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!searchQuery.trim() || loading) return

    skipPopularRef.current = false

    setLoading(true)
    setIsSearching(true)
    setPage(1)
    setShows([])
    setTooManyRequests(false)
    setError(null)
    setSuggestedShows([])

    try {
      const queryString = `?q=${encodeURIComponent(searchQuery)}`
      const searchResults = await searchAnime(queryString, 1)

      setShows(searchResults.data)
      setError(null)
      setHasMore(searchResults.data.length > 0)
    } catch (error: any) {
      console.error(error)
      if (error.message && error.message.includes('429')) {
        setTooManyRequests(true)
        setError('Too many requests. Please try again later.')
      } else {
        setError('Failed to search anime.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    const q = params.get('q')
    if (id) {
      setIsPermalink(true)
      skipPopularRef.current = true
      ;(async () => {
        setLoading(true)
        setIsSearching(false)
        setPage(1)
        setShows([])
        setTooManyRequests(false)
        setError(null)
        try {
          const res = await getAnimeById(Number(id))
          const item = res?.data || res
          if (item) {
            setShows(Array.isArray(item) ? item : [item])
            setHasMore(false)
          } else {
            setError('Shared show not found.')
          }
        } catch (err: any) {
          console.error(err)
          if (err.message && err.message.includes('429')) {
            setTooManyRequests(true)
            setError('Too many requests. Please try again later.')
          } else {
            setError('Failed to load shared show.')
          }
        } finally {
          setLoading(false)
        }
      })()
      return
    }

    if (q) {
      const decoded = decodeURIComponent(q)
      setSearchQuery(decoded)
      performSearch(decoded, 1)
    }
  }, [])

  const loadSearchAnime = async (page: number) => {
    if (loadingRef.current || !hasMore) return
    loadingRef.current = true
    setLoading(true)
    
    try {
      const queryString = `?q=${encodeURIComponent(searchQuery)}`
      const searchResults = await searchAnime(queryString, page)
      setShows((prevShows) => [...prevShows, ...searchResults.data])
      setHasMore(searchResults.data.length > 0)
    } catch (error: any) {
      console.log(error)
      if (error.response && error.response.status === 429) {
        setTooManyRequests(true)
        setError('Too many requests. Please try again later.')
      } else {
        setError('Failed to load more search results...')
      }
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  const loadPopularAnime = async (page: number) => {
    if (loadingRef.current || !hasMore) return
    loadingRef.current = true
    setLoading(true)

    try {
      const popularAnime = await getPopularAnime(page)

      if (popularAnime && popularAnime.data) {
        setShows((prevShows) => {
          if (page === 1) {
            return popularAnime.data
          } else {
            return [...prevShows, ...popularAnime.data]
          }
        })
        setHasMore(popularAnime.data.length > 0)
      } else {
        throw new Error('Invalid API response')
      }
    } catch (error: any) {
      console.error(error)

      if (error.response && error.response.status === 429) {
        setTooManyRequests(true)
        setError('Too many requests. Please try again later.')
      } else {
        setError('Failed to load anime. Please try again.')
      }
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  const handleScroll = () => {
    if (loadingRef.current || !hasMore || tooManyRequests) return

    // More aggressive threshold: trigger when 1200px from bottom
    const nearBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 1200

    setIsNearBottom(nearBottom)

    if (nearBottom) {
      const nextPage = page + 1
      setPage(nextPage)
      if (isSearching) {
        loadSearchAnime(nextPage)
      } else {
        loadPopularAnime(nextPage)
      }
    }
  }

  const debouncedHandleScroll = debounce(handleScroll, 400)

  useEffect(() => {
    if (!isSearching && !skipPopularRef.current && !isPermalink) {
      loadPopularAnime(page)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isSearching, isPermalink])

  useEffect(() => {
    window.addEventListener('scroll', debouncedHandleScroll)
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll)
    }
  }, [debouncedHandleScroll, hasMore, tooManyRequests, page, isSearching])

  const uniqueShows = shows
    .filter(
      (show, index, self) =>
        index === self.findIndex((s) => s.mal_id === show.mal_id)
    )
    .filter((show) => !excludedTypes.includes(show.type))
    .filter((show) => {
      if (show.genres && show.genres.length > 0) {
        return !show.genres.some((genre) => excludedGenres.includes(genre.name))
      }
      return true
    })

  const handleRefresh = () => {
    skipPopularRef.current = false
    setPage(1)
    setShows([])
    setLoading(true)
    setIsSearching(false)
    setSearchQuery('')
    setTooManyRequests(false)
    setError(null)
    loadPopularAnime(1)
    setSuggestedShows([])
  }

  const handleShowSuggestion = (suggestedShows: AnimeShow[]) => {
    setSuggestedShows(suggestedShows)
    setIsSearching(true)
  }

  return (
    <div className='home-container'>
      <div className='home-content'>
        <div className='home'>
          <button className='refresh-button' onClick={handleRefresh}>
            Click to Refresh Popular Anime
          </button>
          <div className='search-and-suggestion-container'>
            <form onSubmit={handleSearch} className='search-form'>
              <input
                type='text'
                placeholder='Search for anime...'
                className='search-input'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type='submit' className='search-button'>
                Search
              </button>
            </form>
            <Suggestion onSuggest={handleShowSuggestion} />
          </div>

          {(tooManyRequests || error) && (
            <div className='error-message'>
              <p>Too many requests. Please try again later.</p>
              <button onClick={handleRefresh} className='retry-button'>
                Retry
              </button>
            </div>
          )}

          {isSearching && suggestedShows.length > 0 ? (
            <div>
              <div className='suggested-shows'>
                {suggestedShows.map((show: AnimeShow) => (
                  <ShowCard show={show} key={show.mal_id} />
                ))}
              </div>
            </div>
          ) : (
            <div className='shows-grid'>
              {loading && page === 1 ? (
                <div className='loading'></div>
              ) : error ? (
                <div className='error-message'>{error}</div>
              ) : uniqueShows.length > 0 ? (
                <>
                  {uniqueShows.map((show: AnimeShow) => (
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
                <p>No shows found.</p>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}