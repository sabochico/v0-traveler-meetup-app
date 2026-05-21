"use client"

import { useState } from "react"
import { MapPin, Clock, Users, Coffee, Camera, Utensils, Moon, BookOpen, Gamepad2, Map } from "lucide-react"
import { MeetupCard } from "./meetup-card"
import { MoodStatus } from "./mood-status"
import { cn } from "@/lib/utils"

const MEETUP_TYPES = [
  { id: "all", label: "All", icon: null },
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "food", label: "Food", icon: Utensils },
  { id: "photo", label: "Photo", icon: Camera },
  { id: "walk", label: "Night Walk", icon: Moon },
  { id: "study", label: "Study", icon: BookOpen },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "explore", label: "Explore", icon: Map },
]

const MOCK_MEETUPS = [
  {
    id: "1",
    user: {
      name: "Mika",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
      languages: ["日本語", "English"],
      status: "exploring" as const,
    },
    title: "Anyone want to grab coffee in Shibuya?",
    location: "Shibuya, Tokyo",
    type: "coffee" as const,
    time: "Now",
    distance: "0.3 km",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop",
  },
  {
    id: "2",
    user: {
      name: "Leo",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
      languages: ["English", "한국어"],
      status: "working" as const,
    },
    title: "Working remotely in Seoul today, looking for cafe company",
    location: "Hongdae, Seoul",
    type: "coffee" as const,
    time: "2h",
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&h=400&fit=crop",
  },
  {
    id: "3",
    user: {
      name: "Sofia",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
      languages: ["Español", "English", "中文"],
      status: "social" as const,
    },
    title: "First week in Taipei, want to explore night markets!",
    location: "Ximending, Taipei",
    type: "food" as const,
    time: "Tonight",
    distance: "2.5 km",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
  },
  {
    id: "4",
    user: {
      name: "Kai",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
      languages: ["English", "日本語"],
      status: "homesick" as const,
    },
    title: "Late night photography walk through Shinjuku",
    location: "Shinjuku, Tokyo",
    type: "photo" as const,
    time: "11 PM",
    distance: "0.8 km",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop",
  },
]

export function FeedView() {
  const [selectedType, setSelectedType] = useState("all")
  const [currentMood, setCurrentMood] = useState<"social" | "working" | "exploring" | "homesick">("exploring")

  const filteredMeetups = selectedType === "all" 
    ? MOCK_MEETUPS 
    : MOCK_MEETUPS.filter(m => m.type === selectedType)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-serif font-semibold tracking-tight">drift</h1>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>Tokyo, Japan</span>
              </div>
            </div>
            <MoodStatus currentMood={currentMood} onMoodChange={setCurrentMood} />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {MEETUP_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all duration-300",
                  selectedType === type.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {type.icon && <type.icon className="w-3.5 h-3.5" />}
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Feed */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {filteredMeetups.map((meetup) => (
          <MeetupCard key={meetup.id} meetup={meetup} />
        ))}
      </div>
    </div>
  )
}
