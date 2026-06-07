"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Profile, MoodStatus } from "@/lib/types"
import { getCachedProfile, setCachedProfile } from "@/lib/profile-cache"
import { getPresenceStatus } from "@/lib/presence"

const SWR_OPTIONS = { keepPreviousData: true }

const createFallbackProfile = (id: string): Profile => {
  const now = new Date().toISOString()
  return {
    id,
    display_name: null,
    bio: null,
    avatar_url: null,
    profile_photos: [],
    interests: [],
    languages: [],
    mood: "social",
    travel_mode: false,
    is_online: true,
    anonymous_mode: false,
    current_city: null,
    current_region: null,
    current_country: null,
    location: null,
    latitude: null,
    longitude: null,
    location_source: null,
    location_updated_at: null,
    instagram_handle: null,
    last_active_at: now,
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
    is_online: getPresenceStatus(data).state === "online",
  }
}

interface UseProfileOptions {
  enabled?: boolean
  userId?: string | null
}

export function useProfile(options: UseProfileOptions = {}) {
  const enabled = options.enabled ?? true
  const key = enabled ? "profile" : null
  const cachedProfile = getCachedProfile(options.userId)
  const fallbackData = cachedProfile
    ? {
      ...createFallbackProfile(cachedProfile.id),
      ...cachedProfile,
      is_online: false,
      anonymous_mode: false,
      latitude: null,
      longitude: null,
      location_source: null,
      location_updated_at: null,
      created_at: cachedProfile.cached_at,
      updated_at: cachedProfile.cached_at,
    } satisfies Profile
    : undefined
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    ...SWR_OPTIONS,
    fallbackData,
    onSuccess: setCachedProfile,
  })

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
    return updateProfile({
      current_city: city,
      current_country: country,
      location_source: "manual",
      location_updated_at: new Date().toISOString(),
    })
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
        is_online: getPresenceStatus(profile).state === "online",
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
    is_online: getPresenceStatus(profile).state === "online",
  }))
}

export function useNearbyProfiles(options: UseProfileOptions = {}) {
  const enabled = options.enabled ?? true
  const { data, error, isLoading, mutate } = useSWR(enabled ? "nearby-profiles" : null, nearbyFetcher, SWR_OPTIONS)

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel("profiles:presence")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => {
          void mutate()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, mutate])

  return {
    profiles: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}
