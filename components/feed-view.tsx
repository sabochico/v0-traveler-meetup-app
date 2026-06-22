"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import type { TouchEvent } from "react"
import Link from "next/link"
import { Haptics } from "@capacitor/haptics"
import { motion, useMotionValue, useTransform, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  MapPin, X, Heart, Loader2, Coffee, Camera, Utensils,
  Moon, BookOpen, Gamepad2, Map, Users, ChevronRight, Sparkles, MessageCircle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { MeetupCard } from "./meetup-card"
import { CategorySelector, type CategorySelectorOption } from "./category-selector"
import { MoodStatus } from "./mood-status"
import { EditProfileModal } from "./edit-profile-modal"
import { useMeetups } from "@/hooks/use-meetups"
import { useSavedMeetupsWithDetails } from "@/hooks/use-saved-meetups"
import { useProfile, useUpdateProfile, useNearbyProfiles } from "@/hooks/use-profile"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { getMeetupCoverImage, getOptimizedMeetupCoverImage } from "@/lib/meetup-cover-images"
import { useToast } from "@/hooks/use-toast"
import { useCreateConversation } from "@/hooks/use-messages"
import { useBlockedUsers } from "@/hooks/use-user-safety"
import { hasLocationValue, sameCityAndCountry } from "@/lib/city-matching"
import { getNextProfileRequirement, getProfileCompletionScore } from "@/lib/profile-completion"
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notification-preferences"
import type { MoodStatus as MoodStatusType, MeetupWithCreator, Profile } from "@/lib/types"

// Profile completion

function getNextProfileStep(p: Profile): string {
  return getNextProfileRequirement(p)
}

function getNextProfileTab(p: Profile): "profile" | "interests" {
  if ((p.interests?.length ?? 0) < 3) return "interests"
  return "profile"
}

interface ProfileCompletionBannerProps {
  profile: Profile
  onComplete: (tab: "profile" | "interests") => void
  onDismiss: () => void
}

function ProfileCompletionBanner({ profile, onComplete, onDismiss }: ProfileCompletionBannerProps) {
  const score = getProfileCompletionScore(profile)
  const nextStep = getNextProfileStep(profile)
  const nextTab = getNextProfileTab(profile)

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-4 mt-3 rounded-2xl border border-primary/25 bg-primary/6 overflow-hidden"
    >
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Next step: <span className="text-primary font-semibold">{nextStep}</span>
            </span>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="min-h-10 min-w-10 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-1.5 w-full rounded-full bg-secondary mb-3">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          />
        </div>

        <button
          onClick={() => onComplete(nextTab)}
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/18 active:scale-[0.98] transition-all"
        >
          <span>{nextStep}</span>
          <ChevronRight className="w-4 h-4 opacity-70" />
        </button>
      </div>
    </motion.div>
  )
}

