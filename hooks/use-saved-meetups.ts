import useSWR, { mutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import { isMeetupDiscoverable } from "@/lib/meetup-lifecycle"
import type { MeetupWithCreator } from "@/lib/types"

const supabase = createClient()
const SWR_OPTIONS = { keepPreviousData: true }

interface FetchOptions {
  enabled?: boolean
}

interface UserMeetupRow {
  meetup_id: string
  status: string
}

interface MeetupIdRow {
  meetup_id: string
}

type SavedMeetupDetailRow = {
  created_at: string
  meetups: (Omit<MeetupWithCreator, "creator"> & { profiles?: Partial<MeetupWithCreator["creator"]> | null }) | null
}

// Fetch user's saved meetup IDs
export function useSavedMeetups(options: FetchOptions = {}) {
  const enabled = options.enabled ?? true
  const { data, error, isLoading } = useSWR<string[]>(enabled ? "saved-meetups" : null, async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from("saved_meetups")
      .select("meetup_id")
      .eq("user_id", user.id)

    if (error) throw error
    return ((data ?? []) as MeetupIdRow[]).map(s => s.meetup_id)
  }, SWR_OPTIONS)

  return {
    savedMeetupIds: data || [],
    isLoading,
    error,
  }
}

// Save/unsave a meetup
export function useSaveMeetup() {
  const saveMeetup = async (meetupId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase
      .from("saved_meetups")
      .insert([{ user_id: user.id, meetup_id: meetupId }] as never[])

    if (error) throw error

    // Revalidate saved meetups
    mutate("saved-meetups")
  }

  const unsaveMeetup = async (meetupId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase
      .from("saved_meetups")
      .delete()
      .eq("user_id", user.id)
      .eq("meetup_id", meetupId)

    if (error) throw error

    // Revalidate saved meetups
    mutate("saved-meetups")
  }

  return { saveMeetup, unsaveMeetup }
}

// Fetch saved meetups with full details
export function useSavedMeetupsWithDetails(options: FetchOptions = {}) {
  const enabled = options.enabled ?? true
  const { data, error, isLoading } = useSWR<MeetupWithCreator[]>(enabled ? "saved-meetups-details" : null, async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: savedMeetups, error: savedError } = await supabase
      .from("saved_meetups")
      .select(`
        meetup_id,
        created_at,
        meetups (
          id,
          title,
          description,
          category,
          cover_image_url,
          location_name,
          city,
          country,
          starts_at,
          ends_at,
          max_attendees,
          is_active,
          creator_id,
          profiles:creator_id (
            id,
            display_name,
            avatar_url,
            mood
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (savedError) throw savedError
    
    // Transform the data — rename profiles→creator to match MeetupWithCreator type
    const transformed = ((savedMeetups ?? []) as SavedMeetupDetailRow[]).map(s => {
      const meetup = s.meetups
      if (!meetup) return null
      const { profiles, ...meetupFields } = meetup
      return {
        ...meetupFields,
        creator: {
          bio: null,
          interests: [],
          languages: [],
          travel_mode: false,
          is_online: false,
          anonymous_mode: false,
          current_city: null,
          current_country: null,
          location: null,
          instagram_handle: null,
          last_active_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...profiles,
        } as MeetupWithCreator["creator"],
      }
    }).filter((meetup): meetup is MeetupWithCreator => Boolean(meetup)).filter(isMeetupDiscoverable)

    return transformed as MeetupWithCreator[]
  }, SWR_OPTIONS)

  return {
    savedMeetups: data ?? [],
    isLoading,
    error,
  }
}

// Join a meetup
export function useJoinMeetup() {
  const joinMeetup = async (meetupId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase
      .from("meetup_attendees")
      .insert([{ 
        meetup_id: meetupId, 
        user_id: user.id,
        status: "confirmed"
      }] as never[])

    if (error) {
      if (error.code === "23505") {
        throw new Error("You've already joined this meetup")
      }
      throw error
    }

    mutate("meetups")
    mutate("user-meetups")
  }

  const leaveMeetup = async (meetupId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase
      .from("meetup_attendees")
      .delete()
      .eq("meetup_id", meetupId)
      .eq("user_id", user.id)

    if (error) throw error

    mutate("meetups")
    mutate("user-meetups")
  }

  return { joinMeetup, leaveMeetup }
}

// Check if user has joined a meetup
export function useUserMeetups(options: FetchOptions = {}) {
  const enabled = options.enabled ?? true
  const { data, error, isLoading } = useSWR<UserMeetupRow[]>(enabled ? "user-meetups" : null, async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from("meetup_attendees")
      .select("meetup_id, status")
      .eq("user_id", user.id)

    if (error) throw error
    return data || []
  }, SWR_OPTIONS)

  return {
    joinedMeetups: data || [],
    isLoading,
    error,
  }
}
