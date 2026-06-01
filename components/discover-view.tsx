"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, MapPin, Globe, Loader2, MessageCircle, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MeetupCard } from "./meetup-card"
import { useNearbyProfiles } from "@/hooks/use-profile"
import { useMeetups } from "@/hooks/use-meetups"
import { useCreateConversation } from "@/hooks/use-messages"
import { useBlockedUsers } from "@/hooks/use-user-safety"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { Profile, MoodStatus } from "@/lib/types"
import { getProfileCompletionScore } from "@/lib/profile-completion"

const STATUS_STYLES: Record<MoodStatus, { color: string; label: string }> = {
  social: { color: "bg-emerald-500", label: "Feeling social" },
  working: { color: "bg-amber-500", label: "Working quietly" },
  exploring: { color: "bg-blue-500", label: "Exploring" },
  homesick: { color: "bg-purple-500", label: "Homesick" },
}

const SHOW_MOCK_DATA = process.env.NODE_ENV !== "production"

const MOCK_PROFILES: Profile[] = [
  {
    id: "mock-1",
    display_name: "Yuki",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    mood: "social",
    bio: "Digital nomad from Berlin. Love finding hidden cafes.",
    languages: ["Deutsch", "English", "Japanese"],
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
    languages: ["English", "Spanish"],
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
    languages: ["Korean", "English"],
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
    languages: ["English", "French"],
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
  const { blockedUserIdSet } = useBlockedUsers()

  const displayProfiles = useMemo(
    () => profiles.length > 0
      ? profiles.filter((profile) => !blockedUserIdSet.has(profile.id))
      : SHOW_MOCK_DATA ? MOCK_PROFILES : [],
    [blockedUserIdSet, profiles]
  )
  const isMockData = SHOW_MOCK_DATA && profiles.length === 0

  // Sort meetups newest first
  const sortedMeetups = useMemo(
    () => meetups
      .filter((meetup) => !blockedUserIdSet.has(meetup.creator_id))
      .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    [blockedUserIdSet, meetups]
  )

  // Build unique city list from real meetups
  const cities = useMemo(
    () => Array.from(
      new Set(sortedMeetups.map((m) => m.city).filter(Boolean) as string[])
    ).sort(),
    [sortedMeetups]
  )

  const filteredMeetups = useMemo(
    () => cityFilter === "all"
      ? sortedMeetups
      : sortedMeetups.filter((m) => m.city?.toLowerCase() === cityFilter.toLowerCase()),
    [cityFilter, sortedMeetups]
  )

  const filteredProfiles = useMemo(
    () => searchQuery
      ? displayProfiles.filter(
        (p) =>
          p.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.interests.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase())) ||
          p.languages.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      : displayProfiles,
    [displayProfiles, searchQuery]
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-[env(safe-area-inset-top)]">
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

          {/* City filter pills - meetups tab */}
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

          {/* Search - people tab */}
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
          {filteredProfiles.length === 0 ? (
            <div className="rounded-3xl border border-border/60 bg-card/70 p-6 text-center">
              <p className="text-sm font-medium text-foreground">
                {searchQuery ? "No people found" : "No people to show yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery ? "Try another name, interest, or language." : "Invite friends or check back as more people join Drift."}
              </p>
            </div>
          ) : (
            filteredProfiles.map((person) => (
              <PersonCard key={person.id} person={person} isMock={isMockData} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function PersonCard({ person, isMock }: { person: Profile; isMock: boolean }) {
  const [messageSent, setMessageSent] = useState(false)
  const [sending, setSending] = useState(false)
  const { startConversation } = useCreateConversation()
  const { toast } = useToast()

  const mood = (person.mood as MoodStatus) ?? "exploring"
  const moodStyle = STATUS_STYLES[mood] ?? STATUS_STYLES.exploring
  const displayName = person.display_name ?? "Anonymous"
  const initial = displayName[0]?.toUpperCase() ?? "U"

  const isOnline =
    Boolean(person.is_online) ||
    Boolean(
      person.last_seen_at &&
        Date.now() - new Date(person.last_seen_at).getTime() < 2 * 60 * 1000
    )

  const location =
    [person.current_city, person.current_country].filter(Boolean).join(", ") ||
    person.location ||
    "Location not shared"

  const interests = person.interests ?? []
  const languages = person.languages ?? []
  const completionScore = getProfileCompletionScore(person)
  const profileHref = isMock ? "#" : `/profile/${person.id}`

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
      toast({
        title: "Could not start conversation",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <article className="rounded-3xl bg-card border border-border/60 p-4 hover:border-primary/40 transition-all duration-300">
      <Link href={profileHref} className="block">
        <div className="flex gap-4">
          <div className="relative flex-shrink-0">
            <Avatar className="w-20 h-20 ring-2 ring-primary/20">
              <AvatarImage src={person.avatar_url ?? undefined} alt={displayName} />
              <AvatarFallback className="text-xl">{initial}</AvatarFallback>
            </Avatar>

            <span
              className={cn(
                "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-card",
                isOnline ? "bg-emerald-500" : "bg-muted"
              )}
              title={isOnline ? "Online now" : "Offline"}
              aria-label={isOnline ? "Online now" : "Offline"}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-lg text-foreground truncate">
                  {displayName}
                </h3>

                <div
                  className={cn(
                    "inline-flex items-center gap-1 mt-1 text-xs px-2.5 py-1 rounded-full text-white",
                    moodStyle.color
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  {moodStyle.label}
                </div>

                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isOnline ? "bg-emerald-500" : "bg-muted"
                    )}
                  />
                  <span>{isOnline ? "Online now" : "Offline"}</span>
                </div>
              </div>

              <Badge variant="secondary" className="text-xs shrink-0">
                {completionScore}%
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>

        {person.bio && (
          <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
            {person.bio}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {interests.length > 0 && <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
              Interests
            </p>

            <div className="flex flex-wrap gap-1.5">
              {interests.slice(0, 3).map((interest) => (
                <Badge key={interest} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>}

          {languages.length > 0 && <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
              Languages
            </p>

            <div className="flex flex-wrap gap-1.5">
              {languages.slice(0, 3).map((lang) => (
                <Badge key={lang} variant="secondary" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>}
        </div>
      </Link>

      <button
        onClick={handleSayHi}
        disabled={messageSent || sending}
        className={cn(
          "mt-4 w-full h-11 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2",
          messageSent
            ? "bg-emerald-500/20 text-emerald-400 cursor-default"
            : "bg-primary text-primary-foreground hover:opacity-90"
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
            <span>Say Hi</span>
          </>
        )}
      </button>
    </article>
  )
}
