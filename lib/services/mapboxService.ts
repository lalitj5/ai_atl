/**
 * MapBox Service
 * Handles all MapBox API interactions (Geocoding, Directions, etc.)
 */

import { v4 as uuidv4 } from "uuid"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

if (!MAPBOX_TOKEN) {
  console.warn(
    "NEXT_PUBLIC_MAPBOX_TOKEN is not set. MapBox features will not work."
  )
}

export interface Place {
  name: string
  coordinates: [number, number] // [lng, lat]
  address?: string
  id: string
}

export interface RouteStep {
  distance: number // in meters
  duration: number // in seconds
  instruction: string
  maneuver: {
    type: string
    modifier?: string
    location: [number, number]
  }
}

export interface Route {
  geometry: {
    coordinates: [number, number][]
    type: "LineString"
  }
  distance: number // in meters
  duration: number // in seconds
  steps: RouteStep[]
}

export interface RouteOptions {
  avoid?: string[] // e.g., ["highways", "tolls"]
  waypoints?: [number, number][] // [lng, lat] format
  profile?: "driving" | "walking" | "cycling" | "driving-traffic"
}

interface SearchSession {
  token: string
  timestamp: number
}

/**
 * MapBox Service class
 */
class MapboxService {
  private token: string | undefined
  private searchSession: SearchSession | null = null

  constructor() {
    this.token = MAPBOX_TOKEN
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.token
  }

  /**
   * Check if two routes are significantly different
   * Routes are considered different if they differ by >10% in distance OR >15% in duration
   * @param route1 First route to compare
   * @param route2 Second route to compare
   * @returns true if routes are meaningfully different
   */
  isSignificantlyDifferent(route1: Route, route2: Route): boolean {
    const distanceDiff = Math.abs(route1.distance - route2.distance) / route1.distance
    const durationDiff = Math.abs(route1.duration - route2.duration) / route1.duration

    // Routes are different if they differ by >10% in distance or >15% in time
    return distanceDiff > 0.10 || durationDiff > 0.15
  }

  /**
   * Get or create session token for Search Box API
   * Session tokens group related searches for billing
   */
  private getSessionToken(): string {
    const SESSION_TIMEOUT = 5 * 60 * 1000 // 5 minutes
    const now = Date.now()

    if (!this.searchSession || now - this.searchSession.timestamp > SESSION_TIMEOUT) {
      this.searchSession = {
        token: uuidv4(),
        timestamp: now,
      }
    }

    return this.searchSession.token
  }

  /**
   * Search for places using MapBox Search Box API
   * Supports POI search (restaurants, businesses, landmarks)
   * @param query Search query string
   * @param userLocation User's current location [lng, lat] for proximity biasing
   * @returns Promise resolving to array of places
   */
  async searchPlaces(query: string, userLocation?: [number, number]): Promise<Place[]> {
    if (!this.token) {
      throw new Error("MapBox token is not configured")
    }

    if (!query.trim()) {
      return []
    }

    try {
      const sessionToken = this.getSessionToken()

      let url =
        `https://api.mapbox.com/search/searchbox/v1/suggest?` +
        `q=${encodeURIComponent(query)}` +
        `&access_token=${this.token}` +
        `&session_token=${sessionToken}` +
        `&limit=5` +
        `&language=en` +
        `&types=poi,address,place`

      // Add proximity biasing if user location available
      if (userLocation) {
        url += `&proximity=${userLocation[0]},${userLocation[1]}`
      }

      // Add country filtering (US for now, could be dynamic)
      url += `&country=us`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`MapBox Search Box API error: ${response.statusText}`)
      }

      const data = await response.json()

