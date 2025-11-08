"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, MapPin, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mapboxService, type Place } from "@/lib/services/mapboxService"

interface DestinationSearchProps {
  onStartNavigation: (destination: { name: string; coordinates: [number, number] }) => void
}

export default function DestinationSearch({ onStartNavigation }: DestinationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (query: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          if (query.trim().length > 0) {
            setIsSearching(true)
            try {
              const results = await mapboxService.searchPlaces(query)
              setSuggestions(results)
              setShowSuggestions(true)
            } catch (error) {
              console.error("Error searching places:", error)
              setSuggestions([])
            } finally {
              setIsSearching(false)
            }
          } else {
            setSuggestions([])
            setShowSuggestions(false)
          }
        }, 300)
      }
    })(),
    []
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const handleSearch = (place: Place) => {
    setSearchQuery(place.name)
    setShowSuggestions(false)
    setTimeout(() => {
      onStartNavigation({
        name: place.name,
        coordinates: place.coordinates,
      })
    }, 300)
  }

  const handleStartWithQuery = () => {
    if (suggestions.length > 0) {
      handleSearch(suggestions[0])
    } else if (searchQuery.trim()) {
      // Try to search for the query and use first result
      mapboxService
        .searchPlaces(searchQuery)
        .then((results) => {
          if (results.length > 0) {
            handleSearch(results[0])
          }
        })
        .catch((error) => {
          console.error("Error searching:", error)
        })
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-6 bg-background">
      <div className="space-y-6">
        {/* Logo/Title */}
        <div className="text-left space-y-2">
          <div className="inline-block p-3 bg-primary/20 rounded-2xl">
            <Navigation className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Journey Assist</h1>
          <p className="text-base text-muted-foreground">Where are you heading?</p>
        </div>

        {/* Search Input */}
        <div className="floating-card bg-card rounded-2xl p-2 flex items-center gap-2 border border-border/30">
          <Search className="w-5 h-5 text-muted-foreground ml-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search destination..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            className="flex-1 bg-transparent py-3 px-2 text-lg text-foreground placeholder:text-muted-foreground outline-none"
          />
          {isSearching && (
            <Loader2 className="w-5 h-5 text-muted-foreground mr-3 animate-spin" />
          )}
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="floating-card bg-card rounded-2xl overflow-hidden border border-border/30 max-h-64 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSearch(suggestion)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0 group touch-target"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-lg">{suggestion.name}</p>
                    {suggestion.address && suggestion.address !== suggestion.name && (
                      <p className="text-sm text-muted-foreground">{suggestion.address}</p>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {showSuggestions && searchQuery && !isSearching && suggestions.length === 0 && (
          <div className="floating-card bg-card rounded-2xl p-6 border border-border/30">
            <p className="text-sm text-muted-foreground text-center">
              No results found. Try a different search term.
            </p>
          </div>
        )}

        {/* Start Navigation Button */}
        {searchQuery && !isSearching && (
          <Button
            onClick={handleStartWithQuery}
            disabled={suggestions.length === 0}
            className="w-full touch-target bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Navigation
          </Button>
        )}
      </div>
    </div>
  )
}

// Icon component for demo
function Navigation({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19.5l10.5-10.5m0 0L21 3m-10.5 10.5L21 3"
      />
    </svg>
  )
}
