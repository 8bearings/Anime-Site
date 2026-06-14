import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { searchAnime, buildAnimeQuery } from '../services/api'
import { AnimeShow } from '../types/interfaces'
import { debounce, getDisplayTitle } from '../services/helper'

interface Props {
  value: string
  onChange: (v: string) => void
  onSelect: (show: AnimeShow) => void
}

export function SearchAutocomplete({ value, onChange, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<AnimeShow[]>([])
  const [open, setOpen] = useState(false)
  const latestQueryRef = useRef('')
  const suppressRef = useRef(false)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (suppressRef.current) return
    if (q.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    latestQueryRef.current = q
    try {
      const result = await searchAnime(
        buildAnimeQuery({ q, limit: 5, orderBy: 'popularity', sort: 'asc', sfw: true }),
        1
      )
      // Discard if a newer query has since been issued
      if (latestQueryRef.current !== q) return
      const items = result.data.slice(0, 5)
      setSuggestions(items)
      setOpen(items.length > 0)
    } catch {
      // autocomplete is best-effort; silent fail
    }
  }, [])

  const debouncedFetch = useMemo(
    () => debounce(fetchSuggestions, 500),
    [fetchSuggestions]
  )

  // Close the dropdown when the query is cleared/shortened externally
  // (Clear button, selecting an item) — those bypass handleChange.
  useEffect(() => {
    if (value.trim().length < 3) {
      setOpen(false)
      setSuggestions([])
    }
  }, [value])

  function handleChange(v: string) {
    suppressRef.current = false
    onChange(v)
    debouncedFetch(v)
  }

  function handleSelect(show: AnimeShow) {
    suppressRef.current = true
    setOpen(false)
    setSuggestions([])
    onSelect(show)
  }

  function handleBlur() {
    // Delay so onMouseDown on a dropdown item fires before blur closes the list
    setTimeout(() => setOpen(false), 150)
  }

  return (
    <div className='autocomplete-wrapper'>
      <input
        type='text'
        placeholder='Search for anime...'
        className='search-input'
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
          else if (e.key === 'Enter') { suppressRef.current = true; setOpen(false) }
        }}
        autoComplete='off'
      />
      {open && suggestions.length > 0 && (
        <ul className='autocomplete-dropdown'>
          {suggestions.map((show) => (
            <li
              key={show.mal_id}
              className='autocomplete-item'
              onMouseDown={(e) => { e.preventDefault(); handleSelect(show) }}
            >
              <img
                src={show.images.jpg.small_image_url || show.images.jpg.image_url}
                alt=''
                className='autocomplete-thumb'
                loading='lazy'
              />
              <span className='autocomplete-title'>
                {getDisplayTitle(show)}
                {show.year && <span className='autocomplete-year'> · {show.year}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
