/* eslint-disable @typescript-eslint/no-explicit-any */
import '../css/Home.css'
import { ShowCard } from '../components/ShowCard'
import { Suggestion } from '../components/Suggestion'
import { useState, useEffect } from 'react'
import { searchAnime, getPopularAnime, debounce } from '../services/api'
import { AnimeShow } from '../types/interfaces'
import { Footer } from '../components/Footer'

export function Home() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [shows, setShows] = useState<AnimeShow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [suggestedShows, setSuggestedShows] = useState<AnimeShow[]>([])
  const [tooManyRequests, setTooManyRequests] = useState<boolean>(false)

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!searchQuery.trim() || loading) return

    setLoading(true)
    setIsSearching(true)
    setPage(1)
    setShows([])
    setTooManyRequests(false)
    setError(null)

    try {
      const queryString = `?q=${encodeURIComponent(searchQuery)}`
      const searchResults = await searchAnime(queryString, 1)

      setShows(searchResults.data)
      setError(null)
      setHasMore(searchResults.data.length > 0)
    } catch (error: any) {
      console.error(error)
      if (error.response && error.response.status === 429) {
        setTooManyRequests(true)
        setError('Too many requests. Please try again later.')
      } else {
        setError('Failed to search anime.')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadSearchAnime = async (page: number) => {
    if (loading) return
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
    }
  }

  const loadPopularAnime = async (page: number) => {
    if (loading) return

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
    }
  }

  let bottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 100

  const handleScroll = () => {
    if (loading || !hasMore || tooManyRequests) return

    bottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 100
    if (bottom) {
      const nextPage = page + 1
      setPage(nextPage)
      if (isSearching) {
        loadSearchAnime(nextPage)
      } else {
        loadPopularAnime(nextPage)
      }
      return nextPage
    }
  }

  const debouncedHandleScroll = debounce(handleScroll, 1200)

  useEffect(() => {
    if (!isSearching) {
      loadPopularAnime(page)
    }
  }, [page, isSearching])

  useEffect(() => {
    window.addEventListener('scroll', debouncedHandleScroll)
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll)
    }
  }, [debouncedHandleScroll])

  const uniqueShows = shows.filter(
    (show, index, self) =>
      index === self.findIndex((s) => s.mal_id === show.mal_id)
  )

  const handleRefresh = () => {
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
              {/* <h3 className='Suggest-h3'>SUGGESTIONS</h3> */}
              <div className='suggested-shows'>
                {suggestedShows.map((show: AnimeShow) => (
                  <ShowCard show={show} key={show.mal_id} />
                ))}
              </div>
            </div>
          ) : (
            <div className='shows-grid'>
              {loading ? (
                <div className='loading'></div>
              ) : error ? (
                <div className='error-message'>{error}</div>
              ) : uniqueShows.length > 0 ? (
                uniqueShows.map((show: AnimeShow) => (
                  <ShowCard show={show} key={show.mal_id} />
                ))
              ) : (
                <p>No shows found.</p>
              )}
            </div>
          )}
          {!error && suggestedShows.length === 0 && hasMore && bottom && (
            <div className='loading'></div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
