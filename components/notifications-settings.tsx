"use client"

import { useEffect, useState } from "react"
import { X, Bell, MessageCircle, Heart, Users, MapPin, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProfile, useUpdateProfile } from "@/hooks/use-profile"
import { DEFAULT_NOTIFICATION_PREFERENCES, normalizeNotificationPreferences, type NotificationPreferences } from "@/lib/notification-preferences"
import type { Profile } from "@/lib/types"

interface NotificationsSettingsProps {
  isOpen: boolean
  onClose: () => void
}

interface NotificationSetting {
  id: keyof NotificationPreferences
  label: string
  description: string
  icon: typeof Bell
}

export function NotificationsSettings({ isOpen, onClose }: NotificationsSettingsProps) {
  const { profile } = useProfile({ enabled: isOpen })
  const { updateProfile } = useUpdateProfile()
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES)
  const [savingId, setSavingId] = useState<keyof NotificationPreferences | null>(null)

  useEffect(() => {
    if (isOpen) {
      setPreferences(normalizeNotificationPreferences(profile?.notification_preferences))
    }
  }, [isOpen, profile?.notification_preferences])

  const settings: NotificationSetting[] = [
    {
      id: "messages",
      label: "Messages",
      description: "When someone sends you a message",
      icon: MessageCircle,
    },
    {
      id: "meetup_requests",
      label: "Meetup Requests",
      description: "When someone wants to join your meetup",
      icon: Users,
    },
    {
      id: "likes",
      label: "Likes",
      description: "When someone likes your meetup",
      icon: Heart,
    },
    {
      id: "nearby",
      label: "Nearby Travelers",
      description: "When new travelers are in your area",
      icon: MapPin,
    },
    {
      id: "sounds",
      label: "Sounds",
      description: "Play sound for notifications",
      icon: Volume2,
    },
  ]

  const togglePreference = async (id: keyof NotificationPreferences) => {
    const next = { ...preferences, [id]: !preferences[id] }
    setPreferences(next)
    setSavingId(id)
    try {
      await updateProfile({ notification_preferences: next } as Partial<Profile>)
    } catch (error) {
      setPreferences(preferences)
      console.error("Failed to update notification preference:", error)
    } finally {
      setSavingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="px-2 pb-2">
            <p className="text-sm text-muted-foreground">
              Choose which Drift updates you want to see.
            </p>
          </div>

          {settings.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <setting.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{setting.label}</p>
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={() => togglePreference(setting.id)}
                disabled={savingId !== null}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors disabled:opacity-70",
                  preferences[setting.id] ? "bg-primary" : "bg-muted"
                )}
                aria-label={`${preferences[setting.id] ? "Disable" : "Enable"} ${setting.label} notifications`}
                aria-pressed={preferences[setting.id]}
              >
                <div
                  className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                    preferences[setting.id] ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:glow-amber transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
