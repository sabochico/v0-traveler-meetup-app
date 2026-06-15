"use client"

import { useEffect, useRef } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
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
  const { data, error, isLoading, mutate } = useSWR(enabled ? "notifications" : null, fetcher)
  const mutateRef = useRef(mutate)

  useEffect(() => {
    mutateRef.current = mutate
  }, [mutate])

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()
    let isActive = true
    let channel: RealtimeChannel | null = null

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isActive || !user) return

      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          () => {
            void mutateRef.current()
          }
        )
        .subscribe()
    })

    return () => {
      isActive = false
      if (channel) {
        void supabase.removeChannel(channel)
      }
    }
  }, [enabled])

  const markAllRead = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("notifications")
      .update({ read: true } as never)
      .eq("user_id", user.id)
      .eq("read", false)

    mutate()
  }

  const notifications = data ?? []
  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, isLoading, error, markAllRead, refresh: mutate }
}
