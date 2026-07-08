import type { Profile } from "@/lib/types"
import { sameCity, sameCountry } from "@/lib/city-matching"

type LocationProfile = Pick<Profile, "latitude" | "longitude" | "current_city" | "current_country">

function hasCoordinate(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
}

function distanceKm(a: LocationProfile, b: LocationProfile) {
  if (!hasCoordinate(a.latitude) || !hasCoordinate(a.longitude) || !hasCoordinate(b.latitude) || !hasCoordinate(b.longitude)) {
    return null
  }

  const earthRadiusKm = 6371
  const toRadians = (degrees: number) => degrees * (Math.PI / 180)
  const dLat = toRadians(b.latitude! - a.latitude!)
  const dLon = toRadians(b.longitude! - a.longitude!)
  const lat1 = toRadians(a.latitude!)
  const lat2 = toRadians(b.latitude!)

  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

export function getProximityLabel(viewer: LocationProfile | null | undefined, person: LocationProfile) {
  if (!viewer) return null

  const distance = distanceKm(viewer, person)
  if (distance !== null) {
    if (distance <= 5) return "Very close"
    if (distance <= 15) return "Nearby"
    if (distance <= 50) return "Same area"
  }

  if (sameCity(viewer.current_city, person.current_city)) return "Same city"
  if (sameCountry(viewer.current_country, person.current_country)) return "Same country"

  return null
}