function TodayPrompt({
  meetupsCount,
  savedCount,
  city,
  onViewSaved,
}: {
  meetupsCount: number
  savedCount: number
  city?: string | null
  onViewSaved: () => void
}) {
  const hasMeetups = meetupsCount > 0

  return (
    <div className="mx-4 mt-3 rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Today on Drift</p>
          <p className="text-xs text-muted-foreground mt-1">
            {hasMeetups
              ? `${meetupsCount} meetup${meetupsCount === 1 ? "" : "s"} ${city ? `near ${city}` : "ready to save"}.`
              : "No nearby meetups yet. Check saved plans or browse all cities."}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
          {savedCount} saved
        </span>
      </div>

      {savedCount > 0 && (
        <button
          onClick={onViewSaved}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary"
        >
          Review saved plans
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

// Constants

const DAILY_LIMIT = 10

const CATEGORY_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  coffee:  { label: "Coffee",         icon: Coffee   },
  food:    { label: "Food Adventure", icon: Utensils  },
  photo:   { label: "Photography",    icon: Camera   },
  walk:    { label: "Night Walk",     icon: Moon     },
  study:   { label: "Study Session",  icon: BookOpen },
  gaming:  { label: "Gaming",         icon: Gamepad2 },
  explore: { label: "Exploring",      icon: Map      },
}

const MOOD_DOT: Record<string, string> = {
  social:   "bg-emerald-500",
  working:  "bg-amber-500",
  exploring:"bg-blue-500",
  homesick: "bg-purple-500",
}

const CONFETTI_COLORS = [
  "#f59e0b","#10b981","#3b82f6","#ec4899",
  "#8b5cf6","#ef4444","#06b6d4","#f97316",
]

const SHOW_MOCK_DATA = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_SHOW_MOCK_DATA === "true"
const MOCK_PROFILE_META = {
  notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
  profile_photos: [],
  current_region: null,
  is_hidden_from_discovery: false,
  banned_at: null,
  banned_by: null,
  ban_reason: null,
  latitude: null,
  longitude: null,
  location_source: null,
  location_updated_at: null,
  last_active_at: new Date().toISOString(),
}

const MOCK_MEETUPS: MeetupWithCreator[] = [
  {
    id: "1", creator_id: "mock-1",
    title: "Anyone want to grab coffee in Shibuya?",
    description: null, category: "coffee", cover_image_url: null,
    location_name: "Shibuya, Tokyo", location: null,
    city: "Tokyo", region: null, country: "Japan", latitude: null, longitude: null, max_attendees: 4,
    starts_at: new Date().toISOString(), ends_at: null,
    is_active: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    creator: {
      ...MOCK_PROFILE_META,
      id: "mock-1", display_name: "Mika",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
      bio: null, interests: [], languages: ["Japanese", "English"],
      mood: "exploring", travel_mode: true, is_online: true,
      anonymous_mode: false, current_city: "Tokyo", current_country: "Japan",
      location: null, instagram_handle: null, last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  },
  {
    id: "2", creator_id: "mock-2",
    title: "Working remotely in Seoul today, looking for cafe company",
    description: null, category: "coffee", cover_image_url: null,
    location_name: "Hongdae, Seoul", location: null,
    city: "Seoul", region: null, country: "South Korea", latitude: null, longitude: null, max_attendees: 4,
    starts_at: new Date(Date.now() + 2 * 3600000).toISOString(), ends_at: null,
    is_active: true,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    creator: {
      ...MOCK_PROFILE_META,
      id: "mock-2", display_name: "Leo",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      bio: null, interests: [], languages: ["English", "Korean"],
      mood: "working", travel_mode: true, is_online: false,
      anonymous_mode: false, current_city: "Seoul", current_country: "South Korea",
      location: null, instagram_handle: null, last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  },
  {
    id: "3", creator_id: "mock-3",
    title: "First week in Taipei - want to explore night markets!",
    description: null, category: "food", cover_image_url: null,
    location_name: "Ximending, Taipei", location: null,
    city: "Taipei", region: null, country: "Taiwan", latitude: null, longitude: null, max_attendees: 4,
    starts_at: new Date(Date.now() + 8 * 3600000).toISOString(), ends_at: null,
    is_active: true,
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    creator: {
      ...MOCK_PROFILE_META,
      id: "mock-3", display_name: "Sofia",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
      bio: null, interests: [], languages: ["Spanish", "English", "Chinese"],
      mood: "social", travel_mode: true, is_online: true,
      anonymous_mode: false, current_city: "Taipei", current_country: "Taiwan",
      location: null, instagram_handle: null, last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  },
  {
    id: "4", creator_id: "mock-4",
    title: "Late night photography walk through Shinjuku",
    description: null, category: "photo", cover_image_url: null,
    location_name: "Shinjuku, Tokyo", location: null,
    city: "Tokyo", region: null, country: "Japan", latitude: null, longitude: null, max_attendees: 4,
    starts_at: new Date(Date.now() + 10 * 3600000).toISOString(), ends_at: null,
    is_active: true,
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    creator: {
      ...MOCK_PROFILE_META,
      id: "mock-4", display_name: "Kai",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
      bio: null, interests: [], languages: ["English", "Japanese"],
      mood: "homesick", travel_mode: true, is_online: false,
      anonymous_mode: false, current_city: "Tokyo", current_country: "Japan",
      location: null, instagram_handle: null, last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  },
]

function getTodayKey() {
  return `drift-saves-${new Date().toISOString().split("T")[0]}`
}

function getSavesToday(): number {
  if (typeof window === "undefined") return 0
  return parseInt(localStorage.getItem(getTodayKey()) ?? "0", 10)
}

function recordSave(): number {
  const key = getTodayKey()
  const next = getSavesToday() + 1
  localStorage.setItem(key, String(next))
  return next
}

function getMsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setDate(midnight.getDate() + 1)
  midnight.setHours(0, 0, 0, 0)
  return midnight.getTime() - now.getTime()
}

function formatTime(startsAt: string): string {
  const diff = (new Date(startsAt).getTime() - Date.now()) / 60000
  if (diff < 1) return "Now"
  if (diff < 60) return `In ${Math.round(diff)}m`
  if (diff < 1440) return `In ${Math.round(diff / 60)}h`
  return "Tomorrow"
}

function ConfettiBlast() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: `${(i * 100) / 48}%`,
        delay: (i % 12) * 0.055,
        duration: 1.4 + (i % 7) * 0.11,
        xDrift: ((i % 9) - 4) * 60,
        size: 6 + (i % 4) * 2,
        isRect: i % 3 === 0,
      })),
    []
  )

  return (
    <div className="fixed inset-0 pointer-events-none z-[110] overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className={cn("absolute", p.isRect ? "rounded-sm" : "rounded-full")}
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: p.left,
            top: -24,
          }}
          animate={{
            y: "110vh",
            x: p.xDrift,
            rotate: p.id % 2 === 0 ? 540 : -540,
            opacity: [1, 1, 0.6, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  )
}

function MatchCelebration({
  meetup,
  onClose,
}: {
  meetup: MeetupWithCreator
  onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <ConfettiBlast />
      <motion.div
        className="text-center px-10 select-none"
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.05 }}
      >
        <motion.div
          className="text-8xl mb-5"
          animate={{ rotate: [0, -14, 14, -8, 8, 0], scale: [1, 1.25, 1] }}
          transition={{ duration: 0.65, delay: 0.25 }}
        >
          Saved
        </motion.div>
        <h2 className="text-4xl font-serif font-bold text-white mb-3 tracking-tight">
          Saved for later
        </h2>
        <p className="text-white/70 text-base leading-snug mb-4 max-w-[260px] mx-auto">
          {meetup.title}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Avatar className="w-7 h-7 ring-2 ring-white/20">
            <AvatarImage src={meetup.creator?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {meetup.creator?.display_name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-white/55 text-sm">with {meetup.creator?.display_name ?? "someone new"}</span>
        </div>
        <p className="text-white/25 text-xs mt-8">Tap anywhere to continue</p>
      </motion.div>
    </motion.div>
  )
}

function CardFace({ meetup }: { meetup: MeetupWithCreator }) {
  const cat = CATEGORY_CONFIG[meetup.category] ?? CATEGORY_CONFIG.explore
  const CatIcon = cat.icon
  const mood = meetup.creator?.mood ?? "exploring"
  const coverImageUrl = getOptimizedMeetupCoverImage(meetup.cover_image_url) ?? getMeetupCoverImage(meetup.category, meetup.id)
  const initial = (meetup.creator?.display_name ?? "?")[0].toUpperCase()

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden relative bg-zinc-900">
      {coverImageUrl ? (
        <img
          src={coverImageUrl}
          alt=""
          width={960}
          height={600}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/50 to-black/80" />
          <div className="absolute inset-0 flex items-center justify-center pb-24 select-none">
            <span className="text-[140px] font-serif font-bold text-white/20 leading-none">
              {initial}
            </span>
          </div>
        </>
      )}

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.75) 28%, rgba(0,0,0,0.25) 55%, transparent 75%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 22%)",
        }}
      />

      <div className="absolute top-5 left-5 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
        <CatIcon className="w-3.5 h-3.5 text-white" />
        <span className="text-white text-xs font-semibold tracking-wide">{cat.label}</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-5 pb-7">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full flex-shrink-0",
              MOOD_DOT[mood] ?? "bg-gray-500"
            )}
          />
          <Link
            href={`/profile/${meetup.creator_id}`}
            className="text-white font-semibold text-base leading-tight hover:text-white/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {meetup.creator?.display_name ?? "Anonymous"}
          </Link>
          {meetup.creator?.languages && meetup.creator.languages.length > 0 && (
            <>
              <span className="text-white/30 text-sm">/</span>
              {meetup.creator.languages.slice(0, 2).map((l) => (
                <span key={l} className="text-white/50 text-xs">
                  {l}
                </span>
              ))}
            </>
          )}
        </div>

        <h2 className="text-white text-2xl font-serif font-bold leading-tight mb-3 drop-shadow-sm">
          {meetup.title}
        </h2>

        <div className="flex items-center gap-4 text-white/60 text-sm">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-white/45 flex-shrink-0" />
            <span className="truncate">{meetup.location_name ?? meetup.city}</span>
          </span>
          <span className="flex-shrink-0">{formatTime(meetup.starts_at)}</span>
        </div>
      </div>
    </div>
  )
}

