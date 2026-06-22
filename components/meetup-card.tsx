"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { MapPin, Clock, MessageCircle, Heart, Loader2, Check, Users, Sparkles, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileTransitionLink } from "@/components/profile-transition-link"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useSavedMeetups, useSaveMeetup, useJoinMeetup, useUserMeetups } from "@/hooks/use-saved-meetups"
import { useDeleteMeetup } from "@/hooks/use-meetups"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { useCreateConversation, useSendMessage } from "@/hooks/use-messages"
import { getMeetupCoverImage, getOptimizedMeetupCoverImage } from "@/lib/meetup-cover-images"
import { getMeetupLifecycleLabel } from "@/lib/meetup-lifecycle"
import { isAdminEmail } from "@/lib/admin"
import { triggerLightImpact, triggerSuccessHaptic } from "@/lib/haptics"
import type { MeetupWithCreator, MoodStatus } from "@/lib/types"

interface MeetupCardProps {
  meetup: MeetupWithCreator
  onNavigateToMessages?: (conversationId: string) => void
  loadUserState?: boolean
}

const STATUS_COLORS = {
  social: "bg-emerald-500/20 text-emerald-400",
  working: "bg-amber-500/20 text-amber-400",
  exploring: "bg-blue-500/20 text-blue-400",
  homesick: "bg-purple-500/20 text-purple-400",
}

const STATUS_LABELS = {
  social: "feeling social",
  working: "working quietly",
  exploring: "exploring",
  homesick: "homesick",
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  coffee: "from-blue-500/50 via-cyan-400/35 to-emerald-400/40",
  food: "from-amber-500/50 via-orange-400/35 to-blue-500/35",
  photo: "from-purple-500/50 via-blue-500/35 to-cyan-400/40",
  walk: "from-slate-700 via-blue-500/35 to-teal-400/40",
  study: "from-emerald-500/45 via-blue-500/35 to-slate-700",
  gaming: "from-purple-500/50 via-cyan-400/35 to-blue-500/40",
  explore: "from-blue-500/50 via-teal-400/40 to-emerald-500/35",
}

const CATEGORY_LABELS: Record<string, string> = {
  coffee: "Coffee",
  food: "Food",
  photo: "Photo",
  walk: "Walk",
  study: "Study",
  gaming: "Gaming",
  explore: "Explore",
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  
  if (diff < 0) return "Now"
  if (diff < 60 * 60 * 1000) return `${Math.round(diff / (60 * 1000))}m`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / (60 * 60 * 1000))}h`
  return "Tomorrow"
}

function formatMeetupTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  if (date.toDateString() === now.toDateString()) return `Today at ${time}`
  if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow at ${time}`

  return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

