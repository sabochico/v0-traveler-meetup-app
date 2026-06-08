"use client"

import { use, useMemo, useState } from "react"
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
  Flag,
  Ban,
  ImageIcon,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { usePublicProfile } from "@/hooks/use-profile"
import { useCreateConversation } from "@/hooks/use-messages"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { useUserSafety } from "@/hooks/use-user-safety"
import { cn } from "@/lib/utils"
import { getProfileCompletionScore } from "@/lib/profile-completion"
import { getPresenceStatus } from "@/lib/presence"

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

const REPORT_REASONS = [
  "Harassment or bullying",
  "Spam or scam",
  "Fake profile",
  "Unsafe meetup behavior",
  "Inappropriate content",
  "Other",
]

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = use(params)
  const router = useRouter()
  const { profile, isLoading } = usePublicProfile(userId)
  const { user, isAuthenticated } = useAuth()
  const { startConversation } = useCreateConversation()
  const { blockUser, reportUser } = useUserSafety()
  const { toast } = useToast()
  const [isStartingChat, setIsStartingChat] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0])
  const [reportDetails, setReportDetails] = useState("")
  const [safetyLoading, setSafetyLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [brokenPhotoUrls, setBrokenPhotoUrls] = useState<Set<string>>(() => new Set())

  const presence = getPresenceStatus(profile)
  const isOnline = presence.state === "online"
  const showPresence = presence.state !== "offline"
  const displayName = profile?.display_name ?? "Anonymous"
  const initial = displayName[0]?.toUpperCase() ?? "U"
  const instagramUsername = profile?.instagram_handle?.replace(/^@/, "")
  const canUseSafetyActions = isAuthenticated && Boolean(user) && user?.id !== profile?.id
  const profilePhotos = useMemo(
    () => Array.from(new Set([...(profile?.profile_photos ?? []), profile?.avatar_url].filter(Boolean) as string[])),
    [profile?.avatar_url, profile?.profile_photos]
  )
  const visiblePhotos = profilePhotos.filter((photoUrl) => !brokenPhotoUrls.has(photoUrl))
  const heroPhoto = visiblePhotos[activePhotoIndex] ?? visiblePhotos[0] ?? null

  const location =
    [profile?.current_city, profile?.current_country].filter(Boolean).join(", ") ||
    profile?.location ||
    "Location not shared"

  const hasLocation = location !== "Location not shared"
  const completionScore = getProfileCompletionScore(profile)
  const trustSignals = profile
    ? [
        {
          label: "Recent activity",
          value: presence.label ?? formatLastSeen(profile.last_active_at ?? profile.last_seen_at),
          icon: Clock3,
          active: showPresence,
        },
        {
          label: "Profile details",
          value: `${completionScore}% complete`,
          icon: Users,
          active: completionScore >= 80,
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

  const handleBlockUser = async () => {
    if (!profile?.id || !confirm("Block this user? You will no longer see them in Drift.")) return

    try {
      setSafetyLoading(true)
      await blockUser(profile.id)
      toast({ title: "User blocked", description: "They will no longer appear in your Drift experience." })
      router.back()
    } catch (error) {
      toast({
        title: "Could not block user",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSafetyLoading(false)
    }
  }

  const handleReportUser = async () => {
    if (!profile?.id) return

    try {
      setSafetyLoading(true)
      await reportUser(profile.id, reportReason, reportDetails)
      setShowReportModal(false)
      setReportDetails("")
      toast({ title: "Report sent", description: "Thanks for helping keep Drift safe." })
    } catch (error) {
      toast({
        title: "Could not send report",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSafetyLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background film-grain">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-[var(--drift-safe-top)]">
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
                {presence.label ?? formatLastSeen(profile.last_active_at ?? profile.last_seen_at)}
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
        <main className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-24">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-card/80 shadow-[0_24px_70px_rgb(0_0_0_/_0.35)]">
            <div className="relative aspect-[4/5] min-h-[460px] bg-gradient-to-br from-primary/35 via-card to-[var(--drift-teal)]/18">
              {heroPhoto ? (
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(heroPhoto)}
                  className="absolute inset-0 text-left"
                  aria-label={`View ${displayName}'s main photo`}
                >
                  <img
                    src={heroPhoto}
                    alt={`${displayName} main profile photo`}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover"
                    onError={() => {
                      setBrokenPhotoUrls((current) => new Set(current).add(heroPhoto))
                      setActivePhotoIndex(0)
                    }}
                  />
                </button>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Avatar className="h-28 w-28 ring-4 ring-primary/20">
                    <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
                    <AvatarFallback className="text-4xl">{initial}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">Photos coming soon</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/36 to-black/12" />
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent" />

              {visiblePhotos.length > 1 && (
                <div className="absolute left-4 right-4 top-4 flex gap-1.5">
                  {visiblePhotos.map((photoUrl, index) => (
                    <button
                      key={photoUrl}
                      type="button"
                      onClick={() => setActivePhotoIndex(index)}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors",
                        index === activePhotoIndex ? "bg-white" : "bg-white/32"
                      )}
                      aria-label={`Show photo ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="rounded-[1.7rem] border border-white/[0.12] bg-[#10131a]/72 p-4 shadow-[0_18px_50px_rgb(0_0_0_/_0.32),inset_0_1px_0_rgb(255_255_255_/_0.12)] backdrop-blur-2xl">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <Avatar className="h-14 w-14 ring-2 ring-white/15">
                        <AvatarImage src={profile.avatar_url ?? heroPhoto ?? undefined} alt={displayName} />
                        <AvatarFallback>{initial}</AvatarFallback>
                      </Avatar>
                      {showPresence && (
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[#10131a]",
                            isOnline ? "bg-emerald-500" : "bg-muted-foreground"
                          )}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-3xl font-serif font-semibold leading-none">{displayName}</h2>
                      <p className="mt-1 text-sm text-white/64">
                        {presence.label ?? formatLastSeen(profile.last_active_at ?? profile.last_seen_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.mood && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs",
                          MOOD_COLORS[profile.mood] ?? MOOD_COLORS.exploring
                        )}
                      >
                        <Sparkles className="h-3 w-3" />
                        {MOOD_LABELS[profile.mood] ?? profile.mood}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.09] px-3 py-1.5 text-xs text-white/72">
                      {profile.travel_mode ? <Plane className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                      {profile.travel_mode ? "Traveler" : "Local"}
                    </span>
                    {hasLocation && (
                      <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-white/[0.09] px-3 py-1.5 text-xs text-white/72">
                        <MapPin className="h-3 w-3 shrink-0 text-primary" />
                        <span className="truncate">{location}</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleSayHi}
                    disabled={isStartingChat}
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[1.25rem] bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
                  >
                    {isStartingChat ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                    {isStartingChat ? "Opening chat..." : "Say Hi"}
                  </button>

                  {chatError && (
                    <p className="mt-3 text-center text-xs text-red-400">{chatError}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {visiblePhotos.length > 1 && (
            <section className="rounded-[1.75rem] border border-border/60 bg-card/72 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-semibold tracking-[-0.01em]">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  More photos
                </h3>
                <span className="text-xs font-medium text-muted-foreground">{visiblePhotos.length}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {visiblePhotos.slice(1).map((photoUrl, index) => (
                  <button
                    key={photoUrl}
                    type="button"
                    onClick={() => setSelectedPhoto(photoUrl)}
                    className="group relative aspect-[4/5] overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-background/42 text-left shadow-[0_14px_34px_rgb(0_0_0_/_0.18)]"
                    aria-label={`View ${displayName}'s photo ${index + 2}`}
                  >
                    <img
                      src={photoUrl}
                      alt={`${displayName} photo ${index + 2}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                      onError={() => {
                        setBrokenPhotoUrls((current) => new Set(current).add(photoUrl))
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/22 via-transparent to-white/[0.03]" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-3 gap-3">
            <div className="flex min-h-[92px] flex-col items-center justify-center rounded-[1.35rem] border border-border/60 bg-card/72 p-3 text-center">
              <CalendarDays className="mb-2 h-5 w-5 text-primary" />
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">Member since</p>
              <p className="mt-1 text-[0.95rem] font-semibold leading-tight text-foreground">{formatMemberSince(profile.created_at)}</p>
            </div>

            <div className="flex min-h-[92px] flex-col items-center justify-center rounded-[1.35rem] border border-border/60 bg-card/72 p-3 text-center">
              <Clock3 className="mb-2 h-5 w-5 text-primary" />
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">Status</p>
              <p className="mt-1 text-[0.95rem] font-semibold leading-tight text-foreground">{presence.label ?? "Inactive"}</p>
            </div>

            <div className="flex min-h-[92px] flex-col items-center justify-center rounded-[1.35rem] border border-border/60 bg-card/72 p-3 text-center">
              <Users className="mb-2 h-5 w-5 text-primary" />
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">Meetups</p>
              <p className="mt-1 text-[0.95rem] font-semibold leading-tight text-foreground">Soon</p>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-border/60 bg-card/72 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-[-0.01em]">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Trust signals
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {trustSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="flex min-h-[118px] flex-col justify-between rounded-[1.35rem] border border-border/50 bg-background/42 p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        signal.active
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      <signal.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 text-[11px] font-medium uppercase tracking-[0.08em] leading-tight text-muted-foreground/78">
                      {signal.label}
                    </span>
                  </div>
                  <p className="mt-3 text-[1.05rem] font-semibold leading-snug tracking-[-0.01em] text-foreground">{signal.value}</p>
                </div>
              ))}
            </div>
          </section>

          {profile.bio && <section className="rounded-[1.75rem] border border-border/60 bg-card/72 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-[-0.01em]">
              <Heart className="h-5 w-5 text-primary" />
              About
            </h3>
            <p className="text-[0.95rem] leading-7 text-muted-foreground">
              {profile.bio}
            </p>
          </section>}

          {(profile.languages?.length ?? 0) > 0 && <section className="rounded-[1.75rem] border border-border/60 bg-card/72 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-[-0.01em]">
              <Languages className="h-5 w-5 text-primary" />
              Languages
            </h3>

            <div className="flex flex-wrap gap-2">
              {profile.languages.map((lang) => (
                <Badge key={lang} variant="secondary">
                  {lang}
                </Badge>
              ))}
            </div>
          </section>}

          {(profile.interests?.length ?? 0) > 0 && <section className="rounded-[1.75rem] border border-border/60 bg-card/72 p-5">
            <h3 className="mb-3 text-base font-semibold tracking-[-0.01em]">Interests</h3>

            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <Badge key={interest} variant="outline" className="border-border text-foreground">
                  {interest}
                </Badge>
              ))}
            </div>
          </section>}

          <section className="rounded-[1.75rem] border border-border/60 bg-card/72 p-5">
            <h3 className="mb-3 text-base font-semibold tracking-[-0.01em]">Shared vibe</h3>
            <div className="space-y-2 text-[0.95rem] leading-6 text-muted-foreground">
              <p>Mutual interests will appear here soon.</p>
              <p>Shared meetup history will appear here soon.</p>
            </div>
          </section>

          {instagramUsername && (
            <section className="rounded-[1.75rem] border border-border/60 bg-card/72 p-5">
              <h3 className="mb-3 text-base font-semibold tracking-[-0.01em]">Social</h3>
              <a
                href={`https://instagram.com/${instagramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="w-4 h-4" />
                <span>@{instagramUsername}</span>
              </a>
            </section>
          )}

          {canUseSafetyActions && (
            <section className="rounded-[1.75rem] border border-border/60 bg-card/52 p-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Safety</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowReportModal(true)}
                  disabled={safetyLoading}
                  className="h-10 rounded-2xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
                >
                  <Flag className="mr-1 inline h-3.5 w-3.5" />
                  Report
                </button>
                <button
                  onClick={handleBlockUser}
                  disabled={safetyLoading}
                  className="h-10 rounded-2xl border border-destructive/30 text-xs font-medium text-destructive disabled:opacity-60"
                >
                  <Ban className="mr-1 inline h-3.5 w-3.5" />
                  Block
                </button>
              </div>
            </section>
          )}
        </main>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-4 backdrop-blur-xl">
          <button
            aria-label="Close photo preview"
            className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={selectedPhoto}
            alt={`${displayName} enlarged profile photo`}
            className="max-h-[82vh] w-full max-w-lg rounded-[1.75rem] object-contain shadow-[0_24px_80px_rgb(0_0_0_/_0.55)]"
            onError={() => setSelectedPhoto(null)}
          />
        </div>
      )}

      {showReportModal && profile && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <button
            aria-label="Close report modal"
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowReportModal(false)}
          />
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Report {displayName}</h2>
              <p className="text-xs text-muted-foreground mt-1">Reports are private and help keep Drift safe.</p>
            </div>

            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={cn(
                    "w-full text-left rounded-2xl border px-3 py-2 text-sm",
                    reportReason === reason
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 text-foreground"
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              value={reportDetails}
              onChange={(event) => setReportDetails(event.target.value)}
              placeholder="Optional details"
              rows={3}
              className="w-full rounded-2xl bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={500}
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="h-11 rounded-2xl bg-secondary text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReportUser}
                disabled={safetyLoading}
                className="h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
              >
                {safetyLoading ? "Sending..." : "Send report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
