"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, MapPin, Globe, Loader2, MessageCircle, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MeetupCard } from "./meetup-card"
import { useNearbyProfiles } from "@/hooks/use-profile"
import { useMeetups } from "@/hooks/use-meetups"
import { useCreateConversation } from "@/hooks/use-messages"
import { cn } from "@/lib/utils"
import type { Profile, MoodStatus } from "@/lib/types"

const STATUS_STYLES: Record<MoodStatus, { color: string; label: string }> = {
  social: { color: "bg-emerald-500", label: "Feeling social" },
  working: { color: "bg-amber-500", label: "Working quietly" },
  exploring: { color: "bg-blue-500", label: "Exploring" },
  homesick: { color: "bg-purple-500", label: "Homesick" },
}

const MOCK_PROFILES: Profile[] = [
  {
    id: "mock-1",
    display_name: "Yuki",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    mood: "social",
    bio: "Digital nomad from Berlin. Love finding hidden cafes.",
    languages: ["Deutsch", "English", "日本語"],
    interests: ["Photography", "Coffee", "Vinyl"],
    travel_mode: true,
    is_online: true,
    anonymous_mode: false,
    current_city: "Tokyo",
    current_country: "Japan",
    location: null,
    instagram_handle: null,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    display_name: "Marcus",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    mood: "exploring",
    bio: "Software engineer exploring Asia for 3 months.",
    languages: ["English", "Español"],
    interests: ["Coding", "Ramen", "Night walks"],
    travel_mode: true,
    is_online: false,
    anonymous_mode: false,
    current_city: "Tokyo",
    current_country: "Japan",
    location: null,
    instagram_handle: null,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-3",
    display_name: "Hana",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    mood: "working",
    bio: "Freelance writer. Always looking for quiet study spots.",
    languages: ["한국어", "English"],
    interests: ["Writing", "Tea", "Bookstores"],
    travel_mode: true,
    is_online: true,
    anonymous_mode: false,
    current_city: "Tokyo",
    current_country: "Japan",
    location: null,
    instagram_handle: null,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-4",
    display_name: "Alex",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
    mood: "homesick",
    bio: "Exchange student from Canada. Missing home but loving Tokyo.",
    languages: ["English", "Français"],
    interests: ["Music", "Gaming", "Anime"],
    travel_mode: true,
    is_online: false,
    anonymous_mode: false,
    current_city: "Tokyo",
    current_country: "Japan",
    location: null,
    instagram_handle: null,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

interface DiscoverViewProps {
  onNavigateToMessages?: (conversationId: string) => void
}

export function DiscoverView({ onNavigateToMessages }: DiscoverViewProps) {
  const [activeTab, setActiveTab] = useState<"meetups" | "people">("meetups")
  const [searchQuery, setSearchQuery] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const { profiles, isLoading: profilesLoading } = useNearbyProfiles()
  const { meetups, isLoading: meetupsLoading } = useMeetups()

  const displayProfiles = profiles.length > 0 ? profiles : MOCK_PROFILES
  const isMockData = profiles.length === 0

  // Sort meetups newest first
  const sortedMeetups = [...meetups].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Build unique city list from real meetups
  const cities = Array.from(
    new Set(sortedMeetups.map((m) => m.city).filter(Boolean) as string[])
  ).sort()

  const filteredMeetups =
    cityFilter === "all"
      ? sortedMeetups
      : sortedMeetups.filter((m) => m.city?.toLowerCase() === cityFilter.toLowerCase())

  const filteredProfiles = searchQuery
    ? displayProfiles.filter(
        (p) =>
          p.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.interests.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase())) ||
          p.languages.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : displayProfiles

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          <div>
            <h1 className="text-2xl font-serif font-semibold">Explore</h1>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              <span>Meetups worldwide</span>
            </div>
          </div>

          {/* Meetups / People tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("meetups")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === "meetups"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Meetups
            </button>
            <button
              onClick={() => setActiveTab("people")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === "people"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              People
            </button>
          </div>

          {/* City filter pills — meetups tab */}
          {activeTab === "meetups" && cities.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
              <button
                onClick={() => setCityFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all",
                  cityFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                All cities
              </button>
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setCityFilter(city)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all",
                    cityFilter === city
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  <MapPin className="w-3 h-3" />
                  {city}
                </button>
              ))}
            </div>
          )}

          {/* Search — people tab */}
          {activeTab === "people" && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, interest, or language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary border-0 pl-10 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      {activeTab === "meetups" ? (
        meetupsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredMeetups.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-muted-foreground">
              {cityFilter !== "all"
                ? `No meetups in ${cityFilter} yet.`
                : "No meetups yet worldwide. Be the first to create one!"}
            </p>
            {cityFilter !== "all" && (
              <button
                onClick={() => setCityFilter("all")}
                className="text-sm text-primary hover:underline"
              >
                Show all cities
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
            {filteredMeetups.map((meetup) => (
              <MeetupCard key={meetup.id} meetup={meetup} onNavigateToMessages={onNavigateToMessages} />
            ))}
          </div>
        )
      ) : profilesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          {filteredProfiles.map((person) => (
            <PersonCard key={person.id} person={person} isMock={isMockData} />
          ))}
        </div>
      )}
    </div>
  )
}

function PersonCard({ person, isMock }: { person: Profile; isMock: boolean }) {
  const [messageSent, setMessageSent] = useState(false)
  const [sending, setSending] = useState(false)
  const { startConversation } = useCreateConversation()
  const mood = (person.mood as MoodStatus) ?? "exploring"

  const handleSayHi = async () => {
    if (isMock) {
      setSending(true)
      setTimeout(() => {
        setSending(false)
        setMessageSent(true)
      }, 500)
      return
    }

    try {
      setSending(true)
      await startConversation(person.id)
      setMessageSent(true)
    } catch (error) {
      console.error("Failed to start conversation:", error)
    } finally {
      setSending(false)
    }
  }

  return (
    <article className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300">
      <div className="flex gap-4">
        <Link href={isMock ? "#" : `/profile/${person.id}`} className="relative flex-shrink-0">
          <Avatar className="w-16 h-16 ring-2 ring-primary/20">
            <AvatarImage src={person?.avatar_url ?? undefined} alt={person?.display_name ?? "User"} />
            <AvatarFallback>{(person?.display_name ?? "U")[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card",
              STATUS_STYLES[mood].color
            )}
            title={STATUS_STYLES[mood].label}
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <Link
              href={isMock ? "#" : `/profile/${person.id}`}
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              {person.display_name ?? "Anonymous"}
            </Link>
            <span className="text-xs text-primary">Nearby</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {person.bio ?? "No bio yet"}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {person.interests.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="secondary" className="text-xs">
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {person.languages.slice(0, 3).map((lang, i) => (
            <span key={lang}>
              {lang}
              {i < Math.min(person.languages.length, 3) - 1 && <span className="mx-1">·</span>}
            </span>
          ))}
        </div>
        <button
          onClick={handleSayHi}
          disabled={messageSent || sending}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
            messageSent
              ? "bg-emerald-500/20 text-emerald-400 cursor-default"
              : "bg-primary text-primary-foreground hover:glow-amber"
          )}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : messageSent ? (
            <>
              <Check className="w-4 h-4" />
              <span>Sent</span>
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4" />
              <span>Say hi</span>
            </>
          )}
        </button>
      </div>
    </article>
  )
}
