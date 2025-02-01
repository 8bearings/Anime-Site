import { ShowCard } from '../components/ShowCard'
import { useState, useEffect } from 'react'
import { searchAnime, getPopularAnime } from '../services/api'
import '../css/Home.css'
import { AnimeShow } from '../types/interfaces'

export function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [shows, setShows] = useState<AnimeShow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {}

  useEffect(() => {
    async function loadPopularAnime() {
      try {
        const popularAnime = await getPopularAnime()
        setShows(popularAnime.data)
      } catch (error) {
        console.log(error)
        setError(' Failed to load anime...')
      } finally {
        setLoading(false)
      }
    }
    loadPopularAnime()
  }, [])

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

      <div className='shows-grid'>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>{error}</p>
        ) : shows.length > 0 ? (
          shows.map((show: AnimeShow) => (
            <ShowCard show={show} key={show.mal_id} />
          ))
        ) : (
          <p>No shows found.</p>
        )}
      </div>
    </div>
  )
}
