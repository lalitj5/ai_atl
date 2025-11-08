"use client"

import { ChevronRight, MapPin, Clock, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Route } from "@/lib/services/mapboxService"

interface NavigationInfoProps {
  route: Route
  destination: { name: string; coordinates: [number, number] } | null
  currentLocation: { lat: number; lng: number } | null
  onModifyRoute: () => void
}

// Calculate distance between two coordinates in meters
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

// Find the current step based on user's location
function findCurrentStep(
  route: Route,
  currentLocation: { lat: number; lng: number } | null
): { step: RouteStep | null; distanceToStep: number } {
  if (!currentLocation || route.steps.length === 0) {
    return { step: route.steps[0] || null, distanceToStep: 0 }
  }

  // Find the closest step to user's current location
  let closestStep = route.steps[0]
  let minDistance = Infinity

  for (const step of route.steps) {
    const [lng, lat] = step.maneuver.location
    const distance = calculateDistance(currentLocation.lat, currentLocation.lng, lat, lng)

    if (distance < minDistance) {
      minDistance = distance
      closestStep = step
    }
  }

  // Find the next step (one that hasn't been reached yet)
  const currentStepIndex = route.steps.findIndex((s) => s === closestStep)
  const nextStepIndex = currentStepIndex < route.steps.length - 1 ? currentStepIndex + 1 : currentStepIndex

  return {
    step: route.steps[nextStepIndex] || route.steps[0],
    distanceToStep: minDistance,
  }
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

function formatETA(durationSeconds: number): string {
  const now = new Date()
  const arrival = new Date(now.getTime() + durationSeconds * 1000)
  return arrival.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatStepInstruction(instruction: string): string {
  if (!instruction) return "Continue straight"
  // Clean up MapBox instructions
  return instruction
    .replace(/^Head /, "")
    .replace(/^Continue /, "")
    .replace(/^Turn /, "")
    .trim()
}

export default function NavigationInfo({
  route,
  destination,
  currentLocation,
  onModifyRoute,
}: NavigationInfoProps) {
  const { step: currentStep, distanceToStep } = findCurrentStep(route, currentLocation)
  const nextStepDistance = currentStep
    ? distanceToStep < 50
      ? formatDistance(currentStep.distance)
      : formatDistance(distanceToStep)
    : ""

  return (
    <div className="w-full h-full flex flex-col p-6 bg-background">
      <div className="floating-card bg-card rounded-2xl p-6 space-y-4">
        {/* Current Direction */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
            <Navigation className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground font-medium">Next Turn</p>
            <p className="text-2xl font-semibold text-foreground leading-tight">
              {currentStep
                ? formatStepInstruction(currentStep.instruction)
                : "Calculating route..."}
            </p>
            {nextStepDistance && (
              <p className="text-sm text-muted-foreground mt-1">In {nextStepDistance}</p>
            )}
          </div>
        </div>

        {/* Trip Stats */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary" />
            <div>
              <p className="text-xs text-muted-foreground">ETA</p>
              <p className="text-lg font-semibold text-foreground">{formatETA(route.duration)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="text-lg font-semibold text-foreground">{formatDistance(route.distance)}</p>
            </div>
          </div>
        </div>

        {/* Destination Name */}
        {destination && (
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground">Destination</p>
            <p className="text-sm font-semibold text-foreground">{destination.name}</p>
          </div>
        )}

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

