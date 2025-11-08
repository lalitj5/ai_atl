"use client"

import { CheckCircle2, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface Route {
  id: string
  name: string
  distance: string
  time: string
  characteristics: string[]
  color: string
  whyStop?: string
}

interface RouteComparisonProps {
  onSelectRoute: () => void
}

const ROUTES: Route[] = [
  {
    id: "1",
    name: "Current Route",
    distance: "4.2 mi",
    time: "14 min",
    characteristics: ["Fastest", "Highway"],
    color: "bg-primary",
    whyStop: "Quickest way to reach your destination via I-80",
  },
  {
    id: "2",
    name: "Scenic Route",
    distance: "5.1 mi",
    time: "18 min",
    characteristics: ["Scenic", "Coastal"],
    color: "bg-accent",
    whyStop: "Beautiful coastal views and relaxing drive experience",
  },
  {
    id: "3",
    name: "Local Streets",
    distance: "4.8 mi",
    time: "16 min",
    characteristics: ["Avoid Highways", "Downtown"],
    color: "bg-secondary",
    whyStop: "Navigate through downtown with local street experience",
  },
]

export default function RouteComparison({ onSelectRoute }: RouteComparisonProps) {
  const [selectedId, setSelectedId] = useState("1")

  const handleSelectRoute = (id: string) => {
    setSelectedId(id)
    setTimeout(onSelectRoute, 300)
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      <div className="floating-card bg-card rounded-t-3xl border-t border-border/30 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm px-4 py-4 border-b border-border/30">
          <h2 className="text-xl font-bold text-foreground">Route Options</h2>
          <p className="text-sm text-muted-foreground mt-1">3 alternatives found</p>
        </div>

        {/* Routes List */}
        <div className="p-4 space-y-3">
          {ROUTES.map((route) => (
            <button
              key={route.id}
              onClick={() => handleSelectRoute(route.id)}
              className={`w-full p-4 rounded-2xl border transition-all touch-target ${
                selectedId === route.id
                  ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
                  : "border-border/30 hover:border-border/50 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Route Color Indicator */}
                <div className={`w-3 h-3 rounded-full ${route.color} mt-1.5 flex-shrink-0`} />

                {/* Route Info */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground text-lg">{route.name}</h3>
                    {selectedId === route.id && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{route.distance}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{route.time}</span>
                    </div>
                  </div>

                  {/* Characteristics */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {route.characteristics.map((char, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground"
                      >
                        {char}
                      </span>
                    ))}
                  </div>

                  {/* Why Stop Section */}
                  {route.whyStop && (
                    <p className="text-sm text-muted-foreground italic mt-2 border-l-2 border-muted-foreground/30 pl-2">
                      {route.whyStop}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm p-4 border-t border-border/30 flex gap-3">
          <Button
            onClick={() => onSelectRoute()}
            className="flex-1 touch-target bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
          >
            Confirm Route
          </Button>
          <Button
            variant="outline"
            className="flex-1 touch-target border-border/30 rounded-xl font-semibold bg-transparent"
          >
            Compare More
          </Button>
        </div>
      </div>
    </div>
  )
}