      // Search Box API returns suggestions WITHOUT coordinates
      // Must call retrievePlace() with mapbox_id to get actual coordinates
      return data.suggestions.map((suggestion: any) => ({
        name: suggestion.name,
        coordinates: [0, 0] as [number, number], // Placeholder - call retrievePlace() for real coordinates
        address: suggestion.full_address || suggestion.place_formatted,
        id: suggestion.mapbox_id,
      }))
    } catch (error) {
      console.error("Error searching places:", error)
      throw error
    }
  }

  /**
   * Retrieve full place details including coordinates using mapbox_id
   * Must be called after searchPlaces to get coordinates for selected suggestion
   * @param mapboxId The mapbox_id from a suggestion
   * @returns Promise resolving to Place with coordinates
   */
  async retrievePlace(mapboxId: string): Promise<Place> {
    if (!this.token) {
      throw new Error("MapBox token is not configured")
    }

    try {
      const sessionToken = this.getSessionToken()

      const url =
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?` +
        `access_token=${this.token}` +
        `&session_token=${sessionToken}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`MapBox Retrieve API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.features || data.features.length === 0) {
        throw new Error("No feature found for the given mapbox_id")
      }

      const feature = data.features[0]
      const props = feature.properties

      return {
        name: props.name,
        coordinates: [
          feature.geometry.coordinates[0], // longitude
          feature.geometry.coordinates[1], // latitude
        ] as [number, number],
        address: props.full_address || props.place_formatted,
        id: props.mapbox_id,
      }
    } catch (error) {
      console.error("Error retrieving place details:", error)
      throw error
    }
  }

  /**
   * Get route between two points using MapBox Directions API
   * @param origin Origin coordinates [lng, lat]
   * @param destination Destination coordinates [lng, lat]
   * @param options Route options
   * @returns Promise resolving to route data
   */
  async getRoute(
    origin: [number, number],
    destination: [number, number],
    options: RouteOptions = {}
  ): Promise<Route> {
    if (!this.token) {
      throw new Error("MapBox token is not configured")
    }

    try {
      const profile = options.profile || "driving"
      let url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?access_token=${this.token}&geometries=geojson&steps=true&overview=full`

      // Add waypoints if provided
      if (options.waypoints && options.waypoints.length > 0) {
        const waypointCoords = options.waypoints
          .map((wp) => `${wp[0]},${wp[1]}`)
          .join(";")
        url = url.replace(
          `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`,
          `${origin[0]},${origin[1]};${waypointCoords};${destination[0]},${destination[1]}`
        )
      }

      // Add avoid parameters
      if (options.avoid && options.avoid.length > 0) {
        url += `&exclude=${options.avoid.join(",")}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`MapBox Directions API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.routes || data.routes.length === 0) {
        throw new Error("No route found")
      }

      const route = data.routes[0]
      const leg = route.legs[0]

      // Parse steps
      const steps: RouteStep[] = leg.steps.map((step: any) => ({
        distance: step.distance,
        duration: step.duration,
        instruction: step.maneuver.instruction || "",
        maneuver: {
          type: step.maneuver.type,
          modifier: step.maneuver.modifier,
          location: step.maneuver.location,
        },
      }))

      return {
        geometry: route.geometry,
        distance: leg.distance,
        duration: leg.duration,
        steps,
      }
    } catch (error) {
      console.error("Error getting route:", error)
      throw error
    }
  }

  /**
   * Get alternative routes between two points
   * @param origin Origin coordinates [lng, lat]
   * @param destination Destination coordinates [lng, lat]
   * @param options Route options
   * @returns Promise resolving to array of route options
   */
  async getAlternativeRoutes(
    origin: [number, number],
    destination: [number, number],
    options: RouteOptions = {}
  ): Promise<Route[]> {
    if (!this.token) {
      throw new Error("MapBox token is not configured")
    }

    try {
      const profile = options.profile || "driving"
      let url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?access_token=${this.token}&geometries=geojson&steps=true&overview=full&alternatives=true`

      // Add waypoints if provided
      if (options.waypoints && options.waypoints.length > 0) {
        const waypointCoords = options.waypoints
          .map((wp) => `${wp[0]},${wp[1]}`)
          .join(";")
        url = url.replace(
          `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`,
          `${origin[0]},${origin[1]};${waypointCoords};${destination[0]},${destination[1]}`
        )
      }

      // Add avoid parameters
      if (options.avoid && options.avoid.length > 0) {
        url += `&exclude=${options.avoid.join(",")}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`MapBox Directions API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.routes || data.routes.length === 0) {
        throw new Error("No routes found")
      }

      return data.routes.map((route: any) => {
        const leg = route.legs[0]
        const steps: RouteStep[] = leg.steps.map((step: any) => ({
          distance: step.distance,
          duration: step.duration,
          instruction: step.maneuver.instruction || "",
          maneuver: {
            type: step.maneuver.type,
            modifier: step.maneuver.modifier,
            location: step.maneuver.location,
          },
        }))

        return {
          geometry: route.geometry,
          distance: leg.distance,
          duration: leg.duration,
          steps,
        }
      })
    } catch (error) {
      console.error("Error getting alternative routes:", error)
      throw error
    }
  }
}

// Export singleton instance
export const mapboxService = new MapboxService()

