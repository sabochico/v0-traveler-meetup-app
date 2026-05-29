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

  const handleSayHi = async () => {
    if (!profile?.id) return

    try {
      setIsStartingChat(true)
      setChatError(null)
      await startConversation(profile.id)
      router.push("/")
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
                {isOnline ? "Online now" : "Offline"}
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
        <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
          <section className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                  <AvatarImage
                    src={profile.avatar_url ?? undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="text-2xl">{initial}</AvatarFallback>
                </Avatar>

                <span
                  className={cn(
                    "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-background",
                    isOnline ? "bg-emerald-500" : "bg-muted"
                  )}
                />
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-2xl font-serif font-semibold truncate">
                  {displayName}
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  {isOnline ? "Online now" : "Offline"}
                </p>

                {profile.mood && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full mt-3",
                      MOOD_COLORS[profile.mood] ?? MOOD_COLORS.exploring
                    )}
                  >
                    <Sparkles className="w-3 h-3" />
                    {MOOD_LABELS[profile.mood] ?? profile.mood}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="rounded-2xl bg-secondary/50 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  Location
                </div>
                <p className="text-sm mt-1">
                  {[profile.current_city, profile.current_country]
                    .filter(Boolean)
                    .join(", ") || "Not shared"}
                </p>
              </div>

              <div className="rounded-2xl bg-secondary/50 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {profile.travel_mode ? (
                    <Plane className="w-4 h-4 text-primary" />
                  ) : (
                    <Globe className="w-4 h-4 text-primary" />
                  )}
                  Mode
                </div>
                <p className="text-sm mt-1">
                  {profile.travel_mode ? "Traveler" : "Local"}
                </p>
              </div>
            </div>

            <button
              onClick={handleSayHi}
              disabled={isStartingChat}
              className="mt-5 w-full h-12 rounded-2xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition"
            >
              {isStartingChat ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              {isStartingChat ? "Starting chat..." : "Say Hi"}
            </button>

            {chatError && (
              <p className="text-xs text-red-400 mt-3 text-center">{chatError}</p>
            )}
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
                  <Badge
                    key={interest}
                    variant="outline"
                    className="border-border text-foreground"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No interests added yet.</p>
            )}
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