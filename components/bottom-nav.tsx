"use client"

import { Home, Compass, Plus, MessageCircle, User } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"
import { navTransition } from "@/lib/motion"

interface BottomNavProps {
  activeTab: "feed" | "discover" | "create" | "messages" | "profile"
  onTabChange: (tab: "feed" | "discover" | "create" | "messages" | "profile") => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const prefersReducedMotion = useReducedMotion()
  const tabs = [
    { id: "feed" as const, icon: Home, label: "Today" },
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
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 py-2 px-1 rounded-xl transition-colors duration-200 min-w-0 overflow-hidden",
                  isCreate && "relative -mt-6",
                  isActive && !isCreate && "text-primary",
                  !isActive && !isCreate && "text-muted-foreground hover:text-foreground"
                )}
                aria-label={tab.label}
              >
                {isCreate ? (
                  <motion.div
                    className="w-14 h-14 rounded-2xl drift-gradient-button flex items-center justify-center glow-amber"
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
                  >
                    <Plus className="w-7 h-7 text-primary-foreground" />
                  </motion.div>
                ) : (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="bottom-nav-active"
                        className="absolute inset-x-1 inset-y-1 rounded-2xl border border-primary/20 bg-primary/10"
                        transition={prefersReducedMotion ? { duration: 0.01 } : navTransition}
                      />
                    )}
                    <tab.icon className={cn("relative z-10 w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgb(0_212_204_/_0.45)]")} />
                    <span className="relative z-10 text-[10px] font-medium truncate max-w-full">{tab.label}</span>
                  </>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
      {/* Safe area padding for mobile */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
