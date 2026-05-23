"use client"

import { useState } from "react"
import { X, MapPin, MessageCircle, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useCreateConversation } from "@/hooks/use-messages"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import type { Profile, MoodStatus } from "@/lib/types"

const STATUS_COLORS = {
  social: "bg-emerald-500/20 text-emerald-400",
  working: "bg-amber-500/20 text-amber-400",
  exploring: "bg-blue-500/20 text-blue-400",
  homesick: "bg-purple-500/20 text-purple-400",
}

const STATUS_LABELS = {
  social: "Feeling social",
  working: "Working quietly",
  exploring: "Exploring",
  homesick: "Homesick",
}

interface UserProfileSheetProps {
  user: Profile | null
  isOpen: boolean
  onClose: () => void
  onNavigateToMessages?: () => void
}

export function UserProfileSheet({ user, isOpen, onClose, onNavigateToMessages }: UserProfileSheetProps) {
  const { user: currentUser } = useAuth()
  const { startConversation } = useCreateConversation()
  const [sending, setSending] = useState(false)

  if (!user) return null

  const mood = (user.mood as MoodStatus) ?? "exploring"
  const isOwnProfile = currentUser?.id === user.id

  const handleSayHi = async () => {
    if (!currentUser || isOwnProfile) return
    
    setSending(true)
    try {
      await startConversation(user.id, "Hey! Saw your profile and wanted to say hi.")
      onClose()
      onNavigateToMessages?.()
    } catch (error) {
      console.error("Failed to start conversation:", error)
      alert("Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl bg-background border-border p-0">
        {/* Header */}
        <div className="relative pt-6 pb-4 px-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-8 overflow-y-auto">
          {/* Avatar & Name */}
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar className="w-24 h-24 ring-4 ring-primary/20 mb-4">
              <AvatarImage src={user.avatar_url ?? undefined} alt={user.display_name ?? "User"} />
              <AvatarFallback className="text-2xl">
                {(user.display_name ?? "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <h2 className="text-xl font-semibold text-foreground mb-1">
              {user.display_name ?? "Anonymous Traveler"}
            </h2>
            
            <span className={cn("text-sm px-3 py-1 rounded-full", STATUS_COLORS[mood])}>
              {STATUS_LABELS[mood]}
            </span>
          </div>

          {/* Location */}
          {(user.current_city || user.current_country) && (
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mb-6">
              <MapPin className="w-4 h-4 text-primary" />
              <span>
                {user.current_city && user.current_country 
                  ? `${user.current_city}, ${user.current_country}`
                  : user.current_city || user.current_country}
              </span>
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <p className="text-center text-muted-foreground mb-6 max-w-sm mx-auto">
              {user.bio}
            </p>
          )}

          {/* Languages */}
          {user.languages && user.languages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-2 text-center">Languages</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {user.languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="bg-secondary text-secondary-foreground">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-foreground mb-2 text-center">Interests</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {user.interests.map((interest) => (
                  <Badge key={interest} variant="outline" className="border-primary/30 text-foreground">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          {!isOwnProfile && currentUser && (
            <button
              onClick={handleSayHi}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-all hover:glow-amber disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
              <span>Say Hi</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
