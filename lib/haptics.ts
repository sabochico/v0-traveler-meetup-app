"use client"

import { Capacitor } from "@capacitor/core"
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics"

function canUseNativeHaptics() {
  return typeof window !== "undefined" && Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios"
}

export function triggerLightImpact() {
  if (!canUseNativeHaptics()) return
  void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
}

export function triggerSuccessHaptic() {
  if (!canUseNativeHaptics()) return
  void Haptics.notification({ type: NotificationType.Success }).catch(() => {})
}
