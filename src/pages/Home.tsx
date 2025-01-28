import { ShowCard } from '../components/ShowCard'
import { useState } from 'react'
import "../css/Home.css"

export function Home() {
  const [searchQuery, setSearchQuery] = useState('')

  const shows = [
    { id: 1, title: 'Heartless', releaseDate: '2016' },
    { id: 2, title: 'Matrix', releaseDate: '2000' },
    { id: 3, title: 'Heartless', releaseDate: '2006' },
  ]

  function handleSearch() {}

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

      <div className='movies-grid'>
        {shows.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (show: any) =>
           
              <ShowCard show={show} key={show.id} />
            
        )}
      </div>
    </div>
  )
}
