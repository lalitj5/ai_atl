/**
 * Geolocation Service
 * Handles browser geolocation API for getting user's current location
 */

export interface Coordinates {
  lat: number
  lng: number
}

export interface GeolocationError {
  code: number
  message: string
}

/**
 * Get the user's current location using browser Geolocation API
 * @returns Promise resolving to coordinates or rejecting with error
 */
export async function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: -1,
        message: "Geolocation is not supported by this browser",
      } as GeolocationError)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        let errorMessage = "Failed to get location"
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }

        reject({
          code: error.code,
          message: errorMessage,
        } as GeolocationError)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  })
}

/**
 * Watch user's location continuously
 * @param callback Function called with new coordinates
 * @param errorCallback Function called on error
 * @returns Watch ID that can be used to stop watching
 */
export function watchLocation(
  callback: (coords: Coordinates) => void,
  errorCallback?: (error: GeolocationError) => void
): number | null {
  if (!navigator.geolocation) {
    errorCallback?.({
      code: -1,
      message: "Geolocation is not supported by this browser",
    })
    return null
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
    },
    (error) => {
      let errorMessage = "Failed to get location"
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied by user"
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable"
          break
        case error.TIMEOUT:
          errorMessage = "Location request timed out"
          break
      }

      errorCallback?.({
        code: error.code,
        message: errorMessage,
      })
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000, // Accept cached position up to 5 seconds old
    }
  )
}

/**
 * Stop watching location
 * @param watchId The watch ID returned from watchLocation
 */
export function stopWatchingLocation(watchId: number): void {
  navigator.geolocation.clearWatch(watchId)
}

