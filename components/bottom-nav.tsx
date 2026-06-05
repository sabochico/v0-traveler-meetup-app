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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-card/85 backdrop-blur-2xl">
      <div className="max-w-lg mx-auto px-3">
        <div className="flex items-end justify-between pt-2.5 pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id || (tab.id === "create" && false)
            const isCreate = tab.id === "create"

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                className={cn(
                  "relative flex min-h-[58px] flex-1 flex-col items-center justify-end gap-1 rounded-2xl px-1 pb-1.5 pt-2 transition-colors duration-200 min-w-0 overflow-hidden",
                  isCreate && "relative -mt-4 pb-0 pt-0 overflow-visible",
                  isActive && !isCreate && "text-primary",
                  !isActive && !isCreate && "text-muted-foreground hover:text-foreground"
                )}
                aria-label={tab.label}
              >
                {isCreate ? (
                  <motion.div
                    className="drift-nav-create flex h-12 w-12 items-center justify-center rounded-[1.15rem]"
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
                  >
                    <Plus className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="bottom-nav-active"
                        className="absolute inset-x-1.5 bottom-1 top-1.5 rounded-2xl border border-primary/20 bg-primary/10"
                        transition={prefersReducedMotion ? { duration: 0.01 } : navTransition}
                      />
                    )}
                    <tab.icon className={cn("relative z-10 h-5.5 w-5.5", isActive && "drop-shadow-[0_0_6px_rgb(0_212_204_/_0.38)]")} />
                    <span className="relative z-10 text-[10px] font-medium leading-none truncate max-w-full">{tab.label}</span>
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
