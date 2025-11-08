"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import { useGeolocation } from "@/hooks/useGeolocation"

interface MapViewProps {
  route?: {
    geometry: {
      coordinates: [number, number][]
      type: string
    }
  } | null
  alternativeRoutes?: {
    geometry: {
      coordinates: [number, number][]
      type: string
    }
  }[]
  selectedRouteIndex?: number
  origin?: { lat: number; lng: number } | null
  destination?: { lat: number; lng: number } | null
}

// Route colors matching route comparison component
const ROUTE_COLORS = [
  "hsl(217, 91%, 60%)", // Primary blue
  "hsl(40, 84%, 53%)", // Accent orange
  "hsl(142, 76%, 36%)", // Secondary green
  "#a855f7", // Purple
  "#ec4899", // Pink
]

export default function MapView({
  route,
  alternativeRoutes,
  selectedRouteIndex = 0,
  origin,
  destination,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const { coordinates, loading: locationLoading } = useGeolocation()

  // Initialize map
  useEffect(() => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    if (!mapboxToken) {
      console.error("MapBox token is not configured")
      return
    }

    if (map.current || !mapContainer.current) return

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      accessToken: mapboxToken,
      style: "mapbox://styles/mapbox/dark-v11",
      center: coordinates ? [coordinates.lng, coordinates.lat] : [-122.4194, 37.7749], // Default to San Francisco
      zoom: 13,
    })

    map.current.on("load", () => {
      setMapLoaded(true)
    })

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [coordinates])

  // Center map on user location when available
  useEffect(() => {
    if (map.current && coordinates && !locationLoading) {
      map.current.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: 14,
        duration: 1000,
      })
    }
  }, [coordinates, locationLoading])

  // Add/update route layers
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Remove all existing route layers and sources
    const routeLayers = ["route-layer", "alternative-route-0", "alternative-route-1", "alternative-route-2", "alternative-route-3", "alternative-route-4"]
    const routeSources = ["route", "alternative-route-0", "alternative-route-1", "alternative-route-2", "alternative-route-3", "alternative-route-4"]

    routeLayers.forEach((layerId) => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId)
      }
    })

    routeSources.forEach((sourceId) => {
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId)
      }
    })

    // Display multiple routes if alternativeRoutes is provided
    if (alternativeRoutes && alternativeRoutes.length > 0) {
      alternativeRoutes.forEach((altRoute, index) => {
        const sourceId = index === 0 ? "route" : `alternative-route-${index - 1}`
        const layerId = index === 0 ? "route-layer" : `alternative-route-${index - 1}`
        const isSelected = index === selectedRouteIndex
        const color = ROUTE_COLORS[index % ROUTE_COLORS.length]

        map.current!.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: altRoute.geometry,
          },
        })

        map.current!.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": color,
            "line-width": isSelected ? 5 : 3,
            "line-opacity": isSelected ? 0.9 : 0.5,
          },
        })
      })

      // Fit map to all routes
      const allCoordinates: [number, number][] = []
      alternativeRoutes.forEach((altRoute) => {
        allCoordinates.push(...(altRoute.geometry.coordinates as [number, number][]))
      })

      if (allCoordinates.length > 0) {
        const bounds = allCoordinates.reduce(
          (bounds, coord) => {
            return bounds.extend(coord)
          },
          new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0])
        )

        map.current.fitBounds(bounds, {
          padding: { top: 100, bottom: 100, left: 400, right: 100 },
          duration: 1000,
        })
      }
    } else if (route) {
      // Display single route
      map.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: route.geometry,
        },
      })

      map.current.addLayer({
        id: "route-layer",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": ROUTE_COLORS[0], // Primary blue color
          "line-width": 4,
          "line-opacity": 0.9,
        },
      })

      // Fit map to route bounds
      if (route.geometry.coordinates.length > 0) {
        const coordinates = route.geometry.coordinates
        const bounds = coordinates.reduce(
          (bounds, coord) => {
            return bounds.extend(coord as [number, number])
          },
          new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number])
        )

        map.current.fitBounds(bounds, {
          padding: { top: 100, bottom: 100, left: 400, right: 100 },
          duration: 1000,
        })
      }
    }
  }, [route, alternativeRoutes, selectedRouteIndex, mapLoaded])

  // Add origin marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const originMarkerId = "origin-marker"
    const existingMarker = document.getElementById(originMarkerId)
    if (existingMarker) {
      existingMarker.remove()
    }

    if (origin || coordinates) {
      const location = origin || coordinates
      if (location) {
        const el = document.createElement("div")
        el.id = originMarkerId
        el.className = "location-marker"
        el.style.width = "16px"
        el.style.height = "16px"
        el.style.borderRadius = "50%"
        el.style.backgroundColor = "hsl(142, 76%, 36%)" // Secondary green
        el.style.border = "4px solid rgba(34, 197, 94, 0.3)"
        el.style.boxShadow = "0 0 0 4px rgba(34, 197, 94, 0.1)"

        new mapboxgl.Marker(el)
          .setLngLat([location.lng, location.lat])
          .addTo(map.current)
      }
    }
  }, [origin, coordinates, mapLoaded])

  // Add destination marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !destination) return

    const destMarkerId = "destination-marker"
    const existingMarker = document.getElementById(destMarkerId)
    if (existingMarker) {
      existingMarker.remove()
    }

    const el = document.createElement("div")
    el.id = destMarkerId
    el.className = "destination-marker"
    el.style.width = "16px"
    el.style.height = "16px"
    el.style.borderRadius = "50%"
    el.style.backgroundColor = "hsl(40, 84%, 53%)" // Accent orange
    el.style.border = "4px solid rgba(245, 158, 11, 0.3)"
    el.style.boxShadow = "0 0 0 4px rgba(245, 158, 11, 0.1)"

    new mapboxgl.Marker(el)
      .setLngLat([destination.lng, destination.lat])
      .addTo(map.current)
  }, [destination, mapLoaded])

  return (
    <div className="map-container">
      <div ref={mapContainer} className="w-full h-full" />
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center p-6">
            <p className="text-lg font-semibold text-foreground mb-2">
              MapBox Token Required
            </p>
            <p className="text-sm text-muted-foreground">
              Please configure NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local file
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
