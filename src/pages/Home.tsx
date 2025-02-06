import '../css/Home.css'
import { ShowCard } from '../components/ShowCard'
import { useState, useEffect } from 'react'
import { searchAnime, getPopularAnime, debounce } from '../services/api'
import { AnimeShow } from '../types/interfaces'

export function Home() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [shows, setShows] = useState<AnimeShow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  
  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!searchQuery.trim() || loading) return

    setLoading(true)
    setIsSearching(true)
    setPage(1)
    setShows([])

    try {
      const searchResults = await searchAnime(searchQuery, page)
      setShows(searchResults.data)
      setError(null)
      setHasMore(searchResults.data.length > 0)
    } catch (error) {
      console.log(error)
      setError('Failed to search anime')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadSearchAnime = async (page: number) => {
    try {
      const searchResults = await searchAnime(searchQuery, page)
      setShows((prevShows) => [...prevShows, ...searchResults.data])
      setHasMore(searchResults.data.length > 0)
    } catch (error) {
      console.log(error)
      setError('Failed to load more search results...')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadPopularAnime = async (page: number) => {
    try {
      const popularAnime = await getPopularAnime(page)
      if (page === 1) {
        setShows(popularAnime.data)
      } else {
        setShows((prevShows) => [...prevShows, ...popularAnime.data])
      }
      setHasMore(popularAnime.data.length > 0)
    } catch (error) {
      console.log(error)
      setError('Failed to load anime...')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleScroll = () => {
    if (loading || loadingMore || !hasMore) return
    const bottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 100
    if (bottom) {
      setLoadingMore(true)
      setPage((prevPage) => {
        const nextPage = prevPage + 1
        if (isSearching) {
          loadSearchAnime(nextPage)
        } else {
          loadPopularAnime(nextPage)
        }
        return nextPage
      })
    }
  }

  const debouncedHandleScroll = debounce(handleScroll, 400)

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
      <button className='refresh-button' onClick={() => loadPopularAnime(1)}>Click to Refresh Popular Anime</button>
      <div className='shows-grid'>
        {loading && page === 1 ? (
          <div className='loading'></div>
        ) : error ? (
          <div className='error-message'>{error}</div>
        ) : shows.length > 0 ? (
          shows.map((show: AnimeShow, index: number) => (
            <ShowCard show={show} key={`${show.mal_id}-${index}`} />
          ))
        ) : (
          <p>No shows found.</p>
        )}
      </div>
      {loadingMore && <div className='loading'></div>}
    </div>
  )
}
