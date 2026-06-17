import type { Profile } from "@/lib/types"
import { getProfileCompletionScore, isProfileComplete } from "@/lib/profile-completion"

const PROFILE_CACHE_KEY = "drift-profile-cache-v1"

type CachedProfile = Pick<
  Profile,
  | "id"
  | "display_name"
  | "bio"
  | "avatar_url"
  | "profile_photos"
  | "interests"
  | "languages"
  | "mood"
  | "travel_mode"
  | "current_city"
  | "current_region"
  | "current_country"
  | "location"
  | "instagram_handle"
  | "notification_preferences"
> & {
  completion_score: number
  is_complete: boolean
  cached_at: string
}

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window
}

export function getCachedProfile(userId?: string | null): CachedProfile | null {
  if (!userId || !canUseStorage()) return null

  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as CachedProfile
    return cached.id === userId ? cached : null
  } catch {
    return null
  }
}

export function setCachedProfile(profile: Profile | null) {
  if (!profile || !canUseStorage()) return

  const cached: CachedProfile = {
    id: profile.id,
    display_name: profile.display_name,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    profile_photos: profile.profile_photos ?? [],
    interests: profile.interests ?? [],
    languages: profile.languages ?? [],
    mood: profile.mood,
    travel_mode: profile.travel_mode,
    current_city: profile.current_city,
    current_region: profile.current_region,
    current_country: profile.current_country,
    location: profile.location,
    instagram_handle: profile.instagram_handle,
    notification_preferences: profile.notification_preferences,
    completion_score: getProfileCompletionScore(profile),
    is_complete: isProfileComplete(profile),
    cached_at: new Date().toISOString(),
  }

  window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cached))
}

export function clearCachedProfile() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(PROFILE_CACHE_KEY)
}
