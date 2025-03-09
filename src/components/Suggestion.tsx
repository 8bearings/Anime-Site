import '../css/Suggestion.css'
import React, { useState } from 'react'
import { SuggestionProps } from '../types/interfaces'
import { searchAnime } from '../services/api'
import { genreOptions } from '../services/helper'

export const Suggestion: React.FC<SuggestionProps> = ({ onSuggest }) => {
  const [genres, setGenres] = useState<string[]>([])
  const [minScore, setMinScore] = useState<number>(0)
  const [startYear, setStartYear] = useState<string>('')
  const [rating, setRating] = useState<string>('')
  const [sfw, setSfw] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const MAX_GENRES = 3

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGenre = e.target.value
    if (
      selectedGenre &&
      !genres.includes(selectedGenre) &&
      genres.length < MAX_GENRES
    ) {
      setGenres([...genres, selectedGenre])
    }
  }

  const removeGenre = (genreId: string) => {
    setGenres(genres.filter((id) => id !== genreId))
  }

  const handleSuggest = async () => {
    setLoading(true)
    setError(null)

    try {
      const params: string[] = []
      if (genres.length > 0) params.push(`genres=${genres.join(',')}`)
      if (minScore > 0) params.push(`min_score=${minScore}`)
      if (startYear) params.push(`start_date=${startYear}-01-01`)
      if (rating) params.push(`rating=${encodeURIComponent(rating)}`)
      if (sfw) params.push(`sfw=true`)

      const queryString = params.length > 0 ? `?${params.join('&')}` : ''

      const searchResults = await searchAnime(queryString)

      if (searchResults.data && searchResults.data.length > 0) {
        onSuggest(searchResults.data)
      } else {
        setError('No shows found for your preferences.')
      }
    } catch (error) {
      console.error(error)
      setError('Failed to fetch suggestions.')
    } finally {
      setLoading(false)
    }
  }

  const clearSelections = () => {
    setGenres([])
    setMinScore(0)
    setStartYear('')
    setRating('')
    setSfw(true)
  }

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)} className='toggle-suggestion'>
        {isOpen ? 'Hide Options' : 'Need Some Direction?'}
      </button>
      <div className={`show-suggestion ${isOpen ? 'active' : ''}`}>
        <h2>It's Time to Find!</h2>
        <div>
          <label>
            <span>Genre:</span>
            <select
              value=''
              onChange={handleGenreChange}
              disabled={genres.length >= MAX_GENRES}
            >
              <option value=''>Select Genre</option>
              {genreOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <div className='selected-genres'>
            {genres.map((genreId) => {
              const genre = genreOptions.find((g) => g.id === genreId)
              const shortG = genre?.name.split('(')
              return (
                <div key={genreId} className='genre-chip'>
                  {shortG?.shift()}
                  <button onClick={() => removeGenre(genreId)}>×</button>
                </div>
              )
            })}
          </div>
          {genres.length >= MAX_GENRES && (
            <p className='genre-limit-message'>
              Maximum of {MAX_GENRES} genres selected.
            </p>
          )}
        </div>
        <div>
          <label>
            <span>Minimum Score:</span>
            <span className='min-score'>{minScore}</span>
            <input
              type='range'
              min='1'
              max='10'
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
            />
          </label>
        </div>
        <div>
          <label>
            <span>After the Year:</span>
            <input
              type='number'
              placeholder='YYYY'
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              min='1900'
              max={new Date().getFullYear()}
            />
          </label>
        </div>
        <div>
          <label>
            <span>Rating:</span>
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value=''>Select Rating</option>
              <option value='g'>G / All Ages</option>
              <option value='pg'>PG</option>
              <option value='pg13'>PG-13</option>
              <option value='r17'>R / 17+ </option>
            </select>
          </label>
        </div>
        <div>
          <label className='sfw'>
            <span>Safe for Work:</span>
            <input
              type='checkbox'
              checked={sfw}
              onChange={(e) => setSfw(e.target.checked)}
            />
          </label>
        </div>
        <button onClick={handleSuggest} disabled={loading}>
          {loading ? 'Loading...' : 'Suggest Shows'}
        </button>
        <button onClick={clearSelections} className='clear-selections-button'>
          Clear Selections
        </button>
        {error && <p className='error-message'>{error}</p>}
      </div>
    </div>
  )
}