interface SwipeCardProps {
  meetup: MeetupWithCreator
  leaving: "left" | "right" | null
  onDragSwipe: (dir: "left" | "right") => void
  onExitComplete: () => void
}

function SwipeCard({ meetup, leaving, onDragSwipe, onExitComplete }: SwipeCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-280, 0, 280], [-18, 0, 18])
  const skipOpacity = useTransform(x, [-140, -20], [1, 0])
  const joinOpacity = useTransform(x, [20, 140], [0, 1])

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 100) onDragSwipe("right")
    else if (info.offset.x < -100) onDragSwipe("left")
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, touchAction: "none", zIndex: 10 }}
      drag={leaving ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.75}
      onDragEnd={handleDragEnd}
      animate={
        leaving === "right"
          ? { x: 1100, opacity: 0, rotate: 22 }
          : leaving === "left"
          ? { x: -1100, opacity: 0, rotate: -22 }
          : {}
      }
      transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
      onAnimationComplete={() => {
        if (leaving) onExitComplete()
      }}
    >
      <CardFace meetup={meetup} />

      <motion.div
        className="absolute top-7 left-6 pointer-events-none"
        style={{ opacity: skipOpacity }}
      >
        <div className="border-[3px] border-red-500 rounded-xl px-4 py-1.5 -rotate-[18deg]">
          <span className="text-red-500 text-2xl font-black tracking-widest">SKIP</span>
        </div>
      </motion.div>

      <motion.div
        className="absolute top-7 right-6 pointer-events-none"
        style={{ opacity: joinOpacity }}
      >
        <div className="border-[3px] border-emerald-400 rounded-xl px-4 py-1.5 rotate-[18deg]">
          <span className="text-emerald-400 text-2xl font-black tracking-widest">SAVE</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface SwipeFeedProps {
  meetups: MeetupWithCreator[]
  isLoading: boolean
  onSaveMeetup: (meetupId: string) => Promise<void>
}

