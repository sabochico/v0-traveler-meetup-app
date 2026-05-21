"use client"

import { useState } from "react"
import { MapPin, Clock, MessageCircle, Heart } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MeetupCardProps {
  meetup: {
    id: string
    user: {
      name: string
      avatar: string
      languages: string[]
      status: "social" | "working" | "exploring" | "homesick"
    }
    title: string
    location: string
    type: "coffee" | "food" | "photo" | "walk" | "study" | "gaming" | "explore"
    time: string
    distance: string
    image: string
  }
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

export function MeetupCard({ meetup }: MeetupCardProps) {
  const [liked, setLiked] = useState(false)

  return (
    <article className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 transition-all duration-500 hover:border-primary/30">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={meetup.image}
          alt={meetup.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        
        {/* Time Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground border-0">
            <Clock className="w-3 h-3 mr-1" />
            {meetup.time}
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
            <AvatarImage src={meetup.user.avatar} alt={meetup.user.name} />
            <AvatarFallback>{meetup.user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{meetup.user.name}</span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full", STATUS_COLORS[meetup.user.status])}>
                {STATUS_LABELS[meetup.user.status]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              {meetup.user.languages.map((lang, i) => (
                <span key={lang}>
                  {lang}
                  {i < meetup.user.languages.length - 1 && <span className="mx-1">·</span>}
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
            <span>{meetup.location}</span>
            <span className="text-primary">· {meetup.distance}</span>
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
