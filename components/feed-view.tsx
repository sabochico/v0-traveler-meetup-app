"use client"

import { useState } from "react"
import { MapPin, Coffee, Camera, Utensils, Moon, BookOpen, Gamepad2, Map, Loader2, Heart } from "lucide-react"
import { MeetupCard } from "./meetup-card"
import { MoodStatus } from "./mood-status"
import { useMeetups } from "@/hooks/use-meetups"
import { useSavedMeetupsWithDetails } from "@/hooks/use-saved-meetups"
import { useProfile, useUpdateProfile } from "@/hooks/use-profile"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import type { MoodStatus as MoodStatusType, MeetupWithCreator } from "@/lib/types"

const MEETUP_TYPES = [
  { id: "all", label: "All", icon: null },
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "food", label: "Food", icon: Utensils },
  { id: "photo", label: "Photo", icon: Camera },
  { id: "walk", label: "Night Walk", icon: Moon },
  { id: "study", label: "Study", icon: BookOpen },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "explore", label: "Explore", icon: Map },
]

// Mock data for when there's no real data yet
const MOCK_MEETUPS: MeetupWithCreator[] = [
  {
    id: "1",
    creator_id: "mock-1",
    title: "Anyone want to grab coffee in Shibuya?",
    description: null,
    category: "coffee",
    location_name: "Shibuya, Tokyo",
    location: null,
    city: "Tokyo",
    country: "Japan",
    max_attendees: 4,
    starts_at: new Date().toISOString(),
    ends_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator: {
      id: "mock-1",
      display_name: "Mika",
      bio: null,
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
      interests: [],
      languages: ["日本語", "English"],
      mood: "exploring",
      travel_mode: true,
      is_online: true,
      anonymous_mode: false,
      current_city: "Tokyo",
      current_country: "Japan",
      location: null,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: "2",
    creator_id: "mock-2",
    title: "Working remotely in Seoul today, looking for cafe company",
    description: null,
    category: "coffee",
    location_name: "Hongdae, Seoul",
    location: null,
    city: "Seoul",
    country: "South Korea",
    max_attendees: 4,
    starts_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    ends_at: null,
    is_active: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    creator: {
      id: "mock-2",
      display_name: "Leo",
      bio: null,
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
      interests: [],
      languages: ["English", "한국어"],
      mood: "working",
      travel_mode: true,
      is_online: false,
      anonymous_mode: false,
      current_city: "Seoul",
      current_country: "South Korea",
      location: null,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: "3",
    creator_id: "mock-3",
    title: "First week in Taipei, want to explore night markets!",
    description: null,
    category: "food",
    location_name: "Ximending, Taipei",
    location: null,
    city: "Taipei",
    country: "Taiwan",
    max_attendees: 4,
    starts_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    ends_at: null,
    is_active: true,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    creator: {
      id: "mock-3",
      display_name: "Sofia",
      bio: null,
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
      interests: [],
      languages: ["Español", "English", "中文"],
      mood: "social",
      travel_mode: true,
      is_online: true,
      anonymous_mode: false,
      current_city: "Taipei",
      current_country: "Taiwan",
      location: null,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: "4",
    creator_id: "mock-4",
    title: "Late night photography walk through Shinjuku",
    description: null,
    category: "photo",
    location_name: "Shinjuku, Tokyo",
    location: null,
    city: "Tokyo",
    country: "Japan",
    max_attendees: 4,
    starts_at: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    ends_at: null,
    is_active: true,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    creator: {
      id: "mock-4",
      display_name: "Kai",
      bio: null,
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
      interests: [],
      languages: ["English", "日本語"],
      mood: "homesick",
      travel_mode: true,
      is_online: false,
      anonymous_mode: false,
      current_city: "Tokyo",
      current_country: "Japan",
      location: null,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
]

export function FeedView() {
  const [selectedType, setSelectedType] = useState("all")
  const [activeTab, setActiveTab] = useState<"feed" | "saved">("feed")
  const { meetups, isLoading } = useMeetups()
  const { savedMeetups, isLoading: savedLoading } = useSavedMeetupsWithDetails()
  const { profile } = useProfile()
  const { updateMood } = useUpdateProfile()
  const { isAuthenticated } = useAuth()
  
  const currentMood = (profile?.mood as MoodStatusType) ?? "exploring"

  const handleMoodChange = async (mood: MoodStatusType) => {
    if (isAuthenticated) {
      await updateMood(mood)
    }
  }

  // Use mock data if no real meetups exist yet
  const displayMeetups = meetups.length > 0 ? meetups : MOCK_MEETUPS

  const filteredMeetups = selectedType === "all" 
    ? displayMeetups 
    : displayMeetups.filter(m => m.category === selectedType)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-serif font-semibold tracking-tight">drift</h1>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>{profile?.current_city ?? "Tokyo"}, {profile?.current_country ?? "Japan"}</span>
              </div>
            </div>
            <MoodStatus currentMood={currentMood} onMoodChange={handleMoodChange} />
          </div>

          {/* Tabs: Feed / Saved */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setActiveTab("feed")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === "feed"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Feed
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === "saved"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <Heart className="w-3.5 h-3.5" />
              Saved
            </button>
          </div>

          {/* Type Filter - only show for feed tab */}
          {activeTab === "feed" && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {MEETUP_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all duration-300",
                  selectedType === type.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {type.icon && <type.icon className="w-3.5 h-3.5" />}
                {type.label}
              </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Feed */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {activeTab === "feed" ? (
          // Feed tab content
          isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredMeetups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No meetups yet. Be the first to create one!</p>
            </div>
          ) : (
            filteredMeetups.map((meetup) => (
              <MeetupCard key={meetup.id} meetup={meetup} />
            ))
          )
        ) : (
          // Saved tab content
          savedLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : savedMeetups.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No saved meetups yet.</p>
              <p className="text-sm text-muted-foreground/70">Tap the heart on meetups to save them here.</p>
            </div>
          ) : (
            savedMeetups.map((meetup) => (
              <MeetupCard key={meetup.id} meetup={meetup as MeetupWithCreator} />
            ))
          )
        )}
      </div>
    </div>
  )
}
