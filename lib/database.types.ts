export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          interests: string[]
          languages: string[]
          mood: string
          travel_mode: boolean
          is_online: boolean
          anonymous_mode: boolean
          current_city: string | null
          current_region: string | null
          current_country: string | null
          location: unknown | null
          latitude: number | null
          longitude: number | null
          location_source: string | null
          location_updated_at: string | null
          instagram_handle: string | null
          last_seen_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          interests?: string[]
          languages?: string[]
          mood?: string
          travel_mode?: boolean
          is_online?: boolean
          anonymous_mode?: boolean
          current_city?: string | null
          current_region?: string | null
          current_country?: string | null
          location?: unknown | null
          latitude?: number | null
          longitude?: number | null
          location_source?: string | null
          location_updated_at?: string | null
          instagram_handle?: string | null
          last_seen_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          interests?: string[]
          languages?: string[]
          mood?: string
          travel_mode?: boolean
          is_online?: boolean
          anonymous_mode?: boolean
          current_city?: string | null
          current_region?: string | null
          current_country?: string | null
          location?: unknown | null
          latitude?: number | null
          longitude?: number | null
          location_source?: string | null
          location_updated_at?: string | null
          instagram_handle?: string | null
          last_seen_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      meetups: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          category: string
          cover_image_url: string | null
          location_name: string | null
          location: unknown | null
          city: string | null
          region: string | null
          country: string | null
          latitude: number | null
          longitude: number | null
          max_attendees: number
          starts_at: string
          ends_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          category?: string
          cover_image_url?: string | null
          location_name?: string | null
          location?: unknown | null
          city?: string | null
          region?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          max_attendees?: number
          starts_at: string
          ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string | null
          category?: string
          cover_image_url?: string | null
          location_name?: string | null
          location?: unknown | null
          city?: string | null
          region?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          max_attendees?: number
          starts_at?: string
          ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      meetup_attendees: {
        Row: {
          id: string
          meetup_id: string
          user_id: string
          status: string
          joined_at: string
        }
        Insert: {
          id?: string
          meetup_id: string
          user_id: string
          status?: string
          joined_at?: string
        }
        Update: {
          id?: string
          meetup_id?: string
          user_id?: string
          status?: string
          joined_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
          last_read_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
          last_read_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
          last_read_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string
          read: boolean
          related_user_id: string | null
          related_meetup_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body: string
          read?: boolean
          related_user_id?: string | null
          related_meetup_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string
          read?: boolean
          related_user_id?: string | null
          related_meetup_id?: string | null
          created_at?: string
        }
      }
      user_blocks: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
      }
      user_reports: {
        Row: {
          id: string
          reporter_id: string
          reported_id: string
          reason: string
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_id: string
          reason: string
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_id?: string
          reason?: string
          details?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
