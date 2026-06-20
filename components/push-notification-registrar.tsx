"use client"

import { useEffect, useRef } from "react"
import { Capacitor } from "@capacitor/core"
import { PushNotifications } from "@capacitor/push-notifications"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

function isNativeIos() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios"
}

export function PushNotificationRegistrar() {
  const { user, isLoading } = useAuth()
  const userId = user?.id
  const registeredUserRef = useRef<string | null>(null)

  useEffect(() => {
    if (isLoading || !userId || !isNativeIos()) return
    if (registeredUserRef.current === userId) return

    registeredUserRef.current = userId
    let active = true
    let registrationListener: { remove: () => Promise<void> } | null = null
    let registrationErrorListener: { remove: () => Promise<void> } | null = null
    const supabase = createClient()

    async function saveToken(token: string) {
      if (!active || !userId || !token) return

      const payload = {
        user_id: userId,
        platform: "ios",
        token,
        enabled: true,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>

      const { error } = await supabase.from("push_tokens" as never).upsert(
        [payload] as never[],
        { onConflict: "token" },
      )

      if (error) {
        console.warn("[Drift Push] token save failed", { message: error.message })
        return
      }

      console.info("[Drift Push] token saved")
    }

    async function registerForPush() {
      try {
        const permission = await PushNotifications.requestPermissions()

        if (permission.receive !== "granted") {
          console.info("[Drift Push] permission denied")
          return
        }

        console.info("[Drift Push] permission granted")

        registrationListener = await PushNotifications.addListener("registration", (token) => {
          void saveToken(token.value)
        })

        registrationErrorListener = await PushNotifications.addListener("registrationError", (error) => {
          console.warn("[Drift Push] registration error", {
            message: typeof error.error === "string" ? error.error : "Registration failed",
          })
        })

        await PushNotifications.register()
      } catch (error) {
        registeredUserRef.current = null
        console.warn("[Drift Push] registration error", {
          message: error instanceof Error ? error.message : "Registration failed",
        })
      }
    }

    void registerForPush()

    return () => {
      active = false
      void registrationListener?.remove()
      void registrationErrorListener?.remove()
    }
  }, [isLoading, userId])

  useEffect(() => {
    if (!userId) registeredUserRef.current = null
  }, [userId])

  return null
}
