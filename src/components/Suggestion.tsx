import '../css/Suggestion.css'
import React, { useState, useEffect } from 'react'
import { SuggestionProps } from '../types/interfaces'
import { searchAnime, buildAnimeQuery } from '../services/api'
import { genreOptions } from '../services/helper'

const SORT_OPTIONS = [
  { label: 'Default', value: '', orderBy: undefined, sort: undefined },
  { label: 'Score', value: 'score', orderBy: 'score', sort: 'desc' as const },
  { label: 'Popularity', value: 'popularity', orderBy: 'popularity', sort: 'asc' as const },
  { label: 'Newest', value: 'newest', orderBy: 'start_date', sort: 'desc' as const },
  { label: 'Title (A–Z)', value: 'title', orderBy: 'title', sort: 'asc' as const },
]

export const Suggestion: React.FC<SuggestionProps> = ({ onSuggest, onFiltersChange }) => {
  const [genres, setGenres] = useState<string[]>([])
  const [minScore, setMinScore] = useState<number>(0)
  const [maxScore, setMaxScore] = useState<number>(10)
  const [startYear, setStartYear] = useState<string>('')
  const [endYear, setEndYear] = useState<string>('')
  const [rating, setRating] = useState<string>('')
  const [sfw, setSfw] = useState<boolean>(true)
  const [sortValue, setSortValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const MAX_GENRES = 3

  // Propagate sort/status/type up to Home so text search also picks them up
  useEffect(() => {
    if (!onFiltersChange) return
    const opt = SORT_OPTIONS.find(o => o.value === sortValue)
    onFiltersChange({
      orderBy: opt?.orderBy,
      sort: opt?.sort,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortValue, statusFilter, typeFilter])

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value
    if (selected && !genres.includes(selected) && genres.length < MAX_GENRES) {
      setGenres([...genres, selected])
    }
  }

  const removeGenre = (genreId: string) => {
    setGenres(genres.filter((id) => id !== genreId))
  }

  const handleMinScoreChange = (val: number) => {
    setMinScore(val)
    if (val > maxScore) setMaxScore(val)
  }

  const handleMaxScoreChange = (val: number) => {
    setMaxScore(val)
    if (val < minScore) setMinScore(val)
  }

  const handleSuggest = async () => {
    setLoading(true)
    setError(null)

    try {
      const opt = SORT_OPTIONS.find(o => o.value === sortValue)
      const searchResults = await searchAnime(
        buildAnimeQuery({
          genres: genres.length > 0 ? genres : undefined,
          minScore: minScore > 0 ? minScore : undefined,
          maxScore: maxScore < 10 ? maxScore : undefined,
          startDate: startYear ? `${startYear}-01-01` : undefined,
          endDate: endYear ? `${endYear}-12-31` : undefined,
          rating: rating || undefined,
          sfw,
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          orderBy: opt?.orderBy,
          sort: opt?.sort,
        })
      )

      if (searchResults.data && searchResults.data.length > 0) {
        onSuggest(searchResults.data)
      } else {
        setError('No shows found for your preferences.')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch suggestions.')
    } finally {
      setLoading(false)
    }
  }

  const clearSelections = () => {
    setGenres([])
    setMinScore(0)
    setMaxScore(10)
    setStartYear('')
    setEndYear('')
    setRating('')
    setSfw(true)
    setSortValue('')
    setStatusFilter('')
    setTypeFilter('')
  }

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)} className='toggle-suggestion'>
        {isOpen ? 'Hide Options' : 'Need Some Direction?'}
      </button>

      <div className={`show-suggestion ${isOpen ? 'active' : ''}`}>
        <h2>It's Time to Find!</h2>

        {/* ── Sort ── */}
        <div>
          <label>
            <span>Sort By:</span>
            <select value={sortValue} onChange={(e) => setSortValue(e.target.value)}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* ── Status ── */}
        <div>
          <label>
            <span>Season Status:</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value=''>Any</option>
              <option value='airing'>Airing</option>
              <option value='complete'>Completed</option>
              <option value='upcoming'>Upcoming</option>
            </select>
          </label>
        </div>

        {/* ── Type ── */}
        <div>
          <label>
            <span>Type:</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value=''>Any</option>
              <option value='tv'>TV</option>
              <option value='movie'>Movie</option>
              <option value='ova'>OVA</option>
              <option value='ona'>ONA</option>
              <option value='special'>Special</option>
            </select>
          </label>
        </div>

        {/* ── Genre ── */}
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

        {/* ── Score range ── */}
        <div>
          <label>
            <span>Min Score:</span>
            <span className='min-score'>{minScore}</span>
            <input
              type='range'
              min='1'
              max='10'
              value={minScore}
              onChange={(e) => handleMinScoreChange(Number(e.target.value))}
            />
          </label>
        </div>
        <div>
          <label>
            <span>Max Score:</span>
            <span className='min-score'>{maxScore}</span>
            <input
              type='range'
              min='1'
              max='10'
              value={maxScore}
              onChange={(e) => handleMaxScoreChange(Number(e.target.value))}
            />
          </label>
        </div>

        {/* ── Year range ── */}
        <div>
          <label>
            <span>After Year:</span>
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
            <span>Before Year:</span>
            <input
              type='number'
              placeholder='YYYY'
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
              min='1900'
              max={new Date().getFullYear()}
            />
          </label>
        </div>

        {/* ── Rating ── */}
        <div>
          <label>
            <span>Rating:</span>
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value=''>Select Rating</option>
              <option value='g'>G / All Ages</option>
              <option value='pg'>PG</option>
              <option value='pg13'>PG-13</option>
              <option value='r17'>R / 17+</option>
            </select>
          </label>
        </div>

        {/* ── SFW ── */}
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
