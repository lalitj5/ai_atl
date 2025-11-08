"use client"

import { useState } from "react"
import MapView from "@/components/map-view"
import NavigationInfo from "@/components/navigation-info"
import DestinationSearch from "@/components/destination-search"
import ConversationalInput from "@/components/conversational-input"
import RouteComparison from "@/components/route-comparison"

type NavigationState = "idle" | "searching" | "navigating" | "comparing-routes"

export default function Home() {
  const [navigationState, setNavigationState] = useState<NavigationState>("idle")
  const [destination, setDestination] = useState("")
  const [showComparison, setShowComparison] = useState(false)

  const handleStartNavigation = (dest: string) => {
    setDestination(dest)
    setNavigationState("navigating")
  }

  const handleModifyRoute = () => {
    setShowComparison(true)
    setNavigationState("comparing-routes")
  }

  const handleConfirmRoute = () => {
    setShowComparison(false)
    setNavigationState("navigating")
  }

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Map Container */}
      <MapView />

      {/* Left Sidebar - Destination Search & Navigation */}
      <div className="absolute left-0 top-0 bottom-0 w-96 z-20 flex flex-col">
        {navigationState === "idle" && <DestinationSearch onStartNavigation={handleStartNavigation} />}
        {navigationState === "navigating" && <NavigationInfo onModifyRoute={handleModifyRoute} />}
      </div>

      {/* Conversational Input - Bottom Floating */}
      {navigationState === "navigating" && <ConversationalInput onRouteModified={handleModifyRoute} />}

      {/* Route Comparison - Bottom Sheet */}
      {showComparison && <RouteComparison onSelectRoute={handleConfirmRoute} />}
    </div>
  )
}
