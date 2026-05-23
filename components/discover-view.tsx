"use client"

import { useState } from "react"
import { Search, MapPin, Users, Loader2, MessageCircle, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useNearbyProfiles } from "@/hooks/use-profile"
import { useCreateConversation } from "@/hooks/use-messages"
import { cn } from "@/lib/utils"
import type { Profile, MoodStatus } from "@/lib/types"

const STATUS_STYLES: Record<MoodStatus, { color: string; label: string }> = {
  social: { color: "bg-emerald-500", label: "Feeling social" },
  working: { color: "bg-amber-500", label: "Working quietly" },
  exploring: { color: "bg-blue-500", label: "Exploring" },
  homesick: { color: "bg-purple-500", label: "Homesick" },
}

// Mock data for when no real users exist
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
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

interface DiscoverViewProps {
  onNavigateToMessages?: () => void
}

export function DiscoverView({ onNavigateToMessages }: DiscoverViewProps) {
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const { profiles, isLoading } = useNearbyProfiles()

  // Use mock data if no real profiles exist
  const displayProfiles = profiles.length > 0 ? profiles : MOCK_PROFILES
  const isMockData = profiles.length === 0

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
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-serif font-semibold">Discover</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}
                aria-label="List view"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === "map" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}
                aria-label="Map view"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, interest, or language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-secondary border-0 pl-10 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : viewMode === "list" ? (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          {filteredProfiles.map((person) => (
            <PersonCard key={person.id} person={person} isMock={isMockData} onNavigateToMessages={onNavigateToMessages} />
          ))}
        </div>
      ) : (
        <div className="h-[calc(100vh-180px)] relative">
          <MapView people={filteredProfiles} isMock={isMockData} onNavigateToMessages={onNavigateToMessages} />
        </div>
      )}
    </div>
  )
}

function PersonCard({ person, isMock, onNavigateToMessages }: { person: Profile; isMock: boolean; onNavigateToMessages?: () => void }) {
  const [messageSent, setMessageSent] = useState(false)
  const [sending, setSending] = useState(false)
  const { startConversation } = useCreateConversation()
  const mood = (person.mood as MoodStatus) ?? "exploring"

  const handleSayHi = async () => {
    if (isMock) {
      // For mock data, just show success animation
      setSending(true)
      setTimeout(() => {
        setSending(false)
        setMessageSent(true)
        // Navigate to messages after a brief delay
        setTimeout(() => {
          onNavigateToMessages?.()
        }, 500)
      }, 500)
      return
    }

    try {
      setSending(true)
      await startConversation(person.id, "Hey 👋")
      setMessageSent(true)
      // Navigate to messages after successful send
      setTimeout(() => {
        onNavigateToMessages?.()
      }, 800)
    } catch (error) {
      console.error("Failed to start conversation:", error)
      alert("Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <article className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300">
      <div className="flex gap-4">
        <div className="relative">
          <Avatar className="w-16 h-16 ring-2 ring-primary/20">
            <AvatarImage src={person.avatar_url ?? undefined} alt={person.display_name ?? "User"} />
            <AvatarFallback>{(person.display_name ?? "U")[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card",
              STATUS_STYLES[mood].color
            )}
            title={STATUS_STYLES[mood].label}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-foreground">{person.display_name ?? "Anonymous"}</h3>
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

function MapView({ people, isMock, onNavigateToMessages }: { people: Profile[]; isMock: boolean; onNavigateToMessages?: () => void }) {
  return (
    <div className="w-full h-full bg-secondary relative overflow-hidden">
      {/* Stylized map background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 400 600">
          {/* Grid lines */}
          {Array.from({ length: 20 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={i * 30}
              x2="400"
              y2={i * 30}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border"
            />
          ))}
          {Array.from({ length: 15 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 30}
              y1="0"
              x2={i * 30}
              y2="600"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border"
            />
          ))}
        </svg>
      </div>

      {/* People markers */}
      {people.slice(0, 4).map((person, index) => {
        const positions = [
          { top: "30%", left: "40%" },
          { top: "45%", left: "60%" },
          { top: "55%", left: "35%" },
          { top: "70%", left: "55%" },
        ]
        const pos = positions[index % positions.length]
        const mood = (person.mood as MoodStatus) ?? "exploring"

        return (
          <MapMarker key={person.id} person={person} position={pos} mood={mood} isMock={isMock} onNavigateToMessages={onNavigateToMessages} />
        )
      })}

      {/* Center marker (you) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-6 h-6 rounded-full bg-primary glow-amber flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-primary/30 animate-ping" />
      </div>

      {/* Location label */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-foreground">Shibuya, Tokyo</span>
        </div>
      </div>
    </div>
  )
}

function MapMarker({
  person,
  position,
  mood,
  isMock,
  onNavigateToMessages,
}: {
  person: Profile
  position: { top: string; left: string }
  mood: MoodStatus
  isMock: boolean
  onNavigateToMessages?: () => void
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [sending, setSending] = useState(false)
  const { startConversation } = useCreateConversation()

  const handleSayHi = async () => {
    if (isMock) {
      setSending(true)
      setTimeout(() => {
        setSending(false)
        setMessageSent(true)
        setTimeout(() => {
          onNavigateToMessages?.()
        }, 500)
      }, 500)
      return
    }

    try {
      setSending(true)
      await startConversation(person.id, "Hey 👋")
      setMessageSent(true)
      setTimeout(() => {
        onNavigateToMessages?.()
      }, 800)
    } catch (error) {
      console.error("Failed to start conversation:", error)
      alert("Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{ top: position.top, left: position.left }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <div className="relative">
        <Avatar
          className={cn(
            "w-12 h-12 ring-4 ring-card shadow-lg transition-all",
            showTooltip ? "ring-primary" : ""
          )}
        >
          <AvatarImage src={person.avatar_url ?? undefined} alt={person.display_name ?? "User"} />
          <AvatarFallback>{(person.display_name ?? "U")[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card",
            STATUS_STYLES[mood].color
          )}
        />
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10">
          <div className="bg-card px-4 py-3 rounded-lg shadow-lg border border-border whitespace-nowrap">
            <p className="font-medium text-sm text-foreground">{person.display_name ?? "Anonymous"}</p>
            <p className="text-xs text-muted-foreground mb-2">{STATUS_STYLES[mood].label}</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSayHi()
              }}
              disabled={messageSent || sending}
              className={cn(
                "w-full px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                messageSent
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-primary text-primary-foreground hover:glow-amber"
              )}
            >
              {sending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : messageSent ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Sent</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-3 h-3" />
                  <span>Say hi</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
