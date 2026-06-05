"use client"

import { useEffect, useRef } from "react"
import { Home, Compass, Plus, MessageCircle, User } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { Haptics, ImpactStyle } from "@capacitor/haptics"
import { Capacitor } from "@capacitor/core"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: "feed" | "discover" | "create" | "messages" | "profile"
  onTabChange: (tab: "feed" | "discover" | "create" | "messages" | "profile") => void
}

const bubbleTransition = {
  type: "spring",
  stiffness: 520,
  damping: 38,
  mass: 0.72,
} as const

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const prefersReducedMotion = useReducedMotion()
  const hasMountedRef = useRef(false)
  const tabs = [
    { id: "feed" as const, icon: Home, label: "Today" },
    { id: "discover" as const, icon: Compass, label: "Discover" },
    { id: "create" as const, icon: Plus, label: "Create" },
    { id: "messages" as const, icon: MessageCircle, label: "Messages" },
    { id: "profile" as const, icon: User, label: "Profile" },
  ]

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    if (activeTab === "create" || !Capacitor.isNativePlatform()) return

    const timer = window.setTimeout(() => {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
    }, prefersReducedMotion ? 0 : 90)

    return () => window.clearTimeout(timer)
  }, [activeTab, prefersReducedMotion])

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg">
        <div className="pointer-events-auto grid h-[74px] grid-cols-5 items-center gap-1 overflow-hidden rounded-[2.15rem] border border-white/[0.11] bg-background/58 px-1.5 shadow-[0_18px_46px_rgb(0_0_0_/_0.32),inset_0_1px_0_rgb(255_255_255_/_0.08)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/42">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const isCreate = tab.id === "create"

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileTap={prefersReducedMotion ? undefined : { scale: isCreate ? 0.94 : 0.97 }}
                className={cn(
                  "relative flex h-[62px] min-w-0 flex-col items-center justify-center gap-1 rounded-[1.75rem] px-1 transition-colors duration-150",
                  isCreate && "overflow-visible pb-0 pt-0",
                  isActive && !isCreate && "text-primary",
                  !isActive && !isCreate && "text-muted-foreground/78 hover:text-foreground"
                )}
                aria-label={tab.label}
              >
                {isCreate ? (
                  <motion.div
                    className="drift-nav-create flex h-[52px] w-[52px] items-center justify-center rounded-[1.35rem]"
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
                  >
                    <Plus className="h-6 w-6 text-primary-foreground" strokeWidth={2.35} />
                  </motion.div>
                ) : (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="bottom-nav-bubble"
                        className="absolute inset-y-1.5 inset-x-1 rounded-[1.65rem] border border-white/[0.12] bg-white/[0.105] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.11),0_10px_28px_rgb(37_99_255_/_0.14)] backdrop-blur-xl"
                        transition={prefersReducedMotion ? { duration: 0.01 } : bubbleTransition}
                      />
                    )}
                    <motion.span
                      animate={{
                        scale: isActive ? 1.07 : 1,
                        opacity: isActive ? 1 : 0.72,
                      }}
                      transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.18 }}
                      className="relative z-10 flex h-7 items-center justify-center"
                    >
                      <tab.icon className={cn("h-[22px] w-[22px]", isActive && "drop-shadow-[0_0_6px_rgb(0_212_204_/_0.3)]")} strokeWidth={isActive ? 2.35 : 2.05} />
                    </motion.span>
                    <motion.span
                      animate={{
                        opacity: isActive ? 1 : 0.72,
                        y: isActive ? 0 : 1,
                      }}
                      transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.18 }}
                      className="relative z-10 max-w-full truncate text-[10px] font-medium leading-none"
                    >
                      {tab.label}
                    </motion.span>
                  </>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
