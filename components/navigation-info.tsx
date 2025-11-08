"use client"

import { ChevronRight, MapPin, Clock, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavigationInfoProps {
  onModifyRoute: () => void
}

export default function NavigationInfo({ onModifyRoute }: NavigationInfoProps) {
  return (
    <div className="w-full h-full flex flex-col p-6 bg-background">
      <div className="floating-card bg-card rounded-2xl p-6 space-y-4">
        {/* Current Direction */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
            <Navigation className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground font-medium">Current Step</p>
            <p className="text-2xl font-semibold text-foreground leading-tight">Turn right onto Main Street</p>
            <p className="text-sm text-muted-foreground mt-1">In 0.5 miles</p>
          </div>
        </div>

        {/* Trip Stats */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary" />
            <div>
              <p className="text-xs text-muted-foreground">ETA</p>
              <p className="text-lg font-semibold text-foreground">12:45 PM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="text-lg font-semibold text-foreground">4.2 mi</p>
            </div>
          </div>
        </div>

        {/* Modify Route Button */}
        <Button
          onClick={onModifyRoute}
          variant="outline"
          className="w-full touch-target border border-border/30 hover:bg-muted/50 text-base font-semibold bg-transparent"
        >
          Ask to Modify Route
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
