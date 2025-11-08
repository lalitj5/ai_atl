"use client"

import { CheckCircle2, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { type Route } from "@/lib/services/mapboxService"

interface RouteComparisonProps {
  routes: Route[]
  currentRoute: Route | null
  onSelectRoute: (route?: Route) => void
}

function formatDistance(meters: number): string {
  const miles = meters * 0.000621371
  if (miles < 0.1) {
    return `${Math.round(miles * 5280)} ft`
  }
  return `${miles.toFixed(1)} mi`
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

// Route colors matching map colors
const ROUTE_COLORS = [
  "bg-primary", // Primary blue
  "bg-accent", // Orange
  "bg-secondary", // Green
  "bg-purple-500",
  "bg-pink-500",
]

const ROUTE_COLOR_VALUES = [
  "hsl(217, 91%, 60%)", // Primary blue
  "hsl(40, 84%, 53%)", // Accent orange
  "hsl(142, 76%, 36%)", // Secondary green
  "#a855f7", // Purple
  "#ec4899", // Pink
]

export default function RouteComparison({
  routes,
  currentRoute,
  onSelectRoute,
}: RouteComparisonProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleSelectRoute = (index: number) => {
    setSelectedIndex(index)
  }

  const handleConfirm = () => {
    onSelectRoute(routes[selectedIndex])
  }

  const getRouteName = (route: Route, index: number): string => {
    if (index === 0 && currentRoute && route === currentRoute) {
      return "Current Route"
    }
    if (index === 0) {
      return "Fastest Route"
    }
    return `Alternative ${index}`
  }

  const getRouteCharacteristics = (route: Route, index: number): string[] => {
    const characteristics: string[] = []
    if (index === 0) {
      characteristics.push("Fastest")
    } else {
      characteristics.push("Alternative")
    }
    
    // Determine characteristics based on route comparison
    if (routes.length > 1) {
      const fastestIndex = routes.reduce(
        (minIndex, r, i) => (r.duration < routes[minIndex].duration ? i : minIndex),
        0
      )
      if (index === fastestIndex) {
        characteristics.push("Fastest")
      }
      
      const shortestIndex = routes.reduce(
        (minIndex, r, i) => (r.distance < routes[minIndex].distance ? i : minIndex),
        0
      )
      if (index === shortestIndex) {
        characteristics.push("Shortest")
      }
    }

    return characteristics
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      <div className="floating-card bg-card rounded-t-3xl border-t border-border/30 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm px-4 py-4 border-b border-border/30">
          <h2 className="text-xl font-bold text-foreground">Route Options</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {routes.length} {routes.length === 1 ? "route" : "routes"} found
          </p>
        </div>

        {/* Routes List */}
        <div className="p-4 space-y-3">
          {routes.map((route, index) => {
            const isSelected = selectedIndex === index
            const routeName = getRouteName(route, index)
            const characteristics = getRouteCharacteristics(route, index)
            const colorClass = ROUTE_COLORS[index % ROUTE_COLORS.length]

            return (
              <button
                key={index}
                onClick={() => handleSelectRoute(index)}
                className={`w-full p-4 rounded-2xl border transition-all touch-target ${
                  isSelected
                    ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
                    : "border-border/30 hover:border-border/50 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Route Color Indicator */}
                  <div
                    className={`w-3 h-3 rounded-full ${colorClass} mt-1.5 flex-shrink-0`}
                    style={{
                      backgroundColor: ROUTE_COLOR_VALUES[index % ROUTE_COLOR_VALUES.length],
                    }}
                  />

                  {/* Route Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground text-lg">{routeName}</h3>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">
                          {formatDistance(route.distance)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">
                          {formatDuration(route.duration)}
                        </span>
                      </div>
                    </div>

                    {/* Characteristics */}
                    {characteristics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {characteristics.map((char, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground"
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm p-4 border-t border-border/30 flex gap-3">
          <Button
            onClick={handleConfirm}
            className="flex-1 touch-target bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
          >
            Confirm Route
          </Button>
          <Button
            variant="outline"
            onClick={() => onSelectRoute()}
            className="flex-1 touch-target border-border/30 rounded-xl font-semibold bg-transparent"
          >
            Keep Current
          </Button>
        </div>
      </div>
    </div>
  )
}