export function MeetupCard({ meetup, onNavigateToMessages, loadUserState = true }: MeetupCardProps) {
  const { user } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  const { savedMeetupIds } = useSavedMeetups({ enabled: loadUserState })
  const { saveMeetup, unsaveMeetup } = useSaveMeetup()
  const { joinMeetup, leaveMeetup } = useJoinMeetup()
  const { deleteMeetup } = useDeleteMeetup()
  const { joinedMeetups } = useUserMeetups({ enabled: loadUserState })
  const { toast } = useToast()
  const { startConversation } = useCreateConversation()
  const { sendMessage } = useSendMessage()
  
  const [savingLike, setSavingLike] = useState(false)
  const [joiningMeetup, setJoiningMeetup] = useState(false)
  const [deletingMeetup, setDeletingMeetup] = useState(false)
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null)
  const [saveBurst, setSaveBurst] = useState<"save" | "unsave" | null>(null)
  const [optimisticJoined, setOptimisticJoined] = useState(false)
  const [joinSuccessBurst, setJoinSuccessBurst] = useState(false)
  
  const isLiked = savedMeetupIds.includes(meetup.id)
  const showLikedState = optimisticLiked ?? isLiked
  const isJoined = joinedMeetups.some(m => m.meetup_id === meetup.id)
  const showJoinedState = isJoined || optimisticJoined
  const isCreator = user?.id === meetup.creator_id
  const canDeleteMeetup = isCreator || isAdminEmail(user?.email)
  
  const creatorMood = (meetup.creator?.mood as MoodStatus) ?? "exploring"
  const categoryGradient = CATEGORY_GRADIENTS[meetup.category] ?? CATEGORY_GRADIENTS.coffee
  const categoryLabel = CATEGORY_LABELS[meetup.category] ?? meetup.category
  const attendeeCount = meetup.attendee_count ?? meetup.attendees?.length ?? 0
  const isFull = attendeeCount >= meetup.max_attendees
  const cardImageUrl = getOptimizedMeetupCoverImage(meetup.cover_image_url) ?? getMeetupCoverImage(meetup.category, meetup.id)
  const lifecycleLabel = getMeetupLifecycleLabel(meetup)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [cardImageUrl])

  useEffect(() => {
    if (isJoined) setOptimisticJoined(false)
  }, [isJoined])

  useEffect(() => {
    if (optimisticLiked === isLiked) setOptimisticLiked(null)
  }, [isLiked, optimisticLiked])

  useEffect(() => {
    if (!saveBurst) return
    const timer = window.setTimeout(() => setSaveBurst(null), 320)
    return () => window.clearTimeout(timer)
  }, [saveBurst])

  useEffect(() => {
    if (!joinSuccessBurst) return
    const timer = window.setTimeout(() => setJoinSuccessBurst(false), 420)
    return () => window.clearTimeout(timer)
  }, [joinSuccessBurst])

  const handleLikeToggle = async () => {
    if (!user) return
    setSavingLike(true)
    try {
      if (showLikedState) {
        await unsaveMeetup(meetup.id)
        setOptimisticLiked(false)
        setSaveBurst("unsave")
      } else {
        await saveMeetup(meetup.id)
        setOptimisticLiked(true)
        setSaveBurst("save")
      }
      triggerLightImpact()
    } catch (error) {
      console.error("Failed to toggle like:", error)
    } finally {
      setSavingLike(false)
    }
  }

  const handleJoinToggle = async () => {
    if (!user) return
    setJoiningMeetup(true)
    try {
      if (showJoinedState) {
        await leaveMeetup(meetup.id)
        setOptimisticJoined(false)
        toast({ title: "Left meetup", description: `You've left "${meetup.title}"` })
      } else {
        await joinMeetup(meetup.id)
        setOptimisticJoined(true)
        setJoinSuccessBurst(true)
        triggerSuccessHaptic()

        // Open a DM with the organizer (skip if user IS the creator)
        if (meetup.creator_id !== user.id) {
          const { conversationId, isNew } = await startConversation(meetup.creator_id, { meetupId: meetup.id })
          if (isNew) {
            await sendMessage(conversationId, `Hey! 👋 I just joined your meetup. Would love to connect!`)
          }
          toast({ title: "You're in! Opening your conversation..." })
          onNavigateToMessages?.(conversationId)
        } else {
          toast({ title: "You're in!", description: `Joined "${meetup.title}"` })
        }
      }
    } catch (error) {
      const e = error as { message?: string; code?: string; details?: string; hint?: string }
      console.error("Failed to toggle join:", JSON.stringify(error), e?.message, e?.code, e?.details, e?.hint)
      toast({ title: "Something went wrong", description: e?.message ?? (error instanceof Error ? error.message : "Please try again."), variant: "destructive" })
    } finally {
      setJoiningMeetup(false)
    }
  }

  const handleDeleteMeetup = async () => {
    if (!user || !canDeleteMeetup) return
    setDeletingMeetup(true)
    try {
      await deleteMeetup(meetup.id)
      toast({ title: "Meetup deleted", description: `"${meetup.title}" has been removed.` })
    } catch (error) {
      toast({
        title: "Could not delete meetup",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingMeetup(false)
    }
  }

  return (
    <motion.article
      whileTap={prefersReducedMotion ? undefined : { scale: 0.992 }}
      transition={prefersReducedMotion ? { duration: 0.01 } : { type: "spring", stiffness: 420, damping: 34, mass: 0.6 }}
      className="group relative overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-card/88 shadow-[0_18px_42px_rgb(0_0_0_/_0.22)] transition-colors duration-300 hover:border-primary/25"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary/40">
        {cardImageUrl && !imageFailed ? (
          <img
            src={cardImageUrl}
            alt={meetup.title}
            width={960}
            height={600}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-[1.025]", categoryGradient)}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-16 w-16 text-white/22" strokeWidth={1.5} />
            </div>
          </div>
        )}
        {imageFailed && (
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,white_0,transparent_24%),radial-gradient(circle_at_80%_30%,white_0,transparent_18%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        
        {/* Time Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="border-0 bg-background/78 text-foreground shadow-sm shadow-black/20 backdrop-blur-md">
            <Clock className="w-3 h-3 mr-1" />
            {lifecycleLabel ?? formatTime(meetup.starts_at)}
          </Badge>
        </div>

        <div className="absolute bottom-3 left-3">
          <Badge className="border-0 bg-primary text-primary-foreground shadow-sm shadow-black/20">
            {categoryLabel}
          </Badge>
        </div>

        {/* Like Button */}
        <motion.button
          onClick={handleLikeToggle}
          disabled={savingLike || !user}
          animate={
            saveBurst && !prefersReducedMotion
              ? {
                  scale: saveBurst === "save" ? [1, 1.16, 1] : [1, 0.9, 1],
                  boxShadow:
                    saveBurst === "save"
                      ? [
                          "0 0 0 0 rgb(255 179 0 / 0)",
                          "0 0 18px 3px rgb(255 179 0 / 0.28)",
                          "0 0 0 0 rgb(255 179 0 / 0)",
                        ]
                      : [
                          "0 0 0 0 rgb(255 179 0 / 0)",
                          "0 0 10px 1px rgb(255 179 0 / 0.12)",
                          "0 0 0 0 rgb(255 179 0 / 0)",
                        ],
                }
              : { scale: 1, boxShadow: "0 0 0 0 rgb(255 179 0 / 0)" }
          }
          transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-3 left-3 w-11 h-11 rounded-full bg-background/58 backdrop-blur-md flex items-center justify-center transition-colors hover:bg-background/78 disabled:opacity-50"
          aria-label={showLikedState ? "Unlike" : "Like"}
        >
          {savingLike ? (
            <Loader2 className="w-4 h-4 animate-spin text-foreground" />
          ) : (
            <Heart className={cn("w-5 h-5 transition-colors", showLikedState ? "fill-accent text-accent" : "text-foreground")} />
          )}
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* User Info */}
        <ProfileTransitionLink
          href={`/profile/${meetup.creator_id}`}
          className="flex items-start gap-3 mb-3 group/creator"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar className="w-11 h-11 ring-2 ring-primary/20">
            <AvatarImage
              src={meetup.creator?.avatar_url ?? undefined}
              alt={meetup.creator?.display_name ?? "User"}
            />
            <AvatarFallback>
              {(meetup.creator?.display_name ?? "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground group-hover/creator:text-primary transition-colors">
                {meetup.creator?.display_name ?? "Anonymous"}
              </span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full", STATUS_COLORS[creatorMood])}>
                {STATUS_LABELS[creatorMood]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              {meetup.creator?.languages?.slice(0, 3).map((lang, i) => (
                <span key={lang}>
                  {lang}
                  {i < Math.min(meetup.creator?.languages?.length || 0, 3) - 1 && <span className="mx-1">·</span>}
                </span>
              ))}
            </div>
          </div>
        </ProfileTransitionLink>

        {/* Title */}
        <h3 className="text-[1.05rem] font-semibold leading-snug mb-3 text-balance">
          {meetup.title}
        </h3>

        {meetup.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {meetup.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1">
            <Clock className="w-3.5 h-3.5 text-primary" />
            {formatMeetupTime(meetup.starts_at)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1">
            <Users className="w-3.5 h-3.5 text-primary" />
            {isFull ? "Full" : `${attendeeCount}/${meetup.max_attendees} Joined`}
          </span>
        </div>

        {/* Location & Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{meetup.location_name ?? `${meetup.city}, ${meetup.country}`}</span>
          </div>
          
          {canDeleteMeetup ? (
            <div className="flex shrink-0 items-center gap-2">
              {isCreator && (
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.06] text-muted-foreground text-sm font-medium">
                  <Users className="w-4 h-4" />
                  <span>Your meetup</span>
                </div>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    disabled={deletingMeetup}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-destructive/25 bg-destructive/10 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-50"
                  >
                    {deletingMeetup ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span>Delete Meetup</span>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border-border/70 bg-card">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete meetup?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this meetup. This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deletingMeetup}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteMeetup}
                      disabled={deletingMeetup}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {deletingMeetup ? "Deleting..." : "Delete Meetup"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : showJoinedState ? (
            <motion.button
              onClick={handleJoinToggle}
              disabled={joiningMeetup}
              animate={
                joinSuccessBurst && !prefersReducedMotion
                  ? {
                      scale: [1, 0.97, 1.025, 1],
                      boxShadow: [
                        "0 0 0 0 rgb(16 185 129 / 0)",
                        "0 0 0 0 rgb(16 185 129 / 0)",
                        "0 0 22px 3px rgb(16 185 129 / 0.28)",
                        "0 0 0 0 rgb(16 185 129 / 0)",
                      ],
                    }
                  : { scale: 1, boxShadow: "0 0 0 0 rgb(16 185 129 / 0)" }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0.01 }
                  : { duration: 0.36, ease: [0.16, 1, 0.3, 1] }
              }
              className="flex shrink-0 items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-colors hover:bg-emerald-500/30"
            >
              {joiningMeetup ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Joined ✓</span>
            </motion.button>
          ) : (
            <button 
              onClick={handleJoinToggle}
              disabled={joiningMeetup || !user || isFull}
              className="flex shrink-0 items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              {joiningMeetup ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              <span>{isFull ? "Full" : "Join"}</span>
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}
