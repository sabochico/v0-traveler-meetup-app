export type PresenceState = "online" | "recent" | "offline"

const ONLINE_WINDOW_MS = 90 * 1000
const RECENT_WINDOW_MS = 15 * 60 * 1000

export function getPresenceStatus(profile?: {
  last_active_at?: string | null
  last_seen_at?: string | null
} | null): { state: PresenceState; label: string | null; activeAt: string | null } {
  const activeAt = profile?.last_active_at ?? profile?.last_seen_at ?? null
  if (!activeAt) return { state: "offline", label: null, activeAt: null }

  const diffMs = Date.now() - new Date(activeAt).getTime()
  if (diffMs < ONLINE_WINDOW_MS) return { state: "online", label: "Online Now", activeAt }
  if (diffMs < RECENT_WINDOW_MS) return { state: "recent", label: "Recently Active", activeAt }

  return { state: "offline", label: null, activeAt }
}

export function isPresenceVisible(profile?: {
  last_active_at?: string | null
  last_seen_at?: string | null
} | null) {
  return getPresenceStatus(profile).state !== "offline"
}
