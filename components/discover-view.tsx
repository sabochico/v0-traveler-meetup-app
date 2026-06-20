"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, MapPin, Globe, Loader2, MessageCircle, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { MeetupCard } from "./meetup-card"
import { CategorySelector, type CategorySelectorOption } from "./category-selector"
import { useNearbyProfiles } from "@/hooks/use-profile"
import { useMeetups } from "@/hooks/use-meetups"
import { useCreateConversation } from "@/hooks/use-messages"
import { useBlockedUsers } from "@/hooks/use-user-safety"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { Profile, MoodStatus } from "@/lib/types"
import { getProfileCompletionScore } from "@/lib/profile-completion"
import { getPresenceStatus } from "@/lib/presence"
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notification-preferences"

const STATUS_STYLES: Record<MoodStatus, { color: string; label: string }> = {
  social: { color: "bg-emerald-500", label: "Feeling social" },
  working: { color: "bg-amber-500", label: "Working quietly" },
  exploring: { color: "bg-blue-500", label: "Exploring" },
  homesick: { color: "bg-purple-500", label: "Homesick" },
}

const SHOW_MOCK_DATA = process.env.NEXT_PUBLIC_SHOW_MOCK_DATA === "true"
const ALL_CITIES_FILTER = "all"

function normalizeCity(city: string | null | undefined) {
  return (city ?? "").trim().toLowerCase()
}

const MOCK_PROFILE_META = {
  notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
  profile_photos: [],
  current_region: null,
  latitude: null,
  longitude: null,
  location_source: null,
  location_updated_at: null,
}

