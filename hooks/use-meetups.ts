"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { MeetupWithCreator } from "@/lib/types"
import { getRandomMeetupCoverImage } from "@/lib/meetup-cover-images"

const SWR_OPTIONS = { keepPreviousData: true }

const fetcher = async (): Promise<MeetupWithCreator[]> => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("meetups")
    .select(`
      id,
      creator_id,
      title,
      description,
      category,
      cover_image_url,
      location_name,
      location,
      city,
      country,
      max_attendees,
      starts_at,
      ends_at,
      is_active,
      created_at,
      updated_at,
      creator:profiles!creator_id(
        id,
        display_name,
        avatar_url,
        mood,
        languages
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) throw error
  return data as MeetupWithCreator[]
}

export function useMeetups() {
  const { data, error, isLoading, mutate } = useSWR("meetups", fetcher, SWR_OPTIONS)

  return {
    meetups: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useCreateMeetup() {
  const { refresh } = useMeetups()

  const createMeetup = async (meetup: {
    title: string
    description?: string
    category: string
    location_name?: string
    city?: string
    country?: string
    starts_at: string
  }) => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const coverImageUrl = getRandomMeetupCoverImage(meetup.category)

    const { data, error } = await supabase
      .from("meetups")
      .insert({
        ...meetup,
        creator_id: user.id,
        cover_image_url: coverImageUrl,
      })
      .select()
      .single()

    if (error) throw error

    await refresh()
    return data
  }

  return { createMeetup }
}
