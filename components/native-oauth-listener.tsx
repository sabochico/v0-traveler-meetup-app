"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { App } from "@capacitor/app"
import { Browser } from "@capacitor/browser"
import { isNativeRuntime } from "@/lib/auth-redirect"
import { createClient } from "@/lib/supabase/client"

function getAuthParams(url: string) {
  const parsed = new URL(url)
  const queryParams = parsed.searchParams
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""))

  return {
    error: hashParams.get("error_description") ?? queryParams.get("error_description") ?? hashParams.get("error") ?? queryParams.get("error"),
    code: queryParams.get("code") ?? hashParams.get("code"),
    accessToken: hashParams.get("access_token") ?? queryParams.get("access_token"),
    refreshToken: hashParams.get("refresh_token") ?? queryParams.get("refresh_token"),
    next: queryParams.get("next") ?? hashParams.get("next") ?? "/",
  }
}

export function NativeOAuthListener() {
  const router = useRouter()

  useEffect(() => {
    if (!isNativeRuntime()) return

    let active = true
    let removeListener: (() => void) | undefined

    const finishNativeAuth = async (url: string) => {
      if (!url.startsWith("com.aweandco.drift://") && !url.startsWith("drift://")) return

      try {
        const { error, code, accessToken, refreshToken, next } = getAuthParams(url)
        if (error) throw new Error(error)

        const supabase = createClient()

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          return
        }

        if (!active) return
        await Browser.close().catch(() => {})
        window.history.replaceState(null, "", "/")
        router.refresh()
        router.replace(next.startsWith("/") ? next : "/")
      } catch (error) {
        console.error("Native OAuth callback failed:", error)
        if (!active) return
        await Browser.close().catch(() => {})
        window.history.replaceState(null, "", "/auth/login")
        router.replace("/auth/error")
      }
    }

    App.getLaunchUrl().then((launch) => {
      if (launch?.url) finishNativeAuth(launch.url)
    })

    App.addListener("appUrlOpen", (event) => {
      finishNativeAuth(event.url)
    }).then((listener) => {
      removeListener = () => listener.remove()
    })

    return () => {
      active = false
      removeListener?.()
    }
  }, [router])

  return null
}
