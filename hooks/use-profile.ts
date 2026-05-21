"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Profile, MoodStatus } from "@/lib/types"

const fetcher = async (): Promise<Profile | null> => {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) throw error
  return data
}

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR("profile", fetcher)

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

// Fetch nearby profiles
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
  return data
}

export function useNearbyProfiles() {
  const { data, error, isLoading, mutate } = useSWR("nearby-profiles", nearbyFetcher)

  return {
    profiles: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}
