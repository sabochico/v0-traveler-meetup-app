import type { Profile } from "@/lib/types"

export const MIN_BIO_LENGTH = 20
export const MIN_INTERESTS = 3

export function getProfileCompletionScore(profile: Profile | null | undefined): number {
  if (!profile) return 0

  let score = 0
  if (profile.display_name?.trim()) score += 10
  if ((profile.profile_photos?.length ?? 0) >= 2) score += 20
  if ((profile.bio?.trim().length ?? 0) >= MIN_BIO_LENGTH) score += 20
  if (profile.current_city?.trim() && profile.current_country?.trim()) score += 15
  if ((profile.interests?.length ?? 0) >= MIN_INTERESTS) score += 15
  if ((profile.languages?.length ?? 0) > 0) score += 10
  if (profile.instagram_handle?.trim()) score += 10
  return score
}

export function isProfileComplete(profile: Profile | null | undefined): boolean {
  return getProfileCompletionScore(profile) >= 100
}

export function getNextProfileRequirement(profile: Profile | null | undefined): string {
  if (!profile?.display_name?.trim()) return "Add your display name"
  if ((profile.profile_photos?.length ?? 0) < 2) return "Add at least 2 profile photos"
  if ((profile.bio?.trim().length ?? 0) < MIN_BIO_LENGTH) return "Write a short bio"
  if (!profile.current_city?.trim() || !profile.current_country?.trim()) return "Add your location"
  if ((profile.interests?.length ?? 0) < MIN_INTERESTS) return "Add at least 3 interests"
  if ((profile.languages?.length ?? 0) === 0) return "Add a language"
  if (!profile.instagram_handle?.trim()) return "Connect Instagram"
  return "Profile complete"
}
