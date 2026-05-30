"use client"

import { Home, Compass, Plus, MessageCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: "feed" | "discover" | "create" | "messages" | "profile"
  onTabChange: (tab: "feed" | "discover" | "create" | "messages" | "profile") => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "feed" as const, icon: Home, label: "Feed" },
    { id: "discover" as const, icon: Compass, label: "Discover" },
    { id: "create" as const, icon: Plus, label: "Create" },
    { id: "messages" as const, icon: MessageCircle, label: "Messages" },
    { id: "profile" as const, icon: User, label: "Profile" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border z-50">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-between py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id || (tab.id === "create" && false)
            const isCreate = tab.id === "create"

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-300 min-w-0",
                  isCreate && "relative -mt-6",
                  isActive && !isCreate && "text-primary",
                  !isActive && !isCreate && "text-muted-foreground hover:text-foreground"
                )}
                aria-label={tab.label}
              >
                {isCreate ? (
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg glow-amber">
                    <Plus className="w-7 h-7 text-primary-foreground" />
                  </div>
                ) : (
                  <>
                    <tab.icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_oklch(0.75_0.12_55)]")} />
                    <span className="text-[10px] font-medium truncate max-w-full">{tab.label}</span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>
      {/* Safe area padding for mobile */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
