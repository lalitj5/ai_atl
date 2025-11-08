"use client"

import { useState } from "react"
import { Search, MapPin, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DestinationSearchProps {
  onStartNavigation: (destination: string) => void
}

const SUGGESTIONS = [
  { name: "Downtown San Francisco", distance: "2.5 mi" },
  { name: "Golden Gate Park", distance: "4.1 mi" },
  { name: "Bay Bridge", distance: "3.8 mi" },
]

export default function DestinationSearch({ onStartNavigation }: DestinationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(true)

  const handleSearch = (destination: string) => {
    setSearchQuery(destination)
    setShowSuggestions(false)
    setTimeout(() => onStartNavigation(destination), 300)
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
            className="flex-1 bg-transparent py-3 px-2 text-lg text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {/* Suggestions */}
        {showSuggestions && !searchQuery && (
          <div className="floating-card bg-card rounded-2xl overflow-hidden border border-border/30 max-h-64 overflow-y-auto">
            {SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(suggestion.name)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0 group touch-target"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-lg">{suggestion.name}</p>
                    <p className="text-sm text-muted-foreground">{suggestion.distance}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}

        {/* Start Navigation Button */}
        {searchQuery && (
          <Button
            onClick={() => handleSearch(searchQuery)}
            className="w-full touch-target bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold rounded-2xl"
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
