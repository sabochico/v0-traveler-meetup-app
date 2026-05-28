"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion"
import {
  MapPin, X, Heart, Loader2, Coffee, Camera, Utensils,
  Moon, BookOpen, Gamepad2, Map, Users, ChevronRight, Sparkles,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MeetupCard } from "./meetup-card"
import { MoodStatus } from "./mood-status"
import { EditProfileModal } from "./edit-profile-modal"
import { useMeetups } from "@/hooks/use-meetups"
import { useSavedMeetupsWithDetails } from "@/hooks/use-saved-meetups"
import { useProfile, useUpdateProfile, useNearbyProfiles } from "@/hooks/use-profile"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import type { MoodStatus as MoodStatusType, MeetupWithCreator, Profile } from "@/lib/types"

// ─── Profile completion ──────────────────────────────────────────────────────

function calcProfileScore(p: Profile): number {
  let score = 0
  if (p.display_name) score += 20
  if (p.avatar_url) score += 25
  if ((p.bio?.length ?? 0) >= 20) score += 20
  if (p.current_city) score += 15
  if ((p.interests?.length ?? 0) >= 3) score += 15
  if (p.mood) score += 5
  return score
}

interface ProfileCompletionBannerProps {
  profile: Profile
  onComplete: () => void
  onDismiss: () => void
}

