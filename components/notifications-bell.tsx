"use client"

import { Bell, Users, Heart, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useNotifications } from "@/hooks/use-notifications"
import { formatDistanceToNow } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/types"
import { useState } from "react"

const TYPE_ICON: Record<string, React.ReactNode> = {
  meetup_join: <Heart className="w-3.5 h-3.5 text-emerald-400" />,
}

function NotificationRow({ n }: { n: Notification }) {
  const icon = TYPE_ICON[n.type] ?? <Bell className="w-3.5 h-3.5 text-primary" />

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 transition-colors",
        !n.read && "bg-primary/5"
      )}
    >
      {/* Avatar or icon */}
      <div className="relative flex-shrink-0 mt-0.5">
        {n.related_user ? (
          <Avatar className="w-10 h-10">
            <AvatarImage src={n.related_user.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {(n.related_user.display_name ?? "?")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center">
          {icon}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-snug", !n.read ? "text-foreground font-medium" : "text-muted-foreground")}>
          {n.body}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {formatDistanceToNow(new Date(n.created_at))}
        </p>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}
    </div>
  )
}

interface NotificationsBellProps {
  className?: string
}

export function NotificationsBell({ className }: NotificationsBellProps) {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, isLoading, markAllRead } = useNotifications({ enabled: open })

  const handleOpen = (open: boolean) => {
    setOpen(open)
    if (open && unreadCount > 0) {
      // Small delay so the badge is visible briefly before clearing
      setTimeout(markAllRead, 800)
    }
  }

  return (
    <Sheet onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-secondary",
            className
          )}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full max-w-sm gap-0 p-0 bg-background border-border/50"
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-5 pb-4 pr-20 pt-[calc(var(--drift-safe-top)+0.875rem)]">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <SheetTitle className="truncate text-xl font-semibold leading-tight">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {unreadCount} unread
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          {isLoading ? (
            <div className="flex min-h-full items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <Bell className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-muted-foreground">No notifications yet</p>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground/60">
                When someone joins your meetup, you&apos;ll see it here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((n) => (
                <NotificationRow key={n.id} n={n} />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
