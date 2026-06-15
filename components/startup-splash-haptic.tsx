"use client"

import { useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { Haptics, ImpactStyle } from "@capacitor/haptics"

export function StartupSplashHaptic() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const timer = window.setTimeout(() => {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
    }, 820)

    return () => window.clearTimeout(timer)
  }, [])

  return null
}
