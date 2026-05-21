import { Database } from "@/lib/database.types"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Meetup = Database["public"]["Tables"]["meetups"]["Row"]
export type MeetupAttendee = Database["public"]["Tables"]["meetup_attendees"]["Row"]
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
export type ConversationParticipant = Database["public"]["Tables"]["conversation_participants"]["Row"]

export type MoodStatus = "social" | "working" | "exploring" | "homesick"
export type MeetupCategory = "coffee" | "food" | "photo" | "walk" | "study" | "gaming" | "explore"

export interface MeetupWithCreator extends Meetup {
  creator: Profile
  attendees?: MeetupAttendee[]
  attendee_count?: number
}

export interface ConversationWithDetails extends Conversation {
  participants: (ConversationParticipant & { profile: Profile })[]
  last_message?: Message
  unread_count?: number
}
