"use client"

import { useState } from "react"
import { MapPin, Clock, MessageCircle, Heart, Coffee, Camera, Utensils, Moon, BookOpen, Gamepad2, Map } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MeetupWithCreator, MoodStatus } from "@/lib/types"

interface MeetupCardProps {
  meetup: MeetupWithCreator
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

const CATEGORY_IMAGES: Record<string, string> = {
  coffee: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
  photo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop",
  walk: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=600&h=400&fit=crop",
  study: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&h=400&fit=crop",
  gaming: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop",
  explore: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=400&fit=crop",
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

export function MeetupCard({ meetup }: MeetupCardProps) {
  const [liked, setLiked] = useState(false)
  const creatorMood = (meetup.creator.mood as MoodStatus) ?? "exploring"
  const categoryImage = CATEGORY_IMAGES[meetup.category] ?? CATEGORY_IMAGES.coffee

  return (
    <article className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 transition-all duration-500 hover:border-primary/30">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={categoryImage}
          alt={meetup.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        
        {/* Time Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground border-0">
            <Clock className="w-3 h-3 mr-1" />
            {formatTime(meetup.starts_at)}
          </Badge>
        </div>

        {/* Like Button */}
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-background/80"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart className={cn("w-5 h-5 transition-colors", liked ? "fill-accent text-accent" : "text-foreground")} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* User Info */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-11 h-11 ring-2 ring-primary/20">
            <AvatarImage 
              src={meetup.creator.avatar_url ?? undefined} 
              alt={meetup.creator.display_name ?? "User"} 
            />
            <AvatarFallback>
              {(meetup.creator.display_name ?? "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {meetup.creator.display_name ?? "Anonymous"}
              </span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full", STATUS_COLORS[creatorMood])}>
                {STATUS_LABELS[creatorMood]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              {meetup.creator.languages.slice(0, 3).map((lang, i) => (
                <span key={lang}>
                  {lang}
                  {i < Math.min(meetup.creator.languages.length, 3) - 1 && <span className="mx-1">·</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium leading-snug mb-3 text-balance">
          {meetup.title}
        </h3>

        {/* Location & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{meetup.location_name ?? `${meetup.city}, ${meetup.country}`}</span>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-all hover:glow-amber">
            <MessageCircle className="w-4 h-4" />
            <span>Join</span>
          </button>
        </div>
      </div>
    </article>
  )
}