function SwipeFeed({ meetups, isLoading, onSaveMeetup }: SwipeFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null)
  const [matchMeetup, setMatchMeetup] = useState<MeetupWithCreator | null>(null)
  const [savesToday, setSavesToday] = useState(0)

  useEffect(() => {
    setSavesToday(getSavesToday())
    const t = setTimeout(() => setSavesToday(0), getMsUntilMidnight())
    return () => clearTimeout(t)
  }, [])

  const limitReached = savesToday >= DAILY_LIMIT
  const currentMeetup = meetups[currentIndex]
  const nextMeetup = meetups[currentIndex + 1]
  const allSwiped = currentIndex >= meetups.length

  const doSwipe = useCallback(
    (dir: "left" | "right") => {
      if (leaving) return
      if (dir === "right" && limitReached) return
      setLeaving(dir)
    },
    [leaving, limitReached]
  )

  const handleDragSwipe = useCallback(
    (dir: "left" | "right") => {
      if (dir === "right" && limitReached) {
        setLeaving("left")
        return
      }
      setLeaving(dir)
    },
    [limitReached]
  )

  const handleExitComplete = useCallback(async () => {
    if (leaving === "right") {
      const saves = recordSave()
      setSavesToday(saves)
      if (currentMeetup) {
        await onSaveMeetup(currentMeetup.id)
        setMatchMeetup(currentMeetup)
      }
    }
    setLeaving(null)
    setCurrentIndex((i) => i + 1)
  }, [leaving, currentMeetup, onSaveMeetup])

  if (isLoading) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-lg rounded-3xl border border-border/60 bg-card/70 p-5">
          <div className="h-[360px] animate-pulse rounded-3xl bg-secondary/80" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-secondary" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-secondary/70" />
          </div>
        </div>
      </div>
    )
  }

  if (allSwiped || meetups.length === 0) {
    return (
      <Empty className="mx-4 my-8 rounded-3xl border border-border/60 bg-card/70 px-6 py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="h-14 w-14 rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>You&apos;re all caught up</EmptyTitle>
          <EmptyDescription className="max-w-xs">
            No nearby meetups right now. Browse other cities or create your own plan.
          </EmptyDescription>
        </EmptyHeader>
        <button
          onClick={() => setCurrentIndex(0)}
          className="mt-1 min-h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
        >
          Start over
        </button>
      </Empty>
    )
  }

  const remaining = meetups.length - currentIndex
  const dotCount = Math.min(remaining, 5)

  return (
    <>
      <div className="flex flex-col items-center px-3 pt-1 pb-3 gap-3">
        <div
          className="relative w-full"
          style={{ height: "clamp(320px, calc(100dvh - 410px), 500px)" }}
        >
          {nextMeetup && (
            <motion.div
              key={`back-${nextMeetup.id}`}
              className="absolute inset-0 rounded-3xl overflow-hidden"
              animate={{ scale: leaving ? 1 : 0.96, y: leaving ? 0 : 10 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              style={{ zIndex: 5 }}
            >
              <CardFace meetup={nextMeetup} />
            </motion.div>
          )}

          {currentMeetup && (
            <SwipeCard
              key={`top-${currentMeetup.id}`}
              meetup={currentMeetup}
              leaving={leaving}
              onDragSwipe={handleDragSwipe}
              onExitComplete={handleExitComplete}
            />
          )}
        </div>

        <div className="flex gap-1.5 items-center h-2">
          {Array.from({ length: dotCount }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === 0 ? "w-5 bg-primary" : "w-1.5 bg-muted"
              )}
            />
          ))}
          {remaining > 5 && (
            <span className="text-muted-foreground/60 text-xs ml-1">+{remaining - 5}</span>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-end justify-center gap-12">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => doSwipe("left")}
                disabled={!!leaving}
                aria-label="Pass"
                className="w-[68px] h-[68px] rounded-full bg-card border-2 border-red-500/50 shadow-lg shadow-red-500/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/80 active:scale-90 transition-all duration-150 disabled:opacity-35"
              >
                <X className="w-8 h-8 text-red-400" strokeWidth={2.5} />
              </button>
              <span className="text-xs font-medium text-muted-foreground tracking-wide">Pass</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => doSwipe("right")}
                disabled={!!leaving || limitReached}
                aria-label="Save"
                className="w-[68px] h-[68px] rounded-full bg-card border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500/80 active:scale-90 transition-all duration-150 disabled:opacity-35"
              >
                <Heart className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />
              </button>
              <span className="text-xs font-medium text-muted-foreground tracking-wide">Save</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground/70">
            {limitReached ? (
              <span className="text-destructive/70">Daily limit reached - resets at midnight</span>
            ) : (
              <>
                <span className="text-primary font-semibold">{DAILY_LIMIT - savesToday}</span>
                {" saves left today"}
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {matchMeetup && (
          <MatchCelebration
            key={matchMeetup.id}
            meetup={matchMeetup}
            onClose={() => setMatchMeetup(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function AvailablePeople({
  profiles,
  hasUserCity,
  onNavigateToMessages,
}: {
  profiles: Profile[]
  hasUserCity: boolean
  onNavigateToMessages?: (conversationId: string) => void
}) {
  const [startingId, setStartingId] = useState<string | null>(null)
  const { startConversation } = useCreateConversation()
  const { toast } = useToast()

  const handleSayHi = async (profileId: string) => {
    try {
      setStartingId(profileId)
      const result = await startConversation(profileId)
      onNavigateToMessages?.(result.conversationId)
    } catch (error) {
      console.error("Failed to start conversation:", error)
      toast({
        title: "Could not start conversation",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setStartingId(null)
    }
  }

  if (profiles.length === 0) {
    return (
      <section className="px-4">
        <div className="rounded-3xl border border-border/60 bg-card/70 p-5 text-center">
          <Users className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">
            {hasUserCity ? "No one available nearby yet" : "Set your city to find people nearby"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {hasUserCity ? "Check Discover to explore people in other cities." : "Add your current city in Profile so Drift can show people in the same city."}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="px-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Available now</h2>
        <span className="text-xs text-muted-foreground">People nearby</span>
      </div>

      <div className="space-y-2">
        {profiles.slice(0, 3).map((person) => {
          const displayName = person.display_name ?? "Anonymous"
          const location =
            [person.current_city, person.current_country].filter(Boolean).join(", ") ||
            (typeof person.location === "string" ? person.location : null) ||
            "Location not shared"

          return (
            <div
              key={person.id}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3"
            >
              <Link href={`/profile/${person.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={person.avatar_url ?? undefined} alt={displayName} />
                  <AvatarFallback>{displayName[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{location}</p>
                </div>
              </Link>

              <button
                onClick={() => handleSayHi(person.id)}
                disabled={startingId === person.id}
                className="shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
              >
                {startingId === person.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Hi
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TodayHome({
  meetups,
  savedMeetups,
  profiles,
  isLoading,
  savedLoading,
  loadSecondaryData,
  hasUserCity,
  onNavigateToMessages,
  onViewSaved,
  onBrowseAll,
}: {
  meetups: MeetupWithCreator[]
  savedMeetups: MeetupWithCreator[]
  profiles: Profile[]
  isLoading: boolean
  savedLoading: boolean
  loadSecondaryData: boolean
  hasUserCity: boolean
  onNavigateToMessages?: (conversationId: string) => void
  onViewSaved: () => void
  onBrowseAll: () => void
}) {
  const soonMeetups = meetups
    .slice()
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 3)

  return (
    <div className="py-5 space-y-7">
      <section className="px-4">
        <div className="rounded-3xl border border-primary/20 bg-primary/8 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Today on Drift</p>
              <p className="text-xs text-muted-foreground mt-1">
                Find something social to do soon, then message the people going.
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="rounded-2xl bg-background/40 p-3">
              <p className="text-lg font-semibold text-primary">{meetups.length}</p>
              <p className="text-[11px] text-muted-foreground">nearby</p>
            </div>
            <button onClick={onViewSaved} className="rounded-2xl bg-background/40 p-3">
              <p className="text-lg font-semibold text-primary">{savedMeetups.length}</p>
              <p className="text-[11px] text-muted-foreground">saved</p>
            </button>
            <div className="rounded-2xl bg-background/40 p-3">
              <p className="text-lg font-semibold text-primary">{profiles.length}</p>
              <p className="text-[11px] text-muted-foreground">people</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Happening soon</h2>
          <button onClick={onBrowseAll} className="text-xs font-medium text-primary">
            Browse all
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : soonMeetups.length === 0 ? (
          <Empty className="rounded-3xl border border-border/60 bg-card/70 p-5">
            <EmptyHeader className="gap-1">
              <EmptyTitle className="text-sm">
                {hasUserCity ? "No nearby meetups right now" : "Set your city to see local plans"}
              </EmptyTitle>
              <EmptyDescription className="text-xs">
                {hasUserCity ? "Create one or browse Discover for other cities." : "Add your current city in Profile, or browse all cities for now."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-4">
            {soonMeetups.map((meetup) => (
              <MeetupCard
                key={meetup.id}
                meetup={meetup}
                loadUserState={loadSecondaryData}
                onNavigateToMessages={onNavigateToMessages}
              />
            ))}
          </div>
        )}
      </section>

      <AvailablePeople profiles={profiles} hasUserCity={hasUserCity} onNavigateToMessages={onNavigateToMessages} />

      <section className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Saved plans</h2>
          <button onClick={onViewSaved} className="text-xs font-medium text-primary">
            View saved
          </button>
        </div>

        {savedLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : savedMeetups.length === 0 ? (
          <Empty className="rounded-3xl border border-border/60 bg-card/70 p-5">
            <EmptyHeader className="gap-1">
              <EmptyMedia variant="default" className="mb-1 text-muted-foreground/40">
                <Heart className="h-8 w-8" />
              </EmptyMedia>
              <EmptyTitle className="text-sm">No saved plans yet</EmptyTitle>
              <EmptyDescription className="text-xs">Save meetups from Today or Discover to come back to them.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-4">
            {savedMeetups.slice(0, 2).map((meetup) => (
              <MeetupCard
                key={meetup.id}
                meetup={meetup as MeetupWithCreator}
                loadUserState={loadSecondaryData}
                onNavigateToMessages={onNavigateToMessages}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

interface FeedViewProps {
  onNavigateToMessages?: (conversationId: string) => void
}

export function FeedView({ onNavigateToMessages }: FeedViewProps) {
  const [activeTab, setActiveTab] = useState<"feed" | "saved">("feed")
  const [browseAll, setBrowseAll] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editProfileTab, setEditProfileTab] = useState<"profile" | "interests">("profile")
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [loadSecondaryData, setLoadSecondaryData] = useState(false)
  const [refreshingSaved, setRefreshingSaved] = useState(false)
  const [savedPullDistance, setSavedPullDistance] = useState(0)
  const savedPullStartY = useRef<number | null>(null)
  const savedPullHapticFired = useRef(false)
  const prefersReducedMotion = useReducedMotion()
  const { meetups, isLoading } = useMeetups()
  const shouldLoadSavedMeetups = activeTab === "saved" || loadSecondaryData
  const { savedMeetups, isLoading: savedLoading, refresh: refreshSavedMeetups } = useSavedMeetupsWithDetails({ enabled: shouldLoadSavedMeetups })
  const { profile } = useProfile()
  const { updateMood } = useUpdateProfile()
  const { profiles } = useNearbyProfiles({ enabled: loadSecondaryData })
  const { isAuthenticated } = useAuth()
  const { blockedUserIdSet } = useBlockedUsers()
  const feedTabs = useMemo<CategorySelectorOption[]>(
    () => [
      { id: "feed", label: "Today" },
      { id: "saved", label: "Saved", icon: <Heart className="h-3.5 w-3.5" /> },
    ],
    []
  )

  useEffect(() => {
    if (sessionStorage.getItem("drift-profile-banner-dismissed") === "1") {
      setBannerDismissed(true)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => setLoadSecondaryData(true), 700)
    return () => window.clearTimeout(timerId)
  }, [])

  useEffect(() => {
    if (activeTab === "saved" && shouldLoadSavedMeetups) {
      void refreshSavedMeetups()
    }
  }, [activeTab, shouldLoadSavedMeetups, refreshSavedMeetups])

  const refreshSaved = useCallback(async () => {
    if (refreshingSaved) return
    setRefreshingSaved(true)
    try {
      await refreshSavedMeetups()
    } finally {
      setRefreshingSaved(false)
    }
  }, [refreshSavedMeetups, refreshingSaved])

  const handleSavedTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (activeTab !== "saved" || window.scrollY > 2) return
    savedPullStartY.current = event.touches[0]?.clientY ?? null
    savedPullHapticFired.current = false
  }

  const handleSavedTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const startY = savedPullStartY.current
    if (startY === null || activeTab !== "saved" || refreshingSaved || window.scrollY > 2) return

    const distance = Math.max(0, event.touches[0]?.clientY - startY)
    const nextDistance = Math.min(distance, 96)
    setSavedPullDistance(nextDistance)

    if (nextDistance >= 72 && !savedPullHapticFired.current) {
      savedPullHapticFired.current = true
      Haptics.selectionChanged().catch(() => {})
    }
  }

  const handleSavedTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startY = savedPullStartY.current
    savedPullStartY.current = null
    const shouldRefresh = savedPullDistance >= 72
    setSavedPullDistance(0)
    if (startY === null || activeTab !== "saved" || refreshingSaved) return
    const endY = event.changedTouches[0]?.clientY ?? startY
    if ((shouldRefresh || endY - startY > 72) && window.scrollY <= 2) {
      void refreshSaved()
    }
  }

  const handleDismissBanner = () => {
    sessionStorage.setItem("drift-profile-banner-dismissed", "1")
    setBannerDismissed(true)
  }

  const currentMood = (profile?.mood as MoodStatusType) ?? "exploring"
  const userCity = profile?.current_city
  const userCountry = profile?.current_country
  const hasUserCity = hasLocationValue(userCity)
  const nearbyCount = profiles.length

  const handleMoodChange = async (mood: MoodStatusType) => {
    if (isAuthenticated) await updateMood(mood)
  }

  const displayMeetups = meetups.length > 0
    ? meetups.filter((meetup) => !blockedUserIdSet.has(meetup.creator_id))
    : SHOW_MOCK_DATA ? MOCK_MEETUPS : []
  const visibleMeetups =
    isAuthenticated && profile
      ? displayMeetups.filter((m) => m.creator_id !== profile.id)
      : displayMeetups

  const filteredMeetups =
    browseAll
      ? visibleMeetups
      : hasUserCity
        ? visibleMeetups.filter((m) => sameCityAndCountry(
          { city: m.city, country: m.country },
          { city: userCity, country: userCountry }
        ))
        : []

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-[var(--drift-safe-top)]">
        <div className="max-w-lg mx-auto px-4 py-4 pr-[4.75rem] sm:pr-4">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-serif font-semibold tracking-tight truncate">Today</h1>
              <div className="flex min-w-0 items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{browseAll ? "All cities" : hasUserCity ? `Near ${userCity}` : "Set your city"}</span>
                </span>
                <span className="flex flex-shrink-0 items-center gap-1 text-emerald-400/80">
                  <Users className="w-3 h-3 flex-shrink-0" />
                  {nearbyCount} nearby
                </span>
              </div>
            </div>
            <MoodStatus currentMood={currentMood} onMoodChange={handleMoodChange} />
          </div>

          <CategorySelector
            value={activeTab}
            options={feedTabs}
            onChange={(tab) => setActiveTab(tab as "feed" | "saved")}
            ariaLabel="Today sections"
            storageKey="drift-today-section"
            fullWidthItems
          />

          {activeTab === "feed" && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                {browseAll
                  ? "Actionable meetups from every city."
                  : hasUserCity
                    ? "People and plans you can act on today."
                    : "Add your city in Profile to personalize Today."}
              </p>

              {hasUserCity ? (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <span>
                    {browseAll
                      ? "Showing meetups from all cities"
                      : `Showing meetups in ${userCity}`}
                  </span>
                  <button
                    onClick={() => setBrowseAll((b) => !b)}
                    className="text-primary hover:underline"
                  >
                    {browseAll ? "Near me" : "Browse all"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <span>Showing local results after your city is set</span>
                  <button
                    onClick={() => setBrowseAll(true)}
                    className="text-primary hover:underline"
                  >
                    Browse all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        <AnimatePresence>
          {activeTab === "feed" && isAuthenticated && profile && !bannerDismissed && getProfileCompletionScore(profile) < 80 && (
            <ProfileCompletionBanner
              profile={profile}
              onComplete={(tab) => {
                setEditProfileTab(tab)
                setShowEditProfile(true)
              }}
              onDismiss={handleDismissBanner}
            />
          )}
        </AnimatePresence>

      </div>

      <div className="max-w-lg mx-auto">
        {activeTab === "feed" ? (
          <TodayHome
            meetups={filteredMeetups}
            savedMeetups={savedMeetups as MeetupWithCreator[]}
            profiles={profiles.filter((person) => !blockedUserIdSet.has(person.id))}
            isLoading={isLoading}
            savedLoading={savedLoading}
            loadSecondaryData={loadSecondaryData}
            hasUserCity={hasUserCity}
            onNavigateToMessages={onNavigateToMessages}
            onViewSaved={() => setActiveTab("saved")}
            onBrowseAll={() => setBrowseAll(true)}
          />
        ) : (
          <div
            className="min-h-[55svh] overscroll-y-contain"
            onTouchStart={handleSavedTouchStart}
            onTouchMove={handleSavedTouchMove}
            onTouchEnd={handleSavedTouchEnd}
          >
            <motion.div
              className="pointer-events-none flex items-center justify-center pt-3"
              animate={{
                opacity: refreshingSaved || savedPullDistance > 8 ? 1 : 0,
                y: refreshingSaved ? 0 : Math.min(savedPullDistance * 0.25, 18),
              }}
              transition={prefersReducedMotion ? { duration: 0.01 } : { type: "spring", stiffness: 320, damping: 30 }}
              aria-live="polite"
            >
              <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-card/80 px-3 py-1.5 text-xs text-muted-foreground shadow-lg shadow-black/10 backdrop-blur-xl">
                <motion.span
                  className="h-2 w-2 rounded-full bg-primary"
                  animate={{
                    scale: refreshingSaved ? [1, 1.35, 1] : savedPullDistance >= 72 ? 1.2 : 0.85,
                    opacity: savedPullDistance >= 72 || refreshingSaved ? 1 : 0.55,
                  }}
                  transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.7, repeat: refreshingSaved ? Infinity : 0 }}
                />
                {refreshingSaved ? "Refreshing saved meetups" : savedPullDistance >= 72 ? "Release to refresh" : "Pull to refresh"}
              </div>
            </motion.div>

            <motion.div
              animate={{ y: prefersReducedMotion ? 0 : Math.min(savedPullDistance * 0.28, 24) }}
              transition={prefersReducedMotion ? { duration: 0.01 } : { type: "spring", stiffness: 360, damping: 32 }}
            >
              {savedLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : savedMeetups.length === 0 ? (
                <Empty className="mx-4 my-8 rounded-3xl border border-border/60 bg-card/70 px-6 py-14">
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="h-14 w-14 rounded-2xl bg-primary/10 text-primary">
                      <Heart className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>No saved meetups yet</EmptyTitle>
                    <EmptyDescription>Save meetups from Today or Discover to keep them here.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="px-4 py-6 space-y-6">
                  {savedMeetups.map((meetup) => (
                    <MeetupCard
                      key={meetup.id}
                      meetup={meetup as MeetupWithCreator}
                      loadUserState
                      onNavigateToMessages={onNavigateToMessages}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {isAuthenticated && profile && (
        <EditProfileModal
          profile={profile}
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          initialTab={editProfileTab}
        />
      )}
    </div>
  )
}
