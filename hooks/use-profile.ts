"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Profile, MoodStatus } from "@/lib/types"

const ONLINE_WINDOW_MS = 2 * 60 * 1000
const SWR_OPTIONS = { keepPreviousData: true }

const isRecentlySeen = (lastSeenAt?: string | null) => {
  if (!lastSeenAt) return false
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS
}

const createFallbackProfile = (id: string): Profile => {
  const now = new Date().toISOString()
  return {
    id,
    display_name: null,
    bio: null,
    avatar_url: null,
    interests: [],
    languages: [],
    mood: "social",
    travel_mode: false,
    is_online: isRecentlySeen(now),
    anonymous_mode: false,
    current_city: null,
    current_country: null,
    location: null,
    instagram_handle: null,
    last_seen_at: now,
    created_at: now,
    updated_at: now,
  }
}

const fetcher = async (): Promise<Profile | null> => {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (error) throw error

  if (!data) return createFallbackProfile(user.id)

  return {
    ...data,
    is_online: data.is_online || isRecentlySeen(data.last_seen_at),
  }
}

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR("profile", fetcher, SWR_OPTIONS)

  useEffect(() => {
    const supabase = createClient()
    let intervalId: ReturnType<typeof setInterval> | null = null

    const updatePresence = async (isOnline: boolean) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from("profiles")
        .update({
          is_online: isOnline,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
    }

    updatePresence(true)

    intervalId = setInterval(() => {
      updatePresence(true)
    }, 30000)

    const handleBeforeUnload = () => {
      updatePresence(false)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      if (intervalId) clearInterval(intervalId)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      updatePresence(false)
    }
  }, [])

  return {
    profile: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useUpdateProfile() {
  const { refresh } = useProfile()

  const updateProfile = async (updates: Partial<Profile>) => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) throw error

    await refresh()
    return data
  }

  const updateMood = async (mood: MoodStatus) => {
    return updateProfile({ mood })
  }

  const updateLocation = async (city: string, country: string) => {
    return updateProfile({ current_city: city, current_country: country })
  }

  const toggleTravelMode = async (enabled: boolean) => {
    return updateProfile({ travel_mode: enabled })
  }

  const toggleAnonymousMode = async (enabled: boolean) => {
    return updateProfile({ anonymous_mode: enabled })
  }

  return { updateProfile, updateMood, updateLocation, toggleTravelMode, toggleAnonymousMode }
}

const supabase = createClient()

export function usePublicProfile(userId: string | null) {
  const { data, error, isLoading } = useSWR(
    userId ? `public-profile-${userId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle()

      if (error) return null

      const profile = data ?? createFallbackProfile(userId!)

      return {
        ...profile,
        is_online: profile.is_online || isRecentlySeen(profile.last_seen_at),
      } as Profile
    },
    SWR_OPTIONS
  )

  return { profile: data ?? null, isLoading, error }
}

const nearbyFetcher = async (): Promise<Profile[]> => {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", user.id)
    .eq("anonymous_mode", false)
    .eq("travel_mode", true)
    .order("last_seen_at", { ascending: false })
    .limit(20)

  if (error) throw error

  return (data ?? []).map((profile) => ({
    ...profile,
    is_online: profile.is_online || isRecentlySeen(profile.last_seen_at),
  }))
}

export function useNearbyProfiles() {
  const { data, error, isLoading, mutate } = useSWR("nearby-profiles", nearbyFetcher, SWR_OPTIONS)

  return {
    profiles: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}
