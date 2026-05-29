"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Globe,
  Instagram,
  Loader2,
  Plane,
  MessageCircle,
  Sparkles,
  Languages,
  Heart,
  CalendarDays,
  Users,
  Clock3,
  ShieldCheck,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { usePublicProfile } from "@/hooks/use-profile"
import { useCreateConversation } from "@/hooks/use-messages"
import { cn } from "@/lib/utils"

const ONLINE_WINDOW_MS = 2 * 60 * 1000

const isRecentlySeen = (lastSeenAt?: string | null) => {
  if (!lastSeenAt) return false
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS
}

const formatMemberSince = (createdAt?: string | null) => {
  if (!createdAt) return "Recently joined"
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(createdAt))
}

const formatLastSeen = (lastSeenAt?: string | null) => {
  if (!lastSeenAt) return "Last active recently"

  const diffMs = Date.now() - new Date(lastSeenAt).getTime()
  const diffMins = Math.max(1, Math.floor(diffMs / 60000))

  if (diffMins < 2) return "Active now"
  if (diffMins < 60) return `Active ${diffMins} min ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Active ${diffHours} hr ago`

  return "Active earlier"
}

const MOOD_COLORS: Record<string, string> = {
  social: "bg-emerald-500/20 text-emerald-400",
  working: "bg-amber-500/20 text-amber-400",
  exploring: "bg-blue-500/20 text-blue-400",
  homesick: "bg-purple-500/20 text-purple-400",
}

const MOOD_LABELS: Record<string, string> = {
  social: "Feeling social",
  working: "Working quietly",
  exploring: "Exploring",
  homesick: "Homesick",
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = use(params)
  const router = useRouter()
  const { profile, isLoading } = usePublicProfile(userId)
  const { startConversation } = useCreateConversation()
  const [isStartingChat, setIsStartingChat] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const isOnline = Boolean(profile?.is_online) || isRecentlySeen(profile?.last_seen_at)
  const displayName = profile?.display_name ?? "Anonymous"
  const initial = displayName[0]?.toUpperCase() ?? "U"

  const location =
    [profile?.current_city, profile?.current_country].filter(Boolean).join(", ") ||
    profile?.location ||
    "Location not shared"

  const hasLocation = location !== "Location not shared"
  const profileDetailsCount = profile
    ? [
        profile.avatar_url,
        profile.bio,
        hasLocation,
        (profile.languages?.length ?? 0) > 0,
        (profile.interests?.length ?? 0) > 0,
      ].filter(Boolean).length
    : 0
  const trustSignals = profile
    ? [
        {
          label: "Recent activity",
          value: isOnline ? "Online now" : formatLastSeen(profile.last_seen_at),
          icon: Clock3,
          active: isOnline || isRecentlySeen(profile.last_seen_at),
        },
        {
          label: "Profile details",
          value: `${profileDetailsCount}/5 added`,
          icon: Users,
          active: profileDetailsCount >= 3,
        },
        {
          label: "Member since",
          value: formatMemberSince(profile.created_at),
          icon: CalendarDays,
          active: true,
        },
        {
          label: "Social link",
          value: profile.instagram_handle ? "Instagram connected" : "Not connected yet",
          icon: Instagram,
          active: Boolean(profile.instagram_handle),
        },
      ]
    : []

  const handleSayHi = async () => {
    if (!profile?.id) return

    try {
      setIsStartingChat(true)
      setChatError(null)
      const result = await startConversation(profile.id)
      router.push(`/?tab=messages&conversation=${result.conversationId}`)
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Could not start chat")
    } finally {
      setIsStartingChat(false)
    }
  }

  return (
    <div className="min-h-screen bg-background film-grain">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="font-medium text-foreground truncate">
              {profile?.display_name ?? "Profile"}
            </h1>
            {profile && (
              <p className="text-xs text-muted-foreground">
                {isOnline ? "Online now" : formatLastSeen(profile.last_seen_at)}
              </p>
            )}
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !profile ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <p className="text-muted-foreground">This profile doesn&apos;t exist.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      ) : (
        <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
          <section className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm text-center">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="w-32 h-32 ring-4 ring-primary/20">
                  <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
                  <AvatarFallback className="text-4xl">{initial}</AvatarFallback>
                </Avatar>

                <span
                  className={cn(
                    "absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-background",
                    isOnline ? "bg-emerald-500" : "bg-muted"
                  )}
                />
              </div>
            </div>

            <h2 className="text-3xl font-serif font-semibold mt-4">{displayName}</h2>

            <p className="text-sm text-muted-foreground mt-1">
              {isOnline ? "Online now" : formatLastSeen(profile.last_seen_at)}
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {profile.mood && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full",
                    MOOD_COLORS[profile.mood] ?? MOOD_COLORS.exploring
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  {MOOD_LABELS[profile.mood] ?? profile.mood}
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">
                {profile.travel_mode ? <Plane className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {profile.travel_mode ? "Traveler" : "Local"}
              </span>
            </div>

            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-4">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{location}</span>
            </div>

            <button
              onClick={handleSayHi}
              disabled={isStartingChat}
              className="mt-6 w-full h-12 rounded-2xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition"
            >
              {isStartingChat ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              {isStartingChat ? "Opening chat..." : "Say Hi"}
            </button>

            {chatError && (
              <p className="text-xs text-red-400 mt-3 text-center">{chatError}</p>
            )}
          </section>

          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-card/70 border border-border/60 p-3 text-center">
              <CalendarDays className="w-4 h-4 mx-auto text-primary mb-1" />
              <p className="text-[11px] text-muted-foreground">Member since</p>
              <p className="text-xs font-medium">{formatMemberSince(profile.created_at)}</p>
            </div>

            <div className="rounded-2xl bg-card/70 border border-border/60 p-3 text-center">
              <Clock3 className="w-4 h-4 mx-auto text-primary mb-1" />
              <p className="text-[11px] text-muted-foreground">Status</p>
              <p className="text-xs font-medium">{isOnline ? "Online" : "Away"}</p>
            </div>

            <div className="rounded-2xl bg-card/70 border border-border/60 p-3 text-center">
              <Users className="w-4 h-4 mx-auto text-primary mb-1" />
              <p className="text-[11px] text-muted-foreground">Meetups</p>
              <p className="text-xs font-medium">Soon</p>
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/70 p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Trust signals
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {trustSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-2xl border border-border/50 bg-background/40 p-3"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center",
                        signal.active
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      <signal.icon className="w-3.5 h-3.5" />
                    </span>
                    {signal.label}
                  </div>
                  <p className="text-sm font-medium text-foreground mt-2">{signal.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/70 p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              About
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {profile.bio || "No bio yet."}
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/70 p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Languages className="w-4 h-4 text-primary" />
              Languages
            </h3>

            {(profile.languages?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang) => (
                  <Badge key={lang} variant="secondary">
                    {lang}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No languages added yet.</p>
            )}
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/70 p-5">
            <h3 className="text-sm font-semibold mb-3">Interests</h3>

            {(profile.interests?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <Badge key={interest} variant="outline" className="border-border text-foreground">
                    {interest}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No interests added yet.</p>
            )}
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/70 p-5">
            <h3 className="text-sm font-semibold mb-3">Shared vibe</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Mutual interests will appear here soon.</p>
              <p>Shared meetup history will appear here soon.</p>
            </div>
          </section>

          {profile.instagram_handle && (
            <section className="rounded-3xl border border-border/60 bg-card/70 p-5">
              <h3 className="text-sm font-semibold mb-3">Social</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Instagram className="w-4 h-4" />
                <span>@{profile.instagram_handle}</span>
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  )
}
