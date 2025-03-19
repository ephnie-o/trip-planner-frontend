
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function LocationSearch({ label, onSelect }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (query.length < 1) {
      setSuggestions([])
      setSelectedIndex(-1)
      return
    }
    const fetchSuggestions = async () => {
      try {
        const res = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: query,
            format: 'json',
            addressdetails: 1,
            limit: 5
          }
        })
        setSuggestions(res.data)
        setSelectedIndex(-1)
      } catch (err) {
        console.error(err)
      }
    }
    const timeoutId = setTimeout(() => {
      fetchSuggestions()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelection(suggestions[selectedIndex])
    }
  }

  const handleSelection = (location) => {
    setQuery(location.display_name)
    setSuggestions([])
    onSelect({
      displayName: location.display_name,
      lat: location.lat,
      lon: location.lon
    })
  }

  const handleBlur = (e) => {
    setTimeout(() => setSuggestions([]), 150)
  }

  return (
    <div className='relative'>
      <label className='text-gray-700'>{label}: </label>
      <input
        type="text"
        value={query}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onChange={e => setQuery(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
      />
      {suggestions.length > 0 && (
        <ul className='absolute bg-white w-full border-2 max-h-36 overflow-y-auto list-none text-gray-500 z-50'>
          {suggestions.map((sugg, index) => (
            <li
              key={index}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelection(sugg)
              }}
              className={`p-2 cursor-pointer ${
                index === selectedIndex ? 'bg-blue-500 text-white' : 'hover:bg-blue-100'
              }`}
            >
              {sugg.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
