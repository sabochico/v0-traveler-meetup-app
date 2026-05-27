"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Globe, Instagram, Loader2, Plane } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { usePublicProfile } from "@/hooks/use-profile"
import { cn } from "@/lib/utils"

const MOOD_COLORS: Record<string, string> = {
  social: "bg-emerald-500/20 text-emerald-400",
  working: "bg-amber-500/20 text-amber-400",
  exploring: "bg-blue-500/20 text-blue-400",
  homesick: "bg-purple-500/20 text-purple-400",
}

const MOOD_LABELS: Record<string, string> = {
  social: "feeling social",
  working: "working quietly",
  exploring: "exploring",
  homesick: "homesick",
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = use(params)
  const router = useRouter()
  const { profile, isLoading } = usePublicProfile(userId)

  return (
    <div className="min-h-screen bg-background film-grain">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-medium text-foreground">
            {profile?.display_name ?? "Profile"}
          </h1>
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
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 ring-4 ring-primary/20">
              <AvatarImage
                src={profile.avatar_url ?? undefined}
                alt={profile.display_name ?? "User"}
              />
              <AvatarFallback>
                {(profile.display_name ?? "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-serif font-semibold truncate">
                {profile.display_name ?? "Anonymous"}
              </h2>

              {profile.mood && (
                <span
                  className={cn(
                    "inline-block text-xs px-2 py-0.5 rounded-full mt-1",
                    MOOD_COLORS[profile.mood] ?? MOOD_COLORS.exploring
                  )}
                >
                  {MOOD_LABELS[profile.mood] ?? profile.mood}
                </span>
              )}

              <div className="flex flex-wrap gap-3 mt-2">
                {(profile.current_city || profile.current_country) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>
                      {[profile.current_city, profile.current_country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {profile.travel_mode ? (
                    <Plane className="w-3 h-3" />
                  ) : (
                    <Globe className="w-3 h-3" />
                  )}
                  <span>{profile.travel_mode ? "Traveler" : "Local"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-foreground leading-relaxed text-sm">{profile.bio}</p>
          )}

          {/* Languages */}
          {(profile.languages?.length ?? 0) > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang) => (
                  <Badge key={lang} variant="secondary">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {(profile.interests?.length ?? 0) > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Interests</h3>
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
            </div>
          )}

          {/* Instagram */}
          {profile.instagram_handle && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Social</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Instagram className="w-4 h-4" />
                <span>@{profile.instagram_handle}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
