"use client"

import { Home, Compass, Plus, MessageCircle, User } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-background/78 shadow-[0_-14px_36px_rgb(0_0_0_/_0.22)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/62">
      <div className="mx-auto max-w-lg px-2.5">
        <div className="grid h-[66px] grid-cols-5 items-end gap-0.5 pb-2 pt-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id || (tab.id === "create" && false)
            const isCreate = tab.id === "create"

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                className={cn(
                  "relative flex h-[58px] min-w-0 flex-col items-center justify-end gap-1 rounded-[1.35rem] px-1 pb-1.5 pt-1.5 transition-colors duration-150",
                  isCreate && "overflow-visible pb-0 pt-0",
                  isActive && !isCreate && "text-primary",
                  !isActive && !isCreate && "text-muted-foreground/78 hover:text-foreground"
                )}
                aria-label={tab.label}
              >
                {isCreate ? (
                  <motion.div
                    className="drift-nav-create mb-1 flex h-[50px] w-[50px] items-center justify-center rounded-[1.25rem]"
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
                  >
                    <Plus className="h-6 w-6 text-primary-foreground" strokeWidth={2.35} />
                  </motion.div>
                ) : (
                  <>
                    <span
                      className={cn(
                        "flex h-8 w-11 items-center justify-center rounded-2xl transition-colors duration-150",
                        isActive && "bg-primary/10 text-primary"
                      )}
                    >
                      <tab.icon className={cn("h-[22px] w-[22px]", isActive && "drop-shadow-[0_0_5px_rgb(0_212_204_/_0.26)]")} strokeWidth={2.15} />
                    </span>
                    <span className="max-w-full truncate text-[10px] font-medium leading-none">{tab.label}</span>
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
