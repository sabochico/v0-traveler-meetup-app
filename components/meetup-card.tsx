"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin, Clock, MessageCircle, Heart, Loader2, Check, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSavedMeetups, useSaveMeetup, useJoinMeetup, useUserMeetups } from "@/hooks/use-saved-meetups"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { useCreateConversation, useSendMessage } from "@/hooks/use-messages"
import type { MeetupWithCreator, MoodStatus } from "@/lib/types"

interface MeetupCardProps {
  meetup: MeetupWithCreator
  onNavigateToMessages?: (conversationId: string) => void
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

export function MeetupCard({ meetup, onNavigateToMessages }: MeetupCardProps) {
  const { user } = useAuth()
  const { savedMeetupIds } = useSavedMeetups()
  const { saveMeetup, unsaveMeetup } = useSaveMeetup()
  const { joinMeetup, leaveMeetup } = useJoinMeetup()
  const { joinedMeetups } = useUserMeetups()
  const { toast } = useToast()
  const { startConversation } = useCreateConversation()
  const { sendMessage } = useSendMessage()
  
  const [savingLike, setSavingLike] = useState(false)
  const [joiningMeetup, setJoiningMeetup] = useState(false)
  
  const isLiked = savedMeetupIds.includes(meetup.id)
  const isJoined = joinedMeetups.some(m => m.meetup_id === meetup.id)
  const isCreator = user?.id === meetup.creator_id
  
  const creatorMood = (meetup.creator?.mood as MoodStatus) ?? "exploring"
  const categoryGradient = CATEGORY_GRADIENTS[meetup.category] ?? CATEGORY_GRADIENTS.coffee
  const categoryLabel = CATEGORY_LABELS[meetup.category] ?? meetup.category
  const attendeeCount = meetup.attendee_count ?? meetup.attendees?.length ?? 0
  const cardImageUrl = meetup.creator?.avatar_url

  const handleLikeToggle = async () => {
    if (!user) return
    setSavingLike(true)
    try {
      if (isLiked) {
        await unsaveMeetup(meetup.id)
      } else {
        await saveMeetup(meetup.id)
      }
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
      if (isJoined) {
        await leaveMeetup(meetup.id)
        toast({ title: "Left meetup", description: `You've left "${meetup.title}"` })
      } else {
        await joinMeetup(meetup.id)

        // Open a DM with the organizer (skip if user IS the creator)
        if (meetup.creator_id !== user.id) {
          const { conversationId, isNew } = await startConversation(meetup.creator_id)
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

  return (
    <article className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 transition-all duration-500 hover:border-primary/30">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {cardImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${cardImageUrl})` }}
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br transition-transform duration-700 group-hover:scale-105", categoryGradient)} />
        )}
        <div className={cn("absolute inset-0", cardImageUrl ? "bg-black/30" : "opacity-30 bg-[radial-gradient(circle_at_20%_20%,white_0,transparent_24%),radial-gradient(circle_at_80%_30%,white_0,transparent_18%)]")} />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        
        {/* Time Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground border-0">
            <Clock className="w-3 h-3 mr-1" />
            {formatTime(meetup.starts_at)}
          </Badge>
        </div>

        <div className="absolute bottom-3 left-3">
          <Badge className="bg-primary text-primary-foreground border-0">
            {categoryLabel}
          </Badge>
        </div>

        {/* Like Button */}
        <button
          onClick={handleLikeToggle}
          disabled={savingLike || !user}
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-background/80 disabled:opacity-50"
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          {savingLike ? (
            <Loader2 className="w-4 h-4 animate-spin text-foreground" />
          ) : (
            <Heart className={cn("w-5 h-5 transition-colors", isLiked ? "fill-accent text-accent" : "text-foreground")} />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* User Info */}
        <Link
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
        </Link>

        {/* Title */}
        <h3 className="text-lg font-medium leading-snug mb-3 text-balance">
          {meetup.title}
        </h3>

        {meetup.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {meetup.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1">
            <Clock className="w-3.5 h-3.5 text-primary" />
            {formatMeetupTime(meetup.starts_at)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1">
            <Users className="w-3.5 h-3.5 text-primary" />
            {attendeeCount}/{meetup.max_attendees} going
          </span>
        </div>

        {/* Location & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{meetup.location_name ?? `${meetup.city}, ${meetup.country}`}</span>
          </div>
          
          {isCreator ? (
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-medium">
              <Users className="w-4 h-4" />
              <span>Your meetup</span>
            </div>
          ) : isJoined ? (
            <button 
              onClick={handleJoinToggle}
              disabled={joiningMeetup}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-all hover:bg-emerald-500/30"
            >
              {joiningMeetup ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Joined</span>
            </button>
          ) : (
            <button 
              onClick={handleJoinToggle}
              disabled={joiningMeetup || !user}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-all hover:glow-amber disabled:opacity-50"
            >
              {joiningMeetup ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              <span>Join</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
