import '../css/Home.css'
import { ShowCard } from '../components/ShowCard'
import { useState, useEffect } from 'react'
import { searchAnime, getPopularAnime, debounce } from '../services/api'
import { AnimeShow } from '../types/interfaces'

export function Home() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [shows, setShows] = useState<AnimeShow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [isSearching, setIsSearching] = useState<boolean>(false)

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!searchQuery.trim() || loading) return

    setLoading(true)
    setIsSearching(true)
    setPage(1)
    setShows([])

    try {
      const searchResults = await searchAnime(searchQuery, 1)
      setShows(searchResults.data)
      setError(null)
      setHasMore(searchResults.data.length > 0)
    } catch (error) {
      console.error(error)
      setError('Failed to search anime')
    } finally {
      setLoading(false)
    }
  }

  const loadSearchAnime = async (page: number) => {
    if (loading) return
    try {
      const searchResults = await searchAnime(searchQuery, page)
      setShows((prevShows) => [...prevShows, ...searchResults.data])
      setHasMore(searchResults.data.length > 0)
    } catch (error) {
      console.log(error)
      setError('Failed to load more search results...')
    } finally {
      setLoading(false)
    }
  }

  const loadPopularAnime = async (page: number) => {
    if (loading) return
    try {
      const popularAnime = await getPopularAnime(page)

      setShows((prevShows) => {
        if (page === 1) {
          return popularAnime.data
        } else {
          return [...prevShows, ...popularAnime.data]
        }
      })
      setHasMore(popularAnime.data.length > 0)
      console.log(' HAS MORE API response', popularAnime.data)
    } catch (error) {
      console.log(error)
      setError('Failed to load anime...')
    } finally {
      setLoading(false)
    }
  }

  let bottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 100

  const handleScroll = () => {
    if (loading || !hasMore) return

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
    loadPopularAnime(1)
  }

  return (
    <div className='home'>
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
      <button className='refresh-button' onClick={handleRefresh}>
        Click to Refresh Popular Anime
      </button>
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
      {hasMore && bottom && <div className='loading'></div>}
    </div>
  )
}
