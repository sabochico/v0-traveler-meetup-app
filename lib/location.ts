export interface DetectedLocation {
  city: string
  region: string | null
  country: string
  latitude: number
  longitude: number
}

export async function detectCurrentLocation(): Promise<DetectedLocation> {
  if (!navigator.geolocation) {
    throw new Error("Location detection is not available on this device.")
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000,
    })
  })

  const { latitude, longitude } = position.coords
  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
  )

  if (!response.ok) {
    throw new Error("Could not look up your city.")
  }

  const data = await response.json()
  const city = data.city || data.locality || data.principalSubdivision || ""
  const country = data.countryName || ""

  if (!city || !country) {
    throw new Error("Could not detect a usable city.")
  }

  return {
    city,
    region: data.principalSubdivision || null,
    country,
    latitude,
    longitude,
  }
}
