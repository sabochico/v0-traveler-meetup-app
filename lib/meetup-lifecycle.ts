import type { Meetup } from "@/lib/types"

export type MeetupLifecycleStatus = "active" | "ending_soon" | "ended"

const GRACE_PERIOD_MS = 2 * 60 * 60 * 1000
const ENDING_SOON_MS = 2 * 60 * 60 * 1000

function endOfLocalDay(date: Date) {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return end
}

export function getMeetupEndTime(meetup: Pick<Meetup, "starts_at" | "ends_at">) {
  const explicitEnd = meetup.ends_at ? new Date(meetup.ends_at) : null
  if (explicitEnd && !Number.isNaN(explicitEnd.getTime())) return explicitEnd

  const start = new Date(meetup.starts_at)
  if (Number.isNaN(start.getTime())) return null

  return endOfLocalDay(start)
}

export function getMeetupLifecycleStatus(
  meetup: Pick<Meetup, "starts_at" | "ends_at" | "is_active">,
  now = new Date()
): MeetupLifecycleStatus {
  if (!meetup.is_active) return "ended"

  const endTime = getMeetupEndTime(meetup)
  if (!endTime) return "ended"

  const expiresAt = endTime.getTime() + GRACE_PERIOD_MS
  const timeRemaining = expiresAt - now.getTime()

  if (timeRemaining <= 0) return "ended"
  if (timeRemaining <= ENDING_SOON_MS) return "ending_soon"

  return "active"
}

export function isMeetupDiscoverable(meetup: Pick<Meetup, "starts_at" | "ends_at" | "is_active">) {
  return getMeetupLifecycleStatus(meetup) !== "ended"
}

export function getMeetupLifecycleLabel(meetup: Pick<Meetup, "starts_at" | "ends_at" | "is_active">) {
  const status = getMeetupLifecycleStatus(meetup)
  if (status === "ending_soon") return "Ending soon"
  if (status === "ended") return "Past activity"
  return null
}

