"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getCurrentLocation,
  watchLocation,
  stopWatchingLocation,
  type Coordinates,
  type GeolocationError,
} from "@/lib/services/geolocationService"

interface UseGeolocationOptions {
  watch?: boolean
  watchInterval?: number
}

interface UseGeolocationReturn {
  coordinates: Coordinates | null
  error: GeolocationError | null
  loading: boolean
  refresh: () => void
}

/**
 * Custom hook for geolocation
 * @param options Configuration options
 * @returns Geolocation state and controls
 */
export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationReturn {
  const { watch = false } = options
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [error, setError] = useState<GeolocationError | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchLocation = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const coords = await getCurrentLocation()
      setCoordinates(coords)
    } catch (err) {
      setError(err as GeolocationError)
      setCoordinates(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (watch) {
      // Watch location continuously
      const watchId = watchLocation(
        (coords) => {
          setCoordinates(coords)
          setError(null)
          setLoading(false)
        },
        (err) => {
          setError(err)
          setCoordinates(null)
          setLoading(false)
        }
      )

      return () => {
        if (watchId !== null) {
          stopWatchingLocation(watchId)
        }
      }
    } else {
      // Get location once
      fetchLocation()
    }
  }, [watch, fetchLocation])

  return {
    coordinates,
    error,
    loading,
    refresh: fetchLocation,
  }
}

