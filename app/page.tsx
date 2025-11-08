"use client"

import { useState, useEffect } from "react"
import MapView from "@/components/map-view"
import NavigationInfo from "@/components/navigation-info"
import DestinationSearch from "@/components/destination-search"
import RouteComparison from "@/components/route-comparison"
import { mapboxService, type Route } from "@/lib/services/mapboxService"
import { useGeolocation } from "@/hooks/useGeolocation"
import { useMicrophone } from "@/hooks/useMicrophone"
import { Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"

type NavigationState = "idle" | "searching" | "navigating" | "comparing-routes"

interface Destination {
  name: string
  coordinates: [number, number] // [lng, lat]
}

export default function Home() {
  const [navigationState, setNavigationState] = useState<NavigationState>("idle")
  const [destination, setDestination] = useState<Destination | null>(null)
  const [route, setRoute] = useState<Route | null>(null)
  const [alternativeRoutes, setAlternativeRoutes] = useState<Route[]>([])
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [showComparison, setShowComparison] = useState(false)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const { coordinates: currentLocation, error: locationErrorData } = useGeolocation({
    watch: navigationState === "navigating",
  })

  // Microphone hook
  const { isListening, isRecording, transcription, toggleMute, manualStopRecording } = useMicrophone()

  // Handle location errors
  useEffect(() => {
    if (locationErrorData) {
      setLocationError(locationErrorData.message)
    } else {
      setLocationError(null)
    }
  }, [locationErrorData])

  const getOrigin = (): [number, number] => {
    if (currentLocation) {
      return [currentLocation.lng, currentLocation.lat]
    }
    // Default to San Francisco if location not available
    return [-122.4194, 37.7749]
  }

  const handleStartNavigation = async (dest: Destination) => {
    setDestination(dest)
    setNavigationState("searching")
    setIsCalculatingRoute(true)

    try {
      const origin = getOrigin()

      // Calculate route
      const calculatedRoute = await mapboxService.getRoute(origin, dest.coordinates)
      setRoute(calculatedRoute)
      setNavigationState("navigating")
    } catch (error) {
      console.error("Error calculating route:", error)
      setNavigationState("idle")
      // Show error message to user
      alert("Failed to calculate route. Please try again or select a different destination.")
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  const handleModifyRoute = async (modifiedParams: {
    avoid?: string[]
    waypoints?: [number, number][]
    profile?: "driving" | "walking" | "cycling" | "driving-traffic"
    explanation: string
  }) => {
    if (!destination) return

    setNavigationState("searching")
    setIsCalculatingRoute(true)

    try {
      const origin = getOrigin()

      // Get alternative routes with modified parameters
      const alternatives = await mapboxService.getAlternativeRoutes(
        origin,
        destination.coordinates,
        {
          avoid: modifiedParams.avoid,
          waypoints: modifiedParams.waypoints,
          profile: modifiedParams.profile,
        }
      )

      // Filter out duplicate/similar routes
      const uniqueRoutes: typeof alternatives = []
      for (const alt of alternatives) {
        // Check if this route is significantly different from all already-added routes
        const isDuplicate = uniqueRoutes.some(
          (existing) => !mapboxService.isSignificantlyDifferent(existing, alt)
        )
        if (!isDuplicate) {
          uniqueRoutes.push(alt)
        }
      }

      // Build final route list including current route
      let allRoutes: typeof alternatives = []
      if (route) {
        // Filter unique routes that are different from current route
        const differentRoutes = uniqueRoutes.filter((alt) =>
          mapboxService.isSignificantlyDifferent(route, alt)
        )
        allRoutes = [route, ...differentRoutes]
      } else {
        allRoutes = uniqueRoutes
      }

      // Check if we have meaningful alternatives (at least 2 different routes)
      if (allRoutes.length < 2) {
        setNavigationState("navigating")
        alert(
          "Unfortunately, there aren't significantly different alternative routes available for this trip. The current route is already optimal for your preferences."
        )
        return
      }

      setAlternativeRoutes(allRoutes)
      setShowComparison(true)
      setNavigationState("comparing-routes")
    } catch (error) {
      console.error("Error calculating alternative routes:", error)
      setNavigationState("navigating")
      // Show error message to user
      alert("Failed to find alternative routes. Please try again or rephrase your request.")
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  const handleConfirmRoute = (selectedRoute?: Route) => {
    if (selectedRoute) {
      setRoute(selectedRoute)
    }
    setShowComparison(false)
    setNavigationState("navigating")
  }

  const handleBackToSearch = () => {
    // Reset all navigation state
    setNavigationState("idle")
    setDestination(null)
    setRoute(null)
    setAlternativeRoutes([])
    setSelectedRouteIndex(0)
    setShowComparison(false)
  }

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Map Container */}
      <MapView
        route={showComparison ? null : route}
        alternativeRoutes={showComparison ? alternativeRoutes : undefined}
        selectedRouteIndex={selectedRouteIndex}
        origin={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : null}
        destination={destination ? { lat: destination.coordinates[1], lng: destination.coordinates[0] } : null}
      />

      {/* Left Sidebar - Destination Search & Navigation */}
      <div className="absolute left-0 top-0 bottom-0 w-96 z-20 flex flex-col">
        {navigationState === "idle" && <DestinationSearch onStartNavigation={handleStartNavigation} />}
        {(navigationState === "searching" || isCalculatingRoute) && (
          <div className="w-full h-full flex items-center justify-center p-6 bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-foreground">Calculating route...</p>
            </div>
          </div>
        )}
        {navigationState === "navigating" && route && (
          <NavigationInfo
            route={route}
            destination={destination}
            currentLocation={currentLocation}
            onModifyRoute={handleModifyRoute}
            onBackToSearch={handleBackToSearch}
          />
        )}
        {locationError && navigationState === "navigating" && (
          <div className="absolute top-4 left-96 right-4 z-30">
            <div className="floating-card bg-destructive/90 text-destructive-foreground p-4 rounded-xl border border-destructive">
              <p className="font-semibold">GPS Signal Lost</p>
              <p className="text-sm mt-1">{locationError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Route Comparison - Bottom Sheet */}
      {showComparison && alternativeRoutes.length > 0 && (
        <RouteComparison
          routes={alternativeRoutes}
          currentRoute={route}
          onSelectRoute={(selectedRoute) => {
            if (selectedRoute) {
              const index = alternativeRoutes.findIndex((r) => r === selectedRoute)
              setSelectedRouteIndex(index >= 0 ? index : 0)
              setRoute(selectedRoute)
            }
            handleConfirmRoute(selectedRoute)
          }}
        />
      )}

      {/* Microphone Button - Top Right Corner */}
      <div className="absolute top-6 right-6 z-30">
        <Button
          onClick={() => {
            if (isRecording) {
              // If currently recording, stop the recording
              manualStopRecording()
            } else {
              // Otherwise toggle mute/unmute
              toggleMute()
            }
          }}
          size="lg"
          variant={!isListening ? "destructive" : "default"}
          className={`h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform ${
            isRecording ? "animate-pulse ring-4 ring-red-500" : ""
          }`}
          aria-label={!isListening ? "Unmute microphone" : isRecording ? "Stop recording" : "Mute microphone"}
        >
          {!isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  )
}
