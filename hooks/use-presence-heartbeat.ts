"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

const HEARTBEAT_MS = 45 * 1000
const MIN_TOUCH_INTERVAL_MS = 30 * 1000

export function usePresenceHeartbeat(enabled: boolean) {
  const lastTouchRef = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()
    let intervalId: ReturnType<typeof setInterval> | null = null
    let stopped = false

    const touchPresence = async (force = false) => {
      if (stopped || document.visibilityState !== "visible") return

      const now = Date.now()
      if (!force && now - lastTouchRef.current < MIN_TOUCH_INTERVAL_MS) return
      lastTouchRef.current = now

      const { error } = await supabase.rpc("touch_profile_activity")
      if (error) {
        console.debug("[Drift presence] heartbeat skipped", error.message)
      }
    }

    const startHeartbeat = () => {
      void touchPresence(true)
      if (intervalId) clearInterval(intervalId)
      intervalId = setInterval(() => {
        void touchPresence()
      }, HEARTBEAT_MS)
    }

    const stopHeartbeat = () => {
      if (!intervalId) return
      clearInterval(intervalId)
      intervalId = null
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startHeartbeat()
      } else {
        stopHeartbeat()
      }
    }

    const handleUserActivity = () => {
      void touchPresence()
    }

    startHeartbeat()
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", startHeartbeat)
    window.addEventListener("pageshow", startHeartbeat)
    window.addEventListener("pointerdown", handleUserActivity, { passive: true })
    window.addEventListener("keydown", handleUserActivity)

    return () => {
      stopped = true
      stopHeartbeat()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", startHeartbeat)
      window.removeEventListener("pageshow", startHeartbeat)
      window.removeEventListener("pointerdown", handleUserActivity)
      window.removeEventListener("keydown", handleUserActivity)
    }
  }, [enabled])
}
