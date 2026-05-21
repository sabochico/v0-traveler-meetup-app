"use client"

import { useState } from "react"
import { Sparkles, Laptop, Compass, Heart } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface MoodStatusProps {
  currentMood: "social" | "working" | "exploring" | "homesick"
  onMoodChange: (mood: "social" | "working" | "exploring" | "homesick") => void
}

const MOODS = [
  { id: "social" as const, label: "Feeling social", icon: Sparkles, color: "text-emerald-400 bg-emerald-500/20" },
  { id: "working" as const, label: "Working quietly", icon: Laptop, color: "text-amber-400 bg-amber-500/20" },
  { id: "exploring" as const, label: "Exploring", icon: Compass, color: "text-blue-400 bg-blue-500/20" },
  { id: "homesick" as const, label: "Homesick", icon: Heart, color: "text-purple-400 bg-purple-500/20" },
]

export function MoodStatus({ currentMood, onMoodChange }: MoodStatusProps) {
  const [open, setOpen] = useState(false)
  const current = MOODS.find(m => m.id === currentMood)!

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all",
          current.color
        )}>
          <current.icon className="w-4 h-4" />
          <span className="hidden sm:inline">{current.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 bg-card border-border" align="end">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-2 py-1">Your mood</p>
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => {
                onMoodChange(mood.id)
                setOpen(false)
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-all",
                currentMood === mood.id ? mood.color : "hover:bg-secondary text-foreground"
              )}
            >
              <mood.icon className="w-4 h-4" />
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