const MOCK_PROFILES: Profile[] = [
  {
    ...MOCK_PROFILE_META,
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
    last_active_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    ...MOCK_PROFILE_META,
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
    last_active_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    ...MOCK_PROFILE_META,
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
    last_active_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    ...MOCK_PROFILE_META,
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
    last_active_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
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
  const [cityFilter, setCityFilter] = useState(ALL_CITIES_FILTER)
  const { profiles, isLoading: profilesLoading } = useNearbyProfiles({ enabled: activeTab === "people" })
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
    () => {
      const cityByKey = new Map<string, string>()
      sortedMeetups.forEach((meetup) => {
        const city = meetup.city?.trim()
        const key = normalizeCity(city)
        if (city && key && !cityByKey.has(key)) {
          cityByKey.set(key, city)
        }
      })
      return Array.from(cityByKey.values()).sort()
    },
    [sortedMeetups]
  )
  const cityKeySignature = useMemo(
    () => cities.map((city) => normalizeCity(city)).join("|"),
    [cities]
  )
  const discoverTabs = useMemo<CategorySelectorOption[]>(
    () => [
      { id: "meetups", label: "Meetups" },
      { id: "people", label: "People" },
    ],
    []
  )
  const cityOptions = useMemo<CategorySelectorOption[]>(
    () => [
      { id: ALL_CITIES_FILTER, label: "All cities" },
      ...cities.map((city) => ({
        id: city,
        label: city,
        icon: <MapPin className="h-3.5 w-3.5" />,
      })),
    ],
    [cities]
  )

  useEffect(() => {
    if (meetupsLoading || cityFilter === ALL_CITIES_FILTER || cities.length === 0) return

    const selectedCity = normalizeCity(cityFilter)
    const availableCityKeys = cityKeySignature ? cityKeySignature.split("|") : []
    if (selectedCity && !availableCityKeys.includes(selectedCity)) {
      setCityFilter((currentCityFilter) =>
        currentCityFilter !== ALL_CITIES_FILTER ? ALL_CITIES_FILTER : currentCityFilter
      )
    }
  }, [cities.length, cityFilter, cityKeySignature, meetupsLoading])

  const activeCityFilter =
    cityFilter === ALL_CITIES_FILTER || cityKeySignature.split("|").includes(normalizeCity(cityFilter))
      ? cityFilter
      : ALL_CITIES_FILTER

  const filteredMeetups = useMemo(
    () => {
      const query = searchQuery.trim().toLowerCase()
      const selectedCity = normalizeCity(activeCityFilter)
      const byCity = activeCityFilter === ALL_CITIES_FILTER
        ? sortedMeetups
        : sortedMeetups.filter((m) => normalizeCity(m.city) === selectedCity)

      if (!query) return byCity

      return byCity.filter((m) =>
        [
          m.title,
          m.description,
          m.category,
          m.city,
          m.country,
          m.location_name,
        ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
      )
    },
    [activeCityFilter, searchQuery, sortedMeetups]
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
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/86 pt-[var(--drift-safe-top)] shadow-[0_10px_30px_rgb(0_0_0_/_0.16)] backdrop-blur-2xl">
        <div className="max-w-lg mx-auto px-4 py-3.5 space-y-3">
          <div>
            <h1 className="text-2xl font-serif font-semibold">Explore</h1>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              <span>Meetups worldwide</span>
            </div>
          </div>

          {/* Meetups / People tabs */}
          <CategorySelector
            value={activeTab}
            options={discoverTabs}
            onChange={(tab) => setActiveTab(tab as "meetups" | "people")}
            ariaLabel="Discover sections"
            storageKey="drift-discover-section"
            fullWidthItems
          />

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={activeTab === "meetups" ? "Search meetups, cities, or plans..." : "Search by name, interest, or language..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-2xl border border-white/[0.06] bg-white/[0.06] pl-10 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* City filter pills - meetups tab */}
          {activeTab === "meetups" && cities.length > 0 && (
            <CategorySelector
              value={activeCityFilter}
              options={cityOptions}
              onChange={setCityFilter}
              ariaLabel="Meetup city filters"
              storageKey="drift-discover-city-filter"
              className="-mx-4 rounded-none border-x-0 border-y-white/[0.08] bg-transparent px-4 py-1.5 shadow-none backdrop-blur-none"
            />
          )}

        </div>
      </header>

      {/* Content */}
      {activeTab === "meetups" ? (
        meetupsLoading ? (
          <MeetupFeedSkeleton />
        ) : filteredMeetups.length === 0 ? (
          <Empty className="mx-4 my-8 rounded-3xl border border-border/60 bg-card/70 px-6 py-14 pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="h-14 w-14 rounded-2xl bg-primary/10 text-primary">
                <Globe className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No meetups found</EmptyTitle>
              <EmptyDescription className="max-w-xs">
              {searchQuery
                ? "No meetups match your search."
                : activeCityFilter !== ALL_CITIES_FILTER
                ? `No meetups in ${activeCityFilter} yet.`
                : "No meetups yet worldwide. Be the first to create one!"}
              </EmptyDescription>
            </EmptyHeader>
            {(activeCityFilter !== ALL_CITIES_FILTER || searchQuery) && (
              <button
                onClick={() => {
                  setCityFilter(ALL_CITIES_FILTER)
                  setSearchQuery("")
                }}
                className="min-h-11 rounded-full bg-primary/10 px-5 text-sm font-semibold text-primary"
              >
                Clear filters
              </button>
            )}
          </Empty>
        ) : (
          <div className="max-w-lg mx-auto px-4 pt-5 pb-[calc(8rem+env(safe-area-inset-bottom))] space-y-5">
            {filteredMeetups.map((meetup, index) => (
              <div key={meetup.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${Math.min(index, 4) * 45}ms` }}>
                <MeetupCard meetup={meetup} onNavigateToMessages={onNavigateToMessages} />
              </div>
            ))}
          </div>
        )
      ) : profilesLoading ? (
        <div className="mx-auto max-w-lg px-4 py-8">
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-3xl border border-border/50 bg-card/70" />
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-4 pt-5 pb-[calc(8rem+env(safe-area-inset-bottom))] space-y-4">
          {filteredProfiles.length === 0 ? (
            <Empty className="rounded-3xl border border-border/60 bg-card/70 p-6">
              <EmptyHeader className="gap-1">
                <EmptyMedia variant="icon" className="h-12 w-12 rounded-2xl bg-primary/10 text-primary">
                  <MessageCircle className="h-5 w-5" />
                </EmptyMedia>
                <EmptyTitle className="text-sm">
                {searchQuery ? "No people found" : "No people to show yet"}
                </EmptyTitle>
                <EmptyDescription className="text-xs">
                {searchQuery ? "Try another name, interest, or language." : "Invite friends or check back as more people join Drift."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
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

function MeetupFeedSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-5 pb-[calc(8rem+env(safe-area-inset-bottom))] space-y-5">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-card/80 shadow-[0_18px_42px_rgb(0_0_0_/_0.2)]"
        >
          <div className="aspect-[16/10] animate-pulse bg-secondary/70" />
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-secondary animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded-full bg-secondary animate-pulse" />
                <div className="h-3 w-40 rounded-full bg-secondary/80 animate-pulse" />
              </div>
            </div>
            <div className="h-5 w-4/5 rounded-full bg-secondary animate-pulse" />
            <div className="flex gap-2">
              <div className="h-7 w-32 rounded-full bg-secondary/80 animate-pulse" />
              <div className="h-7 w-24 rounded-full bg-secondary/80 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
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

  const presence = getPresenceStatus(person)
  const isOnline = presence.state === "online"

  const location =
    [person.current_city, person.current_country].filter(Boolean).join(", ") ||
    (typeof person.location === "string" ? person.location : null) ||
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

            {presence.state !== "offline" && (
              <span
                className={cn(
                  "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-card",
                  isOnline ? "bg-emerald-500" : "bg-muted-foreground"
                )}
                title={presence.label ?? undefined}
                aria-label={presence.label ?? undefined}
              />
            )}
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

                {presence.state !== "offline" && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        isOnline ? "bg-emerald-500" : "bg-muted-foreground"
                      )}
                    />
                    <span>{presence.label}</span>
                  </div>
                )}
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
