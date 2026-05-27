import useSWR, { mutate } from "swr"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

// Fetch user's saved meetup IDs
export function useSavedMeetups() {
  const { data, error, isLoading } = useSWR("saved-meetups", async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from("saved_meetups")
      .select("meetup_id")
      .eq("user_id", user.id)

    if (error) throw error
    return data?.map(s => s.meetup_id) || []
  })

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
      .insert({ user_id: user.id, meetup_id: meetupId })

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
export function useSavedMeetupsWithDetails() {
  const { data, error, isLoading } = useSWR("saved-meetups-details", async () => {
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
          location_name,
          city,
          country,
          starts_at,
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
    return savedMeetups?.map(s => {
      const meetup = s.meetups as any
      if (!meetup) return null
      const { profiles, ...meetupFields } = meetup
      return {
        ...meetupFields,
        saved_at: s.created_at,
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
          last_seen_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...profiles,
        },
      }
    }).filter(Boolean) || []
  })

  return {
    savedMeetups: data || [],
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
      .insert({ 
        meetup_id: meetupId, 
        user_id: user.id,
        status: "confirmed"
      })

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
export function useUserMeetups() {
  const { data, error, isLoading } = useSWR("user-meetups", async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from("meetup_attendees")
      .select("meetup_id, status")
      .eq("user_id", user.id)

    if (error) throw error
    return data || []
  })

  return {
    joinedMeetups: data || [],
    isLoading,
    error,
  }
}
