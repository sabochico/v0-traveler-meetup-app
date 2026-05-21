"use client"

import { useState } from "react"
import { Search, Filter, MapPin, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const NEARBY_PEOPLE = [
  {
    id: "1",
    name: "Yuki",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    status: "social" as const,
    distance: "0.2 km",
    bio: "Digital nomad from Berlin. Love finding hidden cafes.",
    languages: ["Deutsch", "English", "日本語"],
    interests: ["Photography", "Coffee", "Vinyl"],
  },
  {
    id: "2",
    name: "Marcus",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    status: "exploring" as const,
    distance: "0.5 km",
    bio: "Software engineer exploring Asia for 3 months.",
    languages: ["English", "Español"],
    interests: ["Coding", "Ramen", "Night walks"],
  },
  {
    id: "3",
    name: "Hana",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    status: "working" as const,
    distance: "0.8 km",
    bio: "Freelance writer. Always looking for quiet study spots.",
    languages: ["한국어", "English"],
    interests: ["Writing", "Tea", "Bookstores"],
  },
  {
    id: "4",
    name: "Alex",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
    status: "homesick" as const,
    distance: "1.1 km",
    bio: "Exchange student from Canada. Missing home but loving Tokyo.",
    languages: ["English", "Français"],
    interests: ["Music", "Gaming", "Anime"],
  },
]

const STATUS_STYLES = {
  social: { color: "bg-emerald-500", label: "Feeling social" },
  working: { color: "bg-amber-500", label: "Working quietly" },
  exploring: { color: "bg-blue-500", label: "Exploring" },
  homesick: { color: "bg-purple-500", label: "Homesick" },
}

export function DiscoverView() {
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-serif font-semibold">Discover</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}
                aria-label="List view"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === "map" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}
                aria-label="Map view"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, interest, or language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-secondary border-0 pl-10 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      {viewMode === "list" ? (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          {NEARBY_PEOPLE.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      ) : (
        <div className="h-[calc(100vh-180px)] relative">
          <MapView people={NEARBY_PEOPLE} />
        </div>
      )}
    </div>
  )
}

function PersonCard({ person }: { person: typeof NEARBY_PEOPLE[0] }) {
  return (
    <article className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300">
      <div className="flex gap-4">
        <div className="relative">
          <Avatar className="w-16 h-16 ring-2 ring-primary/20">
            <AvatarImage src={person.avatar} alt={person.name} />
            <AvatarFallback>{person.name[0]}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card",
              STATUS_STYLES[person.status].color
            )}
            title={STATUS_STYLES[person.status].label}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-foreground">{person.name}</h3>
            <span className="text-xs text-primary">{person.distance}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{person.bio}</p>
          
          <div className="flex flex-wrap gap-1.5">
            {person.interests.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="secondary" className="text-xs">
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {person.languages.map((lang, i) => (
            <span key={lang}>
              {lang}
              {i < person.languages.length - 1 && <span className="mx-1">·</span>}
            </span>
          ))}
        </div>
        <button className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:glow-amber transition-all">
          Say hi
        </button>
      </div>
    </article>
  )
}

function MapView({ people }: { people: typeof NEARBY_PEOPLE }) {
  return (
    <div className="w-full h-full bg-secondary relative overflow-hidden">
      {/* Stylized map background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 400 600">
          {/* Grid lines */}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 30} x2="400" y2={i * 30} stroke="currentColor" strokeWidth="0.5" className="text-border" />
          ))}
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 30} y1="0" x2={i * 30} y2="600" stroke="currentColor" strokeWidth="0.5" className="text-border" />
          ))}
        </svg>
      </div>

      {/* People markers */}
      {people.map((person, index) => {
        const positions = [
          { top: "30%", left: "40%" },
          { top: "45%", left: "60%" },
          { top: "55%", left: "35%" },
          { top: "70%", left: "55%" },
        ]
        const pos = positions[index % positions.length]

        return (
          <div
            key={person.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="relative">
              <Avatar className="w-12 h-12 ring-4 ring-card shadow-lg group-hover:ring-primary transition-all">
                <AvatarImage src={person.avatar} alt={person.name} />
                <AvatarFallback>{person.name[0]}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card",
                  STATUS_STYLES[person.status].color
                )}
              />
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-card px-3 py-2 rounded-lg shadow-lg border border-border whitespace-nowrap">
                <p className="font-medium text-sm text-foreground">{person.name}</p>
                <p className="text-xs text-muted-foreground">{person.distance}</p>
              </div>
            </div>
          </div>
        )
      })}

      {/* Center marker (you) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-6 h-6 rounded-full bg-primary glow-amber flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-primary/30 animate-ping" />
      </div>

      {/* Location label */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-foreground">Shibuya, Tokyo</span>
        </div>
      </div>
    </div>
  )
}
