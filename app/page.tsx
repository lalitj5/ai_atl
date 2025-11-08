"use client"

import { useState, useEffect } from "react"
import MapView from "@/components/map-view"
import NavigationInfo from "@/components/navigation-info"
import DestinationSearch from "@/components/destination-search"
import ConversationalInput from "@/components/conversational-input"
import RouteComparison from "@/components/route-comparison"
import { mapboxService, type Route } from "@/lib/services/mapboxService"
import { useGeolocation } from "@/hooks/useGeolocation"

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

      // Include current route as first option
      if (route) {
        setAlternativeRoutes([route, ...alternatives])
      } else {
        setAlternativeRoutes(alternatives)
      }

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

      {/* Conversational Input - Bottom Floating */}
      {navigationState === "navigating" && route && destination && (
        <ConversationalInput
          onRouteModified={handleModifyRoute}
          currentRoute={{
            origin: getOrigin(),
            destination: destination.coordinates,
          }}
        />
      )}

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
    </div>
  )
}
