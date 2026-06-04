"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/lib/types"

const fetcher = async (): Promise<Notification[]> => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      related_user:profiles!related_user_id(display_name, avatar_url)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30)

  if (error) throw error
  return (data ?? []) as Notification[]
}

interface UseNotificationsOptions {
  enabled?: boolean
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const enabled = options.enabled ?? true
  const { data, error, isLoading, mutate } = useSWR(enabled ? "notifications" : null, fetcher, {
    refreshInterval: 30_000,
  })

  const markAllRead = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)

    mutate()
  }

  const notifications = data ?? []
  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, isLoading, error, markAllRead, refresh: mutate }
}
