export interface NotificationPreferences {
  messages: boolean
  meetup_requests: boolean
  likes: boolean
  nearby: boolean
  sounds: boolean
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  messages: true,
  meetup_requests: true,
  likes: false,
  nearby: true,
  sounds: true,
}

export function normalizeNotificationPreferences(value: unknown): NotificationPreferences {
  const stored = value && typeof value === "object" ? value as Partial<NotificationPreferences> : {}
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...stored,
  }
}
