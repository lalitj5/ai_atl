/**
 * MapBox Service
 * Handles all MapBox API interactions (Geocoding, Directions, etc.)
 */

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
    type: string
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

/**
 * MapBox Service class
 */
class MapboxService {
  private token: string | undefined

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
   * Search for places using MapBox Geocoding API
   * @param query Search query string
   * @returns Promise resolving to array of places
   */
  async searchPlaces(query: string): Promise<Place[]> {
    if (!this.token) {
      throw new Error("MapBox token is not configured")
    }

    if (!query.trim()) {
      return []
    }

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${this.token}&limit=5&types=place,address,poi`

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`MapBox API error: ${response.statusText}`)
      }

      const data = await response.json()

      return data.features.map((feature: any) => ({
        name: feature.place_name || feature.text,
        coordinates: feature.center as [number, number],
        address: feature.place_name,
        id: feature.id,
      }))
    } catch (error) {
      console.error("Error searching places:", error)
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