function ProfileCompletionBanner({ profile, onComplete, onDismiss }: ProfileCompletionBannerProps) {
  const score = calcProfileScore(profile)

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-4 mt-3 rounded-2xl border border-primary/25 bg-primary/6 overflow-hidden"
    >
      <div className="px-4 pt-3.5 pb-3">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Profile{" "}
              <span className="text-primary font-semibold">{score}%</span>
              {" "}complete
            </span>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-secondary mb-3">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          />
        </div>

        {/* CTA */}
        <button
          onClick={onComplete}
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/18 active:scale-[0.98] transition-all"
        >
          <span>Complete your profile</span>
          <ChevronRight className="w-4 h-4 opacity-70" />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Constants ──────────────────────────────────────────────────────────────

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

const CATEGORY_BG: Record<string, string> = {
  coffee:  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=900&fit=crop&q=80",
  food:    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=900&fit=crop&q=80",
  photo:   "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=900&fit=crop&q=80",
  walk:    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=900&fit=crop&q=80",
  study:   "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=900&fit=crop&q=80",
  gaming:  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=900&fit=crop&q=80",
  explore: "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=600&h=900&fit=crop&q=80",
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

const MOCK_MEETUPS: MeetupWithCreator[] = [
  {
    id: "1", creator_id: "mock-1",
    title: "Anyone want to grab coffee in Shibuya?",
    description: null, category: "coffee",
    location_name: "Shibuya, Tokyo", location: null,
    city: "Tokyo", country: "Japan", max_attendees: 4,
    starts_at: new Date().toISOString(), ends_at: null,
    is_active: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    creator: {
      id: "mock-1", display_name: "Mika",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
      bio: null, interests: [], languages: ["日本語", "English"],
      mood: "exploring", travel_mode: true, is_online: true,
      anonymous_mode: false, current_city: "Tokyo", current_country: "Japan",
      location: null, instagram_handle: null, last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  },
  {
    id: "2", creator_id: "mock-2",
    title: "Working remotely in Seoul today, looking for cafe company",
    description: null, category: "coffee",
    location_name: "Hongdae, Seoul", location: null,
    city: "Seoul", country: "South Korea", max_attendees: 4,
    starts_at: new Date(Date.now() + 2 * 3600000).toISOString(), ends_at: null,
    is_active: true,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    creator: {
      id: "mock-2", display_name: "Leo",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      bio: null, interests: [], languages: ["English", "한국어"],
      mood: "working", travel_mode: true, is_online: false,
      anonymous_mode: false, current_city: "Seoul", current_country: "South Korea",
      location: null, instagram_handle: null, last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  },
  {
    id: "3", creator_id: "mock-3",
    title: "First week in Taipei — want to explore night markets!",
    description: null, category: "food",
    location_name: "Ximending, Taipei", location: null,
    city: "Taipei", country: "Taiwan", max_attendees: 4,
    starts_at: new Date(Date.now() + 8 * 3600000).toISOString(), ends_at: null,
    is_active: true,
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    creator: {
      id: "mock-3", display_name: "Sofia",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
      bio: null, interests: [], languages: ["Español", "English", "中文"],
      mood: "social", travel_mode: true, is_online: true,
      anonymous_mode: false, current_city: "Taipei", current_country: "Taiwan",
      location: null, instagram_handle: null, last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  },
  {
    id: "4", creator_id: "mock-4",
    title: "Late night photography walk through Shinjuku",
    description: null, category: "photo",
    location_name: "Shinjuku, Tokyo", location: null,
    city: "Tokyo", country: "Japan", max_attendees: 4,
    starts_at: new Date(Date.now() + 10 * 3600000).toISOString(), ends_at: null,
    is_active: true,
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    creator: {
      id: "mock-4", display_name: "Kai",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
      bio: null, interests: [], languages: ["English", "日本語"],
      mood: "homesick", travel_mode: true, is_online: false,
      anonymous_mode: false, current_city: "Tokyo", current_country: "Japan",
      location: null, instagram_handle: null, last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  },
]

// ─── Join limit helpers ──────────────────────────────────────────────────────

function getTodayKey() {
  return `drift-joins-${new Date().toISOString().split("T")[0]}`
}

function getJoinsToday(): number {
  if (typeof window === "undefined") return 0
  return parseInt(localStorage.getItem(getTodayKey()) ?? "0", 10)
}

function recordJoin(): number {
  const key = getTodayKey()
  const next = getJoinsToday() + 1
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

// ─── Confetti ────────────────────────────────────────────────────────────────

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

// ─── Match Celebration ───────────────────────────────────────────────────────

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
          🎉
        </motion.div>
        <h2 className="text-4xl font-serif font-bold text-white mb-3 tracking-tight">
          You joined! 🎊
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
          <span className="text-white/55 text-sm">with {meetup.creator?.display_name}</span>
        </div>
        <p className="text-white/25 text-xs mt-8">Tap anywhere to continue</p>
      </motion.div>
    </motion.div>
  )
}

// ─── Card face (shared by top card and back-stack preview) ───────────────────

function CardFace({ meetup }: { meetup: MeetupWithCreator }) {
  const cat = CATEGORY_CONFIG[meetup.category] ?? CATEGORY_CONFIG.explore
  const CatIcon = cat.icon
  const mood = meetup.creator?.mood ?? "exploring"
  const avatarUrl = meetup.creator?.avatar_url
  const initial = (meetup.creator?.display_name ?? "?")[0].toUpperCase()

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden relative bg-zinc-900">
      {avatarUrl ? (
        /* Full-bleed creator photo */
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${avatarUrl})` }}
        />
      ) : (
        /* Gradient fallback with large initial */
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/50 to-black/80" />
          <div className="absolute inset-0 flex items-center justify-center pb-24 select-none">
            <span className="text-[140px] font-serif font-bold text-white/20 leading-none">
              {initial}
            </span>
          </div>
        </>
      )}

      {/* Deep gradient: transparent top → opaque black bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.75) 28%, rgba(0,0,0,0.25) 55%, transparent 75%)",
        }}
      />

      {/* Subtle top vignette so badges read cleanly */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 22%)",
        }}
      />

      {/* Category pill — top left */}
      <div className="absolute top-5 left-5 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
        <CatIcon className="w-3.5 h-3.5 text-white" />
        <span className="text-white text-xs font-semibold tracking-wide">{cat.label}</span>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-7">
        {/* Creator name + mood dot + languages */}
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
              <span className="text-white/30 text-sm">·</span>
              {meetup.creator.languages.slice(0, 2).map((l) => (
                <span key={l} className="text-white/50 text-xs">
                  {l}
                </span>
              ))}
            </>
          )}
        </div>

        {/* Meetup title */}
        <h2 className="text-white text-2xl font-serif font-bold leading-tight mb-3 drop-shadow-sm">
          {meetup.title}
        </h2>

        {/* Location + time */}
        <div className="flex items-center gap-4 text-white/60 text-sm">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-white/45 flex-shrink-0" />
            <span className="truncate">{meetup.location_name ?? meetup.city}</span>
          </span>
          <span className="flex-shrink-0">🕐 {formatTime(meetup.starts_at)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Swipeable top card ───────────────────────────────────────────────────────

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

      {/* SKIP stamp */}
      <motion.div
        className="absolute top-7 left-6 pointer-events-none"
        style={{ opacity: skipOpacity }}
      >
        <div className="border-[3px] border-red-500 rounded-xl px-4 py-1.5 -rotate-[18deg]">
          <span className="text-red-500 text-2xl font-black tracking-widest">SKIP</span>
        </div>
      </motion.div>

      {/* JOIN stamp */}
      <motion.div
        className="absolute top-7 right-6 pointer-events-none"
        style={{ opacity: joinOpacity }}
      >
        <div className="border-[3px] border-emerald-400 rounded-xl px-4 py-1.5 rotate-[18deg]">
          <span className="text-emerald-400 text-2xl font-black tracking-widest">JOIN</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Swipe feed (card stack + controls) ──────────────────────────────────────

interface SwipeFeedProps {
  meetups: MeetupWithCreator[]
  isLoading: boolean
}

function SwipeFeed({ meetups, isLoading }: SwipeFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null)
  const [matchMeetup, setMatchMeetup] = useState<MeetupWithCreator | null>(null)
  const [joinsToday, setJoinsToday] = useState(0)

  useEffect(() => {
    setJoinsToday(getJoinsToday())
    const t = setTimeout(() => setJoinsToday(0), getMsUntilMidnight())
    return () => clearTimeout(t)
  }, [])

  const limitReached = joinsToday >= DAILY_LIMIT
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

  const handleExitComplete = useCallback(() => {
    if (leaving === "right") {
      const joins = recordJoin()
      setJoinsToday(joins)
      if (currentMeetup) setMatchMeetup(currentMeetup)
    }
    setLeaving(null)
    setCurrentIndex((i) => i + 1)
  }, [leaving, currentMeetup])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (allSwiped || meetups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8">
        <div className="text-6xl">✨</div>
        <h3 className="text-xl font-serif font-semibold text-foreground">You&apos;re all caught up</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          No more meetups right now. Check back soon or create your own!
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="mt-2 px-8 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium"
        >
          Start over
        </button>
      </div>
    )
  }

  const remaining = meetups.length - currentIndex
  const dotCount = Math.min(remaining, 5)

  return (
    <>
      <div className="flex flex-col items-center px-3 pt-1 pb-3 gap-3">
        {/* Card stack — height leaves room for buttons without scrolling */}
        <div
          className="relative w-full"
          style={{ height: "clamp(320px, calc(100dvh - 380px), 500px)" }}
        >
          {/* Back card — scales up as top card departs */}
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

          {/* Top draggable card */}
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

        {/* Progress dots */}
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

        {/* Action buttons + join counter */}
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-end justify-center gap-12">
            {/* Skip */}
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

            {/* Join */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => doSwipe("right")}
                disabled={!!leaving || limitReached}
                aria-label="Join"
                className="w-[68px] h-[68px] rounded-full bg-card border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500/80 active:scale-90 transition-all duration-150 disabled:opacity-35"
              >
                <Heart className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />
              </button>
              <span className="text-xs font-medium text-muted-foreground tracking-wide">Join</span>
            </div>
          </div>

          {/* Joins counter */}
          <div className="text-xs text-muted-foreground/70">
            {limitReached ? (
              <span className="text-destructive/70">Daily limit reached · Resets at midnight</span>
            ) : (
              <>
                <span className="text-primary font-semibold">{DAILY_LIMIT - joinsToday}</span>
                {" joins left today"}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Match overlay */}
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

// ─── Main export ─────────────────────────────────────────────────────────────

interface FeedViewProps {
  onNavigateToMessages?: (conversationId: string) => void
}

export function FeedView({ onNavigateToMessages }: FeedViewProps) {
  const [activeTab, setActiveTab] = useState<"feed" | "saved">("feed")
  const [browseAll, setBrowseAll] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const { meetups, isLoading } = useMeetups()
  const { savedMeetups, isLoading: savedLoading } = useSavedMeetupsWithDetails()
  const { profile } = useProfile()
  const { updateMood } = useUpdateProfile()
  const { profiles } = useNearbyProfiles()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (sessionStorage.getItem("drift-profile-banner-dismissed") === "1") {
      setBannerDismissed(true)
    }
  }, [])

  const handleDismissBanner = () => {
    sessionStorage.setItem("drift-profile-banner-dismissed", "1")
    setBannerDismissed(true)
  }

  const currentMood = (profile?.mood as MoodStatusType) ?? "exploring"
  const userCity = profile?.current_city
  const nearbyCount = profiles.length > 0 ? profiles.length : 4

  const handleMoodChange = async (mood: MoodStatusType) => {
    if (isAuthenticated) await updateMood(mood)
  }

  const displayMeetups = meetups.length > 0 ? meetups : MOCK_MEETUPS

  const filteredMeetups =
    browseAll || !userCity
      ? displayMeetups
      : displayMeetups.filter((m) => m.city?.toLowerCase() === userCity.toLowerCase())

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-serif font-semibold tracking-tight">drift</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {browseAll ? "All cities" : `Near you in ${userCity ?? "Tokyo"}`}
                </span>
                <span className="flex items-center gap-1 text-emerald-400/80">
                  <Users className="w-3 h-3" />
                  {nearbyCount} nearby
                </span>
              </div>
            </div>
            <MoodStatus currentMood={currentMood} onMoodChange={handleMoodChange} />
          </div>

          {/* Feed / Saved tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("feed")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === "feed"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Feed
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === "saved"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <Heart className="w-3.5 h-3.5" />
              Saved
            </button>
          </div>

          {/* Browse all toggle */}
          {activeTab === "feed" && userCity && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>{browseAll ? "Showing all cities" : "Near you"}</span>
              <button
                onClick={() => setBrowseAll((b) => !b)}
                className="text-primary hover:underline"
              >
                {browseAll ? "Near me" : "Browse all"}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Profile completion banner */}
      <div className="max-w-lg mx-auto">
        <AnimatePresence>
          {activeTab === "feed" && isAuthenticated && profile && !bannerDismissed && calcProfileScore(profile) < 80 && (
            <ProfileCompletionBanner
              profile={profile}
              onComplete={() => setShowEditProfile(true)}
              onDismiss={handleDismissBanner}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto">
        {activeTab === "feed" ? (
          <SwipeFeed meetups={filteredMeetups} isLoading={isLoading} />
        ) : savedLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : savedMeetups.length === 0 ? (
          <div className="text-center py-16 px-8">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No saved meetups yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Swipe right on meetups to save them here.
            </p>
          </div>
        ) : (
          <div className="px-4 py-6 space-y-6">
            {savedMeetups.map((meetup) => (
              <MeetupCard
                key={meetup.id}
                meetup={meetup as MeetupWithCreator}
                onNavigateToMessages={onNavigateToMessages}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit profile modal */}
      {isAuthenticated && profile && (
        <EditProfileModal
          profile={profile}
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
        />
      )}
    </div>
  )
}
