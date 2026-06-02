export type LaunchCity = {
  city: string
  country: string
  latitude: number
  longitude: number
  radiusKm: number
}

export type LocationInput = {
  city?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
}

export const LAUNCH_CITIES: LaunchCity[] = [
  { city: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503, radiusKm: 50 },
  { city: "Melbourne", country: "Australia", latitude: -37.8136, longitude: 144.9631, radiusKm: 50 },
  { city: "Los Angeles", country: "United States", latitude: 34.0522, longitude: -118.2437, radiusKm: 60 },
  { city: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198, radiusKm: 40 },
]

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? ""

export function getDistanceKm(
  from: Pick<LocationInput, "latitude" | "longitude">,
  to: Pick<LaunchCity, "latitude" | "longitude">
) {
  if (from.latitude == null || from.longitude == null) return Number.POSITIVE_INFINITY

  const earthRadiusKm = 6371
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180
  const lat1 = (from.latitude * Math.PI) / 180
  const lat2 = (to.latitude * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getNearestLaunchCity(location?: LocationInput | null) {
  if (!location) return null

  return LAUNCH_CITIES
    .map((launchCity) => ({
      launchCity,
      distanceKm: getDistanceKm(location, launchCity),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0] ?? null
}

export function getLaunchCityEligibility(location?: LocationInput | null) {
  if (!location) {
    return { eligible: false, matchedCity: null, nearestCity: null }
  }

  const city = normalize(location.city)
  const country = normalize(location.country)
  const cityMatch = LAUNCH_CITIES.find((launchCity) => {
    const sameCity = normalize(launchCity.city) === city
    const sameCountry = !country || normalize(launchCity.country) === country
    return sameCity && sameCountry
  })

  if (cityMatch) {
    return { eligible: true, matchedCity: cityMatch, nearestCity: { launchCity: cityMatch, distanceKm: 0 } }
  }

  const nearestCity = getNearestLaunchCity(location)
  const radiusMatch =
    nearestCity && Number.isFinite(nearestCity.distanceKm)
      ? nearestCity.distanceKm <= nearestCity.launchCity.radiusKm
      : false

  return {
    eligible: radiusMatch,
    matchedCity: radiusMatch && nearestCity ? nearestCity.launchCity : null,
    nearestCity,
  }
}
