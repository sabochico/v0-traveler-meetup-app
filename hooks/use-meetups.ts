"use client"

import useSWR, { mutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import { MeetupWithCreator } from "@/lib/types"
import { getRandomMeetupCoverImage } from "@/lib/meetup-cover-images"
import { assertFieldsAreSafe, cleanUserText } from "@/lib/text-moderation"
import { getMeetupEndTime, isMeetupDiscoverable } from "@/lib/meetup-lifecycle"

const SWR_OPTIONS = { keepPreviousData: true }
const EXPIRED_MEETUP_QUERY_GRACE_MS = 2 * 60 * 60 * 1000
const NO_END_TIME_LOOKBACK_MS = 48 * 60 * 60 * 1000

const fetcher = async (): Promise<MeetupWithCreator[]> => {
  const supabase = createClient()
  const now = Date.now()
  const explicitEndCutoff = new Date(now - EXPIRED_MEETUP_QUERY_GRACE_MS).toISOString()
  const missingEndCutoff = new Date(now - NO_END_TIME_LOOKBACK_MS).toISOString()
  
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
      region,
      country,
      latitude,
      longitude,
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
    .or(`ends_at.gte.${explicitEndCutoff},and(ends_at.is.null,starts_at.gte.${missingEndCutoff})`)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) throw error
  return (data as MeetupWithCreator[]).filter(isMeetupDiscoverable)
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
    region?: string
    country?: string
    latitude?: number
    longitude?: number
    starts_at: string
    cover_image_url?: string | null
  }) => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    assertFieldsAreSafe(
      [meetup.title, meetup.description, meetup.location_name, meetup.city, meetup.region, meetup.country],
      "meetup"
    )

    const coverImageUrl = meetup.cover_image_url ?? getRandomMeetupCoverImage(meetup.category)
    const safeMeetup = {
      ...meetup,
      title: cleanUserText(meetup.title),
      description: meetup.description ? cleanUserText(meetup.description) : meetup.description,
      location_name: meetup.location_name ? cleanUserText(meetup.location_name) : meetup.location_name,
      city: meetup.city ? cleanUserText(meetup.city) : meetup.city,
      region: meetup.region ? cleanUserText(meetup.region) : meetup.region,
      country: meetup.country ? cleanUserText(meetup.country) : meetup.country,
    }
    const insertPayload = {
      ...safeMeetup,
      creator_id: user.id,
      cover_image_url: coverImageUrl,
    } as Record<string, unknown>

    const { data, error } = await supabase
      .from("meetups" as never)
      .insert([insertPayload] as never[])
      .select()
      .single()

    if (error) throw error

    await refresh()
    return data
  }

  return { createMeetup }
}

export function useDeleteMeetup() {
  const deleteMeetup = async (meetupId: string) => {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) throw new Error("Please sign in to delete this meetup.")

    const response = await fetch(`/api/meetups/${meetupId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.error ?? "Could not delete meetup")
    }

    await Promise.all([
      mutate("meetups"),
      mutate("saved-meetups"),
      mutate("saved-meetups-details"),
      mutate("user-meetups"),
    ])
  }

  return { deleteMeetup }
}

export function usePastMeetupActivity(userId: string | null) {
  const { data, error, isLoading } = useSWR(
    userId ? `past-meetup-activity-${userId}` : null,
    async (): Promise<MeetupWithCreator[]> => {
      const supabase = createClient()
      const selectQuery = `
        id,
        creator_id,
        title,
        description,
        category,
        cover_image_url,
        location_name,
        city,
        region,
        country,
        latitude,
        longitude,
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
      `

      const { data: hosted, error: hostedError } = await supabase
        .from("meetups")
        .select(selectQuery)
        .eq("creator_id", userId!)
        .order("starts_at", { ascending: false })
        .limit(12)

      if (hostedError) throw hostedError

      const { data: joined } = await supabase
        .from("meetup_attendees")
        .select(`meetups (${selectQuery})`)
        .eq("user_id", userId!)
        .order("joined_at", { ascending: false })
        .limit(12)

      const joinedMeetups = ((joined ?? []) as Array<{ meetups: MeetupWithCreator | null }>)
        .map((row) => row.meetups)
        .filter(Boolean) as MeetupWithCreator[]

      const activityById = new Map<string, MeetupWithCreator>()
      ;[...((hosted ?? []) as MeetupWithCreator[]), ...joinedMeetups].forEach((meetup) => {
        if (!isMeetupDiscoverable(meetup)) activityById.set(meetup.id, meetup)
      })

      return Array.from(activityById.values())
        .sort((a, b) => (getMeetupEndTime(b)?.getTime() ?? 0) - (getMeetupEndTime(a)?.getTime() ?? 0))
        .slice(0, 4)
    },
    SWR_OPTIONS
  )

  return {
    pastMeetups: data ?? [],
    isLoading,
    error,
  }
}
