"use client"

import { ReactNode, TouchEvent, useCallback, useRef, useState } from "react"
import { Haptics } from "@capacitor/haptics"
import { motion, useReducedMotion } from "framer-motion"

const REFRESH_THRESHOLD = 72
const MAX_PULL_DISTANCE = 96

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<unknown> | unknown
  refreshingLabel?: string
  className?: string
  disabled?: boolean
}

export function PullToRefresh({
  children,
  onRefresh,
  refreshingLabel = "Refreshing",
  className,
  disabled = false,
}: PullToRefreshProps) {
  const prefersReducedMotion = useReducedMotion()
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullStartY = useRef<number | null>(null)
  const hapticFired = useRef(false)

  const refresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh, refreshing])

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (disabled || window.scrollY > 2) return
    pullStartY.current = event.touches[0]?.clientY ?? null
    hapticFired.current = false
  }

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const startY = pullStartY.current
    if (disabled || startY === null || refreshing || window.scrollY > 2) return

    const distance = Math.max(0, event.touches[0]?.clientY - startY)
    const nextDistance = Math.min(distance, MAX_PULL_DISTANCE)
    setPullDistance(nextDistance)

    if (nextDistance >= REFRESH_THRESHOLD && !hapticFired.current) {
      hapticFired.current = true
      Haptics.selectionChanged().catch(() => {})
    }
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startY = pullStartY.current
    pullStartY.current = null
    const shouldRefresh = pullDistance >= REFRESH_THRESHOLD
    setPullDistance(0)
    if (disabled || startY === null || refreshing) return

    const endY = event.changedTouches[0]?.clientY ?? startY
    if ((shouldRefresh || endY - startY > REFRESH_THRESHOLD) && window.scrollY <= 2) {
      void refresh()
    }
  }

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        className="pointer-events-none flex items-center justify-center pt-3"
        animate={{
          opacity: refreshing || pullDistance > 8 ? 1 : 0,
          y: refreshing ? 0 : Math.min(pullDistance * 0.25, 18),
        }}
        transition={prefersReducedMotion ? { duration: 0.01 } : { type: "spring", stiffness: 320, damping: 30 }}
        aria-live="polite"
      >
        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-card/80 px-3 py-1.5 text-xs text-muted-foreground shadow-lg shadow-black/10 backdrop-blur-xl">
          <motion.span
            className="h-2 w-2 rounded-full bg-primary"
            animate={{
              scale: refreshing ? [1, 1.35, 1] : pullDistance >= REFRESH_THRESHOLD ? 1.2 : 0.85,
              opacity: pullDistance >= REFRESH_THRESHOLD || refreshing ? 1 : 0.55,
            }}
            transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.7, repeat: refreshing ? Infinity : 0 }}
          />
          {refreshing ? refreshingLabel : pullDistance >= REFRESH_THRESHOLD ? "Release to refresh" : "Pull to refresh"}
        </div>
      </motion.div>

      <motion.div
        animate={{ y: prefersReducedMotion ? 0 : Math.min(pullDistance * 0.28, 24) }}
        transition={prefersReducedMotion ? { duration: 0.01 } : { type: "spring", stiffness: 360, damping: 32 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
