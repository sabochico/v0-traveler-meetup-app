"use client"

import { Bell, Users, Heart, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useNotifications } from "@/hooks/use-notifications"
import { formatDistanceToNow } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/types"

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
  const { notifications, unreadCount, isLoading, markAllRead } = useNotifications()

  const handleOpen = (open: boolean) => {
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
        className="w-full max-w-sm p-0 bg-background border-border/50"
      >
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-serif font-semibold">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {unreadCount} unread
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                <Bell className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">No notifications yet</p>
              <p className="text-sm text-muted-foreground/60">
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
